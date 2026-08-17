package com.arpfx.platform.service.impl;

import com.arpfx.platform.common.constant.RedisKeyConstant;
import com.arpfx.platform.common.constant.SysConstant;
import com.arpfx.platform.common.enums.ResultCodeEnum;
import com.arpfx.platform.common.enums.TierEnum;
import com.arpfx.platform.common.exception.BusinessException;
import com.arpfx.platform.common.utils.RedisUtils;
import com.arpfx.platform.common.utils.TokenUtils;
import com.arpfx.platform.dao.mapper.EffectMapper;
import com.arpfx.platform.dao.mapper.FavoriteMapper;
import com.arpfx.platform.dao.mapper.UserMapper;
import com.arpfx.platform.entity.dto.ResetPasswordDTO;
import com.arpfx.platform.entity.dto.UserLoginDTO;
import com.arpfx.platform.entity.dto.UserRegisterDTO;
import com.arpfx.platform.entity.dto.EmailCodeDTO;
import com.arpfx.platform.entity.po.BizEffect;
import com.arpfx.platform.entity.po.BizFavorite;
import com.arpfx.platform.entity.po.SysUser;
import com.arpfx.platform.entity.vo.LoginVO;
import com.arpfx.platform.entity.vo.UserVO;
import com.arpfx.platform.service.UserService;
import lombok.extern.log4j.Log4j2;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import javax.annotation.Resource;
import java.util.List;

/**
 * 用户业务实现
 *
 * @author arpfx
 * @date 2026-08-14
 */
@Log4j2
@Service
public class UserServiceImpl implements UserService {

    @Resource
    private UserMapper userMapper;

    @Resource
    private FavoriteMapper favoriteMapper;

    @Resource
    private EffectMapper effectMapper;

    @Resource
    private RedisUtils redisUtils;

    @Resource
    private JavaMailSender mailSender;

    @Value("${app.service.mail.from:${spring.mail.username:}}")
    private String mailFrom;

    /** 密码加密器（BCrypt 自动加盐） */
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Override
    public void register(UserRegisterDTO dto) {
        verifyCode(dto.getEmail(), "register", dto.getCode());
        SysUser exist = userMapper.selectByEmail(dto.getEmail());
        if (exist != null) {
            throw new BusinessException(ResultCodeEnum.USER_EXIST);
        }
        SysUser user = new SysUser();
        user.setUsername(dto.getEmail());
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        user.setEmail(dto.getEmail());
        user.setNickname(dto.getNickname() == null || dto.getNickname().isEmpty() ? dto.getEmail() : dto.getNickname());
        user.setTier(TierEnum.FREE.getCode());
        user.setStatus(1);
        userMapper.insert(user);
        log.info("用户注册成功，email:{}", dto.getEmail());
    }

    @Override
    public LoginVO login(UserLoginDTO dto) {
        SysUser user = userMapper.selectByEmail(dto.getEmail());
        // 统一提示「用户名或密码错误」，避免通过接口枚举已注册用户名
        if (user == null || !passwordEncoder.matches(dto.getPassword(), user.getPassword())) {
            throw new BusinessException(ResultCodeEnum.PASSWORD_ERROR);
        }
        if (user.getStatus() == null || user.getStatus() != 1) {
            throw new BusinessException(ResultCodeEnum.ACCOUNT_DISABLED);
        }
        userMapper.updateLastLogin(user.getId());
        String token = TokenUtils.generateToken();
        redisUtils.set(RedisKeyConstant.USER_TOKEN + token, String.valueOf(user.getId()), SysConstant.TOKEN_EXPIRE_SECONDS);

        LoginVO vo = new LoginVO();
        vo.setToken(token);
        vo.setUser(toVO(user));
        return vo;
    }

    @Override
    public UserVO getInfo(Long userId) {
        SysUser user = userMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException(ResultCodeEnum.USER_NOT_FOUND);
        }
        return toVO(user);
    }

    @Override
    public void addFavorite(Long userId, String effectCode) {
        // 按特效编码（与前端特效 id 对齐）校验并收藏
        BizEffect effect = effectMapper.selectByCode(effectCode);
        if (effect == null) {
            throw new BusinessException(ResultCodeEnum.EFFECT_NOT_FOUND);
        }
        BizFavorite exist = favoriteMapper.selectByUserAndEffect(userId, effect.getId());
        if (exist == null) {
            BizFavorite favorite = new BizFavorite();
            favorite.setUserId(userId);
            favorite.setEffectId(effect.getId());
            favoriteMapper.insert(favorite);
        }
    }

    @Override
    public void removeFavorite(Long userId, String effectCode) {
        BizEffect effect = effectMapper.selectByCode(effectCode);
        if (effect == null) {
            throw new BusinessException(ResultCodeEnum.EFFECT_NOT_FOUND);
        }
        favoriteMapper.deleteByUserAndEffect(userId, effect.getId());
    }

    @Override
    public List<String> listFavoriteEffectCodes(Long userId) {
        return favoriteMapper.selectEffectCodesByUser(userId);
    }

    @Override
    public void resetPassword(ResetPasswordDTO dto) {
        SysUser user = userMapper.selectByUsername(dto.getUsername());
        if (user == null) {
            throw new BusinessException(ResultCodeEnum.USER_NOT_FOUND);
        }
        // 校验注册邮箱匹配，作为找回密码的凭据（真实商用应发送邮件验证码）
        if (user.getEmail() == null || !user.getEmail().equalsIgnoreCase(dto.getEmail())) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR.getCode(), "邮箱与注册信息不匹配");
        }
        userMapper.updatePassword(user.getId(), passwordEncoder.encode(dto.getNewPassword()));
        log.info("用户重置密码成功，username:{}", dto.getUsername());
    }

    @Override
    public void sendEmailCode(EmailCodeDTO dto) {
        String purpose = dto.getPurpose() == null ? "login" : dto.getPurpose();
        String code = String.format("%06d", (int) (Math.random() * 1000000));
        redisUtils.set("email:code:" + purpose + ":" + dto.getEmail().toLowerCase(), code, 300);
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            if (mailFrom != null && !mailFrom.trim().isEmpty()) message.setFrom(mailFrom);
            message.setTo(dto.getEmail());
            message.setSubject("AR 粒子特效库邮箱验证码");
            message.setText("您的验证码是：" + code + "，5 分钟内有效。\n官方账号：xuyangtogether@163.com");
            mailSender.send(message);
        } catch (Exception e) {
            redisUtils.delete("email:code:" + purpose + ":" + dto.getEmail().toLowerCase());
            throw new BusinessException(503, "邮件服务暂未配置，请联系管理员");
        }
    }

    @Override
    public LoginVO loginByEmailCode(EmailCodeDTO dto) {
        verifyCode(dto.getEmail(), "login", dto.getCode());
        SysUser user = userMapper.selectByEmail(dto.getEmail());
        if (user == null) throw new BusinessException(ResultCodeEnum.USER_NOT_FOUND);
        return issueToken(user);
    }

    private void verifyCode(String email, String purpose, String code) {
        String key = "email:code:" + purpose + ":" + email.toLowerCase();
        if (code == null || !code.equals(redisUtils.get(key))) throw new BusinessException(400, "邮箱验证码错误或已过期");
        redisUtils.delete(key);
    }

    private LoginVO issueToken(SysUser user) {
        if (user.getStatus() == null || user.getStatus() != 1) throw new BusinessException(ResultCodeEnum.ACCOUNT_DISABLED);
        userMapper.updateLastLogin(user.getId());
        String token = TokenUtils.generateToken();
        redisUtils.set(RedisKeyConstant.USER_TOKEN + token, String.valueOf(user.getId()), SysConstant.TOKEN_EXPIRE_SECONDS);
        LoginVO vo = new LoginVO(); vo.setToken(token); vo.setUser(toVO(user)); return vo;
    }

    private UserVO toVO(SysUser user) {
        UserVO vo = new UserVO();
        vo.setId(user.getId());
        vo.setUsername(user.getUsername());
        vo.setEmail(user.getEmail());
        vo.setNickname(user.getNickname());
        vo.setTier(user.getTier());
        vo.setRole(user.getRole());
        return vo;
    }
}

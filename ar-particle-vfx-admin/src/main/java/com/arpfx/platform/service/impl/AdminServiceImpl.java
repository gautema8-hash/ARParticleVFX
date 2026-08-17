package com.arpfx.platform.service.impl;

import com.arpfx.platform.common.enums.ResultCodeEnum;
import com.arpfx.platform.common.exception.BusinessException;
import com.arpfx.platform.dao.mapper.EffectMapper;
import com.arpfx.platform.dao.mapper.OrderMapper;
import com.arpfx.platform.dao.mapper.UserMapper;
import com.arpfx.platform.entity.po.BizEffect;
import com.arpfx.platform.entity.po.BizOrder;
import com.arpfx.platform.entity.po.SysUser;
import com.arpfx.platform.entity.dto.EffectCreateDTO;
import com.arpfx.platform.entity.dto.TechnicalMailDTO;
import com.arpfx.platform.entity.vo.EffectVO;
import com.arpfx.platform.entity.vo.OrderVO;
import com.arpfx.platform.entity.vo.UserVO;
import com.arpfx.platform.service.AdminService;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import javax.annotation.Resource;
import java.util.List;
import java.util.stream.Collectors;
import java.util.Map;
import java.util.HashMap;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import com.arpfx.platform.dao.mapper.FeedbackMapper;

/**
 * 管理后台业务实现
 *
 * @author arpfx
 * @date 2026-08-14
 */
@Service
public class AdminServiceImpl implements AdminService {

    @Resource
    private UserMapper userMapper;

    @Resource
    private OrderMapper orderMapper;

    @Resource
    private EffectMapper effectMapper;

    @Resource
    private OrderMapper adminOrderMapper;

    @Resource
    private FeedbackMapper feedbackMapper;

    @Resource private JavaMailSender mailSender;
    @Value("${app.service.mail.from:${spring.mail.username:}}") private String mailFrom;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    private void checkAdmin(Long adminId) {
        SysUser user = userMapper.selectById(adminId);
        if (user == null || user.getRole() == null || user.getRole() != 1) {
            throw new BusinessException(ResultCodeEnum.FORBIDDEN);
        }
    }

    private void checkPublisher(Long userId) {
        SysUser user = userMapper.selectById(userId);
        if (user == null || user.getRole() == null || (user.getRole() != 1 && user.getRole() != 2)) {
            throw new BusinessException(ResultCodeEnum.FORBIDDEN);
        }
    }

    @Override
    public List<UserVO> listUsers(Long adminId, String keyword) {
        checkAdmin(adminId);
        return userMapper.selectAll(keyword).stream().map(this::toUserVO).collect(Collectors.toList());
    }

    @Override
    public List<OrderVO> listOrders(Long adminId, String keyword) {
        checkAdmin(adminId);
        return orderMapper.selectAllAdmin(keyword).stream().map(this::toOrderVO).collect(Collectors.toList());
    }

    @Override
    public List<EffectVO> listEffects(Long adminId, String keyword) {
        checkPublisher(adminId);
        return effectMapper.selectAllAdmin(keyword).stream().map(this::toEffectVO).collect(Collectors.toList());
    }

    @Override
    public void updateEffectStatus(Long adminId, Long effectId, Integer status) {
        checkPublisher(adminId);
        if (status == null || (status != 0 && status != 1)) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR.getCode(), "非法的状态值");
        }
        if (effectMapper.selectById(effectId) == null) {
            throw new BusinessException(ResultCodeEnum.EFFECT_NOT_FOUND);
        }
        effectMapper.updateStatus(effectId, status);
    }

    @Override
    public EffectVO createEffect(Long publisherId, EffectCreateDTO dto) {
        checkPublisher(publisherId);
        if (dto == null || blank(dto.getEffectCode()) || blank(dto.getEffectName()) || blank(dto.getCategory()) || blank(dto.getSourceHtml())) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR.getCode(), "编码、名称、分类和 HTML 源码不能为空");
        }
        if (!"ar".equalsIgnoreCase(dto.getCategory()) && !"3d".equalsIgnoreCase(dto.getCategory())) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR.getCode(), "特效分类只能是 AR 或 3D");
        }
        if (effectMapper.selectByCode(dto.getEffectCode()) != null) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR.getCode(), "特效编码已存在");
        }
        BizEffect effect = new BizEffect();
        effect.setEffectCode(dto.getEffectCode().trim()); effect.setEffectName(dto.getEffectName().trim());
        effect.setCategory(dto.getCategory().toLowerCase()); effect.setMode(dto.getMode()); effect.setTags(dto.getTags());
        effect.setTier(dto.getTier() == null ? 0 : dto.getTier()); effect.setDescription(dto.getDescription());
        effect.setCoverUrl(dto.getCoverUrl()); effect.setSourceHtml(dto.getSourceHtml()); effect.setPrice(dto.getPrice());
        effect.setCoverBase64(dto.getCoverBase64());
        effect.setStatus(dto.getStatus() == null ? 0 : dto.getStatus()); effect.setCreateBy(publisherId); effect.setUpdateBy(publisherId);
        effectMapper.insert(effect);
        return toEffectVO(effect);
    }

    private boolean blank(String value) { return value == null || value.trim().isEmpty(); }

    @Override
    public Map<String, Object> dashboard(Long adminId) {
        checkAdmin(adminId); Map<String, Object> data = new HashMap<>();
        data.put("userCount", userMapper.countAll()); data.put("todayRegistrations", userMapper.countToday());
        data.put("effectCount", effectMapper.countAll()); data.put("arCount", effectMapper.countByCategory("ar")); data.put("threeDCount", effectMapper.countThreeD()); data.put("publishedEffectCount", effectMapper.countByStatus(1)); data.put("offlineEffectCount", effectMapper.countByStatus(0));
        data.put("orderCount", adminOrderMapper.countAll()); data.put("paidOrderCount", adminOrderMapper.countPaid()); data.put("revenue", adminOrderMapper.sumPaid());
        data.put("feedbackCount", feedbackMapper.countOpen()); return data;
    }

    @Override
    public void updateUser(Long adminId, Long userId, Map<String, Object> payload) {
        checkAdmin(adminId); SysUser user = userMapper.selectById(userId); if (user == null) throw new BusinessException(ResultCodeEnum.USER_NOT_FOUND);
        Integer tier = number(payload.get("tier"), user.getTier()); Integer role = number(payload.get("role"), user.getRole()); Integer status = number(payload.get("status"), user.getStatus());
        userMapper.updateAdmin(userId, String.valueOf(payload.getOrDefault("email", user.getEmail())), String.valueOf(payload.getOrDefault("nickname", user.getNickname())), tier, role, status);
    }

    @Override public void deleteUser(Long adminId, Long userId) { checkAdmin(adminId); userMapper.deleteLogical(userId); }
    @Override public void resetUserPassword(Long adminId, Long userId) { checkAdmin(adminId); if (userMapper.selectById(userId) == null) throw new BusinessException(ResultCodeEnum.USER_NOT_FOUND); userMapper.resetPassword(userId, passwordEncoder.encode("Qwer123..")); }
    @Override public Map<String, Object> sendTechnicalMail(Long adminId, TechnicalMailDTO dto) {
        checkAdmin(adminId);
        if (dto == null || dto.getUserIds() == null || dto.getUserIds().isEmpty()) throw new BusinessException(ResultCodeEnum.PARAM_ERROR.getCode(), "请选择收件人");
        if (dto.getUserIds().size() > 20) throw new BusinessException(ResultCodeEnum.PARAM_ERROR.getCode(), "单批最多发送 20 位用户，请分批发送");
        if (blank(dto.getSubject()) || blank(dto.getContent())) throw new BusinessException(ResultCodeEnum.PARAM_ERROR.getCode(), "邮件主题和正文不能为空");
        int sent=0, failed=0;
        for (Long id : dto.getUserIds()) { SysUser user=userMapper.selectById(id); if(user==null||blank(user.getEmail())) { failed++; continue; } try { SimpleMailMessage m=new SimpleMailMessage(); if(mailFrom!=null&&!mailFrom.trim().isEmpty()) m.setFrom(mailFrom); m.setTo(user.getEmail()); m.setSubject(dto.getSubject().trim()); m.setText(dto.getContent()); mailSender.send(m); sent++; } catch(Exception e) { failed++; } }
        Map<String,Object> result=new HashMap<>(); result.put("sent",sent); result.put("failed",failed); return result;
    }
    @Override public void deleteEffect(Long adminId, Long effectId) { checkAdmin(adminId); effectMapper.deleteLogical(effectId); }
    private Integer number(Object value, Integer fallback) { try { return value == null ? fallback : Integer.valueOf(String.valueOf(value)); } catch (Exception e) { return fallback; } }

    private UserVO toUserVO(SysUser u) {
        UserVO vo = new UserVO();
        vo.setId(u.getId());
        vo.setUsername(u.getUsername());
        vo.setEmail(u.getEmail());
        vo.setNickname(u.getNickname());
        vo.setTier(u.getTier());
        vo.setRole(u.getRole());
        return vo;
    }

    private OrderVO toOrderVO(BizOrder o) {
        OrderVO vo = new OrderVO();
        vo.setId(o.getId());
        vo.setOrderNo(o.getOrderNo());
        vo.setOrderType(o.getOrderType());
        vo.setEffectId(o.getEffectId());
        vo.setTier(o.getTier());
        vo.setAmount(o.getAmount());
        vo.setStatus(o.getStatus());
        vo.setCreateTime(o.getCreateTime());
        vo.setUserEmail(o.getUserEmail());
        return vo;
    }

    private EffectVO toEffectVO(BizEffect e) {
        EffectVO vo = new EffectVO();
        vo.setId(e.getId());
        vo.setEffectCode(e.getEffectCode());
        vo.setEffectName(e.getEffectName());
        vo.setCategory(e.getCategory());
        vo.setMode(e.getMode());
        vo.setTags(e.getTags());
        vo.setTier(e.getTier());
        vo.setDescription(e.getDescription());
        vo.setCoverUrl(e.getCoverUrl());
        vo.setCoverBase64(e.getCoverBase64());
        vo.setSourceHtml(e.getSourceHtml());
        vo.setPrice(e.getPrice());
        vo.setCreateTime(e.getCreateTime()); vo.setPublishTime(e.getPublishTime()); vo.setOfflineTime(e.getOfflineTime());
        vo.setStatus(e.getStatus());
        vo.setPublisherEmail(e.getPublisherEmail());
        return vo;
    }
}

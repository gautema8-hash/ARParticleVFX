package com.arpfx.platform.service;

import com.arpfx.platform.entity.dto.ResetPasswordDTO;
import com.arpfx.platform.entity.dto.UserLoginDTO;
import com.arpfx.platform.entity.dto.UserRegisterDTO;
import com.arpfx.platform.entity.vo.LoginVO;
import com.arpfx.platform.entity.vo.UserVO;
import com.arpfx.platform.entity.dto.EmailCodeDTO;

import java.util.List;

/**
 * 用户业务接口
 *
 * @author arpfx
 * @date 2026-08-14
 */
public interface UserService {

    void register(UserRegisterDTO dto);

    LoginVO login(UserLoginDTO dto);

    UserVO getInfo(Long userId);

    void addFavorite(Long userId, String effectCode);

    void removeFavorite(Long userId, String effectCode);

    List<String> listFavoriteEffectCodes(Long userId);

    void resetPassword(ResetPasswordDTO dto);

    void sendEmailCode(EmailCodeDTO dto);

    LoginVO loginByEmailCode(EmailCodeDTO dto);
}

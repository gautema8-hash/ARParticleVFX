package com.arpfx.platform.entity.vo;

import lombok.Data;

import java.io.Serializable;

/**
 * 登录返回（令牌 + 用户信息）
 *
 * @author arpfx
 * @date 2026-08-14
 */
@Data
public class LoginVO implements Serializable {

    private static final long serialVersionUID = 1L;

    private String token;

    private UserVO user;
}

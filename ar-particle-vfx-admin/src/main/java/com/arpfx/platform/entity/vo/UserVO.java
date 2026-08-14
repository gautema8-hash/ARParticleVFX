package com.arpfx.platform.entity.vo;

import lombok.Data;

import java.io.Serializable;

/**
 * 用户信息返回
 *
 * @author arpfx
 * @date 2026-08-14
 */
@Data
public class UserVO implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long id;

    private String username;

    private String email;

    private String nickname;

    private Integer tier;

    /** 角色：0 普通用户，1 管理员 */
    private Integer role;
}

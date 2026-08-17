package com.arpfx.platform.entity.po;

import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 系统用户表
 *
 * @author arpfx
 * @date 2026-08-14
 */
@Data
public class SysUser implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long id;

    private String username;

    private String password;

    private String email;

    private String phone;

    private String nickname;

    private Integer tier;

    private Integer status;

    /** 角色：0 普通用户，1 管理员 */
    private Integer role;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;
    private LocalDateTime lastLoginTime;

    private Long createBy;

    private Long updateBy;

    private Integer isDeleted;
}

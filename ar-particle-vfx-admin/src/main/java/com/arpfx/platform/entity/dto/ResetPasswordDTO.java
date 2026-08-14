package com.arpfx.platform.entity.dto;

import lombok.Data;

import javax.validation.constraints.Email;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;
import java.io.Serializable;

/**
 * 忘记密码 / 重置密码入参
 *
 * @author arpfx
 * @date 2026-08-14
 */
@Data
public class ResetPasswordDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    @NotBlank(message = "用户名不能为空")
    private String username;

    @NotBlank(message = "邮箱不能为空")
    @Email(message = "邮箱格式不正确")
    private String email;

    @NotBlank(message = "新密码不能为空")
    @Size(min = 6, max = 32, message = "密码长度需在 6-32 位之间")
    private String newPassword;
}

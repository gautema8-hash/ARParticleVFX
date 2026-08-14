package com.arpfx.platform.common.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 响应状态码枚举
 *
 * @author arpfx
 * @date 2026-08-14
 */
@Getter
@AllArgsConstructor
public enum ResultCodeEnum {

    SUCCESS(200, "成功"),
    PARAM_ERROR(400, "参数错误"),
    UNAUTHORIZED(401, "未登录或登录已过期"),
    FORBIDDEN(403, "无权限"),
    NOT_FOUND(404, "资源不存在"),
    SYSTEM_ERROR(500, "系统异常"),

    USER_EXIST(1001, "用户已存在"),
    USER_NOT_FOUND(1002, "用户不存在"),
    PASSWORD_ERROR(1003, "用户名或密码错误"),
    ACCOUNT_DISABLED(1004, "账号已禁用"),

    EFFECT_NOT_FOUND(2001, "特效不存在"),
    ORDER_NOT_FOUND(3001, "订单不存在"),
    ORDER_STATUS_ERROR(3002, "订单状态异常");

    private final Integer code;

    private final String message;
}

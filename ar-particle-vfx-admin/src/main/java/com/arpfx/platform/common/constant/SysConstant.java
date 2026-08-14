package com.arpfx.platform.common.constant;

/**
 * 系统全局常量
 *
 * @author arpfx
 * @date 2026-08-14
 */
public final class SysConstant {

    /** 登录令牌有效期（秒） */
    public static final long TOKEN_EXPIRE_SECONDS = 7 * 24 * 3600L;

    /** 请求头令牌名 */
    public static final String TOKEN_HEADER = "Authorization";

    /** 令牌前缀 */
    public static final String TOKEN_PREFIX = "Bearer ";

    private SysConstant() {
    }
}

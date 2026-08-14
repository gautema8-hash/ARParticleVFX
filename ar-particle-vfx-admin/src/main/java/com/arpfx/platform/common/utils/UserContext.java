package com.arpfx.platform.common.utils;

/**
 * 当前登录用户上下文（ThreadLocal）
 *
 * @author arpfx
 * @date 2026-08-14
 */
public final class UserContext {

    private static final ThreadLocal<Long> USER_ID = new ThreadLocal<>();

    private UserContext() {
    }

    public static void setUserId(Long userId) {
        USER_ID.set(userId);
    }

    public static Long getUserId() {
        return USER_ID.get();
    }

    public static void clear() {
        USER_ID.remove();
    }
}

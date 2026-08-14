package com.arpfx.platform.common.utils;

import java.util.UUID;

/**
 * 令牌工具类
 *
 * @author arpfx
 * @date 2026-08-14
 */
public final class TokenUtils {

    private TokenUtils() {
    }

    /**
     * 生成登录令牌（UUID）
     *
     * @return 令牌字符串
     */
    public static String generateToken() {
        return UUID.randomUUID().toString().replace("-", "");
    }
}

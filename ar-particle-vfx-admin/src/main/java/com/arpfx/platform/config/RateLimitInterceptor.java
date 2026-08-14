package com.arpfx.platform.config;

import com.arpfx.platform.common.exception.BusinessException;
import com.arpfx.platform.common.utils.RedisUtils;
import org.springframework.web.servlet.HandlerInterceptor;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 * 接口限流拦截器：基于 Redis 计数器，按「IP + 路径」限流，防刷。
 *
 * @author arpfx
 * @date 2026-08-14
 */
public class RateLimitInterceptor implements HandlerInterceptor {

    /** 每个时间窗口内允许的最大请求次数 */
    private static final int MAX_REQUESTS = 20;

    /** 时间窗口（秒） */
    private static final long WINDOW_SECONDS = 60;

    private final RedisUtils redisUtils;

    public RateLimitInterceptor(RedisUtils redisUtils) {
        this.redisUtils = redisUtils;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }
        String ip = getClientIp(request);
        String key = "rate:" + request.getRequestURI() + ":" + ip;
        long count = redisUtils.incr(key, WINDOW_SECONDS);
        if (count > MAX_REQUESTS) {
            throw new BusinessException(429, "请求过于频繁，请稍后再试");
        }
        return true;
    }

    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }
}

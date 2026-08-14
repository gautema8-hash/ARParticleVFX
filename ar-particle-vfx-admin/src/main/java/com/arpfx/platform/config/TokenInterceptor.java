package com.arpfx.platform.config;

import com.arpfx.platform.common.constant.RedisKeyConstant;
import com.arpfx.platform.common.constant.SysConstant;
import com.arpfx.platform.common.enums.ResultCodeEnum;
import com.arpfx.platform.common.exception.BusinessException;
import com.arpfx.platform.common.utils.RedisUtils;
import com.arpfx.platform.common.utils.UserContext;
import org.springframework.web.servlet.HandlerInterceptor;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 * 登录令牌拦截器
 *
 * @author arpfx
 * @date 2026-08-14
 */
public class TokenInterceptor implements HandlerInterceptor {

    private final RedisUtils redisUtils;

    public TokenInterceptor(RedisUtils redisUtils) {
        this.redisUtils = redisUtils;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }
        String auth = request.getHeader(SysConstant.TOKEN_HEADER);
        if (auth == null || !auth.startsWith(SysConstant.TOKEN_PREFIX)) {
            throw new BusinessException(ResultCodeEnum.UNAUTHORIZED);
        }
        String token = auth.substring(SysConstant.TOKEN_PREFIX.length());
        String userId = redisUtils.get(RedisKeyConstant.USER_TOKEN + token);
        if (userId == null) {
            throw new BusinessException(ResultCodeEnum.UNAUTHORIZED);
        }
        UserContext.setUserId(Long.valueOf(userId));
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        UserContext.clear();
    }
}

package com.arpfx.platform.config;

import com.arpfx.platform.common.utils.RedisUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import javax.annotation.Resource;

/**
 * Web 配置（跨域 + 登录拦截器）
 *
 * @author arpfx
 * @date 2026-08-14
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Resource
    private RedisUtils redisUtils;

    /**
     * 允许跨域的来源（逗号分隔）。生产环境必须配置为具体域名，切勿使用 *。
     */
    @Value("${app.cors.allowed-origins:*}")
    private String allowedOrigins;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // 限流拦截器（对敏感接口防刷，先于鉴权执行）
        registry.addInterceptor(new RateLimitInterceptor(redisUtils))
                .addPathPatterns(
                        "/api/user/register",
                        "/api/user/login",
                        "/api/user/reset-password",
                        "/api/order/pay/callback",
                        "/api/assistant/chat"
                );

        registry.addInterceptor(new TokenInterceptor(redisUtils))
                .addPathPatterns("/api/**")
                .excludePathPatterns(
                        "/api/user/register",
                        "/api/user/login",
                        "/api/user/reset-password",
                        // 助手使用用户在浏览器中配置的模型 API Key，保留限流但不强制平台登录
                        "/api/assistant/chat",
                        "/api/effect/list",
                        "/api/effect/*"
                );
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOriginPatterns(allowedOrigins.split(","))
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }
}

package com.arpfx.platform.common.utils;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;
import java.util.concurrent.TimeUnit;

/**
 * Redis 操作工具
 *
 * @author arpfx
 * @date 2026-08-14
 */
@Component
public class RedisUtils {

    @Resource
    private StringRedisTemplate stringRedisTemplate;

    /**
     * 写入缓存并设置过期时间
     */
    public void set(String key, String value, long expireSeconds) {
        stringRedisTemplate.opsForValue().set(key, value, expireSeconds, TimeUnit.SECONDS);
    }

    /**
     * 读取缓存
     */
    public String get(String key) {
        return stringRedisTemplate.opsForValue().get(key);
    }

    /**
     * 删除缓存
     */
    public Boolean delete(String key) {
        return stringRedisTemplate.delete(key);
    }

    /**
     * 判断 Key 是否存在
     */
    public Boolean hasKey(String key) {
        return stringRedisTemplate.hasKey(key);
    }

    /**
     * 设置过期时间
     */
    public void expire(String key, long expireSeconds) {
        stringRedisTemplate.expire(key, expireSeconds, TimeUnit.SECONDS);
    }

    /**
     * 自增并返回当前值（首次自增时设置过期时间，用于限流计数）
     */
    public long incr(String key, long expireSeconds) {
        Long value = stringRedisTemplate.opsForValue().increment(key);
        if (value != null && value == 1) {
            stringRedisTemplate.expire(key, expireSeconds, TimeUnit.SECONDS);
        }
        return value == null ? 0 : value;
    }
}

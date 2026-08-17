package com.arpfx.platform;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * AR粒子特效代码平台 后端启动类
 *
 * @author arpfx
 * @date 2026-08-14
 */
@SpringBootApplication
@EnableScheduling
@MapperScan("com.arpfx.platform.dao.mapper")
public class PlatformApplication {

    public static void main(String[] args) {
        SpringApplication.run(PlatformApplication.class, args);
    }
}

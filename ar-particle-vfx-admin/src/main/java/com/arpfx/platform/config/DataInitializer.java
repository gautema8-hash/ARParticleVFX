package com.arpfx.platform.config;

import com.arpfx.platform.common.enums.TierEnum;
import com.arpfx.platform.dao.mapper.UserMapper;
import com.arpfx.platform.entity.po.SysUser;
import lombok.extern.log4j.Log4j2;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;

/**
 * 数据初始化：确保默认管理员账号存在（幂等）。
 * 用户名 admin，初始密码 Admin123，role=1（管理员），tier=2（企业版）。
 *
 * @author arpfx
 * @date 2026-08-14
 */
@Log4j2
@Component
public class DataInitializer implements CommandLineRunner {

    @Resource
    private UserMapper userMapper;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Override
    public void run(String... args) {
        SysUser admin = userMapper.selectByUsername("admin");
        if (admin == null) {
            SysUser user = new SysUser();
            user.setUsername("admin");
            user.setPassword(passwordEncoder.encode("Admin123"));
            user.setNickname("管理员");
            user.setTier(TierEnum.ENTERPRISE.getCode());
            user.setRole(1);
            user.setStatus(1);
            userMapper.insert(user);
            log.info("已创建默认管理员账号 admin（role=1）");
        }
    }
}

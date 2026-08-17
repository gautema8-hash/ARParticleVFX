package com.arpfx.platform.config;

import com.arpfx.platform.dao.mapper.LoginLogMapper;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import javax.annotation.Resource;

@Component
public class LoginLogCleanupJob {
    @Resource private LoginLogMapper loginLogMapper;
    /** 每日凌晨逻辑删除 7 天以前的登录日志。 */
    @Scheduled(cron = "0 10 0 * * *")
    public void cleanup() { loginLogMapper.deleteExpired(7); }
}

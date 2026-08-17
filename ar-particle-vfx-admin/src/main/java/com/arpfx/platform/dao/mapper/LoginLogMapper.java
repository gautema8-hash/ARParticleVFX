package com.arpfx.platform.dao.mapper;

import com.arpfx.platform.entity.po.SysLoginLog;
import org.apache.ibatis.annotations.Param;
import java.util.List;

public interface LoginLogMapper {
    int insert(SysLoginLog log);
    List<SysLoginLog> selectRecent(@Param("keyword") String keyword);
    int deleteExpired(@Param("days") int days);
}

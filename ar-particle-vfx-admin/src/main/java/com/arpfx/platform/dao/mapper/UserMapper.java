package com.arpfx.platform.dao.mapper;

import com.arpfx.platform.entity.po.SysUser;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 用户 Mapper
 *
 * @author arpfx
 * @date 2026-08-14
 */
public interface UserMapper {

    SysUser selectByUsername(@Param("username") String username);

    SysUser selectById(@Param("id") Long id);

    int insert(SysUser user);

    /**
     * 升级会员档位（仅升不降）：数据库层使用 GREATEST 保证不会把高等级覆盖为低等级。
     */
    int upgradeTier(@Param("id") Long id, @Param("tier") Integer tier);

    int updatePassword(@Param("id") Long id, @Param("password") String password);

    List<SysUser> selectAll();
}

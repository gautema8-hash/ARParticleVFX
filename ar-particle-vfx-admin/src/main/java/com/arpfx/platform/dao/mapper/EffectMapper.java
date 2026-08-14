package com.arpfx.platform.dao.mapper;

import com.arpfx.platform.entity.po.BizEffect;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 特效 Mapper
 *
 * @author arpfx
 * @date 2026-08-14
 */
public interface EffectMapper {

    List<BizEffect> selectPage(@Param("category") String category, @Param("tier") Integer tier);

    BizEffect selectById(@Param("id") Long id);

    BizEffect selectByCode(@Param("effectCode") String effectCode);

    int insert(BizEffect effect);

    List<BizEffect> selectAll();

    int updateStatus(@Param("id") Long id, @Param("status") Integer status);
}

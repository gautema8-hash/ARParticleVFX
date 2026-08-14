package com.arpfx.platform.dao.mapper;

import com.arpfx.platform.entity.po.BizFavorite;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 收藏 Mapper
 *
 * @author arpfx
 * @date 2026-08-14
 */
public interface FavoriteMapper {

    int insert(BizFavorite favorite);

    int deleteByUserAndEffect(@Param("userId") Long userId, @Param("effectId") Long effectId);

    BizFavorite selectByUserAndEffect(@Param("userId") Long userId, @Param("effectId") Long effectId);

    List<String> selectEffectCodesByUser(@Param("userId") Long userId);
}

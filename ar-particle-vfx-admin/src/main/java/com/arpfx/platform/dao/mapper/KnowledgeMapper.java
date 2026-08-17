package com.arpfx.platform.dao.mapper;
import com.arpfx.platform.entity.po.BizKnowledge;
import org.apache.ibatis.annotations.Param;
import java.util.List;
public interface KnowledgeMapper { List<BizKnowledge> selectPublished(); List<BizKnowledge> selectAll(); BizKnowledge selectById(@Param("id") Long id); int insert(BizKnowledge item); int update(BizKnowledge item); int deleteLogical(@Param("id") Long id); int incrementView(@Param("id") Long id); int incrementFavorite(@Param("id") Long id); int decrementFavorite(@Param("id") Long id); }

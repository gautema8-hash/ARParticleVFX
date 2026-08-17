package com.arpfx.platform.dao.mapper;
import com.arpfx.platform.entity.po.BizFeedback;
import org.apache.ibatis.annotations.Param;
import java.util.List;
public interface FeedbackMapper { int insert(BizFeedback feedback); long countOpen(); List<BizFeedback> selectAll(); int updateStatus(@Param("id") Long id,@Param("status") Integer status); int deleteLogical(@Param("id") Long id); }

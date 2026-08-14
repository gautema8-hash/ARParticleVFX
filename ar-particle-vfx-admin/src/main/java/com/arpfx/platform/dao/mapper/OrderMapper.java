package com.arpfx.platform.dao.mapper;

import com.arpfx.platform.entity.po.BizOrder;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 订单 Mapper
 *
 * @author arpfx
 * @date 2026-08-14
 */
public interface OrderMapper {

    int insert(BizOrder order);

    BizOrder selectByOrderNo(@Param("orderNo") String orderNo);

    BizOrder selectById(@Param("id") Long id);

    List<BizOrder> selectByUser(@Param("userId") Long userId);

    /**
     * 条件更新订单状态（乐观锁/CAS）：仅当订单处于 fromStatus 时才更新为 status，
     * 返回受影响行数，0 表示已被并发处理或状态已变化。
     */
    int updateStatus(@Param("id") Long id, @Param("fromStatus") Integer fromStatus, @Param("status") Integer status);

    List<BizOrder> selectAll();
}

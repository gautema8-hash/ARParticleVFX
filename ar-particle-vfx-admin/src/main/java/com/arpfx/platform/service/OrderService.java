package com.arpfx.platform.service;

import com.arpfx.platform.entity.dto.OrderCreateDTO;
import com.arpfx.platform.entity.vo.OrderVO;

import java.util.List;

/**
 * 订单业务接口
 *
 * @author arpfx
 * @date 2026-08-14
 */
public interface OrderService {

    OrderVO create(Long userId, OrderCreateDTO dto);

    List<OrderVO> list(Long userId);

    void mockPayCallback(Long userId, String orderNo);
}

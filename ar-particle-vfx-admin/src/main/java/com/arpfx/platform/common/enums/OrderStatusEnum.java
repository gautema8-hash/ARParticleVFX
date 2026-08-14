package com.arpfx.platform.common.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 订单状态枚举
 *
 * @author arpfx
 * @date 2026-08-14
 */
@Getter
@AllArgsConstructor
public enum OrderStatusEnum {

    PENDING(0, "待支付"),
    PAID(1, "已支付"),
    CANCELED(2, "已取消"),
    REFUNDED(3, "已退款");

    private final Integer code;

    private final String name;
}

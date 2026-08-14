package com.arpfx.platform.entity.vo;

import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 订单信息返回
 *
 * @author arpfx
 * @date 2026-08-14
 */
@Data
public class OrderVO implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long id;

    private String orderNo;

    private Integer orderType;

    private Long effectId;

    private Integer tier;

    private BigDecimal amount;

    private Integer status;

    private LocalDateTime createTime;
}

package com.arpfx.platform.entity.po;

import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 订单表
 *
 * @author arpfx
 * @date 2026-08-14
 */
@Data
public class BizOrder implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long id;

    private String orderNo;

    private Long userId;
    private String userEmail;

    private Integer orderType;

    private Long effectId;

    private Integer tier;

    private BigDecimal amount;

    private Integer status;

    private String payType;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;

    private Integer isDeleted;
}

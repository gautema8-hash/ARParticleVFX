package com.arpfx.platform.entity.dto;

import lombok.Data;

import javax.validation.constraints.NotNull;
import java.io.Serializable;

/**
 * 订单创建入参
 *
 * @author arpfx
 * @date 2026-08-14
 */
@Data
public class OrderCreateDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    /** 0单特效 1会员订阅 */
    @NotNull(message = "订单类型不能为空")
    private Integer orderType;

    /** 单特效购买：特效编码（与前端特效 id 对齐） */
    private String effectCode;

    /** 会员档位 1个人Pro 2企业 */
    private Integer tier;
}

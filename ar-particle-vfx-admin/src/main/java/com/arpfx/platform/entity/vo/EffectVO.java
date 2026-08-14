package com.arpfx.platform.entity.vo;

import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;

/**
 * 特效信息返回
 *
 * @author arpfx
 * @date 2026-08-14
 */
@Data
public class EffectVO implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long id;

    private String effectCode;

    private String effectName;

    private String category;

    private String mode;

    private String tags;

    private Integer tier;

    private String description;

    private String coverUrl;

    private BigDecimal price;

    /** 状态：1 上架，0 下架 */
    private Integer status;
}

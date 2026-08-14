package com.arpfx.platform.entity.po;

import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 业务特效表
 *
 * @author arpfx
 * @date 2026-08-14
 */
@Data
public class BizEffect implements Serializable {

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

    private Integer status;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;

    private Long createBy;

    private Long updateBy;

    private Integer isDeleted;
}

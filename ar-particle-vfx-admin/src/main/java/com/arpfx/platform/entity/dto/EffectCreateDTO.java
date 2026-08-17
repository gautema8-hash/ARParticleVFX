package com.arpfx.platform.entity.dto;

import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;

@Data
public class EffectCreateDTO implements Serializable {
    private String effectCode;
    private String effectName;
    /** ar 或 3d */
    private String category;
    private String mode;
    private String tags;
    private Integer tier = 0;
    private String description;
    private String coverUrl;
    private String coverBase64;
    private BigDecimal price;
    private Integer status = 0;
    private String sourceHtml;
}

package com.arpfx.platform.entity.dto;

import lombok.Data;

import java.io.Serializable;

/**
 * 特效查询入参
 *
 * @author arpfx
 * @date 2026-08-14
 */
@Data
public class EffectQueryDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    private String category;

    private Integer tier;

    private Integer pageNum = 1;

    private Integer pageSize = 10;
}

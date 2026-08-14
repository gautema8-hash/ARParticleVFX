package com.arpfx.platform.entity.po;

import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 用户收藏表
 *
 * @author arpfx
 * @date 2026-08-14
 */
@Data
public class BizFavorite implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long id;

    private Long userId;

    private Long effectId;

    private LocalDateTime createTime;

    private Integer isDeleted;
}

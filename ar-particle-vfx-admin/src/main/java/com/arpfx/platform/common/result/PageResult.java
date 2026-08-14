package com.arpfx.platform.common.result;

import lombok.Data;

import java.io.Serializable;
import java.util.Collections;
import java.util.List;

/**
 * 分页返回结果
 *
 * @author arpfx
 * @date 2026-08-14
 */
@Data
public class PageResult<T> implements Serializable {

    private static final long serialVersionUID = 1L;

    private long total;

    private List<T> list;

    public PageResult() {
        this.total = 0;
        this.list = Collections.emptyList();
    }

    public PageResult(long total, List<T> list) {
        this.total = total;
        this.list = list == null ? Collections.emptyList() : list;
    }

    public static <T> PageResult<T> of(long total, List<T> list) {
        return new PageResult<>(total, list);
    }
}

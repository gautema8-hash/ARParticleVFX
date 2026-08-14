package com.arpfx.platform.common.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 会员档位枚举
 *
 * @author arpfx
 * @date 2026-08-14
 */
@Getter
@AllArgsConstructor
public enum TierEnum {

    FREE(0, "免费版"),
    PRO(1, "个人Pro"),
    ENTERPRISE(2, "企业版");

    private final Integer code;

    private final String name;

    public static TierEnum of(Integer code) {
        for (TierEnum e : values()) {
            if (e.code.equals(code)) {
                return e;
            }
        }
        return FREE;
    }
}

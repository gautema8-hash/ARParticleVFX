package com.arpfx.platform.common.exception;

import com.arpfx.platform.common.enums.ResultCodeEnum;
import lombok.Getter;

/**
 * 自定义业务异常
 *
 * @author arpfx
 * @date 2026-08-14
 */
@Getter
public class BusinessException extends RuntimeException {

    private final Integer code;

    public BusinessException(ResultCodeEnum resultCode) {
        super(resultCode.getMessage());
        this.code = resultCode.getCode();
    }

    public BusinessException(String message) {
        super(message);
        this.code = ResultCodeEnum.SYSTEM_ERROR.getCode();
    }

    public BusinessException(Integer code, String message) {
        super(message);
        this.code = code;
    }
}

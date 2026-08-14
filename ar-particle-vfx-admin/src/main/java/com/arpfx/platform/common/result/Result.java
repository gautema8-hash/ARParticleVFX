package com.arpfx.platform.common.result;

import com.arpfx.platform.common.enums.ResultCodeEnum;
import lombok.Data;

import java.io.Serializable;

/**
 * 接口统一响应封装
 *
 * @author arpfx
 * @date 2026-08-14
 */
@Data
public class Result<T> implements Serializable {

    private static final long serialVersionUID = 1L;

    private Integer code;

    private String message;

    private T data;

    public Result() {
    }

    public Result(Integer code, String message, T data) {
        this.code = code;
        this.message = message;
        this.data = data;
    }

    public static <T> Result<T> success() {
        return new Result<>(ResultCodeEnum.SUCCESS.getCode(), ResultCodeEnum.SUCCESS.getMessage(), null);
    }

    public static <T> Result<T> success(T data) {
        return new Result<>(ResultCodeEnum.SUCCESS.getCode(), ResultCodeEnum.SUCCESS.getMessage(), data);
    }

    public static <T> Result<T> fail(ResultCodeEnum resultCode) {
        return new Result<>(resultCode.getCode(), resultCode.getMessage(), null);
    }

    public static <T> Result<T> fail(Integer code, String message) {
        return new Result<>(code, message, null);
    }
}

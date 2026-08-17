package com.arpfx.platform.controller;

import com.arpfx.platform.common.result.Result;
import com.arpfx.platform.common.utils.UserContext;
import com.arpfx.platform.entity.dto.ResetPasswordDTO;
import com.arpfx.platform.entity.dto.UserLoginDTO;
import com.arpfx.platform.entity.dto.UserRegisterDTO;
import com.arpfx.platform.entity.dto.EmailCodeDTO;
import com.arpfx.platform.entity.vo.LoginVO;
import com.arpfx.platform.entity.vo.UserVO;
import com.arpfx.platform.service.UserService;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.Resource;
import javax.validation.Valid;
import java.util.List;

/**
 * 用户接口
 *
 * @author arpfx
 * @date 2026-08-14
 */
@RestController
@RequestMapping("/api/user")
public class UserController {

    @Resource
    private UserService userService;

    @PostMapping("/register")
    public Result<Void> register(@Valid @RequestBody UserRegisterDTO dto) {
        userService.register(dto);
        return Result.success();
    }

    @PostMapping("/login")
    public Result<LoginVO> login(@Valid @RequestBody UserLoginDTO dto) {
        return Result.success(userService.login(dto));
    }

    @PostMapping("/email-code")
    public Result<Void> emailCode(@Valid @RequestBody EmailCodeDTO dto) { userService.sendEmailCode(dto); return Result.success(); }

    @PostMapping("/email-login")
    public Result<LoginVO> emailLogin(@Valid @RequestBody EmailCodeDTO dto) { return Result.success(userService.loginByEmailCode(dto)); }

    @PostMapping("/reset-password")
    public Result<Void> resetPassword(@Valid @RequestBody ResetPasswordDTO dto) {
        userService.resetPassword(dto);
        return Result.success();
    }

    @GetMapping("/info")
    public Result<UserVO> info() {
        return Result.success(userService.getInfo(UserContext.getUserId()));
    }

    @PostMapping("/favorite/{effectCode}")
    public Result<Void> addFavorite(@PathVariable String effectCode) {
        userService.addFavorite(UserContext.getUserId(), effectCode);
        return Result.success();
    }

    @DeleteMapping("/favorite/{effectCode}")
    public Result<Void> removeFavorite(@PathVariable String effectCode) {
        userService.removeFavorite(UserContext.getUserId(), effectCode);
        return Result.success();
    }

    @GetMapping("/favorites")
    public Result<List<String>> favorites() {
        return Result.success(userService.listFavoriteEffectCodes(UserContext.getUserId()));
    }
}

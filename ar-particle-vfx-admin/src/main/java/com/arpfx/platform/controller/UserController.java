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
import javax.servlet.http.HttpServletRequest;
import com.arpfx.platform.dao.mapper.LoginLogMapper;
import com.arpfx.platform.entity.po.SysLoginLog;

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

    @Resource
    private LoginLogMapper loginLogMapper;

    @PostMapping("/register")
    public Result<Void> register(@Valid @RequestBody UserRegisterDTO dto) {
        userService.register(dto);
        return Result.success();
    }

    @PostMapping("/login")
    public Result<LoginVO> login(@Valid @RequestBody UserLoginDTO dto, HttpServletRequest request) {
        LoginVO data = userService.login(dto); logLogin(data, "邮箱密码登录", request); return Result.success(data);
    }

    @PostMapping("/email-code")
    public Result<Void> emailCode(@Valid @RequestBody EmailCodeDTO dto) { userService.sendEmailCode(dto); return Result.success(); }

    @PostMapping("/email-login")
    public Result<LoginVO> emailLogin(@Valid @RequestBody EmailCodeDTO dto, HttpServletRequest request) { LoginVO data = userService.loginByEmailCode(dto); logLogin(data, "邮箱验证码登录", request); return Result.success(data); }

    private void logLogin(LoginVO data, String operation, HttpServletRequest request) {
        SysLoginLog log = new SysLoginLog(); log.setUserId(data.getUser().getId()); log.setUsername(data.getUser().getUsername());
        log.setNickname(data.getUser().getNickname()); log.setEmail(data.getUser().getEmail());
        log.setOperation(operation); log.setIp(clientIp(request)); log.setUserAgent(request.getHeader("User-Agent"));
        String ua = log.getUserAgent() == null ? "" : log.getUserAgent().toLowerCase();
        log.setDeviceType(ua.contains("mobile") || ua.contains("android") || ua.contains("iphone") ? "移动端" : "桌面端");
        log.setBrowser(ua.contains("edg") ? "Edge" : ua.contains("chrome") ? "Chrome" : ua.contains("firefox") ? "Firefox" : ua.contains("safari") ? "Safari" : "其他");
        log.setOs(ua.contains("windows") ? "Windows" : ua.contains("mac os") ? "macOS" : ua.contains("android") ? "Android" : ua.contains("iphone") ? "iOS" : "其他");
        log.setAddress(resolveAddress(log.getIp())); log.setSuccess(1); log.setDetail("登录成功"); loginLogMapper.insert(log);
    }
    private String clientIp(HttpServletRequest request) { String ip=request.getHeader("X-Forwarded-For"); if(ip==null||ip.isEmpty()) ip=request.getHeader("X-Real-IP"); return ip==null||ip.isEmpty()?request.getRemoteAddr():ip.split(",")[0].trim(); }
    private String resolveAddress(String ip) { if (ip == null || ip.isEmpty() || "0:0:0:0:0:0:0:1".equals(ip) || "::1".equals(ip) || "127.0.0.1".equals(ip)) return "本机"; if (ip.startsWith("10.") || ip.startsWith("192.168.") || ip.startsWith("172.16.") || ip.startsWith("172.17.") || ip.startsWith("172.18.") || ip.startsWith("172.19.") || ip.startsWith("172.2")) return "内网地址"; return "公网地址（未接入地理定位服务）"; }

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

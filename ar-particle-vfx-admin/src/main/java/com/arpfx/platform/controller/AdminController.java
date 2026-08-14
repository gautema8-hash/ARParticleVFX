package com.arpfx.platform.controller;

import com.arpfx.platform.common.result.Result;
import com.arpfx.platform.common.utils.UserContext;
import com.arpfx.platform.entity.vo.EffectVO;
import com.arpfx.platform.entity.vo.OrderVO;
import com.arpfx.platform.entity.vo.UserVO;
import com.arpfx.platform.service.AdminService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.Resource;
import java.util.List;

/**
 * 管理后台接口（需管理员 role=1）
 *
 * @author arpfx
 * @date 2026-08-14
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Resource
    private AdminService adminService;

    @GetMapping("/users")
    public Result<List<UserVO>> users() {
        return Result.success(adminService.listUsers(UserContext.getUserId()));
    }

    @GetMapping("/orders")
    public Result<List<OrderVO>> orders() {
        return Result.success(adminService.listOrders(UserContext.getUserId()));
    }

    @GetMapping("/effects")
    public Result<List<EffectVO>> effects() {
        return Result.success(adminService.listEffects(UserContext.getUserId()));
    }

    @PutMapping("/effect/{id}/status")
    public Result<Void> updateEffectStatus(@PathVariable Long id, @RequestParam Integer status) {
        adminService.updateEffectStatus(UserContext.getUserId(), id, status);
        return Result.success();
    }
}

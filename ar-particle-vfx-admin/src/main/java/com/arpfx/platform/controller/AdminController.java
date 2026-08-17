package com.arpfx.platform.controller;

import com.arpfx.platform.common.result.Result;
import com.arpfx.platform.common.utils.UserContext;
import com.arpfx.platform.entity.vo.EffectVO;
import com.arpfx.platform.entity.vo.OrderVO;
import com.arpfx.platform.entity.vo.UserVO;
import com.arpfx.platform.entity.dto.EffectCreateDTO;
import com.arpfx.platform.service.AdminService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.Resource;
import java.util.List;
import java.util.Map;
import com.arpfx.platform.dao.mapper.FeedbackMapper;
import com.arpfx.platform.entity.po.BizFeedback;

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

    @Resource
    private FeedbackMapper feedbackMapper;

    @GetMapping("/users")
    public Result<List<UserVO>> users() {
        return Result.success(adminService.listUsers(UserContext.getUserId()));
    }

    @GetMapping("/dashboard")
    public Result<Map<String, Object>> dashboard() { return Result.success(adminService.dashboard(UserContext.getUserId())); }

    @GetMapping("/feedbacks")
    public Result<List<BizFeedback>> feedbacks() { adminService.dashboard(UserContext.getUserId()); return Result.success(feedbackMapper.selectAll()); }

    @PutMapping("/feedback/{id}/status")
    public Result<Void> feedbackStatus(@PathVariable Long id, @RequestParam Integer status) { adminService.dashboard(UserContext.getUserId()); feedbackMapper.updateStatus(id, status); return Result.success(); }

    @DeleteMapping("/feedback/{id}")
    public Result<Void> deleteFeedback(@PathVariable Long id) { adminService.dashboard(UserContext.getUserId()); feedbackMapper.deleteLogical(id); return Result.success(); }

    @PutMapping("/user/{id}")
    public Result<Void> updateUser(@PathVariable Long id, @RequestBody Map<String, Object> payload) { adminService.updateUser(UserContext.getUserId(), id, payload); return Result.success(); }

    @DeleteMapping("/user/{id}")
    public Result<Void> deleteUser(@PathVariable Long id) { adminService.deleteUser(UserContext.getUserId(), id); return Result.success(); }

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

    @DeleteMapping("/effect/{id}")
    public Result<Void> deleteEffect(@PathVariable Long id) { adminService.deleteEffect(UserContext.getUserId(), id); return Result.success(); }

    @PostMapping("/effect")
    public Result<EffectVO> createEffect(@RequestBody EffectCreateDTO dto) {
        return Result.success(adminService.createEffect(UserContext.getUserId(), dto));
    }
}

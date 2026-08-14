package com.arpfx.platform.controller;

import com.arpfx.platform.common.result.Result;
import com.arpfx.platform.common.utils.UserContext;
import com.arpfx.platform.entity.dto.OrderCreateDTO;
import com.arpfx.platform.entity.vo.OrderVO;
import com.arpfx.platform.service.OrderService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.Resource;
import javax.validation.Valid;
import java.util.List;

/**
 * 订单接口
 *
 * @author arpfx
 * @date 2026-08-14
 */
@RestController
@RequestMapping("/api/order")
public class OrderController {

    @Resource
    private OrderService orderService;

    @PostMapping("/create")
    public Result<OrderVO> create(@Valid @RequestBody OrderCreateDTO dto) {
        return Result.success(orderService.create(UserContext.getUserId(), dto));
    }

    @GetMapping("/list")
    public Result<List<OrderVO>> list() {
        return Result.success(orderService.list(UserContext.getUserId()));
    }

    /**
     * 模拟支付回调（真实支付需对接微信/支付宝回调验签，并删除本接口）
     * 当前阶段仅允许订单归属用户本人触发，避免越权篡改他人订单。
     */
    @PostMapping("/pay/callback")
    public Result<Void> mockPayCallback(@RequestParam String orderNo) {
        orderService.mockPayCallback(UserContext.getUserId(), orderNo);
        return Result.success();
    }
}

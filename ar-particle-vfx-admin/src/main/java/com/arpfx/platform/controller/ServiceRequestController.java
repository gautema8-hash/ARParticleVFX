package com.arpfx.platform.controller;

import com.arpfx.platform.common.result.Result;
import com.arpfx.platform.entity.dto.ServiceRequestDTO;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.arpfx.platform.common.utils.UserContext;
import com.arpfx.platform.dao.mapper.FeedbackMapper;
import com.arpfx.platform.entity.po.BizFeedback;

import javax.annotation.Resource;

/** 定制开发、素材授权、API 接入需求通知。 */
@RestController
@RequestMapping("/api/service")
public class ServiceRequestController {

    @Resource
    private FeedbackMapper feedbackMapper;

    @PostMapping("/requests")
    public Result<Void> submit(@RequestBody ServiceRequestDTO request) {
        if (blank(request.getName()) || blank(request.getContact()) || blank(request.getDescription())) {
            return Result.fail(400, "请完整填写姓名、联系方式和需求描述");
        }
        BizFeedback feedback = new BizFeedback(); feedback.setUserId(UserContext.getUserId()); feedback.setName(request.getName()); feedback.setCompany(request.getCompany()); feedback.setContact(request.getContact()); feedback.setType(request.getType()); feedback.setDescription(request.getDescription()); feedbackMapper.insert(feedback);
        return Result.success();
    }

    private boolean blank(String value) { return value == null || value.trim().isEmpty(); }
}

package com.arpfx.platform.controller;

import com.arpfx.platform.common.result.Result;
import com.arpfx.platform.entity.dto.ServiceRequestDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
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

    private static final String OFFICIAL_EMAIL = "xuyangtogether@163.com";

    @Resource
    private JavaMailSender mailSender;

    @Resource
    private FeedbackMapper feedbackMapper;

    @Value("${app.service.mail.from:${spring.mail.username:}}")
    private String from;

    @PostMapping("/requests")
    public Result<Void> submit(@RequestBody ServiceRequestDTO request) {
        if (blank(request.getName()) || blank(request.getContact()) || blank(request.getDescription())) {
            return Result.fail(400, "请完整填写姓名、联系方式和需求描述");
        }
        try {
            BizFeedback feedback = new BizFeedback(); feedback.setUserId(UserContext.getUserId()); feedback.setName(request.getName()); feedback.setCompany(request.getCompany()); feedback.setContact(request.getContact()); feedback.setType(request.getType()); feedback.setDescription(request.getDescription()); feedbackMapper.insert(feedback);
            SimpleMailMessage message = new SimpleMailMessage();
            if (!blank(from)) message.setFrom(from);
            message.setTo(OFFICIAL_EMAIL);
            message.setSubject("【AR 粒子特效库需求】" + safe(request.getType()));
            message.setText("姓名：" + request.getName()
                    + "\n公司：" + safe(request.getCompany())
                    + "\n联系方式：" + request.getContact()
                    + "\n需求类型：" + safe(request.getType())
                    + "\n需求描述：\n" + request.getDescription());
            mailSender.send(message);
            return Result.success();
        } catch (Exception e) {
            return Result.fail(503, "邮件服务暂未配置，请联系管理员配置 SMTP");
        }
    }

    private boolean blank(String value) { return value == null || value.trim().isEmpty(); }
    private String safe(String value) { return blank(value) ? "—" : value.trim(); }
}

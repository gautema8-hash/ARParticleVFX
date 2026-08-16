package com.arpfx.platform.controller;

import com.arpfx.platform.common.result.Result;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * 智能助手统一模型转发接口。
 * 当前协议采用 OpenAI Chat Completions 兼容格式，前端只需要切换 Provider 和 Base URL。
 * 生产环境建议将 API Key 改为服务端加密配置，不从浏览器传入。
 */
@RestController
@RequestMapping("/api/assistant")
public class AssistantController {

    private static final Set<String> ALLOWED_HOSTS = new HashSet<>(Arrays.asList(
            "api.deepseek.com",
            "dashscope.aliyuncs.com",
            "open.bigmodel.cn",
            "api.moonshot.cn",
            "api.openai.com",
            "api.anthropic.com",
            "generativelanguage.googleapis.com",
            "api.mistral.ai"
    ));

    private final RestTemplate restTemplate = new RestTemplate();

    @PostMapping("/chat")
    public Result<Map<String, Object>> chat(@RequestBody Map<String, Object> request) {
        String apiKey = text(request.get("apiKey"));
        String baseUrl = text(request.get("baseUrl"));
        String model = text(request.get("model"));
        if (apiKey.isEmpty() || baseUrl.isEmpty() || model.isEmpty()) {
            return Result.fail(400, "请完整配置 API Key、接口地址和模型");
        }
        if (!isAllowedEndpoint(baseUrl)) {
            return Result.fail(400, "接口地址不在允许的模型服务列表中");
        }

        Map<String, Object> body = new HashMap<>();
        body.put("model", model);
        body.put("messages", request.getOrDefault("messages", new ArrayList<>()));
        String reasoning = text(request.get("reasoningEffort"));
        if (!reasoning.isEmpty() && !"auto".equals(reasoning) && !"none".equals(reasoning)) {
            body.put("reasoning_effort", reasoning);
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);
        try {
            String endpoint = baseUrl.replaceAll("/+$", "") + "/chat/completions";
            ResponseEntity<Map> response = restTemplate.exchange(
                    endpoint, HttpMethod.POST, new HttpEntity<>(body, headers), Map.class);
            Map resultBody = response.getBody();
            String reply = extractReply(resultBody);
            if (reply.isEmpty()) return Result.fail(502, "模型返回了空内容");
            Map<String, Object> result = new HashMap<>();
            result.put("reply", reply);
            result.put("model", model);
            result.put("provider", text(request.get("provider")));
            return Result.success(result);
        } catch (HttpStatusCodeException e) {
            return Result.fail(502, "模型服务返回错误（HTTP " + e.getRawStatusCode() + "）");
        } catch (Exception e) {
            return Result.fail(502, "模型服务连接失败，请检查接口地址和网络");
        }
    }

    private boolean isAllowedEndpoint(String baseUrl) {
        try {
            java.net.URI uri = java.net.URI.create(baseUrl);
            return "https".equalsIgnoreCase(uri.getScheme()) && ALLOWED_HOSTS.contains(uri.getHost());
        } catch (Exception e) {
            return false;
        }
    }

    private String extractReply(Map resultBody) {
        if (resultBody == null) return "";
        Object choicesObject = resultBody.get("choices");
        if (!(choicesObject instanceof List) || ((List) choicesObject).isEmpty()) return "";
        Object first = ((List) choicesObject).get(0);
        if (!(first instanceof Map)) return "";
        Object message = ((Map) first).get("message");
        if (!(message instanceof Map)) return "";
        return text(((Map) message).get("content"));
    }

    private String text(Object value) {
        return value == null ? "" : String.valueOf(value).trim();
    }
}

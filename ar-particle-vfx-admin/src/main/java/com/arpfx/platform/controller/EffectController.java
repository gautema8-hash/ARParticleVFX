package com.arpfx.platform.controller;

import com.arpfx.platform.common.result.PageResult;
import com.arpfx.platform.common.result.Result;
import com.arpfx.platform.entity.dto.EffectQueryDTO;
import com.arpfx.platform.entity.vo.EffectVO;
import com.arpfx.platform.service.EffectService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.Resource;

/**
 * 特效接口
 *
 * @author arpfx
 * @date 2026-08-14
 */
@RestController
@RequestMapping("/api/effect")
public class EffectController {

    @Resource
    private EffectService effectService;

    @GetMapping("/list")
    public Result<PageResult<EffectVO>> list(EffectQueryDTO dto) {
        return Result.success(effectService.page(dto));
    }

    @GetMapping("/{id}")
    public Result<EffectVO> detail(@PathVariable Long id) {
        return Result.success(effectService.detail(id));
    }
}

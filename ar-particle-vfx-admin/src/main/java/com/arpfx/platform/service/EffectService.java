package com.arpfx.platform.service;

import com.arpfx.platform.common.result.PageResult;
import com.arpfx.platform.entity.dto.EffectQueryDTO;
import com.arpfx.platform.entity.vo.EffectVO;

/**
 * 特效业务接口
 *
 * @author arpfx
 * @date 2026-08-14
 */
public interface EffectService {

    PageResult<EffectVO> page(EffectQueryDTO dto);

    EffectVO detail(Long id);
}

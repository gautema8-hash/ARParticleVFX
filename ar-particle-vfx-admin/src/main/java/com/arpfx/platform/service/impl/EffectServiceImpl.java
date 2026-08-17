package com.arpfx.platform.service.impl;

import com.arpfx.platform.common.enums.ResultCodeEnum;
import com.arpfx.platform.common.exception.BusinessException;
import com.arpfx.platform.common.result.PageResult;
import com.arpfx.platform.dao.mapper.EffectMapper;
import com.arpfx.platform.entity.dto.EffectQueryDTO;
import com.arpfx.platform.entity.po.BizEffect;
import com.arpfx.platform.entity.vo.EffectVO;
import com.arpfx.platform.service.EffectService;
import com.github.pagehelper.PageHelper;
import com.github.pagehelper.PageInfo;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 特效业务实现
 *
 * @author arpfx
 * @date 2026-08-14
 */
@Service
public class EffectServiceImpl implements EffectService {

    @Resource
    private EffectMapper effectMapper;

    @Override
    public PageResult<EffectVO> page(EffectQueryDTO dto) {
        PageHelper.startPage(dto.getPageNum(), dto.getPageSize());
        List<BizEffect> list = effectMapper.selectPage(dto.getCategory(), dto.getTier());
        PageInfo<BizEffect> pageInfo = new PageInfo<>(list);
        List<EffectVO> voList = list.stream().map(this::toVO).collect(Collectors.toList());
        return PageResult.of(pageInfo.getTotal(), voList);
    }

    @Override
    public EffectVO detail(Long id) {
        BizEffect effect = effectMapper.selectById(id);
        if (effect == null) {
            throw new BusinessException(ResultCodeEnum.EFFECT_NOT_FOUND);
        }
        return toVO(effect);
    }

    private EffectVO toVO(BizEffect e) {
        EffectVO vo = new EffectVO();
        vo.setId(e.getId());
        vo.setEffectCode(e.getEffectCode());
        vo.setEffectName(e.getEffectName());
        vo.setCategory(e.getCategory());
        vo.setMode(e.getMode());
        vo.setTags(e.getTags());
        vo.setTier(e.getTier());
        vo.setDescription(e.getDescription());
        vo.setCoverUrl(e.getCoverUrl());
        vo.setPrice(e.getPrice());
        vo.setCoverBase64(e.getCoverBase64());
        vo.setStatus(e.getStatus());
        vo.setSourceHtml(e.getSourceHtml());
        return vo;
    }
}

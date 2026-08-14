package com.arpfx.platform.service.impl;

import com.arpfx.platform.common.enums.ResultCodeEnum;
import com.arpfx.platform.common.exception.BusinessException;
import com.arpfx.platform.dao.mapper.EffectMapper;
import com.arpfx.platform.dao.mapper.OrderMapper;
import com.arpfx.platform.dao.mapper.UserMapper;
import com.arpfx.platform.entity.po.BizEffect;
import com.arpfx.platform.entity.po.BizOrder;
import com.arpfx.platform.entity.po.SysUser;
import com.arpfx.platform.entity.vo.EffectVO;
import com.arpfx.platform.entity.vo.OrderVO;
import com.arpfx.platform.entity.vo.UserVO;
import com.arpfx.platform.service.AdminService;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 管理后台业务实现
 *
 * @author arpfx
 * @date 2026-08-14
 */
@Service
public class AdminServiceImpl implements AdminService {

    @Resource
    private UserMapper userMapper;

    @Resource
    private OrderMapper orderMapper;

    @Resource
    private EffectMapper effectMapper;

    private void checkAdmin(Long adminId) {
        SysUser user = userMapper.selectById(adminId);
        if (user == null || user.getRole() == null || user.getRole() != 1) {
            throw new BusinessException(ResultCodeEnum.FORBIDDEN);
        }
    }

    @Override
    public List<UserVO> listUsers(Long adminId) {
        checkAdmin(adminId);
        return userMapper.selectAll().stream().map(this::toUserVO).collect(Collectors.toList());
    }

    @Override
    public List<OrderVO> listOrders(Long adminId) {
        checkAdmin(adminId);
        return orderMapper.selectAll().stream().map(this::toOrderVO).collect(Collectors.toList());
    }

    @Override
    public List<EffectVO> listEffects(Long adminId) {
        checkAdmin(adminId);
        return effectMapper.selectAll().stream().map(this::toEffectVO).collect(Collectors.toList());
    }

    @Override
    public void updateEffectStatus(Long adminId, Long effectId, Integer status) {
        checkAdmin(adminId);
        if (status == null || (status != 0 && status != 1)) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR.getCode(), "非法的状态值");
        }
        if (effectMapper.selectById(effectId) == null) {
            throw new BusinessException(ResultCodeEnum.EFFECT_NOT_FOUND);
        }
        effectMapper.updateStatus(effectId, status);
    }

    private UserVO toUserVO(SysUser u) {
        UserVO vo = new UserVO();
        vo.setId(u.getId());
        vo.setUsername(u.getUsername());
        vo.setEmail(u.getEmail());
        vo.setNickname(u.getNickname());
        vo.setTier(u.getTier());
        vo.setRole(u.getRole());
        return vo;
    }

    private OrderVO toOrderVO(BizOrder o) {
        OrderVO vo = new OrderVO();
        vo.setId(o.getId());
        vo.setOrderNo(o.getOrderNo());
        vo.setOrderType(o.getOrderType());
        vo.setEffectId(o.getEffectId());
        vo.setTier(o.getTier());
        vo.setAmount(o.getAmount());
        vo.setStatus(o.getStatus());
        vo.setCreateTime(o.getCreateTime());
        return vo;
    }

    private EffectVO toEffectVO(BizEffect e) {
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
        vo.setStatus(e.getStatus());
        return vo;
    }
}

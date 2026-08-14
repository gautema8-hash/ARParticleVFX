package com.arpfx.platform.service;

import com.arpfx.platform.entity.vo.EffectVO;
import com.arpfx.platform.entity.vo.OrderVO;
import com.arpfx.platform.entity.vo.UserVO;

import java.util.List;

/**
 * 管理后台业务接口（仅管理员可调用）
 *
 * @author arpfx
 * @date 2026-08-14
 */
public interface AdminService {

    List<UserVO> listUsers(Long adminId);

    List<OrderVO> listOrders(Long adminId);

    List<EffectVO> listEffects(Long adminId);

    void updateEffectStatus(Long adminId, Long effectId, Integer status);
}

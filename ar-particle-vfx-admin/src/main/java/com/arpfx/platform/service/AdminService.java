package com.arpfx.platform.service;

import com.arpfx.platform.entity.vo.EffectVO;
import com.arpfx.platform.entity.vo.OrderVO;
import com.arpfx.platform.entity.vo.UserVO;
import com.arpfx.platform.entity.dto.EffectCreateDTO;

import java.util.List;
import java.util.Map;

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

    EffectVO createEffect(Long publisherId, EffectCreateDTO dto);
    Map<String, Object> dashboard(Long adminId);
    void updateUser(Long adminId, Long userId, Map<String, Object> payload);
    void deleteUser(Long adminId, Long userId);
    void deleteEffect(Long adminId, Long effectId);
}

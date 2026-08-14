package com.arpfx.platform.service.impl;

import com.arpfx.platform.common.enums.OrderStatusEnum;
import com.arpfx.platform.common.enums.ResultCodeEnum;
import com.arpfx.platform.common.exception.BusinessException;
import com.arpfx.platform.dao.mapper.EffectMapper;
import com.arpfx.platform.dao.mapper.OrderMapper;
import com.arpfx.platform.dao.mapper.UserMapper;
import com.arpfx.platform.entity.dto.OrderCreateDTO;
import com.arpfx.platform.entity.po.BizEffect;
import com.arpfx.platform.entity.po.BizOrder;
import com.arpfx.platform.entity.vo.OrderVO;
import com.arpfx.platform.service.OrderService;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.annotation.Resource;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * 订单业务实现
 *
 * @author arpfx
 * @date 2026-08-14
 */
@Log4j2
@Service
public class OrderServiceImpl implements OrderService {

    /** 会员档位价格（元/月） */
    private static final BigDecimal PRO_PRICE = new BigDecimal("19");
    private static final BigDecimal ENTERPRISE_PRICE = new BigDecimal("99");

    @Resource
    private OrderMapper orderMapper;

    @Resource
    private EffectMapper effectMapper;

    @Resource
    private UserMapper userMapper;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public OrderVO create(Long userId, OrderCreateDTO dto) {
        // 订单类型仅支持 0（单特效）和 1（会员订阅），先判 null 避免拆箱 NPE
        if (dto.getOrderType() == null || (dto.getOrderType() != 0 && dto.getOrderType() != 1)) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR.getCode(), "非法的订单类型");
        }
        BizOrder order = new BizOrder();
        order.setOrderNo(generateOrderNo());
        order.setUserId(userId);
        order.setOrderType(dto.getOrderType());
        order.setStatus(OrderStatusEnum.PENDING.getCode());

        if (dto.getOrderType() == 0) {
            // 单特效购买：按特效编码（与前端特效 id 对齐）下单
            if (dto.getEffectCode() == null || dto.getEffectCode().isEmpty()) {
                throw new BusinessException(ResultCodeEnum.PARAM_ERROR.getCode(), "请选择特效");
            }
            BizEffect effect = effectMapper.selectByCode(dto.getEffectCode());
            if (effect == null) {
                throw new BusinessException(ResultCodeEnum.EFFECT_NOT_FOUND);
            }
            order.setEffectId(effect.getId());
            order.setAmount(effect.getPrice() == null ? BigDecimal.ZERO : effect.getPrice());
        } else {
            // 会员订阅
            Integer tier = dto.getTier();
            if (tier == null) {
                throw new BusinessException(ResultCodeEnum.PARAM_ERROR.getCode(), "请选择会员档位");
            }
            order.setTier(tier);
            order.setAmount(tier == 2 ? ENTERPRISE_PRICE : PRO_PRICE);
        }

        orderMapper.insert(order);
        return toVO(orderMapper.selectByOrderNo(order.getOrderNo()));
    }

    @Override
    public List<OrderVO> list(Long userId) {
        return orderMapper.selectByUser(userId).stream().map(this::toVO).collect(Collectors.toList());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void mockPayCallback(Long userId, String orderNo) {
        BizOrder order = orderMapper.selectByOrderNo(orderNo);
        if (order == null) {
            throw new BusinessException(ResultCodeEnum.ORDER_NOT_FOUND);
        }
        // 越权校验：仅允许订单归属用户本人触发（真实支付回调需验签，不依赖登录态）
        if (order.getUserId() == null || !order.getUserId().equals(userId)) {
            throw new BusinessException(ResultCodeEnum.FORBIDDEN);
        }
        // 使用 equals 比较枚举值，避免 Integer 引用比较的隐患
        if (!OrderStatusEnum.PENDING.getCode().equals(order.getStatus())) {
            throw new BusinessException(ResultCodeEnum.ORDER_STATUS_ERROR);
        }
        // CAS 条件更新：仅当订单仍为「待支付」时才置为「已支付」，保证幂等、防并发重复处理
        int updated = orderMapper.updateStatus(order.getId(), OrderStatusEnum.PENDING.getCode(), OrderStatusEnum.PAID.getCode());
        if (updated == 0) {
            throw new BusinessException(ResultCodeEnum.ORDER_STATUS_ERROR);
        }
        // 会员订阅：支付成功后升级用户档位（仅升不降）
        if (order.getOrderType() != null && order.getOrderType() == 1 && order.getTier() != null) {
            userMapper.upgradeTier(order.getUserId(), order.getTier());
        }
        log.info("订单支付成功，orderNo:{}", orderNo);
    }

    private String generateOrderNo() {
        // 使用 UUID 保证并发下订单号唯一，避免时间戳 + 随机数碰撞
        return "AR" + UUID.randomUUID().toString().replace("-", "");
    }

    private OrderVO toVO(BizOrder o) {
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
}

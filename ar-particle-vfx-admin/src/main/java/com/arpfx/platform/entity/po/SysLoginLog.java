package com.arpfx.platform.entity.po;

import lombok.Data;
import java.io.Serializable;
import java.time.LocalDateTime;

@Data
public class SysLoginLog implements Serializable {
    private Long id;
    private Long userId;
    private String username;
    private String nickname;
    private String email;
    private String operation;
    private LocalDateTime loginTime;
    private String ip;
    private String address;
    private String deviceType;
    private String userAgent;
    private String browser;
    private String os;
    private Integer success;
    private String detail;
    private Integer isDeleted;
}

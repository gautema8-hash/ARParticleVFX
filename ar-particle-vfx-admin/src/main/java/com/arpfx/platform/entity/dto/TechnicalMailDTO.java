package com.arpfx.platform.entity.dto;

import lombok.Data;
import java.util.List;

@Data
public class TechnicalMailDTO {
    private List<Long> userIds;
    private String subject;
    private String content;
}

package com.arpfx.platform.entity.po;
import lombok.Data;
import java.time.LocalDateTime;
@Data public class BizFeedback { private Long id; private Long userId; private String name; private String company; private String contact; private String type; private String description; private Integer status; private LocalDateTime createTime; private LocalDateTime updateTime; private LocalDateTime processTime; private Integer isDeleted; }

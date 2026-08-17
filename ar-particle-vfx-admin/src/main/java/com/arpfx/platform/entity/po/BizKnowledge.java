package com.arpfx.platform.entity.po;
import lombok.Data;
import java.time.LocalDateTime;
@Data public class BizKnowledge { private Long id; private String title; private String category; private String summary; private String content; private String imageBase64; private Integer status; private Long viewCount; private Long likeCount; private Long favoriteCount; private String authorName; private LocalDateTime createTime; private LocalDateTime updateTime; private Long createBy; private Integer isDeleted; }

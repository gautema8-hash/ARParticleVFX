package com.arpfx.platform.controller;
import com.arpfx.platform.common.result.Result;
import com.arpfx.platform.dao.mapper.KnowledgeMapper;
import com.arpfx.platform.entity.po.BizKnowledge;
import org.springframework.web.bind.annotation.*;
import javax.annotation.Resource;
import java.util.List;
@RestController @RequestMapping("/api/knowledge")
public class KnowledgeController {
 @Resource private KnowledgeMapper mapper;
 @GetMapping("/list") public Result<List<BizKnowledge>> list(){ return Result.success(mapper.selectPublished()); }
 @PostMapping("/{id}/view") public Result<Void> view(@PathVariable Long id){mapper.incrementView(id);return Result.success();}
 @PostMapping("/{id}/favorite") public Result<Void> favorite(@PathVariable Long id){mapper.incrementFavorite(id);return Result.success();}
 @PostMapping("/{id}/unfavorite") public Result<Void> unfavorite(@PathVariable Long id){mapper.decrementFavorite(id);return Result.success();}
}

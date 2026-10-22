package com.hirematch.controller;

import com.hirematch.service.EnhancementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/enhancements")
@RequiredArgsConstructor
public class EnhancementController {

    private final EnhancementService enhancementService;

    @PostMapping("/{jobId}")
    public ResponseEntity<Map<String, Object>> enhanceResume(
            Authentication auth,
            @PathVariable Long jobId) {
        return ResponseEntity.ok(enhancementService.enhanceResume(auth.getName(), jobId));
    }
}

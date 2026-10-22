package com.hirematch.controller;

import com.hirematch.dto.MatchDtos.MatchRecommendationDto;
import com.hirematch.service.MatchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/matches")
@RequiredArgsConstructor
public class MatchController {

    private final MatchService matchService;

    @GetMapping("/recommendations")
    public ResponseEntity<List<MatchRecommendationDto>> getRecommendations(
            Authentication auth,
            @RequestParam(defaultValue = "10") int limit) {
        String email = auth != null ? auth.getName() : null;
        return ResponseEntity.ok(matchService.getRecommendations(email, limit));
    }

    @GetMapping("/{jobId}")
    public ResponseEntity<com.hirematch.dto.MatchDtos.MatchAnalysisDto> getMatchAnalysis(
            Authentication auth,
            @org.springframework.web.bind.annotation.PathVariable Long jobId) {
        return ResponseEntity.ok(matchService.getMatchAnalysis(auth.getName(), jobId));
    }
}

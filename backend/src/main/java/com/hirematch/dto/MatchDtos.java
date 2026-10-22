package com.hirematch.dto;

import com.hirematch.dto.JobDtos.JobDto;
import lombok.Builder;
import lombok.Data;
import java.util.List;

public class MatchDtos {

    @Data
    @Builder
    public static class MatchRecommendationDto {
        private JobDto job;
        private Float overallScore;
        private Float semanticScore;
        private Float skillScore;
        private List<String> matchedSkills;
        private List<String> missingSkills;
        private String verdict;
    }

    @Data
    @Builder
    public static class MatchAnalysisDto {
        private Long resumeId;
        private Long jobId;
        private Float overallScore;
        private Float semanticScore;
        private Float skillScore;
        private Float experienceScore;
        private List<String> matchedSkills;
        private List<String> missingSkills;
        private String verdict;
    }
}

package com.hirematch.dto;

import lombok.Builder;
import lombok.Data;
import java.time.OffsetDateTime;
import java.util.Map;

public class ResumeDtos {

    @Data
    @Builder
    public static class ResumeDto {
        private Long id;
        private Integer version;
        private String label;
        private Boolean isPrimary;
        private String source;
        private String fileName;
        private Map<String, Object> parsedJson;
        private Short atsScore;
        private OffsetDateTime createdAt;
        private OffsetDateTime updatedAt;
    }

    @Data
    public static class SetPrimaryRequest {
        private Boolean isPrimary;
    }

    @Data
    public static class CreateBuiltResumeRequest {
        private String label;
        private String fileName;
        private Map<String, Object> parsedJson;
    }
}

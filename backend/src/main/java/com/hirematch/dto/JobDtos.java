package com.hirematch.dto;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

public class JobDtos {

    @Data
    @Builder
    public static class JobDto {
        private Long id;
        private String source;
        private String externalId;
        private String title;
        private String company;
        private String location;
        private String workMode;
        private String jobType;
        private Short experienceMin;
        private Short experienceMax;
        private BigDecimal salaryMin;
        private BigDecimal salaryMax;
        private String currency;
        private String description;
        private String applyUrl;
        private OffsetDateTime postedAt;
        private OffsetDateTime expiresAt;
    }
}

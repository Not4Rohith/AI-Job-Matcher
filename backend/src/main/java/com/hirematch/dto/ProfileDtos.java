package com.hirematch.dto;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

public class ProfileDtos {

    @Data
    @Builder
    public static class UserProfileDto {
        private Long id;
        private String firstName;
        private String lastName;
        private String email; // From User entity
        private String phone;
        private String location;
        private String preferredWorkMode;
        private Integer noticePeriodDays;
        private BigDecimal expectedCtc;
        private String workAuthorization;
        private String linkedinUrl;
        private String githubUrl;
        private String portfolioUrl;
        private String bio;
        private String avatarUrl;
        private OffsetDateTime updatedAt;
    }

    @Data
    public static class UserProfileUpdateRequest {
        private String firstName;
        private String lastName;
        private String phone;
        private String location;
        private String preferredWorkMode;
        private Integer noticePeriodDays;
        private BigDecimal expectedCtc;
        private String workAuthorization;
        private String linkedinUrl;
        private String githubUrl;
        private String portfolioUrl;
        private String bio;
        private String avatarUrl;
    }
}

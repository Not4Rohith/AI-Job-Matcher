package com.hirematch.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "jobs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Job {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 30, nullable = false)
    private String source;

    @Column(name = "external_id", length = 200)
    private String externalId;

    @Column(length = 64, nullable = false, unique = true)
    private String hash;

    @Column(length = 300, nullable = false)
    private String title;

    @Column(length = 200)
    private String company;

    @Column(length = 300)
    private String location;

    @Column(name = "work_mode", length = 20)
    private String workMode;

    @Column(name = "job_type", length = 30)
    private String jobType;

    @Column(name = "experience_min")
    private Short experienceMin;

    @Column(name = "experience_max")
    private Short experienceMax;

    @Column(name = "salary_min")
    private BigDecimal salaryMin;

    @Column(name = "salary_max")
    private BigDecimal salaryMax;

    @Column(length = 10)
    private String currency;

    @Column(columnDefinition = "text")
    private String description;

    @Column(name = "apply_url", length = 1000)
    private String applyUrl;

    @Column(name = "apply_email", length = 255)
    private String applyEmail;

    @Column(name = "posted_at")
    private OffsetDateTime postedAt;

    @Column(name = "expires_at")
    private OffsetDateTime expiresAt;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    // We don't map embedding vector directly to JPA memory to save bandwidth, unless required.
    // If needed later, we can map it.

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}

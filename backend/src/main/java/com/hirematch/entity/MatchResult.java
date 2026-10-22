package com.hirematch.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Type;
import io.hypersistence.utils.hibernate.type.json.JsonType;

import java.time.OffsetDateTime;
import java.util.List;

@Entity
@Table(name = "match_results")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MatchResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resume_id", nullable = false)
    private Resume resume;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id", nullable = false)
    private Job job;

    @Column(name = "overall_score", nullable = false)
    private Float overallScore;

    @Column(name = "semantic_score")
    private Float semanticScore;

    @Column(name = "skill_score")
    private Float skillScore;

    @Column(name = "experience_score")
    private Float experienceScore;

    @Column(name = "location_score")
    private Float locationScore;

    @Type(JsonType.class)
    @Column(name = "matched_skills", columnDefinition = "jsonb")
    private List<String> matchedSkills;

    @Type(JsonType.class)
    @Column(name = "missing_skills", columnDefinition = "jsonb")
    private List<String> missingSkills;

    @Column(columnDefinition = "text")
    private String verdict;

    @CreationTimestamp
    @Column(name = "computed_at", updatable = false)
    private OffsetDateTime computedAt;
}

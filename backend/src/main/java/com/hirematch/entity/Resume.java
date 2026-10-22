package com.hirematch.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.Type;
import io.hypersistence.utils.hibernate.type.json.JsonType;

import java.time.OffsetDateTime;
import java.util.Map;

@Entity
@Table(name = "resumes")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Resume {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private Integer version;

    @Column(length = 100)
    private String label;

    @Column(name = "is_primary", nullable = false)
    private Boolean isPrimary;

    @Column(length = 20, nullable = false)
    private String source;

    @Column(name = "file_path", length = 500)
    private String filePath;

    @Column(name = "file_name", length = 255)
    private String fileName;

    @Column(name = "mime_type", length = 100)
    private String mimeType;

    @Type(JsonType.class)
    @Column(name = "parsed_json", columnDefinition = "jsonb")
    private Map<String, Object> parsedJson;

    // We'll leave embedding as a native String or double[] if mapped properly, 
    // but for now we won't map it directly to JPA if we do matching natively in SQL.
    // For Phase 2 (Parsing) we don't strictly need to fetch the vector into memory.

    @Column(name = "ats_score")
    private Short atsScore;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}

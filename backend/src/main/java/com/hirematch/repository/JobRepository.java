package com.hirematch.repository;

import com.hirematch.entity.Job;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface JobRepository extends JpaRepository<Job, Long> {
    
    Optional<Job> findByHash(String hash);

    @org.springframework.transaction.annotation.Transactional
    @Modifying
    @Query(value = "UPDATE jobs SET embedding = CAST(:vectorString AS vector) WHERE id = :id", nativeQuery = true)
    void updateEmbedding(Long id, String vectorString);

    // Find recommended jobs using pgvector cosine distance (<=>)
    // We return Object[] to include the similarity score alongside the Job entity fields
    @Query(value = "SELECT j.id as job_id, (1 - (j.embedding <=> r.embedding)) as similarity " +
                   "FROM jobs j, resumes r " +
                   "WHERE r.id = :resumeId AND j.embedding IS NOT NULL AND r.embedding IS NOT NULL " +
                   "ORDER BY j.embedding <=> r.embedding LIMIT :limit", nativeQuery = true)
    java.util.List<Object[]> findRecommendedJobIdsWithScore(Long resumeId, int limit);

    java.util.List<Job> findTop20ByIsActiveTrueOrderByPostedAtDesc();

    @Query("SELECT j FROM Job j WHERE " +
           "(:query IS NULL OR :query = '' OR LOWER(j.title) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(j.company) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(j.location) LIKE LOWER(CONCAT('%', :query, '%'))) AND " +
           "(:workMode IS NULL OR :workMode = 'All' OR :workMode = '' OR UPPER(j.workMode) = UPPER(:workMode)) AND " +
           "(:jobType IS NULL OR :jobType = 'All' OR :jobType = '' OR UPPER(j.jobType) = UPPER(:jobType)) " +
           "ORDER BY j.postedAt DESC NULLS LAST, j.createdAt DESC")
    org.springframework.data.domain.Page<Job> searchJobs(String query, String workMode, String jobType, org.springframework.data.domain.Pageable pageable);
}

package com.hirematch.repository;

import com.hirematch.entity.Resume;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ResumeRepository extends JpaRepository<Resume, Long> {
    
    List<Resume> findByUserIdOrderByCreatedAtDesc(Long userId);
    
    Optional<Resume> findByIdAndUserId(Long id, Long userId);
    
    Optional<Resume> findFirstByUserIdAndIsPrimaryTrue(Long userId);
    
    @org.springframework.transaction.annotation.Transactional
    @Modifying
    @Query("UPDATE Resume r SET r.isPrimary = false WHERE r.user.id = :userId")
    void clearPrimaryFlagsForUser(Long userId);

    @org.springframework.transaction.annotation.Transactional
    @Modifying
    @Query(value = "UPDATE resumes SET embedding = CAST(:vectorString AS vector) WHERE id = :id", nativeQuery = true)
    void updateEmbedding(Long id, String vectorString);
}

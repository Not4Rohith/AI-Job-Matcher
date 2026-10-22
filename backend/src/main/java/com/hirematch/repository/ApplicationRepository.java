package com.hirematch.repository;

import com.hirematch.entity.Application;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {
    List<Application> findAllByUserIdOrderByUpdatedAtDesc(Long userId);
    Optional<Application> findByUserIdAndJobId(Long userId, Long jobId);
}

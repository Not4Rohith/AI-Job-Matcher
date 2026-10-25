package com.hirematch.controller;

import com.hirematch.entity.Job;
import com.hirematch.repository.JobRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
import java.util.UUID;
import java.math.BigDecimal;

@RestController
@RequestMapping("/api/v1/jobs")
@RequiredArgsConstructor
public class JobController {

    private final JobRepository jobRepository;
    private final com.hirematch.scheduler.JobIngestionService jobIngestionService;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${ai.service.url:http://localhost:8000}")
    private String aiServiceUrl;

    @GetMapping
    public ResponseEntity<org.springframework.data.domain.Page<com.hirematch.dto.JobDtos.JobDto>> searchJobs(
            @org.springframework.web.bind.annotation.RequestParam(required = false) String query,
            @org.springframework.web.bind.annotation.RequestParam(required = false) String workMode,
            @org.springframework.web.bind.annotation.RequestParam(required = false) String jobType,
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "0") int page,
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "20") int size) {
        
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size);
        org.springframework.data.domain.Page<Job> jobs = jobRepository.searchJobs(query, workMode, jobType, pageable);
        
        return ResponseEntity.ok(jobs.map(this::mapToJobDto));
    }

    @GetMapping("/{id}")
    public ResponseEntity<com.hirematch.dto.JobDtos.JobDto> getJobById(@org.springframework.web.bind.annotation.PathVariable Long id) {
        return jobRepository.findById(id)
                .map(job -> ResponseEntity.ok(mapToJobDto(job)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/sync")
    public ResponseEntity<Map<String, Object>> syncJobs() {
        int ingested = jobIngestionService.ingestJobsFromRemotive();
        return ResponseEntity.ok(Map.of("status", "success", "ingested", ingested));
    }

    @PostMapping("/seed")
    public ResponseEntity<String> seedJobs() {
        seedJob("Senior React Developer", "Zepto", "React, TypeScript, Redux, 5+ years experience building scalable frontend applications.");
        seedJob("AI/ML Engineer", "Sarvam AI", "Python, PyTorch, LLMs, Sentence Transformers, PGVector, 3+ years experience.");
        seedJob("Backend Engineer (Java)", "CRED", "Java 21, Spring Boot, Microservices, PostgreSQL, Kafka, Redis. High scale system design.");
        
        return ResponseEntity.ok("Jobs seeded with embeddings.");
    }

    private void seedJob(String title, String company, String description) {
        Job job = Job.builder()
                .title(title)
                .company(company)
                .description(description)
                .source("MANUAL")
                .hash(UUID.randomUUID().toString())
                .location("Bengaluru")
                .workMode("Hybrid")
                .jobType("Full-time")
                .experienceMin((short) 2)
                .experienceMax((short) 5)
                .build();
        
        Job saved = jobRepository.save(job);

        // Generate embedding
        try {
            Map<String, String> embedReq = Map.of("text", title + ". " + description);
            ResponseEntity<String> embedResp = restTemplate.postForEntity(
                    aiServiceUrl + "/embed", embedReq, String.class);
            if (embedResp.getStatusCode().is2xxSuccessful()) {
                com.fasterxml.jackson.databind.JsonNode root = objectMapper.readTree(embedResp.getBody());
                com.fasterxml.jackson.databind.JsonNode embeddingNode = root.get("embedding");
                if (embeddingNode != null) {
                    jobRepository.updateEmbedding(saved.getId(), embeddingNode.toString());
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private com.hirematch.dto.JobDtos.JobDto mapToJobDto(Job job) {
        return com.hirematch.dto.JobDtos.JobDto.builder()
                .id(job.getId())
                .source(job.getSource())
                .externalId(job.getExternalId())
                .title(job.getTitle())
                .company(job.getCompany())
                .location(job.getLocation())
                .workMode(job.getWorkMode())
                .jobType(job.getJobType())
                .experienceMin(job.getExperienceMin())
                .experienceMax(job.getExperienceMax())
                .salaryMin(job.getSalaryMin())
                .salaryMax(job.getSalaryMax())
                .currency(job.getCurrency())
                .description(job.getDescription())
                .applyUrl(job.getApplyUrl())
                .postedAt(job.getPostedAt())
                .expiresAt(job.getExpiresAt())
                .build();
    }
}

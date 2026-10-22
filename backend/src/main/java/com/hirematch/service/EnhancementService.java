package com.hirematch.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hirematch.entity.Job;
import com.hirematch.entity.Resume;
import com.hirematch.entity.User;
import com.hirematch.repository.JobRepository;
import com.hirematch.repository.ResumeRepository;
import com.hirematch.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class EnhancementService {

    private final JobRepository jobRepository;
    private final ResumeRepository resumeRepository;
    private final UserRepository userRepository;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper;

    @Value("${ai.service.url:http://localhost:8000}")
    private String aiServiceUrl;

    @Transactional(readOnly = true)
    public Map<String, Object> enhanceResume(String email, Long jobId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Resume primaryResume = resumeRepository.findFirstByUserIdAndIsPrimaryTrue(user.getId())
                .orElseThrow(() -> new RuntimeException("No primary resume found for enhancement."));

        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found"));

        try {
            Map<String, Object> req = Map.of(
                    "resume_json", primaryResume.getParsedJson(),
                    "job_description", job.getTitle() + "\n" + job.getDescription(),
                    "resume_text", ""
            );

            ResponseEntity<String> resp = restTemplate.postForEntity(
                    aiServiceUrl + "/enhance", req, String.class);

            if (resp.getStatusCode().is2xxSuccessful() && resp.getBody() != null) {
                return objectMapper.readValue(resp.getBody(), Map.class);
            }
        } catch (Exception e) {
            log.error("Failed to enhance resume", e);
            throw new RuntimeException("Failed to enhance resume due to AI service error.", e);
        }

        throw new RuntimeException("Failed to get response from AI service.");
    }
}

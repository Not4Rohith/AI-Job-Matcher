package com.hirematch.controller;

import com.hirematch.entity.Application;
import com.hirematch.entity.Job;
import com.hirematch.entity.User;
import com.hirematch.repository.ApplicationRepository;
import com.hirematch.repository.JobRepository;
import com.hirematch.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/applications")
@RequiredArgsConstructor
public class ApplicationController {

    private final ApplicationRepository applicationRepository;
    private final JobRepository jobRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getApplications(Authentication auth) {
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Application> applications = applicationRepository.findAllByUserIdOrderByUpdatedAtDesc(user.getId());
        List<Map<String, Object>> response = applications.stream().map(app -> {
            Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", app.getId());
            map.put("jobId", app.getJob().getId());
            map.put("title", app.getJob().getTitle());
            map.put("company", app.getJob().getCompany());
            map.put("status", app.getStatus());
            map.put("appliedAt", app.getAppliedAt() != null ? app.getAppliedAt().toString() : "");
            map.put("updatedAt", app.getUpdatedAt().toString());
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createApplication(Authentication auth, @RequestBody Map<String, Object> req) {
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Long jobId = ((Number) req.get("jobId")).longValue();
        Job job = jobRepository.findById(jobId).orElseThrow(() -> new RuntimeException("Job not found"));

        Application application = applicationRepository.findByUserIdAndJobId(user.getId(), jobId)
                .orElse(Application.builder()
                        .user(user)
                        .job(job)
                        .status("SAVED")
                        .build());

        if (req.containsKey("status")) {
            application.setStatus((String) req.get("status"));
            if ("APPLIED".equals(application.getStatus())) {
                application.setAppliedAt(OffsetDateTime.now());
            }
        }

        Application saved = applicationRepository.save(application);

        return ResponseEntity.ok(Map.of(
                "id", saved.getId(),
                "status", saved.getStatus()
        ));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Map<String, Object>> updateStatus(
            Authentication auth,
            @PathVariable Long id,
            @RequestBody Map<String, String> req) {
        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found"));

        application.setStatus(req.get("status"));
        if ("APPLIED".equals(application.getStatus()) && application.getAppliedAt() == null) {
            application.setAppliedAt(OffsetDateTime.now());
        }

        applicationRepository.save(application);

        return ResponseEntity.ok(Map.of("success", true, "status", application.getStatus()));
    }
}

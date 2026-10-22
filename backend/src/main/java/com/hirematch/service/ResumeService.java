package com.hirematch.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hirematch.dto.ResumeDtos.ResumeDto;
import com.hirematch.dto.ResumeDtos.CreateBuiltResumeRequest;
import com.hirematch.entity.Resume;
import com.hirematch.entity.User;
import com.hirematch.repository.ResumeRepository;
import com.hirematch.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ResumeService {

    private final ResumeRepository resumeRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${ai.service.url:http://localhost:8000}")
    private String aiServiceUrl;

    @Transactional
    public ResumeDto uploadAndParseResume(String email, MultipartFile file) throws Exception {
        User user = findUser(email);

        Map<String, Object> parsedJson = new java.util.HashMap<>();
        String rawText = "";

        // 1. Try sending file to Python AI Service for parsing
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            ByteArrayResource fileAsResource = new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return file.getOriginalFilename();
                }
            };
            body.add("file", fileAsResource);

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(
                    aiServiceUrl + "/parse-resume", requestEntity, String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                parsedJson = objectMapper.readValue(response.getBody(), new TypeReference<>() {});
                rawText = (String) parsedJson.get("raw_text");
            }
        } catch (Exception e) {
            log.warn("AI service resume parsing call failed ({}), falling back to direct metadata parsing", e.getMessage());
            parsedJson.put("contact", Map.of("email", user.getEmail()));
            parsedJson.put("summary", "Uploaded Resume: " + file.getOriginalFilename());
            parsedJson.put("skills", List.of("Communication", "Problem Solving"));
            parsedJson.put("experience", List.of());
            parsedJson.put("education", List.of());
            rawText = file.getOriginalFilename();
        }

        // 2. Save in database
        boolean isFirstResume = resumeRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).isEmpty();

        Resume resume = Resume.builder()
                .user(user)
                .version(1)
                .label("Uploaded Resume")
                .isPrimary(isFirstResume)
                .source("UPLOAD")
                .fileName(file.getOriginalFilename())
                .mimeType(file.getContentType())
                .parsedJson(parsedJson)
                .build();

        Resume savedResume = resumeRepository.save(resume);

        // 3. Generate embedding in background
        if (rawText != null && !rawText.isBlank()) {
            try {
                Map<String, String> embedReq = Map.of("text", rawText);
                ResponseEntity<String> embedResp = restTemplate.postForEntity(
                        aiServiceUrl + "/embed", embedReq, String.class);
                if (embedResp.getStatusCode().is2xxSuccessful() && embedResp.getBody() != null) {
                    com.fasterxml.jackson.databind.JsonNode root = objectMapper.readTree(embedResp.getBody());
                    com.fasterxml.jackson.databind.JsonNode embeddingNode = root.get("embedding");
                    if (embeddingNode != null) {
                        resumeRepository.updateEmbedding(savedResume.getId(), embeddingNode.toString());
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to generate embedding for resume {}: {}", savedResume.getId(), e.getMessage());
            }
        }

        return mapToDto(savedResume);
    }

    @Transactional
    public ResumeDto createBuiltResume(String email, CreateBuiltResumeRequest request) {
        User user = findUser(email);

        boolean isFirstResume = resumeRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).isEmpty();

        Resume resume = Resume.builder()
                .user(user)
                .version(1)
                .label(request.getLabel() != null && !request.getLabel().isBlank() ? request.getLabel() : "Built Resume")
                .isPrimary(isFirstResume)
                .source("BUILDER")
                .fileName(request.getFileName() != null && !request.getFileName().isBlank() ? request.getFileName() : "Resume_AI_Built.pdf")
                .parsedJson(request.getParsedJson())
                .atsScore((short) 85)
                .build();

        Resume savedResume = resumeRepository.save(resume);
        return mapToDto(savedResume);
    }

    @Transactional(readOnly = true)
    public List<ResumeDto> getResumes(String email) {
        User user = findUser(email);
        return resumeRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional
    public ResumeDto setPrimary(String email, Long resumeId) {
        User user = findUser(email);

        Resume resume = resumeRepository.findByIdAndUserId(resumeId, user.getId())
                .orElseThrow(() -> new RuntimeException("Resume not found"));

        resumeRepository.clearPrimaryFlagsForUser(user.getId());
        resume.setIsPrimary(true);
        return mapToDto(resumeRepository.save(resume));
    }

    @Transactional
    public void deleteResume(String email, Long resumeId) {
        User user = findUser(email);
        Resume resume = resumeRepository.findByIdAndUserId(resumeId, user.getId())
                .orElseThrow(() -> new RuntimeException("Resume not found"));
        
        resumeRepository.delete(resume);

        if (resume.getIsPrimary()) {
            resumeRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream().findFirst()
                .ifPresent(latest -> {
                    latest.setIsPrimary(true);
                    resumeRepository.save(latest);
                });
        }
    }

    /**
     * Extracts raw text from a resume file by delegating to the AI service.
     * Returns just the raw_text string without storing anything to DB.
     */
    public String extractTextOnly(MultipartFile file) throws Exception {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            ByteArrayResource fileAsResource = new ByteArrayResource(file.getBytes()) {
                @Override public String getFilename() { return file.getOriginalFilename(); }
            };
            body.add("file", fileAsResource);
            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(aiServiceUrl + "/parse-resume", requestEntity, String.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> parsed = objectMapper.readValue(response.getBody(), new TypeReference<>() {});
                Object raw = parsed.get("raw_text");
                return raw != null ? raw.toString() : "";
            }
        } catch (Exception e) {
            log.warn("extractTextOnly failed: {}", e.getMessage());
        }
        return "";
    }

    private User findUser(String identifier) {
        if (identifier == null || identifier.isBlank()) {
            throw new RuntimeException("User not found");
        }
        if (identifier.matches("\\d+")) {
            return userRepository.findById(Long.parseLong(identifier))
                    .or(() -> userRepository.findByEmail(identifier))
                    .orElseThrow(() -> new RuntimeException("User not found"));
        }
        return userRepository.findByEmail(identifier)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private ResumeDto mapToDto(Resume resume) {
        return ResumeDto.builder()
                .id(resume.getId())
                .version(resume.getVersion())
                .label(resume.getLabel())
                .isPrimary(resume.getIsPrimary())
                .source(resume.getSource())
                .fileName(resume.getFileName())
                .parsedJson(resume.getParsedJson())
                .atsScore(resume.getAtsScore())
                .createdAt(resume.getCreatedAt())
                .updatedAt(resume.getUpdatedAt())
                .build();
    }
}

package com.hirematch.scheduler;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hirematch.entity.Job;
import com.hirematch.repository.JobRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class JobIngestionService {

    private final JobRepository jobRepository;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${ai.service.url:http://localhost:8000}")
    private String aiServiceUrl;

    // Run every hour. For testing, you could change this to fixedDelay = 60000 (every minute)
    @Scheduled(fixedDelay = 3600000, initialDelay = 10000)
    public int ingestJobsFromRemotive() {
        log.info("Starting Remotive job ingestion...");
        try {
            String url = "https://remotive.com/api/remote-jobs?category=software-dev&limit=20";
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            
            if (response.getStatusCode().is2xxSuccessful()) {
                JsonNode root = objectMapper.readTree(response.getBody());
                JsonNode jobsNode = root.get("jobs");
                
                if (jobsNode != null && jobsNode.isArray()) {
                    int ingested = 0;
                    for (JsonNode jobNode : jobsNode) {
                        if (ingestSingleJob(jobNode)) {
                            ingested++;
                        }
                    }
                    log.info("Successfully ingested {} new jobs from Remotive.", ingested);
                    return ingested;
                }
            }
        } catch (Exception e) {
            log.error("Failed to ingest jobs from Remotive", e);
        }
        return 0;
    }

    private boolean ingestSingleJob(JsonNode jobNode) {
        try {
            String externalId = jobNode.get("id").asText();
            String title = jobNode.get("title").asText();
            String company = jobNode.get("company_name").asText();
            
            // Hash to prevent duplicates
            String hash = calculateHash("REMOTIVE", externalId, title, company);
            Optional<Job> existing = jobRepository.findByHash(hash);
            
            if (existing.isPresent()) {
                return false; // Skip already ingested jobs
            }

            String description = "";
            if (jobNode.has("description")) {
                // The description from Remotive contains HTML, we can strip or keep it
                description = jobNode.get("description").asText().replaceAll("<[^>]+>", " ");
            }

            OffsetDateTime postedAt = OffsetDateTime.now();
            if (jobNode.has("publication_date") && !jobNode.get("publication_date").isNull()) {
                String rawDate = jobNode.get("publication_date").asText();
                try {
                    postedAt = OffsetDateTime.parse(rawDate, DateTimeFormatter.ISO_OFFSET_DATE_TIME);
                } catch (Exception ex) {
                    try {
                        postedAt = java.time.LocalDateTime.parse(rawDate, DateTimeFormatter.ISO_LOCAL_DATE_TIME)
                                .atOffset(java.time.ZoneOffset.UTC);
                    } catch (Exception ignored) {
                        postedAt = OffsetDateTime.now();
                    }
                }
            }

            Job job = Job.builder()
                    .source("REMOTIVE")
                    .externalId(externalId)
                    .hash(hash)
                    .title(title)
                    .company(company)
                    .location(jobNode.has("candidate_required_location") ? jobNode.get("candidate_required_location").asText() : "Remote")
                    .workMode("Remote")
                    .jobType(jobNode.has("job_type") ? jobNode.get("job_type").asText() : "Full-time")
                    .salaryMin(BigDecimal.ZERO) // Salary is a string on Remotive, skipping parse for brevity
                    .salaryMax(BigDecimal.ZERO)
                    .currency("USD")
                    .description(description)
                    .applyUrl(jobNode.has("url") ? jobNode.get("url").asText() : "")
                    .postedAt(postedAt)
                    .build();

            Job savedJob = jobRepository.save(job);
            
            // Generate Vector Embedding for semantic search
            generateEmbedding(savedJob);
            
            return true;

        } catch (Exception e) {
            log.warn("Error ingesting a single job: {}", e.getMessage());
            return false;
        }
    }

    private void generateEmbedding(Job job) {
        try {
            // Text to embed: Title + Company + Description
            String textToEmbed = job.getTitle() + " at " + job.getCompany() + ". " + 
                                 (job.getDescription().length() > 2000 ? job.getDescription().substring(0, 2000) : job.getDescription());
                                 
            Map<String, String> embedReq = Map.of("text", textToEmbed);
            ResponseEntity<String> embedResp = restTemplate.postForEntity(
                    aiServiceUrl + "/embed", embedReq, String.class);
                    
            if (embedResp.getStatusCode().is2xxSuccessful()) {
                JsonNode root = objectMapper.readTree(embedResp.getBody());
                JsonNode embeddingNode = root.get("embedding");
                if (embeddingNode != null) {
                    jobRepository.updateEmbedding(job.getId(), embeddingNode.toString());
                }
            }
        } catch (Exception e) {
            log.warn("Failed to generate embedding for job {}", job.getId(), e);
        }
    }

    private String calculateHash(String source, String externalId, String title, String company) {
        try {
            String raw = source + "|" + externalId + "|" + title + "|" + company;
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] encodedhash = digest.digest(raw.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder(2 * encodedhash.length);
            for (byte b : encodedhash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}

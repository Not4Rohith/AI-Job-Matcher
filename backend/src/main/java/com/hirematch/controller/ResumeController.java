package com.hirematch.controller;

import com.hirematch.dto.ResumeDtos.ResumeDto;
import com.hirematch.dto.ResumeDtos.SetPrimaryRequest;
import com.hirematch.dto.ResumeDtos.CreateBuiltResumeRequest;
import com.hirematch.service.ResumeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/resumes")
@RequiredArgsConstructor
public class ResumeController {

    private final ResumeService resumeService;

    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<ResumeDto> uploadResume(
            Authentication auth,
            @RequestParam("file") MultipartFile file) throws Exception {
        return ResponseEntity.ok(resumeService.uploadAndParseResume(auth.getName(), file));
    }

    @PostMapping("/builder")
    public ResponseEntity<ResumeDto> createBuiltResume(
            Authentication auth,
            @RequestBody CreateBuiltResumeRequest request) {
        return ResponseEntity.ok(resumeService.createBuiltResume(auth.getName(), request));
    }

    @GetMapping
    public ResponseEntity<List<ResumeDto>> getResumes(Authentication auth) {
        return ResponseEntity.ok(resumeService.getResumes(auth.getName()));
    }

    @PutMapping("/{id}/primary")
    public ResponseEntity<ResumeDto> setPrimary(
            Authentication auth,
            @PathVariable Long id,
            @RequestBody(required = false) SetPrimaryRequest request) {
        // We ignore the request body for now as hitting this endpoint implicitly means setting to primary
        return ResponseEntity.ok(resumeService.setPrimary(auth.getName(), id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteResume(Authentication auth, @PathVariable Long id) {
        resumeService.deleteResume(auth.getName(), id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Extracts raw text from an uploaded resume file (PDF/DOCX) by delegating to the AI service.
     * Used by the chatbot onboarding to enable client-side Gemini parsing.
     */
    @PostMapping(value = "/extract-text", consumes = "multipart/form-data")
    public ResponseEntity<java.util.Map<String, String>> extractText(
            @RequestParam("file") MultipartFile file) throws Exception {
        String text = resumeService.extractTextOnly(file);
        return ResponseEntity.ok(java.util.Map.of("text", text));
    }
}

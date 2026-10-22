package com.hirematch.controller;

import com.hirematch.dto.ProfileDtos.UserProfileDto;
import com.hirematch.dto.ProfileDtos.UserProfileUpdateRequest;
import com.hirematch.service.UserProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/profile")
@RequiredArgsConstructor
public class UserProfileController {

    private final UserProfileService userProfileService;

    @GetMapping
    public ResponseEntity<UserProfileDto> getProfile(Authentication auth) {
        return ResponseEntity.ok(userProfileService.getProfileDto(auth.getName()));
    }

    @PutMapping
    public ResponseEntity<UserProfileDto> updateProfile(
            Authentication auth,
            @RequestBody UserProfileUpdateRequest request) {
        return ResponseEntity.ok(userProfileService.updateProfile(auth.getName(), request));
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteAccount(Authentication auth) {
        userProfileService.deleteUserAccount(auth.getName());
        return ResponseEntity.noContent().build();
    }
}

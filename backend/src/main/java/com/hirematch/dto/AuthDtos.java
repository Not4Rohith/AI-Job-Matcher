package com.hirematch.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public sealed interface AuthDtos {

    record RegisterRequest(
        @NotBlank @Email String email,
        @NotBlank String password,
        @NotBlank @Size(min = 1, max = 100) String firstName,
        @NotBlank @Size(min = 1, max = 100) String lastName,
        boolean consentGiven
    ) implements AuthDtos {}

    record LoginRequest(
        @NotBlank @Email String email,
        @NotBlank String password
    ) implements AuthDtos {}

    record GoogleLoginRequest(
        @NotBlank @Email String email,
        String firstName,
        String lastName,
        String googleId,
        String avatarUrl
    ) implements AuthDtos {}

    record RefreshRequest(
        @NotBlank String refreshToken
    ) implements AuthDtos {}

    record AuthResponse(
        String accessToken,
        String refreshToken,
        long expiresIn,
        UserDto user
    ) implements AuthDtos {}

    record UserDto(
        Long id,
        String email,
        String firstName,
        String lastName,
        String role
    ) implements AuthDtos {}
}

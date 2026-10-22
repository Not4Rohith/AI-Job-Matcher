package com.hirematch.service;

import com.hirematch.config.AppProperties;
import com.hirematch.dto.AuthDtos;
import com.hirematch.entity.RefreshToken;
import com.hirematch.entity.User;
import com.hirematch.exception.ApiException;
import com.hirematch.repository.RefreshTokenRepository;
import com.hirematch.repository.UserRepository;
import com.hirematch.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.OffsetDateTime;
import java.util.HexFormat;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AppProperties appProperties;
    private final UserProfileService userProfileService;

    @Transactional
    public AuthDtos.AuthResponse register(AuthDtos.RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new ApiException(HttpStatus.CONFLICT, "Email already registered");
        }

        User user = User.builder()
                .email(request.email().toLowerCase().trim())
                .passwordHash(passwordEncoder.encode(request.password()))
                .role("USER")
                .consentGiven(request.consentGiven())
                .consentAt(request.consentGiven() ? OffsetDateTime.now() : null)
                .build();
        user = userRepository.save(user);

        // Create empty profile
        userProfileService.createProfile(user, request.firstName(), request.lastName());

        return buildTokenResponse(user);
    }

    @Transactional
    public AuthDtos.AuthResponse login(AuthDtos.LoginRequest request) {
        User user = userRepository.findByEmail(request.email().toLowerCase().trim())
                .filter(User::isActive)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        return buildTokenResponse(user);
    }

    @Transactional
    public AuthDtos.AuthResponse googleLogin(AuthDtos.GoogleLoginRequest request) {
        String email = request.email().toLowerCase().trim();
        User user = userRepository.findByEmail(email).orElseGet(() -> {
            User newUser = User.builder()
                    .email(email)
                    .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString()))
                    .role("USER")
                    .consentGiven(true)
                    .consentAt(OffsetDateTime.now())
                    .build();
            newUser = userRepository.save(newUser);
            userProfileService.createProfile(
                    newUser,
                    request.firstName() != null && !request.firstName().isBlank() ? request.firstName() : "Google",
                    request.lastName() != null && !request.lastName().isBlank() ? request.lastName() : "User"
            );
            return newUser;
        });

        if (!user.isActive()) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Account is disabled");
        }

        return buildTokenResponse(user);
    }

    @Transactional
    public AuthDtos.AuthResponse refresh(AuthDtos.RefreshRequest request) {
        String hash = sha256(request.refreshToken());
        RefreshToken stored = refreshTokenRepository.findByTokenHash(hash)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid refresh token"));

        if (stored.isRevoked() || stored.getExpiresAt().isBefore(OffsetDateTime.now())) {
            // Revoke all tokens for this user (token reuse detection)
            refreshTokenRepository.revokeAllByUserId(stored.getUser().getId());
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Refresh token expired or revoked");
        }

        // Rotate token
        stored.setRevoked(true);
        return buildTokenResponse(stored.getUser());
    }

    @Transactional
    public void logout(Long userId) {
        refreshTokenRepository.revokeAllByUserId(userId);
        log.info("User {} logged out, all refresh tokens revoked", userId);
    }

    @Transactional
    public void logoutByIdentifier(String identifier) {
        if (identifier == null) return;
        if (identifier.matches("\\d+")) {
            logout(Long.parseLong(identifier));
        } else {
            userRepository.findByEmail(identifier).ifPresent(u -> logout(u.getId()));
        }
    }

    // ── Private helpers ────────────────────────────────────────────────────

    private AuthDtos.AuthResponse buildTokenResponse(User user) {
        String accessToken  = jwtTokenProvider.generateAccessToken(user.getId(), user.getEmail(), user.getRole());
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getId());

        // Store hashed refresh token
        var rt = RefreshToken.builder()
                .user(user)
                .tokenHash(sha256(refreshToken))
                .expiresAt(OffsetDateTime.now().plusSeconds(
                        appProperties.getJwt().getRefreshExpiryMs() / 1000))
                .build();
        refreshTokenRepository.save(rt);

        var profile = userProfileService.findByUserId(user.getId());
        return new AuthDtos.AuthResponse(
                accessToken,
                refreshToken,
                appProperties.getJwt().getExpiryMs() / 1000,
                new AuthDtos.UserDto(
                        user.getId(),
                        user.getEmail(),
                        profile.map(p -> p.getFirstName()).orElse(""),
                        profile.map(p -> p.getLastName()).orElse(""),
                        user.getRole()));
    }

    private String sha256(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}

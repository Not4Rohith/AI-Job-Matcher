package com.hirematch.service;

import com.hirematch.dto.ProfileDtos.UserProfileDto;
import com.hirematch.dto.ProfileDtos.UserProfileUpdateRequest;
import com.hirematch.entity.User;
import com.hirematch.entity.UserProfile;
import com.hirematch.repository.RefreshTokenRepository;
import com.hirematch.repository.UserProfileRepository;
import com.hirematch.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserProfileService {

    private final UserProfileRepository userProfileRepository;
    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;

    @Transactional
    public UserProfile createProfile(User user, String firstName, String lastName) {
        UserProfile profile = UserProfile.builder()
                .user(user)
                .firstName(firstName)
                .lastName(lastName)
                .build();
        return userProfileRepository.save(profile);
    }

    public Optional<UserProfile> findByUserId(Long userId) {
        return userProfileRepository.findByUserId(userId);
    }

    @Transactional(readOnly = true)
    public UserProfileDto getProfileDto(String identifier) {
        User user = findUser(identifier);
        UserProfile profile = userProfileRepository.findByUserId(user.getId())
                .orElseGet(() -> createProfile(user, null, null));
        return mapToDto(profile, user);
    }

    @Transactional
    public UserProfileDto updateProfile(String identifier, UserProfileUpdateRequest request) {
        User user = findUser(identifier);
        UserProfile profile = userProfileRepository.findByUserId(user.getId())
                .orElseGet(() -> createProfile(user, request.getFirstName(), request.getLastName()));

        if (request.getFirstName() != null) profile.setFirstName(request.getFirstName());
        if (request.getLastName() != null)  profile.setLastName(request.getLastName());
        if (request.getPhone() != null)     profile.setPhone(request.getPhone());
        if (request.getLocation() != null)  profile.setLocation(request.getLocation());
        if (request.getBio() != null)       profile.setBio(request.getBio());
        if (request.getLinkedinUrl() != null) profile.setLinkedinUrl(request.getLinkedinUrl());
        if (request.getGithubUrl() != null)   profile.setGithubUrl(request.getGithubUrl());
        if (request.getPortfolioUrl() != null) profile.setPortfolioUrl(request.getPortfolioUrl());
        if (request.getPreferredWorkMode() != null) profile.setPreferredWorkMode(request.getPreferredWorkMode());
        if (request.getNoticePeriodDays() != null)  profile.setNoticePeriodDays(request.getNoticePeriodDays());
        if (request.getExpectedCtc() != null)        profile.setExpectedCtc(request.getExpectedCtc());
        if (request.getWorkAuthorization() != null)  profile.setWorkAuthorization(request.getWorkAuthorization());

        return mapToDto(userProfileRepository.save(profile), user);
    }

    private UserProfileDto mapToDto(UserProfile profile, User user) {
        return UserProfileDto.builder()
                .id(profile.getId())
                .firstName(profile.getFirstName())
                .lastName(profile.getLastName())
                .email(user.getEmail())
                .phone(profile.getPhone())
                .location(profile.getLocation())
                .preferredWorkMode(profile.getPreferredWorkMode())
                .noticePeriodDays(profile.getNoticePeriodDays())
                .expectedCtc(profile.getExpectedCtc())
                .workAuthorization(profile.getWorkAuthorization())
                .linkedinUrl(profile.getLinkedinUrl())
                .githubUrl(profile.getGithubUrl())
                .portfolioUrl(profile.getPortfolioUrl())
                .bio(profile.getBio())
                .avatarUrl(profile.getAvatarUrl())
                .updatedAt(profile.getUpdatedAt())
                .build();
    }

    @Transactional
    public void deleteUserAccount(String identifier) {
        try {
            User user = findUser(identifier);
            refreshTokenRepository.revokeAllByUserId(user.getId());
            userRepository.delete(user);
        } catch (Exception ignored) {}
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
}

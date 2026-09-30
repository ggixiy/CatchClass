package com.catchclass.user.internal.service;

import java.io.IOException;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.catchclass.shared.web.ApiException;
import com.catchclass.user.UserApi;
import com.catchclass.user.UserSummary;
import com.catchclass.user.internal.dto.UserProfileResponse;
import com.catchclass.user.internal.entity.Photo;
import com.catchclass.user.internal.entity.User;
import com.catchclass.user.internal.repository.PhotoRepository;
import com.catchclass.user.internal.repository.UserRepository;

@Service
public class UserService implements UserApi {

    private static final Set<String> ALLOWED_PHOTO_TYPES = Set.of("image/png", "image/jpeg", "image/webp");

    private final UserRepository repository;
    private final PhotoRepository photoRepository;

    public UserService(UserRepository repository, PhotoRepository photoRepository) {
        this.repository = repository;
        this.photoRepository = photoRepository;
    }

    // ---- публічний контракт UserApi ----

    @Override
    @Transactional
    public UserSummary create(String email, String displayName) {
        if (repository.findByEmail(email).isPresent()) {
            throw conflict();
        }
        User user = new User(UUID.randomUUID(), email, displayName);
        try {
            repository.saveAndFlush(user);
        } catch (DataIntegrityViolationException e) {
            throw conflict();
        }
        return toSummary(user);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<UserSummary> findById(UUID id) {
        return repository.findById(id).map(this::toSummary);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<UserSummary> findByEmail(String email) {
        return repository.findByEmail(email).map(this::toSummary);
    }

    // ---- для UserController / UserPhotoController ----

    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(UUID id) {
        return toProfileResponse(getOrThrow(id));
    }

    @Transactional
    public UserProfileResponse updateProfile(UUID id, String displayName) {
        User user = getOrThrow(id);
        user.updateDisplayName(displayName);
        return toProfileResponse(user);
    }

    @Transactional
    public UserProfileResponse updatePhoto(UUID id, MultipartFile file) {
        if (file.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "empty_file", "Файл порожній");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_PHOTO_TYPES.contains(contentType)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "unsupported_file_type",
                    "Дозволені формати: PNG, JPEG, WEBP");
        }

        byte[] data;
        try {
            data = file.getBytes();
        } catch (IOException e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "file_read_error", "Не вдалося прочитати файл");
        }

        photoRepository.findById(id)
                .ifPresentOrElse(
                        photo -> photo.replace(contentType, data),
                        () -> photoRepository.save(new Photo(id, contentType, data)));

        return getProfile(id);
    }

    @Transactional
    public UserProfileResponse deletePhoto(UUID id) {
        photoRepository.deleteByUserIdIfExists(id);
        return getProfile(id);
    }

    @Transactional(readOnly = true)
    public Photo getPhoto(UUID id) {
        return photoRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "photo_not_found", "Фото не знайдено"));
    }

    // ---- допоміжні методи ----

    private User getOrThrow(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "user_not_found", "Користувача не знайдено"));
    }

    private UserProfileResponse toProfileResponse(User user) {
        // photoUrl — не збережений рядок, а обчислене посилання: є фото в таблиці photos чи нема.
        String photoUrl = photoRepository.existsById(user.getId())
                ? "/api/users/" + user.getId() + "/photo"
                : null;
        return new UserProfileResponse(user.getId(), user.getEmail(), user.getDisplayName(), photoUrl);
    }

    private ApiException conflict() {
        return new ApiException(HttpStatus.CONFLICT, "user_already_exists", "Користувач з таким email вже існує");
    }

    private UserSummary toSummary(User user) {
        return new UserSummary(user.getId(), user.getEmail(), user.getDisplayName());
    }
}
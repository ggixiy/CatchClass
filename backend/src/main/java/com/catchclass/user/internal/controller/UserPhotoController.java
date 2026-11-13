package com.catchclass.user.internal.controller;

import java.util.UUID;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.catchclass.shared.security.CurrentUser;
import com.catchclass.user.internal.dto.UserProfileResponse;
import com.catchclass.user.internal.entity.Banner;
import com.catchclass.user.internal.entity.Photo;
import com.catchclass.user.internal.service.UserService;

@RestController
@RequestMapping("/api/users")
class UserPhotoController {

    private final UserService userService;

    UserPhotoController(UserService userService) {
        this.userService = userService;
    }

    // ПУБЛІЧНИЙ (дивись SecurityConfig): <img src="..."> у браузері не додає
    // заголовок Authorization, тому для картинок потрібен шлях без перевірки токена.
    @GetMapping("/{id}/photo")
    ResponseEntity<byte[]> getPhoto(@PathVariable UUID id) {
        Photo photo = userService.getPhoto(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(photo.getContentType()))
                .header(HttpHeaders.CACHE_CONTROL, "private, max-age=300")
                .body(photo.getData());
    }

    @PostMapping("/me/photo")
    UserProfileResponse upload(@RequestParam("file") MultipartFile file) {
        return userService.updatePhoto(CurrentUser.require().id(), file);
    }

    @DeleteMapping("/me/photo")
    UserProfileResponse remove() {
        return userService.deletePhoto(CurrentUser.require().id());
    }

    // ПУБЛІЧНИЙ, як і фото: використовується в <img>/CSS background без заголовка Authorization.
    @GetMapping("/{id}/banner")
    ResponseEntity<byte[]> getBanner(@PathVariable UUID id) {
        Banner banner = userService.getBanner(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(banner.getContentType()))
                .header(HttpHeaders.CACHE_CONTROL, "private, max-age=300")
                .body(banner.getData());
    }

    @PostMapping("/me/banner")
    UserProfileResponse uploadBanner(@RequestParam("file") MultipartFile file) {
        return userService.updateBanner(CurrentUser.require().id(), file);
    }

    @DeleteMapping("/me/banner")
    UserProfileResponse removeBanner() {
        return userService.deleteBanner(CurrentUser.require().id());
    }
}

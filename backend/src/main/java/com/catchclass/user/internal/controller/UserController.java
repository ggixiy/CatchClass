package com.catchclass.user.internal.controller;

import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.catchclass.shared.security.CurrentUser;
import com.catchclass.user.internal.dto.UpdateProfileRequest;
import com.catchclass.user.internal.dto.UserProfileResponse;
import com.catchclass.user.internal.service.UserService;

@RestController
@RequestMapping("/api/users/me")
class UserController {

    private final UserService userService;

    UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    UserProfileResponse get() {
        // CurrentUser.require() бере id з токена — підставити чужий id більше неможливо.
        return userService.getProfile(CurrentUser.require().id());
    }

    @PutMapping
    UserProfileResponse update(@Valid @RequestBody UpdateProfileRequest request) {
        return userService.updateProfile(CurrentUser.require().id(), request.displayName());
    }
}
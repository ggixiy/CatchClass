package com.catchclass.course.internal.dto;

import jakarta.validation.constraints.NotBlank;

public record JoinCourseRequest(@NotBlank String code) {
}

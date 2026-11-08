package com.catchclass.course.internal.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.catchclass.course.internal.entity.Course;

public interface CourseRepository extends JpaRepository<Course, UUID> {
    Optional<Course> findByInviteCode(String inviteCode);
    List<Course> findByOwnerUserId(UUID ownerUserId);
}

package com.catchclass.course.internal.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.catchclass.course.internal.entity.CourseMember;

public interface CourseMemberRepository extends JpaRepository<CourseMember, UUID> {
    List<CourseMember> findByCourseId(UUID courseId);
    List<CourseMember> findByUserId(UUID userId);
    boolean existsByCourseIdAndUserId(UUID courseId, UUID userId);
    long countByCourseId(UUID courseId);
    void deleteByCourseIdAndUserId(UUID courseId, UUID userId);
}

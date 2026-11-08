package com.catchclass.meeting.internal.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.catchclass.meeting.internal.entity.Meeting;

public interface MeetingRepository extends JpaRepository<Meeting, UUID> {
    Optional<Meeting> findByPublicId(String publicId);
    List<Meeting> findByHostUserId(UUID hostUserId);
    List<Meeting> findByCourseIdIn(java.util.Collection<UUID> courseIds);
    List<Meeting> findByCourseId(UUID courseId);
    void deleteByCourseId(UUID courseId);
}
package com.catchclass.room.internal.repository;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.catchclass.room.internal.entity.AttendanceSession;

public interface AttendanceSessionRepository extends JpaRepository<AttendanceSession, UUID> {

    Optional<AttendanceSession> findFirstByMeetingIdAndUserIdAndLeftAtIsNullOrderByJoinedAtDesc(UUID meetingId, UUID userId);

    List<AttendanceSession> findByMeetingIdInAndJoinedAtBetween(Collection<UUID> meetingIds, Instant from, Instant to);
}

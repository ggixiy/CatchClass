package com.catchclass.meeting.internal.service;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.catchclass.meeting.MeetingReminderDue;
import com.catchclass.meeting.internal.entity.Meeting;
import com.catchclass.meeting.internal.repository.MeetingRepository;

/**
 * Раз на хвилину перевіряє, чи не настав час нагадати організатору про заняття, яке
 * почнеться за REMINDER_LEAD_MINUTES. Миттєві зустрічі (isInstant) пропускаються — про них
 * нагадувати нема сенсу, вони і так починаються відразу.
 *
 * Стан "кому вже нагадали" зберігається в пам'яті, а не в БД: це лише захист від повторної
 * відправки того самого нагадування на сусідніх тіках, не критична для курсової бізнес-дані,
 * і він не повинен переживати рестарт (після рестарту ще раз нагадати — не страшно).
 */
@Component
class MeetingReminderScheduler {

    private static final int REMINDER_LEAD_MINUTES = 10;
    // Ширше за інтервал тіка (1 хв), щоб жодне проведення не "проскочило" між тіками.
    private static final Duration REMINDER_WINDOW = Duration.ofMinutes(2);
    private static final Duration ENTRY_TTL = Duration.ofDays(1);

    private final MeetingRepository repository;
    private final ApplicationEventPublisher publisher;
    private final Map<String, Instant> alreadyReminded = new ConcurrentHashMap<>();

    MeetingReminderScheduler(MeetingRepository repository, ApplicationEventPublisher publisher) {
        this.repository = repository;
        this.publisher = publisher;
    }

    @Scheduled(fixedRate = 60_000)
    void checkReminders() {
        Instant now = Instant.now();
        evictOldEntries(now);

        Instant windowFrom = now.plus(Duration.ofMinutes(REMINDER_LEAD_MINUTES));
        Instant windowTo = windowFrom.plus(REMINDER_WINDOW);

        for (Meeting meeting : repository.findAll()) {
            if (meeting.isInstant()) {
                continue;
            }
            for (MeetingOccurrenceExpander.Occurrence occ : MeetingOccurrenceExpander.expand(
                    meeting.getStartTime(), meeting.getDurationMinutes(), meeting.getRecurrenceRule(),
                    meeting.getRecurrenceEndsAt(), windowFrom, windowTo)) {
                if (occ.start().isBefore(windowFrom) || occ.start().isAfter(windowTo)) {
                    continue;
                }
                String key = meeting.getId() + "@" + occ.start().getEpochSecond();
                if (alreadyReminded.putIfAbsent(key, now) != null) {
                    continue;
                }
                publisher.publishEvent(new MeetingReminderDue(meeting.getId(), meeting.getPublicId(),
                        meeting.getTitle(), meeting.getHostUserId(), occ.start()));
            }
        }
    }

    private void evictOldEntries(Instant now) {
        alreadyReminded.entrySet().removeIf(e -> now.isAfter(e.getValue().plus(ENTRY_TTL)));
    }
}

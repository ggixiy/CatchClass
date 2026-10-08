package com.catchclass.meeting.internal.service;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;

import com.catchclass.meeting.internal.entity.RecurrenceRule;

final class MeetingOccurrenceExpander {

    // Запобіжник: навіть при щотижневому повторенні без кінцевої дати
    // не рахуємо більше 500 проведень наперед.
    private static final int MAX_OCCURRENCES = 500;

    private MeetingOccurrenceExpander() {
    }

    record Occurrence(Instant start, Instant end) {
    }

    static List<Occurrence> expand(Instant firstStart, int durationMinutes, RecurrenceRule rule,
                                   Instant recurrenceEndsAt, Instant windowFrom, Instant windowTo) {
        List<Occurrence> result = new ArrayList<>();
        ZonedDateTime current = firstStart.atZone(ZoneOffset.UTC);
        Instant hardStop = recurrenceEndsAt != null && recurrenceEndsAt.isBefore(windowTo)
                ? recurrenceEndsAt
                : windowTo;

        int guard = 0;
        while (!current.toInstant().isAfter(hardStop) && guard++ < MAX_OCCURRENCES) {
            Instant start = current.toInstant();
            Instant end = start.plusSeconds(durationMinutes * 60L);

            if (!end.isBefore(windowFrom) && !start.isAfter(windowTo)) {
                result.add(new Occurrence(start, end));
            }

            if (rule == RecurrenceRule.NONE) {
                break;
            }
            current = rule == RecurrenceRule.WEEKLY ? current.plusWeeks(1) : current.plusMonths(1);
        }
        return result;
    }
}
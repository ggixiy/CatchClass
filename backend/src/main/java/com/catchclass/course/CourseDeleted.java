package com.catchclass.course;

import java.util.UUID;

/** Подія: курс видалено — заняття цього курсу теж треба прибрати. */
public record CourseDeleted(UUID courseId) {
}

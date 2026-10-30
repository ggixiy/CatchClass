package com.catchclass.notification.internal;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.stereotype.Component;

import com.catchclass.auth.PasswordResetRequested;
import com.catchclass.auth.UserRegistered;
import com.catchclass.meeting.MeetingReminderDue;
import com.catchclass.notification.internal.config.NotificationProperties;
import com.catchclass.notification.internal.service.MailService;
import com.catchclass.user.UserApi;

@Component
class NotificationListener {

    private static final DateTimeFormatter MEETING_TIME_FORMAT =
            DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm").withZone(ZoneId.of("Europe/Kyiv"));

    private final MailService mailService;
    private final NotificationProperties properties;
    private final UserApi userApi;

    NotificationListener(MailService mailService, NotificationProperties properties, UserApi userApi) {
        this.mailService = mailService;
        this.properties = properties;
        this.userApi = userApi;
    }

    // @ApplicationModuleListener (не звичайний @EventListener) спрацьовує лише ПІСЛЯ
    // успішного коміту транзакції auth — якщо реєстрація відкотиться, лист не піде.
    @ApplicationModuleListener
    void on(UserRegistered event) {
        String link = properties.frontendBaseUrl() + "/verify-email?token=" + event.verificationToken();
        mailService.send(event.email(), "Підтвердіть email у CatchClass",
                "Вітаємо, " + event.displayName() + "!\n\nПідтвердіть email за посиланням:\n" + link);
    }

    @ApplicationModuleListener
    void on(PasswordResetRequested event) {
        String link = properties.frontendBaseUrl() + "/reset-password?token=" + event.resetToken();
        mailService.send(event.email(), "Скидання пароля в CatchClass",
                "Щоб встановити новий пароль, перейдіть за посиланням:\n" + link
                        + "\n\nЯкщо ви не робили цей запит — просто ігноруйте лист.");
    }

    // Нагадування організатору про його ж заняття, яке почнеться за ~10 хвилин.
    @ApplicationModuleListener
    void on(MeetingReminderDue event) {
        userApi.findById(event.hostUserId()).ifPresent(host -> {
            String link = properties.frontendBaseUrl() + "/?meeting=" + event.publicId();
            String time = MEETING_TIME_FORMAT.format(event.startTime());
            mailService.send(host.email(), "Нагадування: «" + event.title() + "» скоро почнеться",
                    "Вітаємо, " + host.displayName() + "!\n\nВаше заняття «" + event.title()
                            + "» починається " + time + " (за київським часом).\n\nПосилання на CatchClass:\n" + link);
        });
    }
}

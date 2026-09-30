package com.catchclass.notification.internal;

import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.stereotype.Component;

import com.catchclass.auth.PasswordResetRequested;
import com.catchclass.auth.UserRegistered;
import com.catchclass.notification.internal.config.NotificationProperties;
import com.catchclass.notification.internal.service.MailService;

@Component
class NotificationListener {

    private final MailService mailService;
    private final NotificationProperties properties;

    NotificationListener(MailService mailService, NotificationProperties properties) {
        this.mailService = mailService;
        this.properties = properties;
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
}
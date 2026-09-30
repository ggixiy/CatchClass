package com.catchclass.notification.internal.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "catchclass.notification")
public record NotificationProperties(String frontendBaseUrl) {
}
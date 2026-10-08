package com.catchclass.room.internal.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "catchclass.livekit")
public record LiveKitProperties(String url, String apiKey, String apiSecret) {
}
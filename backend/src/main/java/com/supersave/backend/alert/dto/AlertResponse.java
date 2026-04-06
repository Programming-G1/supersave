package com.supersave.backend.alert.dto;

import java.time.LocalDateTime;

public record AlertResponse(
        String id,
        String level,
        String title,
        String message,
        String region,
        LocalDateTime createdAt
) {
}

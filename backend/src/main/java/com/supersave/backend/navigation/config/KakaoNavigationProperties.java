package com.supersave.backend.navigation.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "supersave.kakao.navigation")
public class KakaoNavigationProperties {

    private String restApiKey = "";
    private String baseUrl = "https://apis-navi.kakaomobility.com";

    public String getRestApiKey() {
        // Prefer configured property; fall back to common environment variable names for compatibility
        if (restApiKey != null && !restApiKey.isBlank()) return restApiKey;
        String env = System.getenv("KAKAO_REST_API_KEY");
        if (env != null && !env.isBlank()) return env;
        String env2 = System.getenv("SUPERSAVE_KAKAO_NAVIGATION_REST_API_KEY");
        if (env2 != null && !env2.isBlank()) return env2;
        return restApiKey;
    }

    public void setRestApiKey(String restApiKey) {
        this.restApiKey = restApiKey;
    }

    public String getBaseUrl() {
        return baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }
}

package com.supersave.backend.hospital.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "supersave.public-data")
public class PublicDataProperties {

    private boolean enabled = true;
    private String serviceKey = "";
    private String baseUrl = "http://apis.data.go.kr/B552657/ErmctInfoInqireService";
    private int numOfRows = 1000;
    private long refreshIntervalMilliseconds = 120_000;

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getServiceKey() {
        return serviceKey;
    }

    public void setServiceKey(String serviceKey) {
        this.serviceKey = serviceKey;
    }

    public String getBaseUrl() {
        return baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public int getNumOfRows() {
        return numOfRows;
    }

    public void setNumOfRows(int numOfRows) {
        this.numOfRows = numOfRows;
    }

    public long getRefreshIntervalMilliseconds() {
        return refreshIntervalMilliseconds;
    }

    public void setRefreshIntervalMilliseconds(long refreshIntervalMilliseconds) {
        this.refreshIntervalMilliseconds = refreshIntervalMilliseconds;
    }
}

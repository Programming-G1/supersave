package com.supersave.backend.location.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.supersave.backend.location.config.KakaoLocalProperties;
import com.supersave.backend.location.dto.LocationSearchResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class KakaoLocationService {

    private final RestClient restClient;
    private final KakaoLocalProperties properties;

    public KakaoLocationService(RestClient.Builder restClientBuilder, KakaoLocalProperties properties) {
        this.properties = properties;
        this.restClient = restClientBuilder
                .baseUrl(properties.getBaseUrl())
                .build();
    }

    public List<LocationSearchResponse> search(String query) {
        if (properties.getRestApiKey() == null || properties.getRestApiKey().isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Kakao REST API key is not configured");
        }

        List<LocationSearchResponse> keywordResults = searchByKeyword(query);
        if (!keywordResults.isEmpty()) {
            return keywordResults;
        }

        return searchByAddress(query);
    }

    private List<LocationSearchResponse> searchByKeyword(String query) {
        KakaoKeywordResponse response = restClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/v2/local/search/keyword.json")
                        .queryParam("query", query)
                        .queryParam("size", 5)
                        .build())
                .header(HttpHeaders.AUTHORIZATION, "KakaoAK " + properties.getRestApiKey())
                .retrieve()
                .body(KakaoKeywordResponse.class);

        if (response == null || response.documents() == null) {
            return List.of();
        }

        return response.documents().stream()
                .map(this::toLocationSearchResponse)
                .toList();
    }

    private List<LocationSearchResponse> searchByAddress(String query) {
        KakaoAddressResponse response = restClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/v2/local/search/address.json")
                        .queryParam("query", query)
                        .queryParam("size", 5)
                        .build())
                .header(HttpHeaders.AUTHORIZATION, "KakaoAK " + properties.getRestApiKey())
                .retrieve()
                .body(KakaoAddressResponse.class);

        if (response == null || response.documents() == null) {
            return List.of();
        }

        return response.documents().stream()
                .map(this::toLocationSearchResponse)
                .toList();
    }

    private LocationSearchResponse toLocationSearchResponse(KakaoPlaceDocument document) {
        return new LocationSearchResponse(
                document.placeName(),
                document.addressName(),
                document.roadAddressName(),
                Double.parseDouble(document.y()),
                Double.parseDouble(document.x())
        );
    }

    private LocationSearchResponse toLocationSearchResponse(KakaoAddressDocument document) {
        String roadAddress = document.roadAddress() == null ? "" : document.roadAddress().addressName();
        return new LocationSearchResponse(
                roadAddress == null || roadAddress.isBlank() ? document.addressName() : roadAddress,
                document.addressName(),
                roadAddress,
                Double.parseDouble(document.y()),
                Double.parseDouble(document.x())
        );
    }

    private record KakaoKeywordResponse(List<KakaoPlaceDocument> documents) {
    }

    private record KakaoPlaceDocument(
            @JsonProperty("place_name") String placeName,
            @JsonProperty("address_name") String addressName,
            @JsonProperty("road_address_name") String roadAddressName,
            String x,
            String y
    ) {
    }

    private record KakaoAddressResponse(List<KakaoAddressDocument> documents) {
    }

    private record KakaoAddressDocument(
            @JsonProperty("address_name") String addressName,
            @JsonProperty("road_address")
            KakaoRoadAddress roadAddress,
            String x,
            String y
    ) {
    }

    private record KakaoRoadAddress(@JsonProperty("address_name") String addressName) {
    }
}

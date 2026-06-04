package com.supersave.backend.navigation.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.supersave.backend.navigation.config.KakaoNavigationProperties;
import com.supersave.backend.navigation.dto.NavigationRouteResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;

@Service
public class KakaoNavigationService {

    private final RestClient restClient;
    private final KakaoNavigationProperties properties;

    public KakaoNavigationService(RestClient.Builder restClientBuilder, KakaoNavigationProperties properties) {
        this.properties = properties;
        this.restClient = restClientBuilder
                .baseUrl(properties.getBaseUrl())
                .build();
    }

    public NavigationRouteResponse getRoute(double originLat, double originLng, double destinationLat, double destinationLng) {
        if (properties.getRestApiKey() == null || properties.getRestApiKey().isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Kakao navigation REST API key is not configured");
        }

        KakaoDirectionsResponse response = restClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/v1/directions")
                        .queryParam("origin", originLng + "," + originLat)
                        .queryParam("destination", destinationLng + "," + destinationLat)
                        .queryParam("priority", "RECOMMEND")
                        .queryParam("car_fuel", "GASOLINE")
                        .queryParam("car_hipass", false)
                        .build())
                .header(HttpHeaders.AUTHORIZATION, "KakaoAK " + properties.getRestApiKey())
                .retrieve()
                .body(KakaoDirectionsResponse.class);

        if (response == null || response.routes() == null || response.routes().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Kakao navigation API returned no routes");
        }

        KakaoRoute route = response.routes().get(0);
        if (route.summary() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Kakao navigation API returned an invalid route summary");
        }

        // path: 전체 경로 좌표 (기존 호환용)
        List<NavigationRouteResponse.RoutePoint> path = new ArrayList<>();
        // roads: 도로 구간별 교통 정보
        List<NavigationRouteResponse.RoadSegment> roadSegments = new ArrayList<>();

        if (route.sections() != null) {
            for (Section section : route.sections()) {
                if (section.roads() == null) {
                    continue;
                }
                for (Road road : section.roads()) {
                    if (road.vertexes() == null) {
                        continue;
                    }

                    // path에 좌표 추가 (기존 로직)
                    for (int i = 0; i + 1 < road.vertexes().size(); i += 2) {
                        path.add(new NavigationRouteResponse.RoutePoint(
                                road.vertexes().get(i + 1), // lat
                                road.vertexes().get(i)      // lng
                        ));
                    }

                    // roadSegments에 교통 정보 포함하여 추가
                    roadSegments.add(new NavigationRouteResponse.RoadSegment(
                            road.vertexes(),
                            road.trafficSpeed(),
                            road.trafficState()
                    ));
                }
            }
        }

        return new NavigationRouteResponse(
                Math.round(route.summary().distance() / 100.0) / 10.0,
                Math.max(1, (int) Math.round(route.summary().duration() / 60000.0)),
                path,
                roadSegments
        );
    }

    private record KakaoDirectionsResponse(List<KakaoRoute> routes) {
    }

    private record KakaoRoute(
            Summary summary,
            List<Section> sections
    ) {
    }

    private record Summary(
            int distance,
            int duration
    ) {
    }

    private record Section(List<Road> roads) {
    }

    private record Road(
            @JsonProperty("vertexes") List<Double> vertexes,
            @JsonProperty("traffic_speed") double trafficSpeed,
            @JsonProperty("traffic_state") int trafficState
    ) {
    }
}

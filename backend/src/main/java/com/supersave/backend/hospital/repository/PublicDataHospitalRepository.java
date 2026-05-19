package com.supersave.backend.hospital.repository;

import com.supersave.backend.common.exception.NotFoundException;
import com.supersave.backend.hospital.config.PublicDataProperties;
import com.supersave.backend.hospital.entity.Hospital;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Repository;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;

import jakarta.annotation.PostConstruct;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.StringReader;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Repository
@ConditionalOnProperty(name = "supersave.public-data.enabled", havingValue = "true")
public class PublicDataHospitalRepository implements HospitalRepository {

    private static final Logger log = LoggerFactory.getLogger(PublicDataHospitalRepository.class);
    private static final String HOSPITAL_LIST_ENDPOINT = "getEgytListInfoInqire";
    private static final String REALTIME_BEDS_ENDPOINT = "getEmrrmRltmUsefulSckbdInfoInqire";

    private final PublicDataProperties properties;
    private final HttpClient httpClient;
    private final MockHospitalRepository fallbackRepository = new MockHospitalRepository();
    private final Map<Long, Integer> incomingOverrides = new ConcurrentHashMap<>();

    private volatile HospitalCache cache = HospitalCache.empty();
    private volatile Map<String, PublicHospitalItem> hospitalInfoCache = Map.of();

    public PublicDataHospitalRepository(PublicDataProperties properties) {
        this.properties = properties;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
    }

    @PostConstruct
    void initializeCache() {
        refreshHospitalInfoCache();
        refreshPublicDataCache();
    }

    @Scheduled(
            fixedDelayString = "${supersave.public-data.refresh-interval-milliseconds:120000}",
            initialDelayString = "${supersave.public-data.refresh-interval-milliseconds:120000}"
    )
    public void refreshPublicDataCache() {
        if (properties.getServiceKey() == null || properties.getServiceKey().isBlank()) {
            cache = new HospitalCache(fallbackHospitals("PUBLIC_DATA_SERVICE_KEY is empty"), Instant.now());
            return;
        }

        try {
            Map<String, PublicHospitalItem> hospitalInfoByHpid = hospitalInfoCache;
            if (hospitalInfoByHpid.isEmpty()) {
                hospitalInfoByHpid = loadHospitalInfo();
                hospitalInfoCache = hospitalInfoByHpid;
            }

            Map<Long, Hospital> loadedHospitals = combineHospitals(hospitalInfoByHpid, loadRealtimeBeds());
            if (loadedHospitals.isEmpty()) {
                cache = new HospitalCache(
                        fallbackHospitals("public data API returned no hospitals"),
                        Instant.now()
                );
                return;
            }
            cache = new HospitalCache(loadedHospitals, Instant.now());
            log.info("Refreshed public realtime emergency bed cache: {} hospitals", loadedHospitals.size());
        } catch (RuntimeException exception) {
            log.warn("Failed to refresh public emergency hospital data.", exception);
            if (cache.hospitals().isEmpty()) {
                cache = new HospitalCache(fallbackHospitals(exception.getMessage()), Instant.now());
            }
        }
    }

    @Override
    public List<Hospital> findAll() {
        return currentHospitals().values().stream()
                .sorted(Comparator.comparing(Hospital::name))
                .toList();
    }

    @Override
    public Optional<Hospital> findById(Long id) {
        return Optional.ofNullable(currentHospitals().get(id));
    }

    @Override
    public Hospital save(Hospital hospital) {
        Map<Long, Hospital> nextHospitals = new LinkedHashMap<>(currentHospitals());
        nextHospitals.put(hospital.id(), hospital);
        cache = new HospitalCache(nextHospitals, Instant.now());
        return hospital;
    }

    @Override
    public Hospital registerIncomingPatient(Long id) {
        Hospital current = findById(id)
                .orElseThrow(() -> new NotFoundException("Hospital " + id + " was not found"));
        Hospital updated = current.incrementIncomingPatients();
        incomingOverrides.merge(id, 1, Integer::sum);

        Map<Long, Hospital> nextHospitals = new LinkedHashMap<>(currentHospitals());
        nextHospitals.put(id, updated);
        cache = new HospitalCache(nextHospitals, cache.loadedAt());
        return updated;
    }

    private Map<Long, Hospital> currentHospitals() {
        HospitalCache current = cache;
        if (!current.hospitals().isEmpty()) {
            return current.hospitals();
        }
        return fallbackHospitals("public data cache is not ready");
    }

    private void refreshHospitalInfoCache() {
        if (properties.getServiceKey() == null || properties.getServiceKey().isBlank()) {
            return;
        }

        try {
            Map<String, PublicHospitalItem> loadedHospitalInfo = loadHospitalInfo();
            if (!loadedHospitalInfo.isEmpty()) {
                hospitalInfoCache = loadedHospitalInfo;
                log.info("Loaded public emergency hospital master data: {} hospitals", loadedHospitalInfo.size());
            }
        } catch (RuntimeException exception) {
            log.warn("Failed to load public emergency hospital master data.", exception);
        }
    }

    private Map<String, PublicHospitalItem> loadHospitalInfo() {
        Map<String, PublicHospitalItem> hospitalInfoByHpid = new LinkedHashMap<>();
        fetchHospitalInfo().forEach(item -> hospitalInfoByHpid.put(item.hpid(), item));
        return hospitalInfoByHpid;
    }

    private Map<String, PublicRealtimeBedItem> loadRealtimeBeds() {
        Map<String, PublicRealtimeBedItem> realtimeBedsByHpid = new LinkedHashMap<>();
        fetchRealtimeBeds().forEach(item -> realtimeBedsByHpid.put(item.hpid(), item));
        return realtimeBedsByHpid;
    }

    private Map<Long, Hospital> combineHospitals(
            Map<String, PublicHospitalItem> hospitalInfoByHpid,
            Map<String, PublicRealtimeBedItem> realtimeBedsByHpid
    ) {
        Map<Long, Hospital> hospitals = new LinkedHashMap<>();
        hospitalInfoByHpid.values().stream()
                .filter(item -> item.latitude() != 0.0 && item.longitude() != 0.0)
                .map(item -> toHospital(item, realtimeBedsByHpid.get(item.hpid())))
                .forEach(hospital -> hospitals.put(hospital.id(), applyIncomingOverride(hospital)));

        return hospitals;
    }

    private List<PublicHospitalItem> fetchHospitalInfo() {
        URI uri = buildUri(HOSPITAL_LIST_ENDPOINT, Map.of(
                "pageNo", "1",
                "numOfRows", String.valueOf(properties.getNumOfRows())
        ));
        return parseItems(getXml(uri)).stream()
                .map(PublicHospitalItem::from)
                .filter(PublicHospitalItem::hasMinimumFields)
                .toList();
    }

    private List<PublicRealtimeBedItem> fetchRealtimeBeds() {
        URI uri = buildUri(REALTIME_BEDS_ENDPOINT, Map.of(
                "pageNo", "1",
                "numOfRows", String.valueOf(properties.getNumOfRows())
        ));
        return parseItems(getXml(uri)).stream()
                .map(PublicRealtimeBedItem::from)
                .filter(PublicRealtimeBedItem::hasHpid)
                .toList();
    }

    private String getXml(URI uri) {
        try {
            HttpRequest request = HttpRequest.newBuilder(uri)
                    .timeout(Duration.ofSeconds(8))
                    .GET()
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalStateException("public data API returned HTTP " + response.statusCode());
            }
            return response.body();
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("public data API request was interrupted", exception);
        } catch (Exception exception) {
            throw new IllegalStateException("public data API request failed", exception);
        }
    }

    private URI buildUri(String endpoint, Map<String, String> parameters) {
        Map<String, String> queryParameters = new LinkedHashMap<>();
        queryParameters.put("serviceKey", properties.getServiceKey());
        queryParameters.putAll(parameters);

        String query = queryParameters.entrySet().stream()
                .map(entry -> encode(entry.getKey()) + "=" + encode(entry.getValue()))
                .reduce((left, right) -> left + "&" + right)
                .orElse("");

        return URI.create(properties.getBaseUrl() + "/" + endpoint + "?" + query);
    }

    private List<Map<String, String>> parseItems(String xml) {
        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
            factory.setFeature("http://xml.org/sax/features/external-general-entities", false);
            factory.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
            factory.setExpandEntityReferences(false);

            Document document = factory.newDocumentBuilder().parse(new InputSource(new StringReader(xml)));
            NodeList itemNodes = document.getElementsByTagName("item");
            List<Map<String, String>> items = new ArrayList<>();

            for (int i = 0; i < itemNodes.getLength(); i++) {
                Node node = itemNodes.item(i);
                if (node instanceof Element element) {
                    items.add(toMap(element));
                }
            }
            return items;
        } catch (Exception exception) {
            throw new IllegalStateException("failed to parse public data XML", exception);
        }
    }

    private Map<String, String> toMap(Element element) {
        Map<String, String> values = new LinkedHashMap<>();
        NodeList children = element.getChildNodes();
        for (int i = 0; i < children.getLength(); i++) {
            Node child = children.item(i);
            if (child instanceof Element childElement) {
                String value = childElement.getTextContent();
                if (value != null && !value.isBlank()) {
                    values.put(childElement.getTagName().toLowerCase(), value.trim());
                }
            }
        }
        return values;
    }

    private Hospital toHospital(PublicHospitalItem info, PublicRealtimeBedItem realtime) {
        int availableBeds = realtime == null ? 0 : Math.max(0, realtime.emergencyBeds());
        int currentPatients = estimateCurrentPatients(availableBeds);
        int estimatedWait = estimateWaitMinutes(availableBeds);
        Set<String> departments = new LinkedHashSet<>();
        departments.add("응급의학과");
        departments.addAll(info.departments());
        Set<String> specialists = new LinkedHashSet<>(departments);
        List<String> equipmentStatus = realtime == null ? List.of("실시간 장비 정보 없음") : realtime.equipmentStatus();

        if (equipmentStatus.stream().anyMatch(item -> item.contains("CT") || item.contains("MRI"))) {
            specialists.add("영상의학과");
        }
        if (equipmentStatus.stream().anyMatch(item -> item.contains("인공호흡기"))) {
            specialists.add("중환자의학");
        }

        return new Hospital(
                toStableId(info.hpid()),
                info.name(),
                info.address(),
                info.phone(),
                info.latitude(),
                info.longitude(),
                availableBeds,
                List.of("KTAS1", "KTAS2", "KTAS3", "KTAS4", "KTAS5"),
                specialists.stream().toList(),
                departments.stream().toList(),
                equipmentStatus,
                currentPatients,
                0,
                estimateProcessingRate(availableBeds),
                estimatedWait,
                info.region()
        );
    }

    private Hospital applyIncomingOverride(Hospital hospital) {
        int count = incomingOverrides.getOrDefault(hospital.id(), 0);
        Hospital updated = hospital;
        for (int i = 0; i < count; i++) {
            updated = updated.incrementIncomingPatients();
        }
        return updated;
    }

    private int estimateCurrentPatients(int availableBeds) {
        if (availableBeds <= 0) {
            return 35;
        }
        return Math.max(6, 32 - (availableBeds * 2));
    }

    private int estimateWaitMinutes(int availableBeds) {
        if (availableBeds <= 0) {
            return 90;
        }
        if (availableBeds <= 3) {
            return 60;
        }
        if (availableBeds <= 8) {
            return 35;
        }
        return 20;
    }

    private double estimateProcessingRate(int availableBeds) {
        return Math.max(5.0, Math.min(12.0, 5.0 + availableBeds * 0.4));
    }

    private Long toStableId(String hpid) {
        String digits = hpid.replaceAll("\\D", "");
        if (!digits.isBlank()) {
            try {
                return Long.parseLong(digits);
            } catch (NumberFormatException ignored) {
                // fall through to hash id
            }
        }
        return Integer.toUnsignedLong(hpid.hashCode());
    }

    private Map<Long, Hospital> fallbackHospitals(String reason) {
        log.info("Using mock emergency hospital data: {}", reason);
        Map<Long, Hospital> fallbackHospitals = new LinkedHashMap<>();
        fallbackRepository.findAll().forEach(hospital -> fallbackHospitals.put(hospital.id(), hospital));
        return fallbackHospitals;
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private record HospitalCache(Map<Long, Hospital> hospitals, Instant loadedAt) {
        static HospitalCache empty() {
            return new HospitalCache(Map.of(), Instant.EPOCH);
        }
    }

    private record PublicHospitalItem(
            String hpid,
            String name,
            String address,
            String phone,
            double latitude,
            double longitude,
            String region,
            List<String> departments
    ) {
        static PublicHospitalItem from(Map<String, String> values) {
            String address = text(values, "dutyaddr");
            return new PublicHospitalItem(
                    text(values, "hpid"),
                    text(values, "dutyname"),
                    address,
                    first(values, "dutytel3", "dutytel1"),
                    number(values, "wgs84lat"),
                    number(values, "wgs84lon"),
                    parseRegion(address),
                    parseDepartments(first(values, "dutyemclsname", "dutyemcls"))
            );
        }

        boolean hasMinimumFields() {
            return !hpid.isBlank() && !name.isBlank() && latitude != 0.0 && longitude != 0.0;
        }
    }

    private record PublicRealtimeBedItem(
            String hpid,
            int emergencyBeds,
            List<String> equipmentStatus
    ) {
        static PublicRealtimeBedItem from(Map<String, String> values) {
            List<String> equipment = new ArrayList<>();
            addAvailability(equipment, "CT", text(values, "hvctayn"));
            addAvailability(equipment, "MRI", text(values, "hvmriayn"));
            addAvailability(equipment, "조영촬영기", text(values, "hvangioayn"));
            addAvailability(equipment, "인공호흡기", text(values, "hvventiayn"));
            addAvailability(equipment, "구급차", text(values, "hvamyn"));
            addPositiveCapacity(equipment, "수술실", integer(values, "hvoc"));
            addPositiveCapacity(equipment, "일반중환자실", integer(values, "hvicc"));
            addPositiveCapacity(equipment, "흉부중환자실", integer(values, "hvccc"));
            addPositiveCapacity(equipment, "신경중환자실", integer(values, "hvcc"));

            return new PublicRealtimeBedItem(
                    text(values, "hpid"),
                    integer(values, "hvec"),
                    equipment.isEmpty() ? List.of("실시간 장비 정보 없음") : List.copyOf(equipment)
            );
        }

        boolean hasHpid() {
            return !hpid.isBlank();
        }
    }

    private static String text(Map<String, String> values, String key) {
        return values.getOrDefault(key.toLowerCase(), "");
    }

    private static String first(Map<String, String> values, String... keys) {
        for (String key : keys) {
            String value = text(values, key);
            if (!value.isBlank()) {
                return value;
            }
        }
        return "";
    }

    private static int integer(Map<String, String> values, String key) {
        String value = text(values, key);
        if (value.isBlank()) {
            return 0;
        }
        try {
            return Integer.parseInt(value.replaceAll("[^\\-0-9]", ""));
        } catch (NumberFormatException exception) {
            return 0;
        }
    }

    private static double number(Map<String, String> values, String key) {
        String value = text(values, key);
        if (value.isBlank()) {
            return 0.0;
        }
        try {
            return Double.parseDouble(value);
        } catch (NumberFormatException exception) {
            return 0.0;
        }
    }

    private static String parseRegion(String address) {
        if (address == null || address.isBlank()) {
            return "정보 없음";
        }
        String[] tokens = address.split("\\s+");
        if (tokens.length >= 2) {
            return tokens[0] + " " + tokens[1];
        }
        return tokens[0];
    }

    private static List<String> parseDepartments(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }
        if (value.contains("권역") || value.contains("지역") || value.contains("응급")) {
            return List.of("응급의학과");
        }
        return List.of(value);
    }

    private static void addAvailability(List<String> equipment, String label, String yn) {
        if ("Y".equalsIgnoreCase(yn) || "가능".equals(yn)) {
            equipment.add(label + " 가능");
        }
    }

    private static void addPositiveCapacity(List<String> equipment, String label, int count) {
        if (count > 0) {
            equipment.add(label + " " + count + "개");
        }
    }
}

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.HashMap;
import java.util.Map;

@RestController
public class AppDataController {
    @GetMapping("/api/app-data")
    public Map<String, Object> getAppData() {
        Map<String, Object> data = new HashMap<>();
        data.put("status", "ok");
        data.put("message", "This is mock app data.");
        return data;
    }
}

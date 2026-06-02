package com.bidforge.app.login_activity;

import com.bidforge.app.user.User;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class LoginActivityService {

    private final LoginActivityRepository loginActivityRepository;
    private final RestTemplate restTemplate;

    public void record(User user, HttpServletRequest request, String loginMethod) {
        String ip = extractIp(request);
        String ua = request.getHeader("User-Agent");
        if (ua != null && ua.length() > 500) ua = ua.substring(0, 500);

        LoginActivity activity = LoginActivity.builder()
                .user(user)
                .ipAddress(ip)
                .userAgent(ua)
                .loginMethod(loginMethod)
                .build();

        LoginActivity saved = loginActivityRepository.save(activity);
        resolveGeoAsync(saved.getId(), ip);
    }

    @Async
    public void resolveGeoAsync(Long activityId, String ip) {
        if (ip == null || ip.equals("127.0.0.1") || ip.equals("0:0:0:0:0:0:0:1") || ip.equals("::1")) {
            return;
        }
        try {
            String url = "http://ip-api.com/json/" + ip + "?fields=status,city,country,countryCode";
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            if (response != null && "success".equals(response.get("status"))) {
                loginActivityRepository.findById(activityId).ifPresent(a -> {
                    a.setCity((String) response.get("city"));
                    a.setCountry((String) response.get("country"));
                    a.setCountryCode((String) response.get("countryCode"));
                    loginActivityRepository.save(a);
                });
            }
        } catch (Exception e) {
            log.debug("Geo lookup failed for IP {}: {}", ip, e.getMessage());
        }
    }

    private String extractIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}

package com.hirematch.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
@ConfigurationProperties(prefix = "app")
@Data
public class AppProperties {

    private Jwt jwt = new Jwt();
    private Storage storage = new Storage();
    private AiService aiService = new AiService();
    private RateLimit rateLimit = new RateLimit();
    private Matching matching = new Matching();
    private Cors cors = new Cors();

    @Data
    public static class Jwt {
        private String secret;
        private long expiryMs = 900_000L;
        private long refreshExpiryMs = 604_800_000L;
    }

    @Data
    public static class Storage {
        private String type = "local";
        private String path = "./uploads";
        private S3 s3 = new S3();

        @Data
        public static class S3 {
            private String bucket;
            private String region;
        }
    }

    @Data
    public static class AiService {
        private String url = "http://localhost:8000";
    }

    @Data
    public static class RateLimit {
        private long capacity = 100;
        private long refillTokens = 100;
        private long refillPeriodSeconds = 60;
    }

    @Data
    public static class Matching {
        private Weights weights = new Weights();

        @Data
        public static class Weights {
            private double semantic = 0.55;
            private double skill = 0.25;
            private double experience = 0.10;
            private double location = 0.10;
        }
    }

    @Data
    public static class Cors {
        private List<String> allowedOrigins = List.of("http://localhost:3000", "http://localhost:5173");
    }
}

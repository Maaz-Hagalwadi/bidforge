package com.bidforge.app.config;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.springframework.boot.test.context.TestConfiguration;

import java.io.IOException;

@TestConfiguration
public class TestRedisConfig {

    private static redis.embedded.RedisServer redisServer;

    @PostConstruct
    public void startRedis() throws IOException {
        redisServer = new redis.embedded.RedisServer(6370);
        redisServer.start();
    }

    @PreDestroy
    public void stopRedis() {
        if (redisServer != null) redisServer.stop();
    }
}

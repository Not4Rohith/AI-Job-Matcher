package com.hirematch;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class HireMatchApplication {
    public static void main(String[] args) {
        SpringApplication.run(HireMatchApplication.class, args);
    }
}

package com.supersave.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SuperSaveApplication {

    public static void main(String[] args) {
        SpringApplication.run(SuperSaveApplication.class, args);
    }
}

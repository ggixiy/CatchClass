package com.catchclass;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.modulith.Modulithic;
import org.springframework.scheduling.annotation.EnableScheduling;

@Modulithic(systemName = "CatchClass")
@SpringBootApplication
@ConfigurationPropertiesScan
@EnableScheduling
public class CatchClassApplication {

	public static void main(String[] args) {
		SpringApplication.run(CatchClassApplication.class, args);
	}

}

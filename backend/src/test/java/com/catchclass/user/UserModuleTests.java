package com.catchclass.user;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import com.jayway.jsonpath.JsonPath;

import com.catchclass.TestcontainersConfiguration;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class UserModuleTests {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void createsAndFetchesProfile() throws Exception {
        String createBody = """
                {"email":"anna@example.com","displayName":"Анна Хижняк"}
                """;

        String response = mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("anna@example.com"))
                .andReturn().getResponse().getContentAsString();

        String id = JsonPath.read(response, "$.id");

        mockMvc.perform(get("/api/users/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.displayName").value("Анна Хижняк"));
    }

    @Test
    void rejectsDuplicateEmail() throws Exception {
        String body = """
                {"email":"dup@example.com","displayName":"Тест"}
                """;
        mockMvc.perform(post("/api/users").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated());
        mockMvc.perform(post("/api/users").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isConflict());
    }
}
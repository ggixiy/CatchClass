package com.catchclass.auth.internal.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.catchclass.auth.internal.entity.Credential;

public interface CredentialRepository extends JpaRepository<Credential, UUID> {
}
package com.catchclass.user.internal.repository;

import java.util.Optional;
import java.util.UUID;

import com.catchclass.user.internal.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
}
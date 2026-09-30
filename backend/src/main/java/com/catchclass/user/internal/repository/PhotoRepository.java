package com.catchclass.user.internal.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import com.catchclass.user.internal.entity.Photo;

public interface PhotoRepository extends JpaRepository<Photo, UUID> {

    @Modifying
    @Query("delete from Photo p where p.userId = :userId")
    int deleteByUserIdIfExists(UUID userId);
}
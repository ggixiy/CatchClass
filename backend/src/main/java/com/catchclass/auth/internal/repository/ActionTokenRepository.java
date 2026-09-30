package com.catchclass.auth.internal.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import com.catchclass.auth.internal.entity.ActionToken;

public interface ActionTokenRepository extends JpaRepository<ActionToken, String> {

    @Modifying
    @Query("delete from ActionToken t where t.tokenHash = :hash")
    int deleteByTokenHashIfExists(String hash);
}
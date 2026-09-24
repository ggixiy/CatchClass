package com.catchclass;

import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModules;
import org.springframework.modulith.docs.Documenter;

class ModularityTests {

    private static final ApplicationModules MODULES = ApplicationModules.of(CatchClassApplication.class);

    @Test
    void verifiesModularStructure() {
        MODULES.verify();
    }

    @Test
    void writesDocumentation() {
        new Documenter(MODULES).writeDocumentation(); // діаграми в target/spring-modulith-docs
    }
}
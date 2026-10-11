package org.lowcoder.sdk.contract;

/**
 * Every container image a test starts, each pinned by digest (docs/COVERAGE_GATE_PLAN.md §7, task P0-4). A tag such as
 * {@code mysql:8.0} can be moved to a new build and a digest cannot, so a test names its image only through these
 * constants ({@code DockerImageName.parse(ContainerImages.MYSQL_8_0)}), and docs/coverage-gate/image-pin-check.sh fails
 * on any other image name in test sources.
 *
 * <p>Each value is {@code <name>:<tag>@sha256:<digest>}: the tag says which line the image belongs to, the digest which
 * build. Docker pulls by the digest. A Testcontainers module class ({@code MongoDBContainer}, {@code MySQLContainer},
 * {@code PostgreSQLContainer}, ...) does not accept a digest-pinned name as its image without
 * {@code .asCompatibleSubstituteFor("<repository>")} (it fails with "Failed to verify that image ... is a compatible
 * substitute"); {@code GenericContainer} needs nothing. The digests were read on 2026-10-04: for the images already on
 * the build machine, the build that was measured (the registry's tag had moved on for {@code mongo:7.0} and
 * {@code postgres:16-alpine}); for the others, the registry's index digest. Changing a digest is a change of its own,
 * with a full build.
 *
 * <p>Licences (confirmed from each image's documentation, 2026-10-04): MySQL GPLv2; PostgreSQL License; Redis 7.2.4
 * BSD-3; MongoDB SSPL; ClickHouse Apache-2.0; SQL Server under its EULA (Developer/Express editions, no production use);
 * Elasticsearch 8.15 Elastic License 2.0; Oracle Database Free under the Oracle Free Use Terms (the image packaging
 * Apache-2.0). They are used for tests only (owner decision D-5).
 */
public final class ContainerImages {

    /** The server's tests: the line of the embedded mongod they ran against before (4.0.2). */
    public static final String MONGO_4_0 =
            "mongo:4.0.28@sha256:4ca81c89ad08f4cfa9906005126112bffe8fb363800466ef5e50f6238f6f6af1";
    /** mongoPlugin's container tests. */
    public static final String MONGO_7_0 =
            "mongo:7.0@sha256:d5b3ca8c3f3cdce78d44870dc0871b76d5235e9b2ad4ea6bea5d1fbff8027703";
    public static final String REDIS_7_2 =
            "redis:7.2.4-alpine@sha256:c8bb255c3559b3e458766db810aa7b3c7af1235b204cfdb304e79ff388fe1a5a";
    public static final String POSTGRES_16 =
            "postgres:16-alpine@sha256:20edbde7749f822887a1a022ad526fde0a47d6b2be9a8364433605cf65099416";
    public static final String MYSQL_8_0 =
            "mysql:8.0@sha256:7dcddc01f13bab2f15cde676d44d01f61fc9f99fe7785e86196dfc07d358ae2b";
    public static final String CLICKHOUSE_24_8 =
            "clickhouse/clickhouse-server:24.8-alpine@sha256:b002e56ed5c16e224c312527f6fcba7e77216fec5d7a88a7828f59efc614feb5";
    /** Heavy: started only by tests tagged {@code heavy-container} (task P0-6). */
    public static final String MSSQL_2022 =
            "mcr.microsoft.com/mssql/server:2022-CU27-ubuntu-22.04@sha256:4402d880dd4c34bfa7d8705e56a86cd6c88da80a1f6bbbe741f999e76264a090";
    /** Heavy: started only by tests tagged {@code heavy-container} (task P0-6). */
    public static final String ELASTICSEARCH_8_15 =
            "docker.elastic.co/elasticsearch/elasticsearch:8.15.5@sha256:8870d5b7b86235fa790c9112464f5fd3b693f89d73e757a630f8b5cda350f95b";
    /** Heavy: started only by tests tagged {@code heavy-container} (task P0-6). */
    public static final String ORACLE_FREE_23 =
            "gvenzl/oracle-free:23-slim-faststart@sha256:f5ff19033860d662c821cb04eb10483fa94f14f78eae252d054291ea07028093";

    private ContainerImages() {
    }
}

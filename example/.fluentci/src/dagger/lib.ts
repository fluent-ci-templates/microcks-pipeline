import { dag, env, Directory, DirectoryID } from "../../deps.ts";
import { Secret, SecretID } from "../../sdk/client.gen.ts";

export const getDirectory = async (
  src: string | Directory | undefined = "."
) => {
  if (src instanceof Directory) {
    return src;
  }
  if (typeof src === "string") {
    try {
      const directory = dag.loadDirectoryFromID(src as DirectoryID);
      await directory.id();
      return directory;
    } catch (_) {
      return dag.host
        ? dag.host().directory(src)
        : dag.currentModule().source().directory(src);
    }
  }
  return dag.host
    ? dag.host().directory(src)
    : dag.currentModule().source().directory(src);
};

export const getKeycloakClientSecret = async (kcSecret: string | Secret) => {
  if (env.get("KEYCLOAK_CLIENT_SECRET")) {
    return dag.setSecret(
      "KEYCLOAK_CLIENT_SECRET",
      env.get("KEYCLOAK_CLIENT_SECRET")!
    );
  }
  if (kcSecret && typeof kcSecret === "string") {
    try {
      const secret = dag.loadSecretFromID(kcSecret as SecretID);
      await secret.id();
      return secret;
    } catch (_) {
      return dag.setSecret("KEYCLOAK_CLIENT_SECRET", kcSecret);
    }
  }
  if (kcSecret && kcSecret instanceof Secret) {
    return kcSecret;
  }
  throw new Error("KEYCLOAK_CLIENT_SECRET not found");
};

export const microcksService = () => {
  const mongo = dag
    .container()
    .from("mongo:3.6.23")
    .withMountedCache("/data/db", dag.cacheVolume("microcks-mongo-data"))
    .withExposedPort(27017)
    .asService();

  const realm = dag
    .container()
    .from("alpine")
    .withExec([
      "wget",
      "https://raw.githubusercontent.com/fluent-ci-templates/microcks-pipeline/main/example/microcks-realm-sample.json",
    ])
    .file("/microcks-realm-sample.json");

  const keycloak = dag
    .container()
    .from("quay.io/keycloak/keycloak:22.0.2")
    .withFile("/opt/keycloak/data/import/microcks-realm.json", realm)
    .withEnvVariable("KEYCLOAK_ADMIN", "admin")
    .withEnvVariable("KEYCLOAK_ADMIN_PASSWORD", "admin")
    .withEnvVariable("KC_HOSTNAME_ADMIN_URL", "http://keycloak:8080")
    .withEnvVariable("KC_HOSTNAME_URL", "http://keycloak:8080")
    .withUser("root")
    .withExec(["start-dev", "--import-realm"])
    .withExposedPort(8080)
    .asService();

  const postman = dag
    .container()
    .from("quay.io/microcks/microcks-postman-runtime:latest")
    .asService();

  const microcks = dag
    .container()
    .from("quay.io/microcks/microcks:1.8.1")
    .withEnvVariable("SPRING_PROFILES_ACTIVE", "prod")
    .withEnvVariable("SPRING_DATA_MONGODB_URI", "mongodb://mongo:27017")
    .withEnvVariable("SPRING_DATA_MONGODB_DATABASE", "microcks")
    .withEnvVariable("POSTMAN_RUNNER_URL", "http://postman:3000")
    .withEnvVariable("TEST_CALLBACK_URL", "http://microcks:8080")
    .withEnvVariable("SERVICES_UPDATE_INTERVAL", "0 0 0/2 * * *")
    .withEnvVariable("KEYCLOAK_URL", "http://keycloak:8080")
    .withEnvVariable("KEYCLOAK_PUBLIC_URL", "http://keycloak:8080")
    .withEnvVariable(
      "JAVA_OPTIONS",
      "-Dspring.security.oauth2.resourceserver.jwt.issuer-uri=http://keycloak:8080/realms/microcks -Dspring.security.oauth2.resourceserver.jwt.jwk-set-uri=http://keycloak:8080/realms/microcks/protocol/openid-connect/certs"
    )
    .withServiceBinding("mongo", mongo)
    .withServiceBinding("keycloak", keycloak)
    .withServiceBinding("postman", postman)
    .withExposedPort(8080)
    .withExposedPort(9090)
    .asService();

  return { microcks, keycloak };
};

import {
  importApiSpecs,
  runTests,
} from "https://pkg.fluentci.io/microcks_pipeline@v0.1.0/mod.ts";
import { env } from "./deps.ts";

await importApiSpecs(
  ".",
  env.get("SPECIFICATION_FILES")!,
  env.get("MICROCKS_URL")!,
  env.get("KEYCLOAK_CLIENT_ID")!,
  env.get("KEYCLOAK_CLIENT_SECRET")!
);

await runTests(
  env.get("API_NAME_AND_VERSION")!,
  env.get("TEST_ENDPOINT")!,
  env.get("MICROCKS_URL")!,
  env.get("KEYCLOAK_CLIENT_ID")!,
  env.get("KEYCLOAK_CLIENT_SECRET")!,
  env.get("RUNNER")!,
  env.get("WAIT_FOR"),
  env.get("SECRET_NAME"),
  env.get("FILTERED_OPERATIONS")
);

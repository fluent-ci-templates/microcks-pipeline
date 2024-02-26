import {
  importApiSpecs,
  runTests,
} from "https://pkg.fluentci.io/microcks_pipeline@v0.1.0/mod.ts";

await importApiSpecs(
  ".",
  Deno.env.get("SPECIFICATION_FILES")!,
  Deno.env.get("MICROCKS_URL")!,
  Deno.env.get("KEYCLOAK_CLIENT_ID")!,
  Deno.env.get("KEYCLOAK_CLIENT_SECRET")!
);

await runTests(
  Deno.env.get("API_NAME_AND_VERSION")!,
  Deno.env.get("TEST_ENDPOINT")!,
  Deno.env.get("MICROCKS_URL")!,
  Deno.env.get("KEYCLOAK_CLIENT_ID")!,
  Deno.env.get("KEYCLOAK_CLIENT_SECRET")!,
  Deno.env.get("RUNNER")!,
  Deno.env.get("WAIT_FOR"),
  Deno.env.get("SECRET_NAME"),
  Deno.env.get("FILTERED_OPERATIONS")
);

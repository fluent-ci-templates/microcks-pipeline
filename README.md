# Microcks Pipeline

[![fluentci pipeline](https://img.shields.io/badge/dynamic/json?label=pkg.fluentci.io&labelColor=%23000&color=%23460cf1&url=https%3A%2F%2Fapi.fluentci.io%2Fv1%2Fpipeline%2Fmicrocks_pipeline&query=%24.version)](https://pkg.fluentci.io/microcks_pipeline)
![deno compatibility](https://shield.deno.dev/deno/^1.37)

A ready-to-use CI/CD Pipeline for importing API specifications into [Microcks](https://microcks.io/) and running [Microcks](https://microcks.io/) tests.

## 🚀 Usage

Run the following command:

```bash
fluentci run microcks_pipeline
```

Or, if you want to use it as a template:

```bash
fluentci init -t microcks
```

This will create a `.fluentci` folder in your project.

Now you can run the pipeline with:

```bash
fluentci run .
```

## Dagger Module

Use as a [Dagger](https://dagger.io) module:

```bash
dagger install github.com/fluent-ci-templates/microcks-pipeline@mod
```

## Environment variables

| Variable          | Description               | Default    |
| ----------------- | ------------------------- | ---------- |
| SPECIFICATION_FILES | The path to the API specifications |  |
| MICROCKS_URL | Microcks instance API endpoint |  |
| KEYCLOAK_CLIENT_ID | Keycloak Realm Service Account ClientId |  |
| KEYCLOAK_CLIENT_SECRET | Keycloak Realm Service Account ClientSecret |  |
| API_NAME_AND_VERSION | The name and version of the API to test |  |
| TEST_ENDPOINT | The endpoint to test |  |
| RUNNER | Test strategy (one of: HTTP, SOAP, SOAP_UI, POSTMAN, OPEN_API_SCHEMA, ASYNC_API_SCHEMA, GRPC_PROTOBUF, GRAPHQL_SCHEMA) | `HTTP` |
| WAIT_FOR | Time to wait for test to finish (int + one of: milli, sec, min) | `5sec` |
| SECRET_NAME | The name of a Secret to use for connecting test endpoint |  |
| FILTERED_OPERATIONS | JSON that allows to filter a list of operations to launch a test for |  |



## Jobs

| Job              | Description                               |
| ---------------- | ----------------------------------------- |
| import-api-specs | Import API specifications into Microcks   |
| run-tests        | Launch a Microcks test on an API endpoint |

```typescript
importApiSpecs(
  src: string | Directory,
  specificationFiles: string,
  microcksURL: string,
  keycloakClientId: string,
  keycloakClientSecret: string | Secret
): Promise<string>;

runTests(
  apiNameAndVersion: string,
  testEndpoint: string,
  microcksURL: string,
  keycloakClientId: string,
  keycloakClientSecret: string | Secret,
  runner = "HTTP",
  waitFor = "5sec",
  secretName?: string,
  filteredOperations?: string,
  operationsHeaders?: string
): Promise<string>;
```

## Programmatic usage

You can also use this pipeline programmatically:

```ts
import { importApiSpecs, runTests } from "https://pkg.fluentci.io/microcks_pipeline@v0.1.0/mod.ts";

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
```

/**
 * @module microcks
 * @description Import API specifications into Microcks and run Microcks tests
 */

import { Directory, dag } from "../../deps.ts";
import { Secret } from "../../sdk/client.gen.ts";
import {
  getDirectory,
  getKeycloakClientSecret,
  microcksService,
} from "./lib.ts";

export enum Job {
  importApiSpecs = "import-api-specs",
  runTests = "run-tests",
}

export const exclude = [];

/**
 * Import API specifications into Microcks
 *
 * @function
 * @description Import API specifications into Microcks
 * @param {src: string | Directory | undefined} src The source directory
 * @param {specificationFiles: string} specificationFiles The path to the API specifications
 * @param {microcksURL: string} microcksURL Microcks instance API endpoint
 * @param {keycloakClientId: string}  keycloakClientId Keycloak Realm Service Account ClientId
 * @param  {keycloakClientSecret: string | Secret} keycloakClientSecret Keycloak Realm Service Account ClientSecret
 * @returns {string}
 */
export async function importApiSpecs(
  src: string | Directory,
  specificationFiles: string,
  microcksURL: string,
  keycloakClientId: string,
  keycloakClientSecret: string | Secret
): Promise<string> {
  const secret = await getKeycloakClientSecret(keycloakClientSecret);
  const context = await getDirectory(src);
  let ctr = dag
    .pipeline(Job.importApiSpecs)
    .container()
    .from("quay.io/microcks/microcks-cli:0.5.3")
    .withDirectory("/app", context)
    .withWorkdir("/app")
    .withEnvVariable("SPECIFICATION_FILES", specificationFiles)
    .withEnvVariable("MICROCKS_URL", microcksURL)
    .withEnvVariable("KEYCLOAK_CLIENT_ID", keycloakClientId)
    .withSecretVariable("KEYCLOAK_CLIENT_SECRET", secret);

  if (microcksURL === "http://microcks:8080/api") {
    const { microcks, keycloak } = microcksService();
    ctr = await ctr
      .withServiceBinding("microcks", microcks)
      .withServiceBinding("keycloak", keycloak)
      .sync();
  }

  ctr = ctr.withExec([
    "bash",
    "-c",
    `\
  microcks-cli import "$SPECIFICATION_FILES" \
    --microcksURL=$MICROCKS_URL \
    --keycloakClientId=$KEYCLOAK_CLIENT_ID --keycloakClientSecret=$KEYCLOAK_CLIENT_SECRET \
    --insecure \
    --verbose
  `,
  ]);

  const result = await ctr.stdout();
  return result;
}

/**
 * Launch a Microcks test on an API endpoint
 *
 * @function
 * @description Launch a Microcks test on an API endpoint
 * @param {apiNameAndVersion: string} apiNameAndVersion The name and version of the API to test
 * @param {testEndpoint: string} testEndpoint The endpoint to test
 * @param {runner: string} runner Test strategy (one of: HTTP, SOAP, SOAP_UI, POSTMAN, OPEN_API_SCHEMA, ASYNC_API_SCHEMA, GRPC_PROTOBUF, GRAPHQL_SCHEMA)
 * @param {microcksURL: string} microcksURL Microcks instance API endpoint
 * @param {waitFor: string} waitFor Time to wait for test to finish (int + one of: milli, sec, min)
 * @param {secretName: string} secretName The name of a Secret to use for connecting test endpoint
 * @param {keycloakClientId: string} keycloakClientId Keycloak Realm Service Account ClientId
 * @param {keycloakClientSecret: string | Secret} keycloakClientSecret Keycloak Realm Service Account ClientSecret
 * @param {filteredOperations: string} filteredOperations JSON that allows to filter a list of operations to launch a test for
 * @param {operationsHeaders: string} operationsHeaders SON that override some operations headers for the tests to launch
 * @returns {string}
 */
export async function runTests(
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
): Promise<string> {
  const secret = await getKeycloakClientSecret(keycloakClientSecret);
  let ctr = dag
    .pipeline(Job.runTests)
    .container()
    .from("quay.io/microcks/microcks-cli:0.5.3")
    .withWorkdir("/app")
    .withEnvVariable("API_NAME_AND_VERSION", apiNameAndVersion)
    .withEnvVariable("TEST_ENDPOINT", testEndpoint)
    .withEnvVariable("MICROCKS_URL", microcksURL)
    .withEnvVariable("KEYCLOAK_CLIENT_ID", keycloakClientId)
    .withSecretVariable("KEYCLOAK_CLIENT_SECRET", secret)
    .withEnvVariable("RUNNER", runner)
    .withEnvVariable("WAIT_FOR", waitFor)
    .withEnvVariable("SECRET_NAME", secretName || "")
    .withEnvVariable("FILTERED_OPERATIONS", filteredOperations || "")
    .withEnvVariable("OPERATIONS_HEADERS", operationsHeaders || "");

  if (microcksURL === "http://microcks:8080/api") {
    const { microcks, keycloak } = microcksService();
    ctr = await ctr
      .withServiceBinding("microcks", microcks)
      .withServiceBinding("keycloak", keycloak)
      .sync();
  }

  ctr = ctr.withExec([
    "bash",
    "-c",
    `\
    microcks-cli test "$API_NAME_AND_VERSION" $TEST_ENDPOINT $RUNNER \
      --microcksURL=$MICROCKS_URL --waitFor=$WAIT_FOR --secretName="$SECRET_NAME" \
      --keycloakClientId=$KEYCLOAK_CLIENT_ID --keycloakClientSecret=$KEYCLOAK_CLIENT_SECRET \
      --insecure --filteredOperations="$FILTERED_OPERATIONS" --operationsHeaders="$OPERATIONS_HEADERS" \ 
  `,
  ]);

  const result = await ctr.stdout();
  return result;
}

export type JobExec =
  | ((
      src: string | Directory,
      specificationFiles: string,
      microcksURL: string,
      keycloakClientId: string,
      keycloakClientSecret: string | Secret
    ) => Promise<string>)
  | ((
      apiNameAndVersion: string,
      testEndpoint: string,
      microcksURL: string,
      keycloakClientId: string,
      keycloakClientSecret: string | Secret,
      runner?: string,
      waitFor?: string,
      secretName?: string,
      filteredOperations?: string,
      operationsHeaders?: string
    ) => Promise<string>);

export const runnableJobs: Record<Job, JobExec> = {
  [Job.importApiSpecs]: importApiSpecs,
  [Job.runTests]: runTests,
};

export const jobDescriptions: Record<Job, string> = {
  [Job.importApiSpecs]: "Import API specifications into Microcks",
  [Job.runTests]: "Launch a Microcks test on an API endpoint",
};

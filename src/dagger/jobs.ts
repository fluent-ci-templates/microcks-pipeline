/**
 * @module microcks
 * @description Import API specifications into Microcks and run Microcks tests
 */

import { Directory, dag } from "../../deps.ts";
import { Secret } from "../../sdk/client.gen.ts";
import { getDirectory, getKeycloakClientSecret } from "./lib.ts";

export enum Job {
  importApiSpecs = "import-api-specs",
  runTests = "run-tests",
}

export const exclude = [];

/**
 * @function
 * @description Import API specifications into Microcks
 * @param src {src: string | Directory | undefined}
 * @param specificationFiles {specificationFiles: string}
 * @param microcksURL {microcksURL: string}
 * @param keycloakClientId {keycloakClientId: string}
 * @param keycloakClientSecret {keycloakClientSecret: string | Secret}
 * @returns {string}
 */
export async function importApiSpecs(
  src: string | Directory,
  specificationFiles: string,
  microcksURL: string,
  keycloakClientId: string,
  keycloakClientSecret: string | Secret
): Promise<string> {
  const secret = await getKeycloakClientSecret(dag, keycloakClientSecret);
  const context = await getDirectory(dag, src);
  const ctr = dag
    .pipeline(Job.importApiSpecs)
    .container()
    .from("quay.io/microcks/microcks-cli:0.5.3")
    .withDirectory("/app", context)
    .withWorkdir("/app")
    .withEnvVariable("SPECIFICATION_FILES", specificationFiles)
    .withEnvVariable("MICROCKS_URL", microcksURL)
    .withEnvVariable("KEYCLOAK_CLIENT_ID", keycloakClientId)
    .withSecretVariable("KEYCLOAK_CLIENT_SECRET", secret)
    .withExec([
      "bash",
      "-c",
      `\
    microcks-cli import "$SPECIFICATION_FILES" \
      --microcksURL=$MICROCKS_URL \
      --keycloakClientId=$KEYCKLOAK_CLIENT_ID --keycloakClientSecret=$KEYCLOAK_CLIENT_SECRET \
      --insecure
    `,
    ]);

  const result = await ctr.stdout();
  return result;
}

/**
 * @function
 * @description Launch a Microcks test on an API endpoint
 * @param apiNameAndVersion {apiNameAndVersion: string}
 * @param testEndpoint {testEndpoint: string}
 * @param runner {runner: string}
 * @param microcksURL {microcksURL: string}
 * @param waitFor {waitFor: string}
 * @param secretName {secretName: string}
 * @param keycloakClientId {keycloakClientId: string}
 * @param keycloakClientSecret {keycloakClientSecret: string | Secret}
 * @param filterOperations {filterOperations: string}
 * @param operationsHeaders {operationsHeaders: string}
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
  filterOperations?: string,
  operationsHeaders?: string
): Promise<string> {
  const secret = await getKeycloakClientSecret(dag, keycloakClientSecret);
  const ctr = dag
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
    .withEnvVariable("FILTER_OPERATIONS", filterOperations || "")
    .withEnvVariable("OPERATIONS_HEADERS", operationsHeaders || "")
    .withExec([
      "bash",
      "-c",
      `\
      microcks-cli test "$API_NAME_AND_VERSION" $TEST_ENDPOINT $RUNNER \
        --microcksURL=$MICROCKS_URL --waitFor=$WAIT_FOR --secretName="$SECRET_NAME" \
        --keycloakClientId=$KEYCLOAK_CIENT_ID --keycloakClientSecret=$KEYCLOAK_CLIENT_SECRET \
        --insecure --filteredOperations="$FILTER_OPERATIONS" --operationsHeaders="$OPERATIONS_HEADERS" \ 
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
      filterOperations?: string,
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

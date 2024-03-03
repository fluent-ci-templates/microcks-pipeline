import * as jobs from "./jobs.ts";
import { env } from "../../deps.ts";

const { importApiSpecs, runTests, runnableJobs } = jobs;

export default async function pipeline(src = ".", args: string[] = []) {
  if (args.length > 0) {
    await runSpecificJobs(args as jobs.Job[]);
    return;
  }

  await importApiSpecs(
    src,
    "specifications",
    env.get("MICROCKS_URL")!,
    env.get("KEYCLOAK_CLIENT_ID")!,
    env.get("KEYCLOAK_CLIENT_SECRET")!
  );
}

async function runSpecificJobs(args: jobs.Job[]) {
  for (const name of args) {
    const job = runnableJobs[name];
    if (!job) {
      throw new Error(`Job ${name} not found`);
    }
    switch (name) {
      case jobs.Job.importApiSpecs:
        await importApiSpecs(
          ".",
          env.get("SPECIFICATION_FILES")!,
          env.get("MICROCKS_URL")!,
          env.get("KEYCLOAK_CLIENT_ID")!,
          env.get("KEYCLOAK_CLIENT_SECRET")!
        );
        break;
      case jobs.Job.runTests:
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
        break;
      default:
        throw new Error(`Job ${name} not found`);
    }
  }
}

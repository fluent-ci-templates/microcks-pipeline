import * as jobs from "./jobs.ts";

const { importApiSpecs, runTests, runnableJobs } = jobs;

export default async function pipeline(src = ".", args: string[] = []) {
  if (args.length > 0) {
    await runSpecificJobs(args as jobs.Job[]);
    return;
  }

  await importApiSpecs(
    src,
    "specifications",
    Deno.env.get("MICROCKS_URL")!,
    Deno.env.get("KEYCLOAK_CLIENT_ID")!,
    Deno.env.get("KEYCLOAK_CLIENT_SECRET")!
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
          Deno.env.get("SPECIFICATION_FILES")!,
          Deno.env.get("MICROCKS_URL")!,
          Deno.env.get("KEYCLOAK_CLIENT_ID")!,
          Deno.env.get("KEYCLOAK_CLIENT_SECRET")!
        );
        break;
      case jobs.Job.runTests:
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
        break;
      default:
        throw new Error(`Job ${name} not found`);
    }
  }
}

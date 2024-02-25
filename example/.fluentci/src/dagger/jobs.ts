import { Directory, dag } from "../../deps.ts";
import { getDirectory } from "./lib.ts";

export enum Job {
  hello = "hello",
}

export const exclude = [];

/**
 * @function
 * @description Say hello
 * @param src {src: string | Directory | undefined}
 * @returns {string}
 */
export async function hello(
  src: string | Directory | undefined = "."
): Promise<string> {
  const context = await getDirectory(dag, src);
  const ctr = dag
    .pipeline("hello")
    .container()
    .from("alpine")
    .withDirectory("/app", context)
    .withWorkdir("/app")
    .withExec(["echo", "'Hello, world!'"]);

  const result = await ctr.stdout();
  return result.replace(/(\r\n|\n|\r)/gm, "");
}

export type JobExec = (src?: string) =>
  | Promise<string>
  | ((
      src?: string,
      options?: {
        ignore: string[];
      }
    ) => Promise<string>);

export const runnableJobs: Record<Job, JobExec> = {
  [Job.hello]: hello,
};

export const jobDescriptions: Record<Job, string> = {
  [Job.hello]: "Say hello",
};

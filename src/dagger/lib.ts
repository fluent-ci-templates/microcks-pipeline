import { Directory, DirectoryID } from "../../deps.ts";
import { Secret, Client, SecretID } from "../../sdk/client.gen.ts";

export const getDirectory = async (
  client: Client,
  src: string | Directory | undefined = "."
) => {
  if (src instanceof Directory) {
    return src;
  }
  if (typeof src === "string") {
    try {
      const directory = client.loadDirectoryFromID(src as DirectoryID);
      await directory.id();
      return directory;
    } catch (_) {
      return client.host
        ? client.host().directory(src)
        : client.currentModule().source().directory(src);
    }
  }
  return client.host
    ? client.host().directory(src)
    : client.currentModule().source().directory(src);
};

export const getKeycloakClientSecret = async (
  client: Client,
  kcSecret: string | Secret
) => {
  if (Deno.env.get("KEYCLOAK_CLIENT_SECRET")) {
    return client.setSecret(
      "KEYCLOAK_CLIENT_SECRET",
      Deno.env.get("KEYCLOAK_CLIENT_SECRET")!
    );
  }
  if (kcSecret && typeof kcSecret === "string") {
    try {
      const secret = client.loadSecretFromID(kcSecret as SecretID);
      await secret.id();
      return secret;
    } catch (_) {
      return client.setSecret("KEYCLOAK_CLIENT_SECRET", kcSecret);
    }
  }
  if (kcSecret && kcSecret instanceof Secret) {
    return kcSecret;
  }
  throw new Error("KEYCLOAK_CLIENT_SECRET not found");
};

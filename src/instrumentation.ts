import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.RMD_LOCAL_CHECK === '1') return;
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;

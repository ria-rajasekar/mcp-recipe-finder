import { LangfuseSpanProcessor } from "@langfuse/otel";
import { NodeSDK } from "@opentelemetry/sdk-node";

const hasLangfuseCredentials =
  Boolean(process.env.LANGFUSE_PUBLIC_KEY) &&
  Boolean(process.env.LANGFUSE_SECRET_KEY) &&
  Boolean(process.env.LANGFUSE_BASE_URL);

const telemetrySdk = new NodeSDK({
  spanProcessors: [new LangfuseSpanProcessor()],
});

let hasStarted = false;
let isShuttingDown = false;

async function startTelemetry() {
  if (hasStarted) return;
  hasStarted = true;

  try {
    await Promise.resolve(telemetrySdk.start());
    if (hasLangfuseCredentials) {
      console.log("Langfuse tracing initialized");
    } else {
      console.warn(
        "Langfuse tracing is enabled but credentials are missing. " +
          "Set LANGFUSE_PUBLIC_KEY, LANGFUSE_SECRET_KEY, and LANGFUSE_BASE_URL."
      );
    }
  } catch (error) {
    console.error("Failed to initialize Langfuse tracing", error);
  }
}

async function shutdownTelemetry(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  try {
    await telemetrySdk.shutdown();
    console.log(`Langfuse tracing flushed on ${signal}`);
  } catch (error) {
    console.error("Failed to shutdown Langfuse tracing", error);
  }
}

process.once("SIGINT", () => {
  void shutdownTelemetry("SIGINT");
});

process.once("SIGTERM", () => {
  void shutdownTelemetry("SIGTERM");
});

void startTelemetry();

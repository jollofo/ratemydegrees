import { SeverityNumber, type Logger } from '@opentelemetry/api-logs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { BatchLogRecordProcessor, LoggerProvider } from '@opentelemetry/sdk-logs';

type LogAttributes = Record<string, boolean | number | string>;

let initialized = false;
let logger: Logger | undefined;
let provider: LoggerProvider | undefined;

function reportMissingConfiguration(variableName: string) {
    if (process.env.NODE_ENV !== 'production') {
        console.error(`${variableName} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${variableName} is configured`);
    }
}

function getPostHogLogger() {
    if (initialized) return logger;
    initialized = true;

    const token = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
    if (!token) {
        reportMissingConfiguration('NEXT_PUBLIC_POSTHOG_KEY');
        return undefined;
    }
    if (!host) {
        reportMissingConfiguration('NEXT_PUBLIC_POSTHOG_HOST');
        return undefined;
    }

    const exporter = new OTLPLogExporter({
        url: `${host.replace(/\/+$/, '')}/i/v1/logs`,
        headers: { Authorization: `Bearer ${token}` },
    });
    provider = new LoggerProvider({
        processors: [new BatchLogRecordProcessor({ exporter })],
    });
    logger = provider.getLogger('rmd.posthog.logs');
    return logger;
}

async function emitLog(severityNumber: SeverityNumber, severityText: string, body: string, attributes: LogAttributes = {}) {
    const posthogLogger = getPostHogLogger();
    if (!posthogLogger || !provider) return;

    try {
        posthogLogger.emit({
            severityNumber,
            severityText,
            body,
            attributes: { 'service.name': 'rmd', ...attributes },
        });
        await provider.forceFlush();
    } catch {
        // Log delivery must not change the outcome of an application request.
    }
}

export function logPostHogInfo(body: string, attributes?: LogAttributes) {
    return emitLog(SeverityNumber.INFO, 'INFO', body, attributes);
}

export function logPostHogError(body: string, attributes?: LogAttributes) {
    return emitLog(SeverityNumber.ERROR, 'ERROR', body, attributes);
}

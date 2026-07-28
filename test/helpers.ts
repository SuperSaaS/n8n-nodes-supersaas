import { vi } from 'vitest';
import type { INode } from 'n8n-workflow';

/**
 * Minimal stand-in for the n8n node the error classes need. NodeApiError and
 * NodeOperationError both read from this, so it has to be shaped like a real one.
 */
export const testNode: INode = {
	id: 'test-node-id',
	name: 'SuperSaaS Trigger',
	type: 'n8n-nodes-supersaas.superSaaSTrigger',
	typeVersion: 1,
	position: [0, 0],
	parameters: {},
};

export const validCredentials = {
	account: 'acme',
	api_key: 'secret-key',
	ngrok: '',
};

export interface ContextOptions {
	/** Credentials returned by getCredentials(). Pass null to simulate none. */
	credentials?: Record<string, unknown> | null;
	/** Node parameter values keyed by parameter name. */
	parameters?: Record<string, unknown>;
	/** Value returned by getNodeWebhookUrl(). */
	webhookUrl?: string;
	/** Backing object for getWorkflowStaticData('node'). */
	staticData?: Record<string, unknown>;
	/** Body returned by getBodyData(), used by the webhook() handler. */
	bodyData?: unknown;
	/** Implementation for this.helpers.request. Defaults to a resolved empty array. */
	request?: (...args: any[]) => unknown;
}

/**
 * Builds a fake n8n execution context. The node code is always invoked via
 * `.call(context, ...)`, so a plain object with the members actually used is
 * enough — no need to satisfy the full IHookFunctions surface.
 */
export function createContext(options: ContextOptions = {}) {
	const {
		credentials = validCredentials,
		parameters = {},
		webhookUrl = 'http://localhost:5678/webhook/abc',
		staticData = {},
		bodyData = {},
		request = vi.fn().mockResolvedValue('[]'),
	} = options;

	return {
		getCredentials: vi.fn().mockResolvedValue(credentials),
		getNode: vi.fn().mockReturnValue(testNode),
		getNodeParameter: vi.fn((name: string) => parameters[name]),
		getNodeWebhookUrl: vi.fn().mockReturnValue(webhookUrl),
		getWorkflowStaticData: vi.fn().mockReturnValue(staticData),
		getBodyData: vi.fn().mockReturnValue(bodyData),
		helpers: {
			request: vi.fn(request as any),
			returnJsonArray: vi.fn((data: unknown) =>
				Array.isArray(data) ? data.map((json) => ({ json })) : [{ json: data }],
			),
		},
	};
}

/** Convenience type for the object createContext returns. */
export type TestContext = ReturnType<typeof createContext>;

/**
 * Silences the console.log/console.error calls the node makes during webhook
 * creation so test output stays readable. Returns a restore function.
 */
export function silenceConsole() {
	const log = vi.spyOn(console, 'log').mockImplementation(() => {});
	const error = vi.spyOn(console, 'error').mockImplementation(() => {});
	return () => {
		log.mockRestore();
		error.mockRestore();
	};
}

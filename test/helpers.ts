import { vi } from 'vitest';
import type { INode } from 'n8n-workflow';

// NodeApiError and NodeOperationError both read from the node they are given, so
// this has to be shaped like a real one.
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
	credentials?: Record<string, unknown> | null;
	parameters?: Record<string, unknown>;
	webhookUrl?: string;
	staticData?: Record<string, unknown>;
	bodyData?: unknown;
	request?: (...args: any[]) => unknown;
}

// The node code is always invoked via .call(context, ...), so a plain object with
// the members actually used is enough — no need to satisfy all of IHookFunctions.
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

export type TestContext = ReturnType<typeof createContext>;

export function silenceConsole() {
	const log = vi.spyOn(console, 'log').mockImplementation(() => {});
	const error = vi.spyOn(console, 'error').mockImplementation(() => {});
	return () => {
		log.mockRestore();
		error.mockRestore();
	};
}

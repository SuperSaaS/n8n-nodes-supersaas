import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';
import { SuperSaaSTrigger } from '../nodes/SuperSaaS/SuperSaaSTrigger.node';
import { createContext, silenceConsole } from './helpers';

const node = new SuperSaaSTrigger();
const { getSchedules } = node.methods.loadOptions;
const { checkExists, create, delete: deleteHook } = node.webhookMethods.default;

describe('description', () => {
	it('declares a single main output', () => {
		// Guards the regression where NodeConnectionType was used as a value after
		// n8n-workflow turned it into a type-only alias.
		expect(node.description.outputs).toEqual([NodeConnectionTypes.Main]);
		expect(node.description.outputs).toEqual(['main']);
	});

	it('is a trigger node with no inputs', () => {
		expect(node.description.group).toEqual(['trigger']);
		expect(node.description.inputs).toEqual([]);
	});

	it('requires the superSaaSApi credential', () => {
		expect(node.description.credentials).toEqual([{ name: 'superSaaSApi', required: true }]);
	});

	it('registers a POST webhook that responds on receive', () => {
		expect(node.description.webhooks).toEqual([
			{ name: 'default', httpMethod: 'POST', responseMode: 'onReceived', path: 'webhook' },
		]);
	});

	it('exposes the event codes the SuperSaaS API accepts', () => {
		const events = node.description.properties.find((p) => p.name === 'events');
		const values = (events?.options ?? []).map((o) => (o as { value: string }).value);

		expect(values.sort()).toEqual(['C', 'F', 'H', 'M', 'N', 'O', 'P', 'R', 'S', 'U']);
		expect(events?.default).toBe('U');
	});
});

describe('loadOptions.getSchedules', () => {
	it.each(['U', 'M', 'H', 'P'])(
		'returns the account itself for account-level event %s',
		async (event) => {
			const ctx = createContext({ parameters: { events: event } });

			await expect(getSchedules.call(ctx as any)).resolves.toEqual([
				{ name: 'Account', value: 'acme' },
			]);
			expect(ctx.helpers.request).not.toHaveBeenCalled();
		},
	);

	it.each(['N', 'C', 'R', 'F'])('lists schedules for appointment event %s', async (event) => {
		const ctx = createContext({
			parameters: { events: event },
			request: vi.fn().mockResolvedValue(
				JSON.stringify([
					{ id: '1', name: 'Tennis court' },
					{ id: '2', name: 'Meeting room' },
				]),
			),
		});

		await expect(getSchedules.call(ctx as any)).resolves.toEqual([
			{ name: 'Schedule: Tennis court', value: '1' },
			{ name: 'Schedule: Meeting room', value: '2' },
		]);
		expect(ctx.helpers.request).toHaveBeenCalledWith(
			expect.objectContaining({
				url: expect.stringContaining('/api/schedules.json'),
			}),
		);
	});

	it.each(['S', 'O'])('lists super forms for form event %s', async (event) => {
		const ctx = createContext({
			parameters: { events: event },
			request: vi.fn().mockResolvedValue(JSON.stringify([{ id: '7', name: 'Signup' }])),
		});

		await expect(getSchedules.call(ctx as any)).resolves.toEqual([
			{ name: 'Form: Signup', value: '7' },
		]);
		expect(ctx.helpers.request).toHaveBeenCalledWith(
			expect.objectContaining({
				url: expect.stringContaining('/api/super_forms.json'),
			}),
		);
	});

	it('returns no options for an unknown event code', async () => {
		const ctx = createContext({ parameters: { events: 'Z' } });

		await expect(getSchedules.call(ctx as any)).resolves.toEqual([]);
		expect(ctx.helpers.request).not.toHaveBeenCalled();
	});
});

describe('webhookMethods.default.checkExists', () => {
	const parameters = { events: 'N', schedule: '42' };
	const webhookUrl = 'http://localhost:5678/webhook/abc';

	it('finds a hook matching url, trigger and parent', async () => {
		const ctx = createContext({
			parameters,
			webhookUrl,
			request: vi
				.fn()
				.mockResolvedValue(
					JSON.stringify([{ url: webhookUrl, trigger: 'N', parent_id: '42' }]),
				),
		});

		await expect(checkExists.call(ctx as any)).resolves.toBe(true);
	});

	it('ignores a hook pointing at a different url', async () => {
		const ctx = createContext({
			parameters,
			webhookUrl,
			request: vi
				.fn()
				.mockResolvedValue(
					JSON.stringify([{ url: 'https://elsewhere.test/hook', trigger: 'N', parent_id: '42' }]),
				),
		});

		await expect(checkExists.call(ctx as any)).resolves.toBe(false);
	});

	it('ignores a hook registered for a different event', async () => {
		const ctx = createContext({
			parameters,
			webhookUrl,
			request: vi
				.fn()
				.mockResolvedValue(JSON.stringify([{ url: webhookUrl, trigger: 'C', parent_id: '42' }])),
		});

		await expect(checkExists.call(ctx as any)).resolves.toBe(false);
	});

	it('returns false when the account has no hooks at all', async () => {
		const ctx = createContext({ parameters, webhookUrl, request: vi.fn().mockResolvedValue('[]') });

		await expect(checkExists.call(ctx as any)).resolves.toBe(false);
	});
});

describe('webhookMethods.default.create', () => {
	let restoreConsole: () => void;

	beforeEach(() => {
		restoreConsole = silenceConsole();
	});
	afterEach(() => restoreConsole());

	it('registers the hook and reports success', async () => {
		const ctx = createContext({
			parameters: { events: 'N', schedule: '42' },
			request: vi.fn().mockResolvedValue(JSON.stringify({ id: 123 })),
		});

		await expect(create.call(ctx as any)).resolves.toBe(true);
		expect(ctx.helpers.request).toHaveBeenCalledWith(
			expect.objectContaining({
				method: 'POST',
				body: {
					parent_id: '42',
					event: 'N',
					target_url: 'http://localhost:5678/webhook/abc',
				},
			}),
		);
	});

	it('accepts an already-parsed object response', async () => {
		const ctx = createContext({
			parameters: { events: 'N', schedule: '42' },
			request: vi.fn().mockResolvedValue({ id: 123 }),
		});

		await expect(create.call(ctx as any)).resolves.toBe(true);
	});

	it('refuses to create a hook without a parent ID', async () => {
		const ctx = createContext({ parameters: { events: 'N', schedule: '' } });

		await expect(create.call(ctx as any)).rejects.toThrow(NodeOperationError);
		expect(ctx.helpers.request).not.toHaveBeenCalled();
	});

	it('swaps the localhost prefix for the tunnel URL when ngrok is configured', async () => {
		const ctx = createContext({
			credentials: { account: 'acme', api_key: 'secret-key', ngrok: 'https://abc123.ngrok.io' },
			parameters: { events: 'N', schedule: '42' },
			webhookUrl: 'http://localhost:5678/webhook/abc',
			request: vi.fn().mockResolvedValue(JSON.stringify({ id: 123 })),
		});

		await create.call(ctx as any);

		expect(ctx.helpers.request).toHaveBeenCalledWith(
			expect.objectContaining({
				body: expect.objectContaining({
					target_url: 'https://abc123.ngrok.io/webhook/abc',
				}),
			}),
		);
	});

	it('leaves a non-localhost webhook URL alone', async () => {
		const ctx = createContext({
			credentials: { account: 'acme', api_key: 'secret-key', ngrok: 'https://abc123.ngrok.io' },
			parameters: { events: 'N', schedule: '42' },
			webhookUrl: 'https://n8n.example.test/webhook/abc',
			request: vi.fn().mockResolvedValue(JSON.stringify({ id: 123 })),
		});

		await create.call(ctx as any);

		expect(ctx.helpers.request).toHaveBeenCalledWith(
			expect.objectContaining({
				body: expect.objectContaining({
					target_url: 'https://n8n.example.test/webhook/abc',
				}),
			}),
		);
	});

	it('fails when the API response carries no hook id', async () => {
		const ctx = createContext({
			parameters: { events: 'N', schedule: '42' },
			request: vi.fn().mockResolvedValue(JSON.stringify({ status: 'ok' })),
		});

		await expect(create.call(ctx as any)).rejects.toThrow('Invalid response from webhook creation');
	});

	it('propagates an API failure', async () => {
		const ctx = createContext({
			parameters: { events: 'N', schedule: '42' },
			request: vi.fn().mockRejectedValue(new Error('boom')),
		});

		await expect(create.call(ctx as any)).rejects.toThrow();
	});
});

describe('webhookMethods.default.delete', () => {
	it('removes the hook and clears the stored ids', async () => {
		const staticData: Record<string, unknown> = { webhookID: 'hook-7', webhookParentID: '42' };
		const ctx = createContext({ staticData, request: vi.fn().mockResolvedValue('') });

		await expect(deleteHook.call(ctx as any)).resolves.toBe(true);
		expect(ctx.helpers.request).toHaveBeenCalledWith(
			expect.objectContaining({
				method: 'DELETE',
				body: { parent_id: '42', id: 'hook-7' },
			}),
		);
		expect(staticData).toEqual({});
	});

	it('reports failure when the API rejects the delete', async () => {
		const staticData: Record<string, unknown> = { webhookID: 'hook-7', webhookParentID: '42' };
		const ctx = createContext({
			staticData,
			request: vi.fn().mockRejectedValue(new Error('gone')),
		});

		await expect(deleteHook.call(ctx as any)).resolves.toBe(false);
		expect(staticData).toEqual({ webhookID: 'hook-7', webhookParentID: '42' });
	});

	// NOTE: this documents current behaviour, and it is a bug. `create` never writes
	// webhookID/webhookParentID into the workflow's static data, so in a real workflow
	// this branch is always the one taken and hooks are never removed from SuperSaaS.
	// See the "known gap" note in the test suite README before changing this.
	it('does nothing when no hook id was stored', async () => {
		const ctx = createContext({ staticData: {} });

		await expect(deleteHook.call(ctx as any)).resolves.toBe(false);
		expect(ctx.helpers.request).not.toHaveBeenCalled();
	});
});

describe('webhook', () => {
	it('passes the received body through as workflow data', async () => {
		const bodyData = { event: 'N', appointment_id: 5 };
		const ctx = createContext({ bodyData });

		await expect(node.webhook.call(ctx as any)).resolves.toEqual({
			workflowData: [[{ json: bodyData }]],
		});
	});
});

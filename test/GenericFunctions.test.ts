import { describe, expect, it, vi } from 'vitest';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';
import { getAccount, superSaaSApiRequest } from '../nodes/SuperSaaS/GenericFunctions';
import { createContext } from './helpers';

describe('getAccount', () => {
	it('returns the account from the credentials', async () => {
		const ctx = createContext();

		await expect(getAccount.call(ctx as any)).resolves.toBe('acme');
		expect(ctx.getCredentials).toHaveBeenCalledWith('superSaaSApi');
	});

	it('throws when no credentials are available', async () => {
		const ctx = createContext({ credentials: null });

		await expect(getAccount.call(ctx as any)).rejects.toThrow(NodeOperationError);
	});

	it('throws when the account is missing from the credentials', async () => {
		const ctx = createContext({ credentials: { api_key: 'secret-key' } });

		await expect(getAccount.call(ctx as any)).rejects.toThrow(NodeOperationError);
	});
});

describe('superSaaSApiRequest', () => {
	describe('credential validation', () => {
		it.each([
			['no credentials', null],
			['missing api_key', { account: 'acme' }],
			['missing account', { api_key: 'secret-key' }],
		])('throws on %s', async (_label, credentials) => {
			const ctx = createContext({ credentials });

			await expect(
				superSaaSApiRequest.call(ctx as any, 'GET', '/api/hooks'),
			).rejects.toThrow(NodeOperationError);

			expect(ctx.helpers.request).not.toHaveBeenCalled();
		});
	});

	it('builds the URL from the endpoint, account and api key', async () => {
		const ctx = createContext({ request: vi.fn().mockResolvedValue('[]') });

		await superSaaSApiRequest.call(ctx as any, 'GET', '/api/schedules.json');

		expect(ctx.helpers.request).toHaveBeenCalledWith(
			expect.objectContaining({
				url: 'https://www.supersaas.com/api/schedules.json?account=acme&api_key=secret-key',
				method: 'GET',
				headers: {
					Accept: 'application/json',
					'Content-Type': 'application/json',
				},
			}),
		);
	});

	it('sends no body for a plain GET', async () => {
		const ctx = createContext();

		await superSaaSApiRequest.call(ctx as any, 'GET', '/api/hooks');

		expect(ctx.helpers.request).toHaveBeenCalledWith(expect.objectContaining({ body: null }));
	});

	it('sends parent_id, event and target_url when creating a hook', async () => {
		const ctx = createContext({ request: vi.fn().mockResolvedValue('{"id":1}') });

		await superSaaSApiRequest.call(
			ctx as any,
			'POST',
			'/api/hooks',
			'42',
			'N',
			'https://example.test/webhook',
		);

		expect(ctx.helpers.request).toHaveBeenCalledWith(
			expect.objectContaining({
				method: 'POST',
				body: {
					parent_id: '42',
					event: 'N',
					target_url: 'https://example.test/webhook',
				},
			}),
		);
	});

	it('sends parent_id and id when deleting a hook', async () => {
		const ctx = createContext();

		await superSaaSApiRequest.call(
			ctx as any,
			'DELETE',
			'/api/hooks',
			'42',
			null,
			null,
			'hook-7',
		);

		expect(ctx.helpers.request).toHaveBeenCalledWith(
			expect.objectContaining({
				method: 'DELETE',
				body: { parent_id: '42', id: 'hook-7' },
			}),
		);
	});

	it('returns the raw response untouched', async () => {
		const ctx = createContext({ request: vi.fn().mockResolvedValue('{"id":99}') });

		await expect(
			superSaaSApiRequest.call(ctx as any, 'GET', '/api/hooks'),
		).resolves.toBe('{"id":99}');
	});

	it('wraps a failing request in a NodeApiError', async () => {
		const ctx = createContext({
			request: vi.fn().mockRejectedValue({ response: { status: 401, data: 'Unauthorized' } }),
		});

		await expect(
			superSaaSApiRequest.call(ctx as any, 'GET', '/api/hooks'),
		).rejects.toThrow(NodeApiError);
	});

	it('wraps a non-axios failure in a NodeApiError too', async () => {
		const ctx = createContext({ request: vi.fn().mockRejectedValue(new Error('socket hang up')) });

		await expect(
			superSaaSApiRequest.call(ctx as any, 'GET', '/api/hooks'),
		).rejects.toThrow(NodeApiError);
	});
});

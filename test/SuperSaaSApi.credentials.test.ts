import { describe, expect, it } from 'vitest';
import { SuperSaaSApi } from '../credentials/SuperSaaSApi.credentials';

const credentials = new SuperSaaSApi();

describe('SuperSaaSApi credentials', () => {
	it('uses the name the node refers to', () => {
		expect(credentials.name).toBe('superSaaSApi');
		expect(credentials.displayName).toBe('SuperSaaS API');
	});

	it('declares the account, api key and tunnel fields', () => {
		expect(credentials.properties.map((p) => p.name)).toEqual(['account', 'api_key', 'ngrok']);
	});

	it('masks the api key in the UI', () => {
		const apiKey = credentials.properties.find((p) => p.name === 'api_key');

		expect(apiKey?.typeOptions?.password).toBe(true);
	});

	it('does not mask or prefill the non-secret fields', () => {
		for (const name of ['account', 'ngrok']) {
			const property = credentials.properties.find((p) => p.name === name);

			expect(property?.default).toBe('');
			expect(property?.typeOptions?.password).toBeUndefined();
		}
	});

	it('tests the credential against the ping endpoint', () => {
		expect(credentials.test.request).toMatchObject({
			baseURL: 'https://www.supersaas.com',
			url: '/api/ping',
			method: 'GET',
		});
	});

	it('sends the account as a query param and the api key as a bearer token', () => {
		const { qs, headers } = credentials.test.request;

		expect(qs).toEqual({ account: '={{$credentials.account}}' });
		expect(headers).toEqual({ Authorization: '=Bearer {{$credentials.api_key}}' });
	});
});

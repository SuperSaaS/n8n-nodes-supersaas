import {
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class SuperSaaSApi implements ICredentialType {
	name = 'superSaaSApi';
	displayName = 'SuperSaaS API';
	properties: INodeProperties[] = [
		{
			displayName: 'Account',
			name: 'account',
			type: 'string',
			default: '',
		},
		{
			displayName: 'API key',
			name: 'api_key',
			type: 'string',
			typeOptions: { password: true },
			default: '',
		},
		{
			displayName: 'Testing tunnel (ngrok...)',
			name: 'ngrok',
			type: 'string',
			default: '',
		}
	];
	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://www.supersaas.com',
			url: '/api/ping',
				method: 'GET',
				qs: {
					account: '={{$credentials.account}}',
				},
				headers: {
					Authorization: '=Bearer {{$credentials.api_key}}',
				},
		},
	};
}

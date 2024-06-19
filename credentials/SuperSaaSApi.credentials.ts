import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

//const BASE_URL = 'https://www.supersaas.com';
//const BASE_URL = 'https://05df-89-205-225-51.ngrok-free.app';
const BASE_URL = 'http://localhost:3000'


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
		}
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			qs: {
				account: '={{$credentials.account}}',
				api_key: '={{$credentials.api_key}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
				baseURL: BASE_URL,
				url: '/api/ping',
				method: 'GET',
				// qs: {
				// 	account: '={{$credentials.account}}',
				// },
				headers: {
					Authorization: '=Bearer {{$credentials.api_key}}',
				},
		},
	};
}

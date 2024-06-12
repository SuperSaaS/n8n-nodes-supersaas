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
			displayName: 'Password',
			name: 'password',
			type: 'string',
			typeOptions: { password: true },
			default: '',
		}
	];

	test: ICredentialTestRequest = {
		request: {
				baseURL: 'https://www.supersaas.com',
				url: '/api/schedules.json',
				method: 'GET',
				qs: {
					account: '={{$credentials.account}}',
					password: '={{$credentials.password}}',
				},
		},
	};
}

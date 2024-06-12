import {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	NodeOperationError,
	INodeTypeDescription,
} from 'n8n-workflow';

//const DEBUG = false
const BASE_URL = 'https://www.supersaas.com';

export class SuperSaaS implements INodeType {

	description: INodeTypeDescription = {
		displayName: 'SuperSaaS',
		name: 'superSaaS',
		icon: 'file:superSaaS.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{ $parameter["operation"] + ": " + $parameter["resource"] }}',
		description: 'Consume SuperSaaS API',
		defaults: {
			name: 'SuperSaaS',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'superSaaSApi',
				required: true,
			},
		],
		requestDefaults: {
			baseURL: 'https://www.supersaas.com',
		},
		properties: [
			{
				displayName: 'WebhookURL',
				name: 'target_base',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'https://your-webhook-url.com',
				description: 'The URL of your n8n',
			},
			{
				displayName: 'WebhookName',
				name: 'target_end',
				type: 'string',
				required: true,
				default: 'supersaas',
				placeholder: 'supersaas',
				description: 'Your webhook name',
			},
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				options: [
					{
						name: 'Changed Appointment',
						value: 'C',
					},
					{
						name: 'Changed Credit',
						value: 'P',
					},
					{
						name: 'Changed Form',
						value: 'O',
					},
					{
						name: 'Changed User',
						value: 'M',
					},
					{
						name: 'New Appointment',
						value: 'N',
					},
					{
						name: 'New Form',
						value: 'S',
					},
					{
						name: 'New User',
						value: 'U',
					},
					{
						name: 'Send Mail',
						value: 'H',
					},
					{
						name: 'Sent Follow-Up',
						value: 'F',
					},
					{
						name: 'Sent Reminder',
						value: 'R',
					},
				],
				default: 'U',
				description: 'Event for webhook',
			},
			{
				// eslint-disable-next-line n8n-nodes-base/node-param-display-name-wrong-for-dynamic-options
				displayName: 'Parent ID',
				name: 'schedule',
				type: 'options',
				// eslint-disable-next-line n8n-nodes-base/node-param-default-wrong-for-options
				default: [],
				typeOptions: {
					loadOptionsDependsOn: ['event'],
					loadOptionsMethod: 'getSchedules',
				},
				// eslint-disable-next-line n8n-nodes-base/node-param-description-wrong-for-dynamic-options
				description: 'Account, Schedule, FormID',
			},
		],
	};

	methods = {
		loadOptions: {
			async getSchedules(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const credentials = await this.getCredentials('superSaaSApi');
				const event = this.getNodeParameter('event', 0) as string;

				if (!credentials || !credentials.password || !credentials.account || !credentials.account_id) {
					throw new NodeOperationError(this.getNode(), "Invalid credentials.");
				}

				let options: INodePropertyOptions[] = []

				if (event === 'U' || event === 'M' || event === 'H' || event === 'P') {

					options.push({
						name: "Account",
						value: credentials.account as string,
					})

				} else if (event === 'N' || event === 'C' || event === 'R' || event === 'F') {
					let url = `${BASE_URL}/api/schedules.json?password=${credentials.password}&account=${credentials.account}`

					let responseData = await this.helpers.request({
						url: url,
						method: 'GET',
						headers: {
							'Accept': 'application/json',
							'Content-Type': 'application/json',
						},
					});


					let responseJSON = JSON.parse(responseData)
					for (const item of responseJSON) {
						const itemName = item["name"] as string;
						const itemID = item["id"] as string;
						options.push({
							name: "Schedule: " + itemName,
							value: itemID,
						}
					);}

				} else if (event === 'S' || event === 'O') {

					let url = `${BASE_URL}/api/super_forms.json?password=${credentials.password}&account=${credentials.account}`

					let responseData = await this.helpers.request({
						url: url,
						method: 'GET',
						headers: {
							'Accept': 'application/json',
							'Content-Type': 'application/json',
						},
					});

					let responseJSON = JSON.parse(responseData)
					for (const item of responseJSON) {
						const itemName = item["name"] as string;
						const itemID = item["id"] as string;
						options.push({
							name: "Form: " + itemName,
							value: itemID,
						}
					);}
				} else {
					console.log("EVENT EITHER SUPERFORMS or SCHEDULE")
				}

				return options;
			},
		}
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {

		let mode = this.getMode();

		if (mode === 'manual') {
			const targetBase = this.getNodeParameter('target_base', 0) as string;
			const targetEnd = this.getNodeParameter('target_end', 0) as string;
			const parentId = this.getNodeParameter('schedule', 0) as string;
			const event = this.getNodeParameter('event', 0) as string;
			const credentials = await this.getCredentials('superSaaSApi');
			console.log(targetBase, targetEnd, parentId, event)

			if (!credentials || !credentials.password || !credentials.account) {
				throw new NodeOperationError(this.getNode(), "Invalid credentials.");
			}
			let url = `${BASE_URL}/api/hooks?password=${credentials.password}&account=${credentials.account}`

			let responseData = await this.helpers.request({
				url: url,
				method: 'POST',
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json',
					},
				body: {
					parent_id: parentId,
					event: event,
					target_url: targetBase + '/' + targetEnd
				}
			});

			if (responseData){
				return [this.helpers.returnJsonArray({json: {status: 'OK',},}),];
			}
		}

		return [this.helpers.returnJsonArray([])];
	}
}

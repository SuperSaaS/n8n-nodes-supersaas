import {
	IHookFunctions,
	ILoadOptionsFunctions,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription, IWebhookFunctions, IWebhookResponseData,

} from 'n8n-workflow';

import {getAccount, superSaaSApiRequest} from './GenericFunctions';

export class SuperSaaSTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'SuperSaaS Trigger',
		name: 'superSaaSTrigger',
		icon: 'file:superSaaS.svg',
		group: ['trigger'],
		version: 1,
		subtitle: '={{ $parameter["operation"] + ": " + $parameter["resource"] }}',
		description: 'SuperSaaS trigger',
		defaults: {
			name: 'SuperSaaS Trigger',
		},
		inputs: [],
		outputs: ['main'],
		credentials: [
			{
				name: 'superSaaSApi',
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Event (Gets Parent ID)',
				name: 'events',
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
				description: 'Select Event',
				required: true,
			},
			{
				// eslint-disable-next-line n8n-nodes-base/node-param-display-name-wrong-for-dynamic-options
				displayName: 'Parent ID',
				name: 'schedule',
				type: 'options',
				// eslint-disable-next-line n8n-nodes-base/node-param-default-wrong-for-options
				default: [],
				typeOptions: {
					loadOptionsDependsOn: ['events'],
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
				const event = this.getNodeParameter('events', 0) as string;
				let optionsRet: INodePropertyOptions[] = []

				if (event === 'U' || event === 'M' || event === 'H' || event === 'P') {
					let account = await getAccount.call(this);
					optionsRet.push({
						name: "Account",
						value: account
					})
				} else if (event === 'N' || event === 'C' || event === 'R' || event === 'F') {
					let responseData = await superSaaSApiRequest.call(this, 'GET', '/api/schedules.json');
					let responseJSON = JSON.parse(responseData)
					for (const item of responseJSON) {
						const itemName = item["name"] as string;
						const itemID = item["id"] as string;
						optionsRet.push({
							name: "Schedule: " + itemName,
							value: itemID,
						}
					);}
				} else if (event === 'S' || event === 'O') {
					let responseData = await superSaaSApiRequest.call(this, 'GET', '/api/super_forms.json');
					let responseJSON = JSON.parse(responseData)
					for (const item of responseJSON) {
						const itemName = item["name"] as string;
						const itemID = item["id"] as string;
						optionsRet.push({
							name: "Form: " + itemName,
							value: itemID,
						}
					);}
				}

				return optionsRet;
			},
		}
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default');
				const event = this.getNodeParameter('events') as string;
				let parentID = this.getNodeParameter('schedule') as string;
				let responseData = await superSaaSApiRequest.call(this, 'GET', '/api/hooks');
				let responseJSON = JSON.parse(responseData)
				for (const webhook of responseJSON) {
					if (webhook.url === webhookUrl && webhook.trigger === event && webhook.parent_id === parentID) {
						return true;
					}
				}

				return false;
			},
			async create(this: IHookFunctions): Promise<boolean> {
				const webhookUrl: string | undefined = this.getNodeWebhookUrl('default');
				const event = this.getNodeParameter('events') as string;
				const parentID = this.getNodeParameter('schedule') as string;
				const webhookData = this.getWorkflowStaticData('node');
				let responseData = await superSaaSApiRequest.call(this, 'POST', '/api/hooks', parentID, event, webhookUrl);
				let responseJSON = JSON.parse(responseData)

				if (!responseJSON || responseJSON.id === undefined || responseJSON.parent_id === undefined) {
					return false;
				}

				webhookData.webhookID = responseJSON.id;
				webhookData.webhookParentID = responseJSON.parent_id;
				return true;
			},
			async delete(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				if (webhookData.webhookID === undefined || webhookData.webhookParentID === undefined) {
					return false
				}

				try {
					await superSaaSApiRequest.call(this, 'DELETE', '/api/hooks', webhookData.webhookParentID as string, null, null,webhookData.webhookID as string);
				} catch (error) {
					return false;
				}

				delete webhookData.webhookID
				delete webhookData.webhookParentID
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const bodyData = this.getBodyData();
		return {
			workflowData: [this.helpers.returnJsonArray(bodyData)],
		};
	}
}

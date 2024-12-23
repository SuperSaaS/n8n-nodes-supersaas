import {
	IHookFunctions,
	ILoadOptionsFunctions,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
	NodeOperationError,
} from 'n8n-workflow';
import { NodeConnectionType } from 'n8n-workflow';
import {getAccount, superSaaSApiRequest} from './GenericFunctions';


// const NGROK = "" // set this and ngrok if you want to test


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
		outputs: [NodeConnectionType.Main],
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
				displayName: 'Event (gets parent ID)',
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

				displayName: 'Parent ID',
				name: 'schedule',
				type: 'options',

				default: [],
				typeOptions: {
					loadOptionsDependsOn: ['events'],
					loadOptionsMethod: 'getSchedules',
				},

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
				let webhookUrl = this.getNodeWebhookUrl('default');


				const event = this.getNodeParameter('events') as string;
				const parentId = this.getNodeParameter('schedule') as string;

				// Validate parent ID
				if (!parentId) {
					throw new NodeOperationError(this.getNode(), 'Parent ID is required');
				}

				const webhookData = this.getWorkflowStaticData('node');

				const NGROK = "https://8bf8-81-59-3-222.ngrok-free.app"

				//webhookUrl = NGROK

				webhookUrl = (webhookUrl as String).replace(
					'http://localhost:5678',
					NGROK
			);


				try {
					console.log('Creating webhook with:', {
						webhookUrl,
						event,
						parentId,
						account: (await this.getCredentials('superSaaSApi')).account,
					});

					const responseData = await superSaaSApiRequest.call(
						this,
						'POST',
						'/api/hooks',
						parentId,
						event,
						webhookUrl
					);

					const response = typeof responseData === 'string' ? JSON.parse(responseData) : responseData;

					if (!response || !response.id) {
						throw new Error('Invalid response from webhook creation');
					}

					webhookData.webhookID = response.id;
					webhookData.webhookParentID = parentId;
					return true;
				} catch (error) {
					console.error('Failed to create webhook:', {
						error,
						credentials: await this.getCredentials('superSaaSApi'),
						params: {
							webhookUrl,
							event,
							parentId,
						}
					});
					throw error;
				}
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

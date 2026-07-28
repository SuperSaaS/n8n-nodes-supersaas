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
import { NodeConnectionTypes } from 'n8n-workflow';
import {getAccount, getRegisteredWebhookUrl, superSaaSApiRequest} from './GenericFunctions';

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
		outputs: [NodeConnectionTypes.Main],
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
						// The API returns numeric ids. `as string` would only silence the
						// compiler; the value has to actually be converted, otherwise the
						// number ends up as the parameter value and checkExists misses it.
						const itemID = String(item["id"]);
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
						const itemID = String(item["id"]);
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
				const webhookUrl = await getRegisteredWebhookUrl.call(this);
				const event = this.getNodeParameter('events') as string;
				const parentID = String(this.getNodeParameter('schedule'));
				let responseData = await superSaaSApiRequest.call(this, 'GET', '/api/hooks');
				let responseJSON = JSON.parse(responseData)
				for (const webhook of responseJSON) {
					if (webhook.url === webhookUrl && webhook.trigger === event && String(webhook.parent_id) === parentID) {
						return true;
					}
				}

				return false;
			},
			async create(this: IHookFunctions): Promise<boolean> {
				const event = this.getNodeParameter('events') as string;
				// The 'schedule' parameter defaults to [], so convert before testing it:
				// `[] as string` is truthy and would pass the guard below.
				const parentId = String(this.getNodeParameter('schedule') ?? '');

				// Validate parent ID
				if (!parentId) {
					throw new NodeOperationError(this.getNode(), 'Parent ID is required');
				}

				const webhookUrl = await getRegisteredWebhookUrl.call(this);

				try {
					const creds = await this.getCredentials('superSaaSApi')

					console.log('Creating webhook with:', {
						webhookUrl,
						event,
						parentId,
						account: creds.account,
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

					// delete() reads these back to remove the hook again; without them the
					// hook stays registered at SuperSaaS forever.
					const webhookData = this.getWorkflowStaticData('node');
					webhookData.webhookID = String(response.id);
					webhookData.webhookParentID = parentId;

					return true;
				} catch (error) {
					console.error('Failed to create webhook, check API key:', {
						error,
						account: (await this.getCredentials('superSaaSApi')).account,
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

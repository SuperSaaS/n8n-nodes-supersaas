import type {
	IExecuteFunctions,
	IHookFunctions,
	ILoadOptionsFunctions,
	JsonObject,
	IHttpRequestMethods,
} from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';

export async function getAccount(this: IHookFunctions | IExecuteFunctions | ILoadOptionsFunctions,): Promise<string> {
	const credentials = await this.getCredentials('superSaaSApi');
	if (!credentials || !credentials.account) {
		throw new NodeOperationError(this.getNode(), "Invalid credentials.");
	}

	return credentials.account as string
}

interface RequestBody {
	parent_id: string;
	event?: string;
	target_url?: string;
	id?: string;
}
export async function superSaaSApiRequest(
	this: IHookFunctions | IExecuteFunctions | ILoadOptionsFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	parentId?: string | null,
	event?: string | null,
	target?: string | null,
	id?: string | null,
): Promise<any> {
	const credentials = await this.getCredentials('superSaaSApi');
	if (!credentials || !credentials.api_key || !credentials.account) {
		throw new NodeOperationError(this.getNode(), "Invalid credentials.");
	}

	let requestBody: RequestBody | null = null;
	if (parentId) {
		requestBody = { parent_id: parentId };
		if (event && target) {
			requestBody.event = event;
			requestBody.target_url = target;
		} else if (id) {
			requestBody.id = id;
		}
	}

	try {
		return await this.helpers.request({
			url: 'https://www.supersaas.com' + endpoint + '?account=' + credentials.account + '&api_key=' + credentials.api_key,
			method: method,
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json',
			},
			...(requestBody && { body: requestBody })
		});
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject);
	}
}

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
  event?: string | null;
  target_url?: string | null;
  id?: string | null;
}

export async function superSaaSApiRequest(
	this: IHookFunctions | IExecuteFunctions | ILoadOptionsFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	parentId?: string | null,
	event?: string | null,
	target_url?: string | null,
	id?: string | null,
): Promise<any> {
	const credentials = await this.getCredentials('superSaaSApi');

	if (!credentials || !credentials.api_key || !credentials.account) {
		throw new NodeOperationError(this.getNode(), "Invalid credentials.");
	}

	let body: RequestBody | null = null;

	if (method === 'POST' && parentId) {
    body = {
      parent_id: parentId,
			event,
      target_url
    };
  } else if (method === 'DELETE' && endpoint === '/api/hooks' && id) {
    body = {
      parent_id: parentId as string,
      id: id,
    };
  }

	try {
    const response = await this.helpers.request({
      url: `https://www.supersaas.com${endpoint}?account=${credentials.account}&api_key=${credentials.api_key}`,
      method,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body,
    });

    return response;
  } catch (error) {
		console.error('API Error:', {
      status: error.response?.status,
      data: error.response?.data,
      body: body,
    });
    throw new NodeApiError(this.getNode(), error as JsonObject);
  }
}

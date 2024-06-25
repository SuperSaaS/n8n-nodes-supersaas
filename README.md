# n8n-nodes-supersaas

This is an n8n community node. It lets you use SuperSaaS webhooks in your n8n workflows. It creates configures webhooks in the SuperSaaS backend then you can receive information.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)  
[Operations](#operations)  
[Credentials](#credentials)
[Usage](#usage)
[Resources](#resources)  
[Version history](#version-history) 

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation. You can go to the settings and from there install community nodes.

## Operations

This module creates automatically webhooks for SuperSaaS with your credentials.

## Credentials

Use your account name, and API key [from SuperSaaS dashboard](https://www.supersaas.com/accounts/edit). Once you have done that you can start creating the webhooks.

## Usage

After the credentials are set for self hosted n8n installation and setup is beyond the scope of this tutorial, but you could try out [ngrok](https://ngrok.com) for testing.

Now you can set which kind of event you wish to receive notifications about. The module will fetch and populate the Parent ID drop down menu. The different types of events are tied to either your account, schedule or a form check [webhooks](https://www.supersaas.com/info/dev/webhooks).

If you don't have forms then the Parent ID list will be empty.

Once you have checked all the necessary information is correct, you can press Test Step, and if successful it will say OK. You can also check on your SuperSaaS dashboard that a webhook has been created.

## Testing locally

You can use the build bash command to build locally. You can check more information on how to [hosting n8n](https://docs.n8n.io/hosting/).
NOTE: localhost:5678 does not work as an URL for SuperSaaS.

## Resources

* [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
* [SuperSaaS webhooks](https://www.supersaas.com/info/doc/integration/webhooks)

## Version history

Version 0.1.3

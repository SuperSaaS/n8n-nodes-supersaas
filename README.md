# n8n-nodes-supersaas

This is an n8n community node. It lets you use SuperSaaS webhooks in your n8n workflows. It creates configures webhooks in the SuperSaaS backend then you can receive information.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)  
[Operations](#operations)  
[Credentials](#credentials)  <!-- delete if no auth needed -->  
[Usage](#usage)  <!-- delete if not using this section -->  
[Resources](#resources)  
[Version history](#version-history)  <!-- delete if not using this section -->  

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Operations

This module creates automatically webhooks for SuperSaaS with your credentials.

## Credentials

Use your account name, and password. Once you have done that you can start creating the webhooks.

<img width="376" alt="Screenshot 2024-06-13 at 10 08 49" src="https://github.com/SuperSaaS/n8n-nodes-supersaas/assets/13538400/bce10ea7-f113-4129-9330-ddf9a2ea69f1">

## Usage

After the credentials are
 set it is time to fill in the base address where the n8n is hosted at (not localhost unless you are testing). Hosting n8n and setting up a URL for this is beyond the scope of this tutorial, but you could try out [ngrok](https://ngrok.com) for testing.

Add a webhook into your canvass. Set the method to POST. Then set the path you want. Copy the path, and then go back to the SuperSaaS module. In the Webhook URL text field enter the base URL that points to your hosted n8n e.g. (https://www.myown-n8n.com without /). Let's say you set your path to 'hello' then in the WebhookName input field you should give 'webhook/hello' (or if testing 'webhook-test/hello'). See the image below.

Now you can set which kind of event you wish to receive notifications about. The module will fetch and populate the Parent ID drop down menu. The different types of events are tied to either your account, schedule or a form check [webhooks](https://www.supersaas.com/info/dev/webhooks).

<img width="380" alt="Screenshot 2024-06-13 at 10 09 18" src="https://github.com/SuperSaaS/n8n-nodes-supersaas/assets/13538400/392fbe54-35ed-4617-83e3-d31c29eac5d4">

If you don't have forms then the Parent ID list will be empty.

Once you have checked all the necessary information is correct, you can press Test Step, and if successful it will say OK. You can also check on your SuperSaaS dashboard that a webhook has been created.

## Testing locally

You can use the build bash command to build locally. You can check more information on how to [hosting n8n](https://docs.n8n.io/hosting/)

## Resources

* [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
* [SuperSaaS webhooks](https://www.supersaas.com/info/doc/integration/webhooks)

## Version history

Version 0.1.1



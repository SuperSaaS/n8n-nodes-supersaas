# Tests

```bash
npm test          # single run
npm run test:watch
```

Vitest, no network. Every test drives the real node code through `createContext()`
from `helpers.ts`, which stubs the slice of the n8n execution context the node
actually uses (`getCredentials`, `getNodeParameter`, `getNodeWebhookUrl`,
`getWorkflowStaticData`, `getBodyData`, `helpers.request`). Nothing is mocked at the
module level, so the assertions exercise the shipped logic rather than a stand-in.

## Layout

| File | Covers |
| --- | --- |
| `GenericFunctions.test.ts` | `getAccount`, `superSaaSApiRequest` — credential validation, URL construction, request bodies per HTTP method, error wrapping |
| `SuperSaaSTrigger.node.test.ts` | node description, `loadOptions.getSchedules`, `webhookMethods.default.{checkExists,create,delete}`, `webhook()` |
| `SuperSaaSApi.credentials.test.ts` | credential name, field list, api-key masking, `test` request shape |

The description tests are deliberately specific about `outputs`. n8n-workflow turned
`NodeConnectionType` from an enum into a type-only alias — using the old name as a
value stopped compiling, and the assertion on `['main']` pins the emitted value so a
future rename cannot silently change the node's output wiring.

## Known gap: hooks are never deleted

`webhookMethods.default.delete` early-returns `false` unless `webhookID` and
`webhookParentID` are present in the workflow's static data. Nothing in this
repository ever writes those keys — `create` returns `true` without recording the id
it just received, and grep confirms the only other references are the `delete`
statements at the end of the same method.

In practice that means deactivating a workflow or removing the node leaves the hook
registered at SuperSaaS. `checkExists` then finds the stale hook on reactivation, so
it is not visible as a duplicate, but hooks accumulate on the account.

`test/SuperSaaSTrigger.node.test.ts` documents this as
`'does nothing when no hook id was stored'`. The other two `delete` tests inject the
static data by hand and prove the removal path itself works — so the fix is
presumably to have `create` persist the id:

```ts
const webhookData = this.getWorkflowStaticData('node');
webhookData.webhookID = response.id;
webhookData.webhookParentID = parentId;
```

That has not been applied here because it changes the webhook lifecycle and should be
verified against the live SuperSaaS API first.

## Not covered

- Real HTTP against `www.supersaas.com`; everything stops at `helpers.request`.
- The node running inside n8n. Use `build.sh` (`npm run build && npm link`) for that.
- `checkExists` compares `webhook.parent_id === parentID` with `===`. The tests feed
  string ids on both sides; if the API returns numeric ids the comparison would fail
  silently and hooks would be recreated on every activation. Worth confirming against
  a real account response.

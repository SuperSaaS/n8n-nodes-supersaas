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
| `GenericFunctions.test.ts` | `getAccount`, `getRegisteredWebhookUrl`, `superSaaSApiRequest` — credential validation, tunnel substitution, URL construction, request bodies per HTTP method, error wrapping |
| `SuperSaaSTrigger.node.test.ts` | node description, `loadOptions.getSchedules`, `webhookMethods.default.{checkExists,create,delete}`, the create→delete round trip, `webhook()` |
| `SuperSaaSApi.credentials.test.ts` | credential name, field list, api-key masking, `test` request shape |

The description tests are deliberately specific about `outputs`. n8n-workflow turned
`NodeConnectionType` from an enum into a type-only alias — using the old name as a
value stopped compiling, and the assertion on `['main']` pins the emitted value so a
future rename cannot silently change the node's output wiring.

## String ids

Several tests feed **numeric** ids where the SuperSaaS API returns numbers
(`/api/schedules.json`, `/api/super_forms.json`, `/api/hooks`). This is not
incidental. `as string` is a compile-time assertion that emits no code, so casting a
number that way leaves a number at runtime and a later `===` against a string fails
silently. The node converts with `String(...)` at the boundaries instead, and these
tests are what stop that regressing — a test feeding string ids cannot tell the two
apart.

## Not covered

- Real HTTP against `www.supersaas.com`; everything stops at `helpers.request`.
- The node running inside n8n. Use `build.sh` (`npm run build && npm link`) for that.
- Whether SuperSaaS accepts the hook id `delete` sends back as a string. The round
  trip is verified against a mock, not the live API.

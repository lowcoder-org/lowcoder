# Native embed SDK

Embed a Lowcoder app directly in your web application's DOM. Your application owns the surrounding page, navigation and host actions; Lowcoder renders the embedded app inside an element you provide.

For communication, build a **module** and define its inputs, outputs, events and methods in the Lowcoder editor. A regular app can also be embedded, but the module interface is the explicit contract for exchanging data with your host. It does not expose arbitrary internal component state.

## Documentation and examples

The source-checked documentation is maintained alongside the browser SDK:

* [Quickstart: plain JavaScript and React](https://sdk.lowcoder.cloud/guide.html)
* [Complete native embedding API reference](https://sdk.lowcoder.cloud/reference.html)
* [CRM, website, ticketing and POS integration recipes](https://sdk.lowcoder.cloud/recipes.html)
* [Live native DOM playground](https://sdk.lowcoder.cloud/#playground)

The reference documents signatures, parameters, defaults, return values, errors, lifecycle behavior and examples for every embedding function. It includes React props, legacy HTML attributes, authentication requirements, shared runtime boundaries and the differences between hosted and npm distributions.

## Plain JavaScript

Publish your app or module, use its application ID, and load the browser SDK once:

```html
<div id="customer-panel" style="min-height: 360px"></div>
<script src="https://sdk.lowcoder.cloud/bundle.js"></script>
<script>
  async function start() {
    const sdk = await LowcoderSDK.ready;
    const app = await sdk.mount('#customer-panel', {
      appId: 'YOUR_PUBLISHED_MODULE_ID',
      moduleInputs: { customerId: 'customer-42' }
    });
    app.on('moduleOutputChange', (output) => console.log(output));
    app.on('moduleEventTriggered', (name) => console.log(name));
  }
  start().catch(console.error);
</script>
```

`LowcoderSDK.ready` waits for the runtime scripts. `mount()` waits for the initial app definition and schedules rendering; components and queries may still be loading. When leaving the host screen, call `await LowcoderSDK.unmount(element)` before removing its element.

## What the host can do

| API | Purpose |
| --- | --- |
| `LowcoderSDK.ready` | Wait for the browser runtime. |
| `LowcoderSDK.mount(target, options)` | Mount into an element or CSS selector and receive an instance. |
| `LowcoderSDK.unmount(target)` | Dispose a browser-managed embed. |
| `LowcoderSDK.scan(root)` | Mount legacy declarative markup beneath a root. |
| `instance.ready` | Wait for initial definition loading and render scheduling in the hosted/current-source SDK. |
| `instance.setModuleInputs(inputs)` | Update named module inputs. |
| `instance.on('moduleOutputChange', handler)` | Receive the complete output object when it changes. |
| `instance.on('moduleEventTriggered', handler)` | Receive a module event's name. |
| `instance.invokeMethod(name, args)` | Invoke a declared module method with positional arguments. |
| `instance.destroy()` | Dispose an instance in the hosted/current-source SDK. |
| `bootstrapAppAt(appId, element, options)` | Mount through the npm package's imperative factory. |
| `LowcoderAppView` | Render an embed using the npm React wrapper. |

Important behavior to design around:

* Each event supports one active handler per instance. Registering another replaces it. The returned function unsubscribes; subscriptions do not replay an initial snapshot.
* Data and Array inputs need JSON serialization. Inputs pass through Lowcoder code controls, including `{{ … }}` expression evaluation; this is not a guaranteed literal-value channel.
* `invokeMethod()` returns `void`, not an awaitable result. Calls before the module root exists are not queued. Model completion and results through module outputs/events.
* Initial `401` responses show the built-in authentication prompt. Mounting successfully is not proof of authorization. Configure backend CORS and cookies for the actual host domain.
* Embeds share runtime configuration, CSS and page-level state. Use one Lowcoder deployment per host page and test the interaction with your own styles and routing.

## React and npm versions

```jsx
import { LowcoderAppView } from 'lowcoder-sdk';
import 'lowcoder-sdk/dist/style.css';

export function CustomerPanel({ customerId }) {
  return (
    <LowcoderAppView
      appId="YOUR_PUBLISHED_MODULE_ID"
      moduleInputs={{ customerId }}
      onModuleOutputChange={(output) => console.log(output)}
      onModuleEventTriggered={(name) => console.log(name)}
    />
  );
}
```

The hosted browser SDK and npm package are separate releases. As verified on **11 October 2026**, published `lowcoder-sdk@3.0.0` does not include instance `ready` or `destroy`, the updated React cleanup, or all current declarations. Its `lowcoder-sdk/appView` export points to a missing file; use the root import above. The current repository source includes changes that have not yet reached that npm artifact.

Check the [distribution compatibility table](https://sdk.lowcoder.cloud/reference.html#versions) before relying on lifecycle behavior. Use a bundler and client-side imports for npm; its ESM output is not the standalone browser loader.

## Scope

The native embedding reference is distinct from the broader package's component builders, editor controls, datasource plugin APIs and re-exported utilities. Those exports are not additional host-to-app control methods. This page replaces the previous guessed export descriptions with verified embedding guidance; undocumented internals should not be treated as a stable embedding contract.

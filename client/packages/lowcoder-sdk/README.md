# lowcoder-sdk

## Usage

yarn:

```bash
yarn add lowcoder-sdk
```

npm:

```bash
npm install lowcoder-sdk
```

## Integrate Lowcoder's app/module into existing app page

1. Publish your app/module in Lowcoder.
2. Set the app/module's access privilege as public.
3. Add code in your existing app as below.

### Import style

```ts
import "lowcoder-sdk/dist/style.css";
```

### For react app:

```ts
import { LowcoderAppView } from "lowcoder-sdk";

<LowcoderAppView appId="{YOUR_APPLICATION_ID}" />;
```

#### LowcoderViewProps

| Name                   | Type                        | Description                                                                             | Default value |
|------------------------|-----------------------------|-----------------------------------------------------------------------------------------|---------------|
| appId                  | string                      | The app's id in Lowcoder. Required!                                                     | --            |
| baseUrl                | string                      | Lowcoder's api base url                                                                 | --            |
| onModuleEventTriggered | (eventName: string) => void | Triggered when module's custom event is triggered. Works only when the app is a module. | --            |
| onModuleOutputChange   | (output: any) => void       | Triggered when module's outputs change. Works only when the app is a module.            | --            |

#### Invoke module methods

```tsx
import { useRef } from "ref";
import { LowcoderAppView } from "lowcoder-sdk";

function MyExistingAppPage() {
  const appRef = useRef();
  return (
    <div>
      <LowcoderAppView appId={YOUR_APPLICATION_ID} ref={appRef} />;
      <button onClick={() => appRef.current?.invokeMethod("some-method-name")}>
        Invoke method
      </button>
    </div>
  );
}
```

### For vanilla js:

```js
import { bootstrapAppAt } from "lowcoder-sdk";

const node = document.querySelector("#my-app");

async function bootstrap() {
  const instance = await bootstrapAppAt(YOUR_APPLICATION_ID, node);

  // set module inputs
  instance.setModuleInputs({ input1: "xxx", input2: "xxx" });

  // invoke module methods
  instance.setModuleInputs({ input1: "xxx", input2: "xxx" });

  // listen module event trigger
  instance.on("moduleEventTriggered", (eventName) => {
    console.info("event triggered:", eventName);
  });

  // listen module output change
  instance.on("moduleOutputChange", (data) => {
    console.info("output data:", data);
  });
}
```

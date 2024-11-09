# Embed Apps in React

### Native embedding in your React-based Web App

First, install the OpenFlower SDK. OpenFlower publishes with every Version Release a new version of OpenFlower SDK too. [https://www.npmjs.com/package/lowcoder-sdk](https://www.npmjs.com/package/lowcoder-sdk)

yarn:

```
yarn add lowcoder-sdk
```

npm:

```
npm install lowcoder-sdk
```

### Integrate an OpenFlower App or Module into your existing app <a href="#user-content-integrate-openblocks-appmodule-into-existing-app-page" id="user-content-integrate-openblocks-appmodule-into-existing-app-page"></a>

1. Publish your app/module in OpenFlower.
2. Set the app/module's access privilege as public.
3. Add code in your existing app as below.

#### Import CSS styles <a href="#user-content-import-style" id="user-content-import-style"></a>

```
import "lowcoder-sdk/dist/style.css";
```

#### For React app: <a href="#user-content-for-react-app" id="user-content-for-react-app"></a>

```
import { OpenFlowerAppView } from "lowcoder-sdk";

<OpenFlowerAppView appId="{YOUR_APPLICATION_ID}" />;
```

**Properties**

<table><thead><tr><th width="171">Name</th><th width="149">Type</th><th>Description</th><th>Default value</th></tr></thead><tbody><tr><td>appId</td><td>string</td><td>The app's id is required!</td><td>--</td></tr><tr><td>baseUrl</td><td>string</td><td>The api base url of the OpenFlower Instance.</td><td>https://todo</td></tr><tr><td>onModuleEventTriggered</td><td>(eventName: string) => void</td><td>(Only for Modules) Triggered when module's custom event is triggered. Works only when the app is a module.</td><td>--</td></tr><tr><td>onModuleOutputChange</td><td>(output: any) => void</td><td>(Only for Modules) Triggered when module's outputs change. Works only when the app is a module.</td><td>--</td></tr></tbody></table>

Modules are special Apps, which make bidirectional communication between your app and the OpenFlower Module possible. You can send data to Module-Inputs and receive Data back via Module Outputs. Also, you can trigger Methods and listen to Events.

**Invoke module methods**

```
import { useRef } from "ref";
import { OpenFlowerAppView } from "lowcoder-sdk";

function MyExistingAppPage() {
  const appRef = useRef();
  return (
    <div>
      <OpenFlowerAppView appId={YOUR_APPLICATION_ID} ref={appRef} />;
      <button onClick={() => appRef.current?.invokeMethod("some-method-name")}>
        Invoke method
      </button>
    </div>
  );
}
```

#### For vanilla js: <a href="#user-content-for-vanilla-js" id="user-content-for-vanilla-js"></a>

```
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

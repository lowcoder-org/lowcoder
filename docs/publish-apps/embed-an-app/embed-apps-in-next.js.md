# Embed Apps in NEXT.JS

### Native embedding in your NEXT.JS -based Web App

First, install the Lowcoder SDK. Lowcoder publishes with every Version Release, a new version of Lowcoder SDK too. [https://www.npmjs.com/package/lowcoder-sdk](https://www.npmjs.com/package/lowcoder-sdk)

yarn:

```
yarn add lowcoder-sdk
```

npm:

```
npm install lowcoder-sdk
```

### Integrate a Lowcoder App or Module into your existing app

1. Publish your app/module in Lowcoder.
2. Set the app/module's access privilege as public.
3. Add code in your existing app as below.

### Import CSS Styles

```
import "lowcoder-sdk/dist/style.css";
```

### Embed Lowcoder Apps

* Create Wrapper Component to Embed Lowcoder Apps

```
"use client"
import { LowcoderAppView } from "lowcoder-sdk";

function LowcoderAppWrapper(props) {
  const { appId } = props;
  return (
    <section style={{marginTop: '2rem'}}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <h1>Lowcoder App</h1>
      </div>
      <LowcoderAppView
        appId={appId}
      />
    </section>
  )
}

export default LowcoderAppWrapper;
```

* Dynamically import the LowcoderAppWrapper component in the file where you want to embed the Lowcoder app

```
const LowcoderAppWrapper = dynamic(
  () => import('../components/LowcoderAppWrapper'), {ssr: false}
);
```

* Now, we can embed  our Lowcoder app by just passing the appId to the imported LowcoderAppWrapper component.

```
<LowcoderAppWrapper
   appId='66ab6af10390b00771b2e649'
/>
```

### Embed Lowcoder Modules

* Create Wrapper Component to Embed Lowcoder Modules

```
"use client"
import { useRef } from "react";
import { LowcoderAppView } from "lowcoder-sdk";

function LowcoderModuleWrapper(props) {
  const { appId } = props;
  const appRef = useRef();
  return (
    <section style={{marginTop: '2rem'}}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <h1>Lowcoder Module</h1>
        <button
          type="button"
          onClick={() => {
            appRef?.current?.invokeMethod("ShowNotification")
          }}
        >
          Invoke module method
        </button>
      </div>
      <LowcoderAppView
        ref={appRef}
        appId={appId}
    
      />
    </section>
  )
}

export default LowcoderModuleWrapper;
```

* Dynamically import the LowcoderModuleWrapper component in the file where you want to embed the Lowcoder Module

```
const LowcoderModuleWrapper = dynamic(
  () => import('../components/LowcoderModuleWrapper'), {ssr: false}
);
```

* Now, we can embed  our Lowcoder module by just passing the appId to the imported LowcoderModuleWrapper component.

```
<LowcoderModuleWrapper
   appId="660f13367c18a91b174fe96d"
/>
```

### Demo

The result of the above code in NEXT.JS App is shown below in the Demo. The List component with Yellow background is the Lowcoder App and the Table component is the Lowcoder Module :&#x20;

{% embed url="https://demos.lowcoder.cloud/demo/clzi68y2h1jaw9x776x7lwz8p" %}

### Properties

| Name                   | Type                        | Description                                                                                                | Default value                      |
| ---------------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| appId                  | string                      | The app's id is required!                                                                                  | --                                 |
| baseUrl                | string                      | The api base url of the Lowcoder Instance.                                                                 | https://api-service.lowcoder.cloud |
| onModuleEventTriggered | (eventName: string) => void | (Only for Modules) Triggered when module's custom event is triggered. Works only when the app is a module. | --                                 |
| onModuleOutputChange   | (output: any) => void       | (Only for Modules) Triggered when module's outputs change. Works only when the app is a module.            | --                                 |

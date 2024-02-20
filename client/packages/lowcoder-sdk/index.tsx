import { useRef } from "react";
import ReactDOM, { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { AppViewInstance, bootstrapAppAt, LowcoderAppView } from "./src/index";

const url = new URL(location.href);
const appId = url.searchParams.get("appId");
const baseUrl = url.searchParams.get("baseUrl") || "http://localhost:8000";

function ReactDemoApp() {
  const ref = useRef<AppViewInstance | null>(null);
  if (!appId) {
    return null;
  }
  return (
    <div>
      <LowcoderAppView
        ref={ref}
        appId={appId}
        baseUrl={baseUrl}
        onModuleEventTriggered={(e) => {
          console.info("trigger:", e);
        }}
        onModuleOutputChange={(data) => {
          console.info("output:", data);
        }}
      />
      <div className="ops">
        <button
          onClick={() => {
            ref.current?.setModuleInputs({ userName: "Jack", userAge: 99 });
          }}
        >
          setModuleInputs
        </button>
        <button onClick={() => ref.current?.invokeMethod("setSlider")}>invokeMethod</button>
      </div>
    </div>
  );
}

async function bootstrap() {
  if (!appId) {
    return;
  }
  // vanilla js
  const instance = await bootstrapAppAt(appId, document.querySelector("#app1"), {
    baseUrl,
    moduleInputs: { userName: "Lucy" },
  });

  instance?.on("moduleOutputChange", (output) => {
    console.info("output change:", output);
  });

  instance?.on("moduleEventTriggered", (eventName) => {
    console.info("event triggered:", eventName);
  });

  document.querySelector("#app1-ops")?.addEventListener("click", (e) => {
    const target = e.target as HTMLButtonElement;
    const key = target.dataset.key;
    if (key === "setModuleInputs") {
      instance?.setModuleInputs({
        userName: "Tom",
      });
    }
    if (key === "invokeMethod") {
      instance?.invokeMethod("setSlider");
    }
  });

  // React
  const container = document.querySelector("#app2");
  const root = createRoot(container!);
  root.render(<ReactDemoApp />);
}

bootstrap();

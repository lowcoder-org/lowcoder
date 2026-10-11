import React, { useEffect, useImperativeHandle, useRef, useState } from "react";
import type {
  AppViewInstance,
  AppViewInstanceOptions,
  EventTriggerHandler,
  OutputChangeHandler,
} from "./AppViewInstance";
import { bootstrapAppAt } from "./bootstrapAt";

export interface LowcoderAppViewProps<I, O> extends AppViewInstanceOptions<I> {
  appId: string;
  className?: string;
  onModuleOutputChange?: OutputChangeHandler<O>;
  onModuleEventTriggered?: EventTriggerHandler;
}

function LowcoderAppViewBase<I = any, O = any>(
  props: LowcoderAppViewProps<I, O>,
  ref: React.Ref<AppViewInstance | undefined>
) {
  const { appId, className, onModuleEventTriggered, onModuleOutputChange, ...options } = props;

  const [instance, setInstance] = useState<AppViewInstance | undefined>();
  const nodeRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => instance, [instance]);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) {
      return;
    }
    // An effect owns its mount node, including during StrictMode's async cleanup.
    const mountNode = document.createElement("div");
    node.appendChild(mountNode);
    let cancelled = false;
    let mounted: AppViewInstance | undefined;
    setInstance(undefined);
    bootstrapAppAt<I>(appId, mountNode, options).then((next) => {
      if (cancelled) next.destroy();
      else { mounted = next; setInstance(next); }
    }).catch((error) => {
      if (!cancelled) console.error("Lowcoder app could not mount", error);
    });
    return () => {
      cancelled = true;
      mountNode.remove();
      // Avoid synchronously unmounting a nested root during React's commit.
      if (mounted) queueMicrotask(() => mounted?.destroy());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appId, options.baseUrl, options.webUrl, options.orgId]);

  useEffect(() => {
    if (!instance) {
      return;
    }
    const offOutput = instance.on("moduleOutputChange", onModuleOutputChange);
    const offEvent = instance.on("moduleEventTriggered", onModuleEventTriggered);
    return () => { offOutput(); offEvent(); };
  }, [instance, onModuleEventTriggered, onModuleOutputChange]);

  useEffect(() => {
    if (options.moduleInputs && instance) {
      instance.setModuleInputs(options.moduleInputs);
    }
  }, [options.moduleInputs, instance]);

  return <div ref={nodeRef} className={className}></div>;
}

export const LowcoderAppView = React.forwardRef(LowcoderAppViewBase);

import { useLayoutEffect } from "react";
import { default as App } from "antd/es/app";
import type { MessageInstance } from "antd/es/message/interface";
import type { ModalStaticFunctions } from "antd/es/modal/confirm";
import type { NotificationInstance } from "antd/es/notification/interface";

let messageInstance: MessageInstance;
let notificationInstance: NotificationInstance;
let modalInstance: Omit<ModalStaticFunctions, 'warn'>;

// Nested application shells can supply a themed API without leaking it after exit.
const scopes = new Map<symbol, { priority: number; api: ReturnType<typeof App.useApp> }>();
function updateInstances() {
  const active = Array.from(scopes.values()).sort((a, b) => b.priority - a.priority)[0]?.api;
  if (active) {
    messageInstance = active.message;
    modalInstance = active.modal;
    notificationInstance = active.notification;
  }
}

export default function GlobalInstances({ priority = 0 }: { priority?: number }) {
  const api = App.useApp();
  useLayoutEffect(() => {
    const key = Symbol();
    scopes.set(key, { priority, api });
    updateInstances();
    return () => {
      scopes.delete(key);
      updateInstances();
    };
  }, [api, priority]);
  return null;
}

export { messageInstance, notificationInstance, modalInstance };

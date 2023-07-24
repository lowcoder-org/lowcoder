import { QueryNotificationControl } from "./queryNotificationControl";
import { trans } from "../../../i18n";
import { evalAndReduce } from "comps/utils";
import { messageInstance } from "lowcoder-design";

jest.mock('lowcoder-design/src/components/GlobalInstances', () => ({
  __esModule: true, // this property makes it work
  default: 'mockedDefaultExport',
  messageInstance: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

const param = {
  value: {
    showSuccess: true,
    success: {
      text: "success",
    },
    showFail: true,
    fail: [
      {
        text: "{{ data + 1 }}",
        condition: "{{ data + 1 === 2 }}",
      },
      {
        text: "{{ data }}",
        condition: "{{ data === 3 }}",
      },
    ],
    duration: "",
  },
};

beforeAll(() => {
  jest.spyOn(messageInstance, "error");
  jest.spyOn(messageInstance, "success");
});

test("test custom fail", () => {
  let notification = new QueryNotificationControl(param);
  notification = evalAndReduce(notification);
  notification.getView()("", "automatic", { data: 1, success: false } as any);
  expect(messageInstance.error).toHaveBeenCalledWith("2", 3);
});

test("test system fail", () => {
  let notification = new QueryNotificationControl(param);
  notification = evalAndReduce(notification);
  notification.getView()("", "automatic", { data: 4, success: false } as any);
  expect(messageInstance.error).toHaveBeenCalledWith(
    trans("query.failMessageWithName", {
      name: "",
      result: "{}",
    }),
    3
  );
});

test("test custom success", () => {
  let notification = new QueryNotificationControl(param);
  notification = evalAndReduce(notification);

  notification.getView()("", "automatic", { data: 4, success: true } as any);
  expect(messageInstance.success).toHaveBeenCalledTimes(0);

  notification.getView()("", "manual", { data: 4, success: false } as any);
  expect(messageInstance.success).toHaveBeenCalledTimes(0);

  notification.getView()("", "manual", { data: 1, success: true } as any);
  expect(messageInstance.success).toHaveBeenCalledTimes(0);
  expect(messageInstance.error).toHaveBeenCalled();

  notification.getView()("", "manual", { data: 4, success: true } as any);
  expect(messageInstance.success).toHaveBeenCalledWith("success", 3);
});

test("test system success", () => {
  let notification = new QueryNotificationControl({
    value: {
      showSuccess: true,
      success: {
        text: "",
      },
      showFail: true,
      fail: [
        {
          text: "{{ data }}",
          condition: "{{ data === 2 }}",
        },
        {
          text: "{{ data }}",
          condition: "{{ data === 3 }}",
        },
      ],
      duration: "",
    },
  });
  notification = evalAndReduce(notification);
  notification.getView()("", "manual", { data: 4, success: true } as any);
  expect(messageInstance.success).toHaveBeenCalledWith(
    trans("query.successMessageWithName", { name: "" }),
    3
  );
});

test("test duration", () => {
  let notification = new QueryNotificationControl({ value: { ...param.value, duration: "3s" } });
  notification = evalAndReduce(notification);
  notification.getView()("", "automatic", { data: 1, success: false } as any);
  expect(messageInstance.error).toHaveBeenNthCalledWith(1, "2", 3);

  notification = new QueryNotificationControl({ value: { ...param.value, duration: "1000ms" } });
  notification = evalAndReduce(notification);
  notification.getView()("", "automatic", { data: 1, success: false } as any);
  expect(messageInstance.error).toHaveBeenNthCalledWith(2, "2", 1);

  notification = new QueryNotificationControl({
    value: { ...param.value, duration: "{{2*2}}" },
  });
  notification = evalAndReduce(notification);
  notification.getView()("", "automatic", { data: 1, success: false } as any);
  expect(messageInstance.error).toHaveBeenNthCalledWith(3, "2", 4);
});

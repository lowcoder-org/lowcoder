import type { ChatMessage } from "../types/chatTypes";
import {
  addSystemPromptToHistory,
  buildChatQueryArgs,
} from "./assistantMessages";

const imageDataUrl = "data:image/png;base64,aW1hZ2U=";

const userMessage = {
  id: "user-1",
  role: "user",
  content: [{ type: "text", text: "Explain this image" }],
  createdAt: new Date("2026-09-08T00:00:00.000Z"),
  attachments: [
    {
      id: "image-1",
      type: "image",
      name: "example.png",
      contentType: "image/png",
      content: [{ type: "image", image: imageDataUrl }],
      status: { type: "complete" },
    },
  ],
} as ChatMessage;

describe("AI Chat query context", () => {
  test("serializes the system prompt, text, and image attachment", () => {
    const history = addSystemPromptToHistory(
      [userMessage],
      "Describe images accurately",
    );

    expect(history).toEqual([
      expect.objectContaining({
        role: "system",
        content: "Describe images accurately",
      }),
      {
        role: "user",
        content: "Explain this image",
        timestamp: userMessage.createdAt.getTime(),
        attachments: [
          {
            id: "image-1",
            type: "image",
            name: "example.png",
            contentType: "image/png",
            content: [{ type: "image", image: imageDataUrl }],
          },
        ],
      },
    ]);
  });

  test("passes the same current message in the prompt and history arguments", () => {
    const args = buildChatQueryArgs(
      userMessage,
      [userMessage],
      "Describe images accurately",
    );

    expect(args.prompt.value).toBe("Explain this image");
    expect(args.message.value).toBe(userMessage);
    const lastMessage =
      args.conversationHistory.value[args.conversationHistory.value.length - 1];
    expect(lastMessage).toEqual(
      expect.objectContaining({
        role: "user",
        content: "Explain this image",
        attachments: expect.arrayContaining([
          expect.objectContaining({ id: "image-1" }),
        ]),
      }),
    );
  });
});

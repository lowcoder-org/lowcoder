import { ThreadPrimitive } from "@assistant-ui/react";
import { useState, type FC } from "react";
import { trans } from "i18n";

const DEMO_SUGGESTION_KEYS = [
  "chat.suggestionTimeTracking",
  "chat.suggestionCrm",
  "chat.suggestionTodo",
  "chat.suggestionInventory",
  "chat.suggestionExpenseTracker",
  "chat.suggestionProjectManagement",
  "chat.suggestionCustomerSupport",
  "chat.suggestionEmployeeDirectory",
] as const;

const CHAT_SUGGESTION_KEYS = [
  "chat.suggestionChatCapabilities",
  "chat.suggestionChatIdeas",
] as const;

const pickDemoSuggestions = () => {
  const firstIndex = Math.floor(Math.random() * DEMO_SUGGESTION_KEYS.length);
  let secondIndex = Math.floor(Math.random() * (DEMO_SUGGESTION_KEYS.length - 1));

  if (secondIndex >= firstIndex) {
    secondIndex += 1;
  }

  return [DEMO_SUGGESTION_KEYS[firstIndex], DEMO_SUGGESTION_KEYS[secondIndex]];
};

interface ThreadWelcomeProps {
  suggestionMode: "chat" | "automator";
}

export const ThreadWelcome: FC<ThreadWelcomeProps> = ({ suggestionMode }) => {
  return (
    <div className="aui-thread-welcome-root">
      <div className="aui-thread-welcome-center">
        <div className="aui-thread-welcome-message">
          <h1 className="aui-thread-welcome-message-inner">
            {trans("chat.welcomeMessage")}
          </h1>
        </div>
      </div>
      <ThreadSuggestions suggestionMode={suggestionMode} />
    </div>
  );
};

const ThreadSuggestions: FC<ThreadWelcomeProps> = ({ suggestionMode }) => {
  const [suggestionKeys] = useState(() =>
    suggestionMode === "automator" ? pickDemoSuggestions() : CHAT_SUGGESTION_KEYS
  );

  return (
    <div className="aui-thread-welcome-suggestions">
      {suggestionKeys.map((suggestionKey) => {
        const suggestion = trans(suggestionKey);

        return (
          <div className="aui-thread-welcome-suggestion-display" key={suggestionKey}>
            <ThreadPrimitive.Suggestion
              className="aui-thread-welcome-suggestion"
              prompt={suggestion}
              method="replace"
              autoSend
            >
              <span className="aui-thread-welcome-suggestion-text-1">{suggestion}</span>
            </ThreadPrimitive.Suggestion>
          </div>
        );
      })}
    </div>
  );
};

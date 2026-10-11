import { useState } from "react";
import { ThreadListPrimitive } from "@assistant-ui/react";
import { History, PanelLeftClose, Plus } from "lucide-react";
import { Tooltip } from "antd";
import { ThreadList } from "components/assistant-ui/thread-list";
import { trans } from "i18n";

export function AutomatorHistory() {
  const [open, setOpen] = useState(false);
  return (
    <aside
      className={`automator-history ${open ? "is-open" : ""}`}
      aria-label={trans("automator.studio.history")}
    >
      {open ? (
        <>
          <div className="automator-history-heading">
            <span>{trans("automator.studio.history")}</span>
            <button
              type="button"
              className="studio-icon-button"
              aria-label={trans("automator.studio.hideHistory")}
              onClick={() => setOpen(false)}
            >
              <PanelLeftClose size={16} />
            </button>
          </div>
          <ThreadList newThreadLabel={trans("automator.studio.newBuild")} />
        </>
      ) : (
        <>
          <Tooltip title={trans("automator.studio.newBuild")} placement="right">
            <ThreadListPrimitive.New asChild>
              <button
                type="button"
                className="studio-icon-button studio-new-build"
                aria-label={trans("automator.studio.newBuild")}
              >
                <Plus size={19} />
              </button>
            </ThreadListPrimitive.New>
          </Tooltip>
          <Tooltip title={trans("automator.studio.history")} placement="right">
            <button
              type="button"
              className="studio-icon-button"
              aria-label={trans("automator.studio.history")}
              aria-expanded={false}
              onClick={() => setOpen(true)}
            >
              <History size={18} />
            </button>
          </Tooltip>
        </>
      )}
    </aside>
  );
}

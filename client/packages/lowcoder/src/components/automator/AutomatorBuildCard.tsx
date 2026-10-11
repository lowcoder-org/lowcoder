import { automatorColor } from "./AutomatorTheme";
import { useEffect, useRef, useState } from "react";
import { Button, Progress, Space } from "antd";
import { Check, Code2, Loader2, Sparkles, TriangleAlert } from "lucide-react";
import styled from "styled-components";
import { trans } from "i18n";
import type { AutomatorBuildState } from "./buildState";

const Card = styled.section`
  position: relative;
  flex: 0 0 auto;
  margin: 3px 0;
  padding: 20px;
  border: 1px solid #dedede;
  border-radius: 16px;
  background: #fff;
  color: #434343;
  overflow: hidden;
  box-shadow: 0 4px 18px #0000000a;
  &[data-phase="complete"] {
    background: #fff;
    border-color: #d8ebe5;
  }
  &[data-phase="partial"],
  &[data-phase="failed"] {
    background: #fff;
    border-color: #efdfd0;
  }
  .build-heading {
    display: flex;
    align-items: center;
    gap: 13px;
  }
  .build-orb {
    flex: 0 0 42px;
    height: 42px;
    display: grid;
    place-items: center;
    color: ${automatorColor.accent};
    background: ${automatorColor.accentBg};
    border: 1px solid ${automatorColor.accentBorder};
    border-radius: 13px;
  }
  h3 {
    margin: 0;
    color: #262626;
    font-size: 18px;
    line-height: 1.3;
    font-weight: 600;
    letter-spacing: -0.025em;
  }
  .build-meta {
    margin-top: 4px;
    font-size: 10px;
    color: #757575;
  }
  .build-meta svg {
    vertical-align: -2px;
    margin-right: 3px;
  }
  p {
    margin: 12px 0 !important;
    line-height: 1.7;
    font-size: 12px;
    color: #6b6b6b;
  }
  .automator-progress .ant-progress-bg {
    background: ${automatorColor.accent} !important;
  }
  .build-motion {
    height: 30px;
    display: flex;
    gap: 7px;
    align-items: end;
    margin: 18px 0 12px;
  }
  .build-motion i {
    display: block;
    width: 22%;
    height: 25px;
    border-radius: 5px;
    background: ${automatorColor.accentBg};
    animation: automator-breathe 2.2s ease-in-out infinite;
  }
  .build-motion i:nth-child(2) {
    height: 30px;
    animation-delay: 0.3s;
    background: ${automatorColor.accentBg};
  }
  .build-motion i:nth-child(3) {
    height: 20px;
    animation-delay: 0.6s;
    background: ${automatorColor.accentBg};
  }
  .build-motion i:nth-child(4) {
    height: 26px;
    animation-delay: 0.9s;
    background: ${automatorColor.accentBg};
  }
  .build-current {
    overflow-wrap: anywhere;
    font-weight: 500;
  }
  .build-steps {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
    list-style: none;
    padding: 0;
    margin: 12px 0 16px;
    font-size: 10px;
    max-height: 145px;
    overflow: auto;
  }
  .build-steps li {
    display: flex;
    align-items: start;
    gap: 5px;
    padding: 5px 8px;
    border: 1px solid #e0ebe8;
    border-radius: 6px;
    color: #6e8d84;
    background: #fff;
    overflow-wrap: anywhere;
  }
  .build-steps svg {
    flex-shrink: 0;
    margin-top: 1px;
  }
  .build-steps .build-error {
    color: #b36a4e;
    border-color: #efddd0;
  }
  .build-success .build-orb {
    background: #e6f4ee;
    color: #438c75;
    border-color: #d4eade;
    animation: automator-arrive 0.5s ease-out;
  }
  .build-spin {
    animation: automator-spin 6s linear infinite;
  }
  .ant-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    border-radius: 8px;
    height: 33px;
    padding: 0 12px;
    font-size: 11px;
    box-shadow: none;
  }
  @keyframes automator-breathe {
    50% {
      opacity: 0.45;
      transform: translateY(-3px);
    }
  }
  @keyframes automator-spin {
    to {
      transform: rotate(360deg);
    }
  }
  @keyframes automator-arrive {
    from {
      transform: scale(0.8);
      opacity: 0.4;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    *,
    .build-motion i,
    .build-success .build-orb {
      animation: none !important;
    }
  }
  @container automator-chat (max-width: 480px) {
    padding: 15px;
    h3 {
      font-size: 16px;
    }
  }
`;

export function automatorActionLabel(action: string) {
  const keys: Record<string, string> = {
    place_component: "place",
    nest_component: "nest",
    move_component: "move",
    resize_component: "resize",
    delete_component: "remove",
    delete_query: "removeQuery",
    rename_component: "rename",
    set_properties: "properties",
    set_style: "style",
    set_theme: "theme",
    set_app_metadata: "metadata",
    set_canvas_setting: "canvas",
    set_global_css: "css",
    set_global_javascript: "javascript",
    add_event_handler: "event",
    publish_app: "publish",
    align_component: "align",
  };
  return trans(`automator.build.actions.${keys[action] || "change"}` as any);
}

export function AutomatorBuildCard({
  build,
  onPreview,
  onRecipe,
  autoScroll = true,
}: {
  build: AutomatorBuildState;
  autoScroll?: boolean;
  onPreview: () => void;
  onRecipe: () => void;
}) {
  const cardRef = useRef<HTMLElement>(null);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!autoScroll) return;
    const frame = requestAnimationFrame(() =>
      cardRef.current?.scrollIntoView?.({ block: "nearest" }),
    );
    return () => cancelAnimationFrame(frame);
  }, [build.phase, autoScroll]);
  const active = build.phase === "planning" || build.phase === "applying";
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [active]);
  const seconds = Math.max(
    0,
    Math.floor(((build.finishedAt || now) - build.startedAt) / 1000),
  );
  const succeeded = build.steps.filter((step) => step.status === "done").length;
  const failed = build.steps.filter((step) => step.status === "error").length;
  const title = trans(`automator.build.${build.phase}Title` as any);
  const hint = ["planningHint", "recipeHint", "javascriptHint"][
    Math.floor(seconds / 10) % 3
  ];
  return (
    <Card
      ref={cardRef}
      data-phase={build.phase}
      aria-label={title}
      aria-busy={active}
    >
      <div
        className={`build-heading ${build.phase === "complete" ? "build-success" : ""}`}
      >
        <div className="build-orb" aria-hidden="true">
          {active ? (
            <Sparkles size={22} className="build-spin" />
          ) : build.phase === "complete" ? (
            <Check size={23} />
          ) : (
            <TriangleAlert size={22} />
          )}
        </div>
        <div>
          <h3 role="status" aria-live="polite">
            {title}
          </h3>
          <div className="build-meta">
            {trans("automator.build.elapsed", { seconds })}
          </div>
        </div>
      </div>
      {build.phase === "planning" ? (
        <>
          <div className="build-motion" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </div>
          <p>{trans(`automator.build.${hint}` as any)}</p>
        </>
      ) : (
        <>
          {active && (
            <>
              <p className="build-current">
                {build.current
                  ? `${automatorActionLabel(build.current.action)}${build.current.component_name ? ` · ${build.current.component_name}` : ""}`
                  : trans("automator.build.settling")}
              </p>
              <Progress
                percent={
                  build.recipe.length
                    ? Math.round(
                        (build.steps.length / build.recipe.length) * 100,
                      )
                    : 0
                }
                showInfo={false}
                size="small"
                className="automator-progress"
              />
              <div className="build-meta">
                {trans("automator.build.progress", {
                  done: build.steps.length,
                  total: build.recipe.length,
                })}
              </div>
            </>
          )}
          {!active && (
            <p>
              {trans(
                build.phase === "complete"
                  ? "automator.build.completeDescription"
                  : build.phase === "partial"
                    ? "automator.build.partialDescription"
                    : "automator.build.failedDescription",
                { succeeded, failed, total: build.recipe.length },
              )}
            </p>
          )}
          {!!build.steps.length && (
            <ul className="build-steps">
              {(active
                ? build.steps.slice(-3)
                : [
                    ...build.steps.filter((step) => step.status === "error"),
                    ...build.steps
                      .filter((step) => step.status === "done")
                      .slice(-3),
                  ]
              ).map((step, index) => (
                <li
                  key={index}
                  className={step.status === "error" ? "build-error" : ""}
                >
                  {step.status === "done" ? (
                    <Check size={14} />
                  ) : (
                    <TriangleAlert size={14} />
                  )}
                  <span>
                    {automatorActionLabel(step.action)}
                    {step.name ? ` · ${step.name}` : ""}
                    {step.error ? ` — ${step.error}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {!active && (
            <Space wrap>
              {succeeded > 0 && (
                <Button type="primary" onClick={onPreview}>
                  {trans("automator.build.preview")}
                </Button>
              )}
              {!!build.recipe.length && (
                <Button icon={<Code2 size={14} />} onClick={onRecipe}>
                  {trans("automator.build.recipe")}
                </Button>
              )}
            </Space>
          )}
        </>
      )}
      {active && (
        <div className="build-meta">
          <Loader2 size={11} className="build-spin" aria-hidden="true" />{" "}
          {trans("automator.build.liveNote")}
        </div>
      )}
    </Card>
  );
}

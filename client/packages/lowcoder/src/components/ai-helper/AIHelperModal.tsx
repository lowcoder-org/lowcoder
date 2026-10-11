import { useContext, useEffect, useRef } from "react";
import Button from "antd/es/button";
import Empty from "antd/es/empty";
import Select from "antd/es/select";
import { AssistantModalPrimitive } from "@assistant-ui/react";
import { SparklesIcon, XIcon } from "lucide-react";
import { useSelector } from "react-redux";
import styled from "styled-components";

import { DocLink } from "lowcoder-design";
import { EditorContext } from "comps/editorState";
import { trans } from "i18n";
import { getDataSourceStructures } from "redux/selectors/datasourceSelectors";
import { getSelectedAIQueryName } from "util/localStorageUtil";

import { AIHelperRuntime } from "./AIHelperRuntime";
import { useAIHelper } from "./context/AIHelperController";

const Anchor = styled.div`
  position: fixed;
  right: 16px;
  bottom: 16px;
  width: 1px;
  height: 1px;
`;

const Content = styled(AssistantModalPrimitive.Content)`
  width: 430px;
  height: min(640px, calc(100vh - 128px));
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #e1e3eb;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 12px 40px rgba(15, 23, 42, 0.18);
  z-index: 2147483000;

  .aui-thread-root {
    min-height: 0;
    flex: 1 1 auto;
    background: #fafbfc;
  }

  .aui-thread-viewport {
    padding: 12px 12px 0;
  }

  .aui-thread-welcome-root {
    padding: 16px 8px;
  }

  .aui-thread-welcome-suggestions {
    display: none;
  }
`;

const Header = styled.div`
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-bottom: 1px solid #e1e3eb;
`;

const Title = styled.div`
  min-width: 0;
`;

const TitleLine = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #111827;
  font-size: 13px;
  font-weight: 600;
`;

const TargetLabel = styled.div`
  max-width: 300px;
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #6b7280;
  font-size: 11px;
`;

const IconButton = styled.button`
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #6b7280;
  cursor: pointer;

  &:hover {
    background: #f3f4f6;
    color: #111827;
  }
`;

const QueryBar = styled.div`
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid #f1f5f9;
  background: #fcfcfd;
  color: #6b7280;
  font-size: 12px;
`;

const EmptyState = styled.div`
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
`;

export function AIHelperModal() {
  const helper = useAIHelper();
  const editorState = useContext(EditorContext);
  const datasourceStructures = useSelector(getDataSourceStructures);
  const datasourceStructuresRef = useRef(datasourceStructures);

  useEffect(() => {
    datasourceStructuresRef.current = datasourceStructures;
  }, [datasourceStructures]);

  useEffect(() => {
    if (!helper?.open) {
      return;
    }
    const selectedQueryName = getSelectedAIQueryName();
    if (selectedQueryName !== helper.helperQueryName) {
      helper.setHelperQueryName(selectedQueryName);
    }
  }, [helper?.open]);

  if (!helper) return null;

  const queryOptions = (() => {
    if (!editorState) return [];
    try {
      return editorState.getQueriesComp().getView().map((query: any) => {
        const name = query.children.name.getView();
        const type = query.children.compType.getView();
        return {
          label: type ? `${name} (${type})` : name,
          value: name,
        };
      });
    } catch {
      return [];
    }
  })();

  const target = helper.target;

  return (
    <AssistantModalPrimitive.Root open={helper.open} onOpenChange={helper.setOpen}>
      <AssistantModalPrimitive.Anchor asChild>
        <Anchor />
      </AssistantModalPrimitive.Anchor>
      <Content sideOffset={16} role="dialog" aria-label="AI Helper">
        <Header>
          <Title>
            <TitleLine>
              <SparklesIcon size={16} color="#4965f2" />
              <span>AI Helper</span>
              <DocLink
                href={trans("docUrls.githubAiHelp")}
                title={trans("comp.menuViewDocsTooltip")}
                tooltipZIndex={2147483001}
              >
                {trans("comp.menuViewDocs")}
              </DocLink>
            </TitleLine>
            {target?.label && (
              <TargetLabel title={target.label}>{target.label}</TargetLabel>
            )}
          </Title>
          <IconButton aria-label="Close AI Helper" onClick={helper.closeHelper}>
            <XIcon size={16} />
          </IconButton>
        </Header>

        <QueryBar>
          <span>AI query:</span>
          <Select
            showSearch
            allowClear
            size="small"
            placeholder="Select model query"
            value={helper.helperQueryName || undefined}
            onChange={(value) => helper.setHelperQueryName(value || "")}
            options={queryOptions}
            notFoundContent={queryOptions.length ? undefined : "No queries found"}
            getPopupContainer={(triggerNode) => triggerNode.parentElement ?? document.body}
            style={{ flex: 1, minWidth: 0 }}
          />
        </QueryBar>

        {!helper.helperQueryName || !target ? (
          <EmptyState>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="Select the model query that should handle AI requests."
            >
              <Button onClick={helper.closeHelper}>Close</Button>
            </Empty>
          </EmptyState>
        ) : (
          <AIHelperRuntime
            key={`${helper.helperQueryName}|${target.id}`}
            helperQueryName={helper.helperQueryName}
            dispatch={editorState?.rootComp?.dispatch}
            getDatasourceStructures={() => datasourceStructuresRef.current}
            target={target}
          />
        )}
      </Content>
    </AssistantModalPrimitive.Root>
  );
}

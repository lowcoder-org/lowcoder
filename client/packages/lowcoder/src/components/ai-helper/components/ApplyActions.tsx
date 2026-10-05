import Button from "antd/es/button";
import { CodeIcon } from "lucide-react";
import styled from "styled-components";

import type { AIHelperApplyAction } from "../types";

const Wrapper = styled.div`
  flex: 0 0 auto;
  border-top: 1px solid #e1e3eb;
  background: #ffffff;
  padding: 10px 12px;
`;

const Title = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  color: #4b5563;
  font-size: 12px;
  font-weight: 600;
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Label = styled.div`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #111827;
  font-size: 13px;
`;

export function ApplyActions({
  actions,
  onApply,
}: {
  actions: AIHelperApplyAction[];
  onApply: (action: AIHelperApplyAction) => void;
}) {
  if (!actions.length) return null;

  return (
    <Wrapper>
      <Title>
        <CodeIcon size={13} />
        <span>Generated value</span>
      </Title>
      {actions.map((action) => (
        <Row key={action.id}>
          <Label title={action.value}>{action.label}</Label>
          <Button size="small" type="primary" onClick={() => onApply(action)}>
            Apply
          </Button>
        </Row>
      ))}
    </Wrapper>
  );
}


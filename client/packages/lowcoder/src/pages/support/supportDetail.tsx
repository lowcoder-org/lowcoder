import { ArrowIcon } from "lowcoder-design";
import styled from "styled-components";
import { trans } from "i18n";
import { useParams } from "react-router-dom";
import history from "util/history";
import { getTicket }  from '@lowcoder-ee/api/supportApi';

const FieldWrapper = styled.div`
  margin-bottom: 32px;
  width: 408px;
  margin-top: 40px;
`;

const Wrapper = styled.div`
  padding: 32px 24px;
`;

export function SupportDetail() {

  const { ticketId } = useParams<{ ticketId: string }>();
  const ticket = getTicket(ticketId);

  console.log("ticket", ticket);

  return (
    <Wrapper>
      
      <div>
        <h1>{`Support Ticket ID: ${ticketId}`}</h1>
      </div>
    </Wrapper>
  );
}

export default SupportDetail;
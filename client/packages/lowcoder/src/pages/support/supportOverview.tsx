import styled from "styled-components";
import { trans } from "i18n";
import { searchCustomerTickets } from "@lowcoder-ee/api/supportApi";
import { useState, useEffect } from 'react';
import { Helmet } from "react-helmet";
import { useUserDetails } from "./useUserDetails";
import StepModal from "components/StepModal";
import { Search, TacoButton } from "lowcoder-design";
import { Table } from "../../components/Table";
import { Avatar, Flex, Tooltip } from "antd";
import { buildSupportTicketLink } from "constants/routesURL";
import history from "util/history";

const SupportWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
`;

const HeaderWrapper = styled.div`
  display: flex;
  align-items: center;
  height: 92px;
  padding: 28px 36px;
  width: 100%;
`;

const Title = styled.div`
  font-weight: 500;
  font-size: 18px;
  color: #222222;
  line-height: 18px;
  flex-grow: 1;
`;

const ModalTitleWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
`;

const AddBtn = styled(TacoButton)`
  min-width: 96px;
  width: fit-content;
  height: 32px;
`;

const ReloadBtn = styled(TacoButton)`
  min-width: 96px;
  width: fit-content;
  height: 32px;
`;

const EditBtn = styled(TacoButton)`

`;

const BodyWrapper = styled.div`
  width: 100%;
  flex-grow: 1;
  padding: 0 24px;
`;

const StyledTable = styled(Table)`
  .datasource-can-not-edit {
    cursor: default;
  }
`;

const SubColumnCell = styled.div`
  color: #8b8fa3;
`;

const StatusDot = styled.span<{ active: boolean }>`
  display: inline-block;
  margin-left: 14px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${(props) => (props.active ? "green" : "gray")};
`;

function formatDateToMinute(dateString: string): string {
  // Create a Date object from the string
  const date = new Date(dateString);

  // Extract the components of the date
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');

  // Return the formatted string
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

// Function to handle edit button click
const handleEditClick = (ticketId: string) => {
  history.push(buildSupportTicketLink(ticketId));
};

export function SupportOverview() {
  const { orgID, currentUser, domain } = useUserDetails();
  const [supportTickets, setSupportTickets] = useState<any>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const [isCreateFormShow, showCreateForm] = useState(false);

   // Function to fetch support tickets
   const fetchSupportTickets = async () => {
    setLoading(true); // Set loading to true while fetching data
    try {
      const ticketData = await searchCustomerTickets(orgID, currentUser.id, domain);
      setSupportTickets(ticketData);
    } catch (err) {
      setError("Failed to fetch support tickets.");
      console.error(err);
    } finally {
      setLoading(false); // Set loading to false after fetching data
    }
  };

  useEffect(() => {
    fetchSupportTickets();
  }, [orgID, currentUser.id, domain]);

  const filteredTickets = supportTickets.filter((ticket: any) => {
    if (searchValue) {
      return (
        ticket.title.toLowerCase().includes(searchValue.trim().toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchValue.trim().toLowerCase())
      );
    }
    return true;
  });

  return (
    <>
      <Helmet><title>{trans("support.supportTitle")}</title></Helmet>
      <SupportWrapper>

      <StepModal
          open={isCreateFormShow}
          onCancel={() => showCreateForm(false)}
          activeStepKey={"type"}
          destroyOnClose={true}
          width="888px"
          steps={[
            {
              key: "type",
              titleRender: () =>  <ModalTitleWrapper>
                <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>Support Ticket</span>
                </ModalTitleWrapper>,
              bodyRender: () => (
                <div></div>
              ),
              footerRender: () => null,
            },
          ]} />

        <HeaderWrapper>
          <Title>{trans("support.supportTitle")}</Title>
          <Flex gap="12px">
            <Search
              placeholder={trans("search")}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              style={{ width: "192px", height: "32px", margin: "0 12px 0 0" }} />
            <AddBtn buttonType={"primary"} onClick={() => showCreateForm(true)}>
              {trans("support.newSupportTicket")}
            </AddBtn>
            <ReloadBtn buttonType={"normal"} onClick={() => fetchSupportTickets()}>
              {trans("support.reloadTickets")}
            </ReloadBtn>
          </Flex>
        </HeaderWrapper>
        <BodyWrapper>
            <StyledTable
              loading={loading}
              rowClassName="datasource-can-not-edit"
              tableLayout={"auto"}
              scroll={{ x: "100%" }}
              pagination={false}
              columns={[
                {
                  title: trans("support.ticketTitle"),
                  dataIndex: "title",
                  ellipsis: true,
                  sorter: (a: any, b: any) => a.title.localeCompare(b.title),
                },
                {
                  title: trans("support.priority"),
                  dataIndex: "priority",
                  ellipsis: true,
                  width: "192px",
                  sorter: (a: any, b: any) => a.priority.name.localeCompare(b.priority.name),
                  render: (priority: any) => <SubColumnCell>{priority.name}</SubColumnCell>,
                },
                {
                  title: trans("support.assignee"),
                  dataIndex: "assignee",
                  ellipsis: true,
                  width: "192px",
                  render: (assignee: any) => (
                    <SubColumnCell>
                      <Tooltip title={"Support Member is active in: " + 
                          assignee.timeZone + ", " + 
                          (assignee.email || trans("support.noEmail"))
                        }>
                        <Avatar src={assignee.avatar} alt={assignee.email} />
                      </Tooltip>
                      <StatusDot active={assignee.active} />
                    </SubColumnCell>
                  ),
                },
                {
                  title: trans("support.status"),
                  dataIndex: "status",
                  ellipsis: true,
                  width: "220px",
                  sorter: (a: any, b: any) => a.status.name.localeCompare(b.status.name),
                  render: (status: any) => <SubColumnCell>{status.name}</SubColumnCell>,
                },
                {
                  title: trans("support.updatedTime"),
                  dataIndex: "updated",
                  ellipsis: true,
                  width: "192px",
                  sorter: (a: any, b: any) => a.updated.localeCompare(b.updated),
                  render: (updated: string) => (
                    <SubColumnCell>
                      {formatDateToMinute(updated)}
                    </SubColumnCell>
                  ),
                },
                {
                  title: trans("support.details"),
                  dataIndex: "actions",
                  width: "120px",
                  render: (key: string) => (
                    <EditBtn
                      buttonType={"normal"}
                      onClick={() => handleEditClick(key)}
                    >
                      {trans("support.details")}
                    </EditBtn>
                  ),
                },
              ]}
              dataSource={filteredTickets.map((ticket: any, index: number) => ({
                key: index,
                title: ticket.title,
                priority: ticket.priority,
                assignee: ticket.assignee,
                status: ticket.status,
                updated: ticket.updated,
                actions: ticket.key,
              }))}
            />
          {error && <div>Error: {error}</div>}
        </BodyWrapper>
      </SupportWrapper>
    </>
  );
}

export default SupportOverview;

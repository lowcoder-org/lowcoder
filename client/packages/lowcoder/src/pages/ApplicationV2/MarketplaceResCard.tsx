import { TacoButton } from "lowcoder-design/src/components/button"
import styled from "styled-components";
import { timestampToHumanReadable } from "util/dateTimeUtils";
import { HomeRes } from "./HomeLayout";
import {
  handleMarketplaceAppViewClick,
  HomeResInfo,
} from "../../util/homeResUtils";
import { trans } from "../../i18n";
import { TypographyText } from "../../components/TypographyText";
import { default as Typography } from "antd/es/typography";
import { MultiIconDisplay } from "../../comps/comps/multiIconDisplay";

const { Text } = Typography;

const EditButton = styled(TacoButton)`
  width: 52px;
  height: 24px;
  padding: 5px 12px;
  margin-right: 12px;
  @media screen and (max-width: 500px) {
    display: inline-flex;
  }
`;

const ExecButton = styled(TacoButton)`
  width: 52px;
  height: 24px;
  padding: 5px 12px;
  margin-right: 0;
  background: #fafbff;
  border: 1px solid #c9d1fc;
  border-radius: 4px;
  font-weight: 500;
  color: #4965f2;

  &:hover {
    background: #f9fbff;
    border: 1px solid #c2d6ff;
    color: #315efb;
  }

  @media screen and (max-width: 500px) {
    margin-right: 0;
    display: inline-flex;
  }
`;

const Wrapper = styled.div`
  height: auto;
  padding: 12px;
  border: 1px solid var(--admin-line);
  border-radius: 12px;
  margin-bottom: 0;
  margin-top: 1px;
  background-color: white;

  &:hover {
    background-color: #f5f7fa;
  }
`;

const Card = styled.div`
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  gap: 14px 8px;
  align-items: center;
  height: 100%;
  min-height:100px;
  width: 100%;

  padding: 0 10px;

  button {
    opacity: 1;
  }

  &:hover {
    button {
      opacity: 1;
    }
  }

  @media screen and (max-width: 500px) {
    button {
      opacity: 1;
    }

    padding: 0;
    display: grid;
    grid-template-columns: 42px minmax(0, 1fr);
    gap: 14px 8px;
  }
`;

const CardInfo = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin-left: 0;
  white-space: wrap;
  min-width: 0;
  width: auto;
  min-height: 100px;
  flex-grow: 1;
  cursor: pointer;
  overflow: hidden;
  padding-right: 0;
  padding-top: 12px;

  &:hover {
    .ant-typography {
      color: #315efb;
    }
  }

  .ant-typography {
    padding: 2px 2px 8px 2px;
    white-space: normal; overflow-wrap: anywhere; line-height: 1.4;
  }
  @media (max-width: 500px) {
    width: auto; margin-left: 0; padding-right: 0; min-height: 0;
    .ant-typography { white-space: normal; overflow-wrap: anywhere; line-height: 1.4; }
  }
`;

const AppTimeOwnerInfoLabel = styled.div`
  font-size: 13px;
  color: #8b8fa3;
  line-height: 15px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`;

const AppDescription = styled.div`
  font-size: 13px;
  color: #8b8fa3;
  line-height: 15px;
  overflow: hidden;
  white-space: wrap;
  text-overflow: ellipsis;
  margin-top: 10px;
  margin-bottom: 10px;
`;

const OperationWrapper = styled.div`
  display: flex;
  grid-column: 1 / -1;
  justify-content: flex-end;
  align-items: center;
  @media screen and (max-width: 500px) {
    > svg {
      display: inline-flex;
    }
  }
  @media (max-width: 500px) { grid-column: 1 / -1; justify-content: flex-end; padding-right: 0; gap: 8px; }
`;

const MONTH_MILLIS = 30 * 24 * 60 * 60 * 1000;

export function MarketplaceResCard(props: { res: HomeRes; }) {
  const { res } = props;

  const subTitle = trans("home.resCardSubTitle", { time: timestampToHumanReadable(res.lastModifyTime, MONTH_MILLIS), creator: res.creator});

  const resInfo = HomeResInfo[res.type];
  if (!resInfo) { return null; }

  return (
    <Wrapper>
      <Card>
        <MultiIconDisplay identifier={res.icon && typeof res.icon === 'string' ? res.icon : '/icon:antd/appstoreoutlined'} width="30px" height="30px" style={{ marginRight: "6px", flexShrink: 0, color: "#b766db" }} />
        <CardInfo
          role="button" tabIndex={0}
          onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); event.currentTarget.click(); } }}
          onClick={(e) => {
            if(res.isMarketplace) {
              handleMarketplaceAppViewClick(res.id , res.isLocalMarketplace);
              return;
            }
          }}
        >
          <TypographyText 
            value={res.title ? res.title : res.name}
            editing={false}
            onChange={(value) => {}}
          />
          <AppTimeOwnerInfoLabel title={subTitle}>{subTitle}</AppTimeOwnerInfoLabel>
          {res.description && 
            <AppDescription title={res.description}>{res.description.length > 150 ? res.description.substring(0, 150) + '...' : res.description}</AppDescription>
          }
        </CardInfo>
        <OperationWrapper>
          <ExecButton onClick={() => handleMarketplaceAppViewClick(res.id, res.isLocalMarketplace)}>
            {trans("view")}
          </ExecButton>
        </OperationWrapper>
      </Card>
    </Wrapper>
  );
}

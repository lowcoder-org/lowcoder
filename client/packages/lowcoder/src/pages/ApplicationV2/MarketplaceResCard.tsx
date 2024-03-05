import { TacoButton } from "lowcoder-design";
import styled from "styled-components";
import { timestampToHumanReadable } from "util/dateTimeUtils";
import { HomeRes } from "./HomeLayout";
import {
  handleMarketplaceAppViewClick,
  HomeResInfo,
} from "../../util/homeResUtils";
import { trans } from "../../i18n";
import { checkIsMobile } from "util/commonUtils";
import history from "util/history";
import { APPLICATION_VIEW_URL } from "constants/routesURL";
import { TypographyText } from "../../components/TypographyText";
import { messageInstance } from "lowcoder-design";
import { Typography } from "antd";
import { MultiIconDisplay } from "../../comps/comps/multiIconDisplay";

const { Text } = Typography;

const EditButton = styled(TacoButton)`
  width: 52px;
  height: 24px;
  padding: 5px 12px;
  margin-right: 12px;
  @media screen and (max-width: 500px) {
    display: none;
  }
`;

const ExecButton = styled(TacoButton)`
  width: 52px;
  height: 24px;
  padding: 5px 12px;
  margin-right: 24px;
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
    display: none;
  }
`;

const Wrapper = styled.div`
  height: auto;
  padding: 0 6px;
  border-radius: 8px;
  margin-bottom: -1px;
  margin-top: 1px;
  background-color: #fcfcfc;

  &:hover {
    background-color: #f5f7fa;
  }
`;

const Card = styled.div`
  display: flex;
  align-items: center;
  height: 100%;
  min-height:100px;
  width: 100%;
  border-bottom: 1px solid #f5f5f6;
  padding: 0 10px;

  button {
    opacity: 0;
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
  }
`;

const CardInfo = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin-left: 14px;
  white-space: wrap;
  width: 284px;
  max-height: 150px;
  flex-grow: 1;
  cursor: pointer;
  overflow: hidden;
  padding-right: 12px;
  padding-top: 12px;

  &:hover {
    .ant-typography {
      color: #315efb;
    }
  }

  .ant-typography {
    padding: 2px 2px 8px 2px;
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
  align-items: center;
  @media screen and (max-width: 500px) {
    > svg {
      display: none;
    }
  }
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
        {res.icon && typeof res.icon === 'string' && (
          <MultiIconDisplay identifier={res.icon} width="30px" height="30px" style={{ marginRight: "6px", flexShrink: 0, color: "#b766db" }} />
        )}
        <CardInfo
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

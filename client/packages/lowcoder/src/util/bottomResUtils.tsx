import styled from "styled-components";
import { ResourceType } from "@lowcoder-ee/constants/queryConstants";
import { BottomResTypeEnum } from "types/bottomRes";
import { HttpMethod } from "api/api";
import {MultiIcon, MultiIconDisplay} from "@lowcoder-ee/comps/comps/multiIconDisplay";
import {
  ClickHouseIcon,
  DataResponderIcon,
  DeleteApiIcon, EsIcon, FileFolderIcon,
  GetApiIcon, GoogleSheetsIcon, GraphqlIcon,
  HeadApiIcon, JSIcon, LowcoderQueryIcon, MariaDBIcon, MongoIcon, MSSQLIcon, MysqlIcon,
  OptionsApiIcon, OracleIcon,
  PatchApiIcon,
  PostApiIcon, PostgresIcon,
  PutApiIcon,
  QueryLibraryIcon, RedisIcon, RestApiIcon, SMTPIcon, SnowflakeIcon, TempStateIcon, TraceApiIcon, TransformerIcon
} from "icons";

const QueryLibrary = styled(MultiIcon(QueryLibraryIcon))`
  g g g {
    stroke: #222222;
  }
`;

export const IconWrapper = styled.div<{ $isRestApi?: boolean }>`
  display: flex;
  width: ${(props) => (props.$isRestApi ? "26px" : "16px")};
  height: ${(props) => (props.$isRestApi ? "13px" : "16px")};
  border-radius: 2px;
  flex-shrink: 0;
  margin-right: 4px;
  align-items: center;
`;

export const LargeBottomResIconWrapper = styled(IconWrapper)`
  width: ${(props) => (props.$isRestApi ? "32px" : "20px")};
  height: ${(props) => (props.$isRestApi ? "16px" : "20px")};
  margin-right: 8px;

  svg {
    width: ${(props) => (props.$isRestApi ? "32px" : "20px")};
    height: ${(props) => (props.$isRestApi ? "16px" : "20px")};
  }
`;

function getBottomResIconInnerByUrl(type: BottomResType, url: string) {
  let fullUrl = url;
  if (!fullUrl.startsWith("http")) {
    fullUrl = `${REACT_APP_NODE_SERVICE_URL !== "" ? REACT_APP_NODE_SERVICE_URL : REACT_APP_API_SERVICE_URL}/node-service/plugin-icons/${url}`;
  }
  return <img style={{ width: "100%", height: "100%" }} src={fullUrl} alt="" />;
}

export type BottomResType =
  | ResourceType
  | BottomResTypeEnum.TempState
  | BottomResTypeEnum.Transformer
  | BottomResTypeEnum.Folder
  | BottomResTypeEnum.DateResponder;

const HttpMethodIcon = {
  DELETE: <MultiIconDisplay identifier={DeleteApiIcon} />,
  GET: <MultiIconDisplay identifier={GetApiIcon} />,
  PATCH: <MultiIconDisplay identifier={PatchApiIcon} />,
  POST: <MultiIconDisplay identifier={PostApiIcon} />,
  PUT: <MultiIconDisplay identifier={PutApiIcon} />,
  HEAD: <MultiIconDisplay identifier={HeadApiIcon} />,
  OPTIONS: <MultiIconDisplay identifier={OptionsApiIcon} />,
  TRACE: <MultiIconDisplay identifier={TraceApiIcon} />,
};

export const getBottomResIcon = (
  type: BottomResType,
  size?: "middle" | "large",
  defaultIconUrl?: string,
  httpMethod?: HttpMethod
) => {
  const getIcon = () => {
    switch (type) {
      case BottomResTypeEnum.TempState:
        return <MultiIconDisplay identifier={TempStateIcon} />;
      case BottomResTypeEnum.Transformer:
        return <MultiIconDisplay identifier={TransformerIcon} />;
      case BottomResTypeEnum.DateResponder:
        return <MultiIconDisplay identifier={DataResponderIcon} />;
      case BottomResTypeEnum.Folder:
        return <MultiIconDisplay identifier={FileFolderIcon} />;
      case "mysql":
        return <MultiIconDisplay identifier={MysqlIcon} />;
      case "mongodb":
        return <MultiIconDisplay identifier={MongoIcon} />;
      case "restApi":
        return httpMethod ? HttpMethodIcon[httpMethod] : <MultiIconDisplay identifier={RestApiIcon} />;
      case "postgres":
        return <MultiIconDisplay identifier={PostgresIcon} />;
      case "js":
        return <MultiIconDisplay identifier={JSIcon} />;
      case "redis":
        return <MultiIconDisplay identifier={RedisIcon} />;
      case "es":
        return <MultiIconDisplay identifier={EsIcon} />;
      case "mssql":
        return <MultiIconDisplay identifier={MSSQLIcon} />;
      case "smtp":
        return <MultiIconDisplay identifier={SMTPIcon} />;
      case "oracle":
        return <MultiIconDisplay identifier={OracleIcon} />;
      case "clickHouse":
        return <MultiIconDisplay identifier={ClickHouseIcon} />;
      case "libraryQuery":
        return <MultiIconDisplay identifier={QueryLibrary} />;
      case "googleSheets":
        return <MultiIconDisplay identifier={GoogleSheetsIcon} />;
      case "graphql":
        return <MultiIconDisplay identifier={GraphqlIcon} />;
      case "lowcoderApi":
        return <MultiIconDisplay identifier={LowcoderQueryIcon} />;
      case "snowflake":
        return <MultiIconDisplay identifier={SnowflakeIcon} />;
      case "mariadb":
        return <MultiIconDisplay identifier={MariaDBIcon} />;
      default:
        if (defaultIconUrl) {
          return getBottomResIconInnerByUrl(type, defaultIconUrl);
        }
        return <MultiIconDisplay identifier={RestApiIcon} />;
    }
  };
  const isRestApi = type === "restApi" && !!httpMethod;
  return size === "large" ? (
    <LargeBottomResIconWrapper $isRestApi={isRestApi}>{getIcon()}</LargeBottomResIconWrapper>
  ) : (
    <IconWrapper $isRestApi={isRestApi}>{getIcon()}</IconWrapper>
  );
};

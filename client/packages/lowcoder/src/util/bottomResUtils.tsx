import styled from "styled-components";
import { ResourceType } from "@lowcoder-ee/constants/queryConstants";
import { BottomResTypeEnum } from "types/bottomRes";
import { HttpMethod } from "api/api";
import {MultiIcon, MultiIconDisplay} from "@lowcoder-ee/comps/comps/multiIconDisplay";

const QueryLibrary = styled(MultiIcon("/icon:svg/QueryLibraryIcon"))`
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
  DELETE: <MultiIconDisplay identifier="/icon:svg/DeleteApiIcon" />,
  GET: <MultiIconDisplay identifier="/icon:svg/GetApiIcon" />,
  PATCH: <MultiIconDisplay identifier="/icon:svg/PatchApiIcon" />,
  POST: <MultiIconDisplay identifier="/icon:svg/PostApiIcon" />,
  PUT: <MultiIconDisplay identifier="/icon:svg/PutApiIcon" />,
  HEAD: <MultiIconDisplay identifier="/icon:svg/HeadApiIcon" />,
  OPTIONS: <MultiIconDisplay identifier="/icon:svg/OptionsApiIcon" />,
  TRACE: <MultiIconDisplay identifier="/icon:svg/TraceApiIcon" />,
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
        return <MultiIconDisplay identifier="/icon:svg/TempStateIcon" />;
      case BottomResTypeEnum.Transformer:
        return <MultiIconDisplay identifier="/icon:svg/TransformerIcon" />;
      case BottomResTypeEnum.DateResponder:
        return <MultiIconDisplay identifier="/icon:svg/DataResponderIcon" />;
      case BottomResTypeEnum.Folder:
        return <MultiIconDisplay identifier="/icon:svg/FileFolderIcon" />;
      case "mysql":
        return <MultiIconDisplay identifier="/icon:svg/MysqlIcon" />;
      case "mongodb":
        return <MultiIconDisplay identifier="/icon:svg/MongoIcon" />;
      case "restApi":
        return httpMethod ? HttpMethodIcon[httpMethod] : <MultiIconDisplay identifier="/icon:svg/RestApiIcon" />;
      case "postgres":
        return <MultiIconDisplay identifier="/icon:svg/PostgresIcon" />;
      case "js":
        return <MultiIconDisplay identifier="/icon:svg/JSIcon" />;
      case "redis":
        return <MultiIconDisplay identifier="/icon:svg/RedisIcon" />;
      case "es":
        return <MultiIconDisplay identifier="/icon:svg/EsIcon" />;
      case "mssql":
        return <MultiIconDisplay identifier="/icon:svg/MSSQLIcon" />;
      case "smtp":
        return <MultiIconDisplay identifier="/icon:svg/SMTPIcon" />;
      case "oracle":
        return <MultiIconDisplay identifier="/icon:svg/OracleIcon" />;
      case "clickHouse":
        return <MultiIconDisplay identifier="/icon:svg/ClickHouseIcon" />;
      case "libraryQuery":
        return <MultiIconDisplay identifier="/icon:svg/QueryLibrary" />;
      case "googleSheets":
        return <MultiIconDisplay identifier="/icon:svg/GoogleSheetsIcon" />;
      case "graphql":
        return <MultiIconDisplay identifier="/icon:svg/GraphqlIcon" />;
      case "lowcoderApi":
        return <MultiIconDisplay identifier="/icon:svg/LowcoderQueryIcon" />;
      case "snowflake":
        return <MultiIconDisplay identifier="/icon:svg/SnowflakeIcon" />;
      case "mariadb":
        return <MultiIconDisplay identifier="/icon:svg/MariaDBIcon" />;
      default:
        if (defaultIconUrl) {
          return getBottomResIconInnerByUrl(type, defaultIconUrl);
        }
        return <MultiIconDisplay identifier="/icon:svg/RestApiIcon" />;
    }
  };
  const isRestApi = type === "restApi" && !!httpMethod;
  return size === "large" ? (
    <LargeBottomResIconWrapper $isRestApi={isRestApi}>{getIcon()}</LargeBottomResIconWrapper>
  ) : (
    <IconWrapper $isRestApi={isRestApi}>{getIcon()}</IconWrapper>
  );
};

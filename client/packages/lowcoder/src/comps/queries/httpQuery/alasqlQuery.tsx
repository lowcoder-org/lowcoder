import { QueryConfigItemWrapper, QueryConfigLabel, QueryConfigWrapper } from "components/query";
import { simpleMultiComp } from "comps/generators/multi";
import { JSONValue } from "../../../util/jsonTypes";
import { ParamsStringControl } from "../../controls/paramsControl";
import { dropdownControl } from "@lowcoder-ee/comps/controls/dropdownControl";
import { QueryResult } from "../queryComp";
import { QUERY_EXECUTION_ERROR, QUERY_EXECUTION_OK } from "@lowcoder-ee/constants/queryConstants";
import { getDynamicStringSegments, isDynamicSegment } from "lowcoder-core";
import alasql from "alasql";
import { trans } from "i18n";

const childrenMap = {
  databaseType: dropdownControl(
    [
      { label: "Data Query", value: "dataQuery" },
      { label: "Local Database", value: "localDB" },
    ] as const,
    "dataQuery"
  ),
  database: dropdownControl(
    [
      { label: "Local Storage", value: "LOCALSTORAGE" },
      { label: "IndexedDB", value: "INDEXEDDB" },
    ] as const,
    "LOCALSTORAGE"
  ),
  sql: ParamsStringControl,
};

const AlaSqlTmpQuery = simpleMultiComp(childrenMap);

// TODO: Support multiple queries
export class AlaSqlQuery extends AlaSqlTmpQuery {
  override getView() {
    const children = this.children;
    const params = [ ...children.sql.getQueryParams() ];
    const databaseType = children.databaseType.getView();
    const selectedDB = children.database.getView();
    const paramsMap: Record<string, any> = {};
    params.forEach(({key, value}) => {
      paramsMap[key] = value();
    });

    const sqlQuery = children.sql.children.text.unevaledValue.replace(/  +/g, ' ');
    const isCreateDBQuery = sqlQuery.toUpperCase().startsWith('CREATE DATABASE');

    return async (p: { args?: Record<string, unknown> }): Promise<QueryResult> => {
      try {
        let result: JSONValue;
        const timer = performance.now();

        if (databaseType === 'localDB' && isCreateDBQuery) {
          const updatedQuery = `${sqlQuery.slice(0, 6)} ${selectedDB} ${sqlQuery.slice(6)}`;
          const tableName = updatedQuery.split(' ').pop()?.replace(';', '');
          result = alasql(updatedQuery);
          result = alasql(`ATTACH ${selectedDB} DATABASE ${tableName};`);
        } else {
          let segments = getDynamicStringSegments(sqlQuery);
          let dataArr: any = [];
          segments = segments.map((segment) => {
            if (isDynamicSegment(segment)) {
              const key = segment.replace('{{','').replace('}}','');
              dataArr.push(paramsMap[key]);
              return '?';
            }
            return segment;
          })
          result = alasql(segments.join(' '), dataArr);
        }

        return {
          data: result as JSONValue,
          code: QUERY_EXECUTION_OK,
          success: true,
          runTime: Number((performance.now() - timer).toFixed()),
        };
      } catch (e) {
        return {
          success: false,
          data: "",
          code: QUERY_EXECUTION_ERROR,
          message: (e as any).message || "",
        };
      }
    };
  }

  propertyView(props: { datasourceId: string }) {
    return <PropertyView {...props} comp={this} />;
  }
}

const PropertyView = (props: { comp: InstanceType<typeof AlaSqlQuery>; datasourceId: string }) => {
  const { comp } = props;
  const { children } = comp;

  return (
    <>
      <QueryConfigWrapper>
        <QueryConfigLabel>{trans("query.databaseType")}</QueryConfigLabel>
        <QueryConfigItemWrapper>
          {children.databaseType.propertyView({
            styleName: "medium",
            width: "100%",
          })}
        </QueryConfigItemWrapper>
      </QueryConfigWrapper>

      {children.databaseType.getView() === 'localDB' && (
        <QueryConfigWrapper>
          <QueryConfigLabel>{trans("query.chooseDatabase")}</QueryConfigLabel>
          <QueryConfigItemWrapper>
            {children.database.propertyView({
              styleName: "medium",
              width: "100%",
            })}
          </QueryConfigItemWrapper>
        </QueryConfigWrapper>
      )}

      <QueryConfigWrapper>
        <QueryConfigItemWrapper>
          {children.sql.propertyView({
          placement: "bottom",
          placeholder: "SELECT * FROM users WHERE user_id = {{userId}}::uuid", 
          styleName: "medium",
          language: "sql",
          enableMetaCompletion: true,
        })}
        </QueryConfigItemWrapper>
      </QueryConfigWrapper>
    </>
  );
};

import { default as Spin } from "antd/es/spin";
import {
  FetchCheckNode,
  FetchInfo,
  fromRecord,
  mergeExtra,
  MultiCompConstructor,
  CompAction,
  CompActionTypes,
} from "lowcoder-core";
import styled from "styled-components";
import { codeControl } from "comps/controls/codeControl";
import { setFieldsNoTypeCheck } from "util/objectUtils";
import Skeleton from "antd/es/skeleton";
import { ReactNode, useContext, useMemo } from "react";
import { CompContext } from "../utils/compContext";
import LoadingOutlined from "@ant-design/icons/LoadingOutlined";
import { ThemeContext } from "../utils/themeContext";

const Wrapper = styled.div`
  &,
  .ant-spin-nested-loading,
  .ant-spin-container {
    width: 100%;
    height: 100%;
  }
`;

const __WITH_IS_LOADING = "__WITH_IS_LOADING";

const LoadingWrapper = ({
  isLoading,
  children,
}: {
  isLoading: boolean,
  children: ReactNode,
}) => {
  const compState = useContext(CompContext);
  const currentTheme = useContext(ThemeContext)?.theme;

  const showLoading = useMemo(() => {
    const themeDataIndicator = currentTheme?.showDataLoadingIndicators;
    const compDataIndicator = compState.comp?.comp?.showDataLoadingIndicators;

    return isLoading ? (
      compDataIndicator !== 'undefined' ? compDataIndicator : Boolean(themeDataIndicator)
    ) : false;
  }, [
    isLoading,
    currentTheme?.showDataLoadingIndicators,
    compState.comp?.comp?.showDataLoadingIndicators,
  ]);

  if (currentTheme?.dataLoadingIndicator === 'skeleton') {
    return (
      <Wrapper>
        <Skeleton active loading={showLoading}>
          {children}
        </Skeleton>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <Spin
        spinning={showLoading}
        indicator={<LoadingOutlined style={{ fontSize: 15 }} spin />}
      >
        {children}
      </Spin>
    </Wrapper>
  )
}
/**
 * Unified increase isLoading effect
 */
export function withIsLoading<T extends MultiCompConstructor>(VariantComp: T): T {
  // @ts-ignore
  class IS_LOADING_CLASS extends VariantComp {
    readonly isLoading: boolean = false;

    override extraNode() {
      return mergeExtra(super.extraNode(), {
        node: {
          [__WITH_IS_LOADING]: new FetchCheckNode(fromRecord(this.childrenNode())),
        },
        updateNodeFields: (value: any) => {
          const fetchInfo = value[__WITH_IS_LOADING] as FetchInfo;
          return { isLoading: fetchInfo?.isFetching };
        },
      });
    }

    override getView() {
      return (
        <LoadingWrapper isLoading={this.isLoading}>
          {super.getView()}
        </LoadingWrapper>
      );
    }
  }

  return IS_LOADING_CLASS;
}

export const __SUPER_NODE_KEY = "__LOADING_SUPER_NODE";

/**
 * only add isLoading method to codeControl, without override getView
 * @param VariantComp
 */
export function withIsLoadingMethod<T extends ReturnType<typeof codeControl>>(VariantComp: T) {
  // @ts-ignore
  class IS_LOADING_CLASS extends VariantComp {
    private loading: boolean = false;

    isLoading() {
      return this.loading;
    }

    override reduce(action: CompAction) {
      if (action.type === CompActionTypes.UPDATE_NODES_V2) {
        const value = action.value;
        const superValue = value[__SUPER_NODE_KEY];
        const fetchInfo = value[__WITH_IS_LOADING] as FetchInfo;
        const comp = super.reduce({
          ...action,
          value: superValue,
        });
        if (fetchInfo.isFetching !== this.loading) {
          return setFieldsNoTypeCheck(comp, {
            loading: fetchInfo.isFetching,
          });
        } else {
          return comp;
        }
      }
      return super.reduce(action);
    }

    override nodeWithoutCache() {
      const superNode = super.nodeWithoutCache();
      return fromRecord({
        [__SUPER_NODE_KEY]: superNode,
        [__WITH_IS_LOADING]: new FetchCheckNode(superNode),
      }) as any;
    }
  }

  return IS_LOADING_CLASS;
}

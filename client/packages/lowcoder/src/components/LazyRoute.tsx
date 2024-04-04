import { default as Skeleton } from "antd/es/skeleton";
import { ComponentType, lazy, Suspense, useRef } from "react";
import { Route, RouteProps } from "react-router";
import PageSkeleton from "./PageSkeleton";
import EditorSkeletonView from "@lowcoder-ee/pages/editor/editorSkeletonView";
import { ProductLoading } from "./ProductLoading";

interface IProps extends RouteProps {
  /**
   * normal: only one antd's skeleton
   * layout: including basic layout
   */
  fallback?: "normal" | "layout" | "outAppLayout";
}

const fallbacks = {
  normal: <Skeleton style={{ padding: 32 }} />,
  layout: <ProductLoading />,
  outAppLayout: <PageSkeleton logoWithName />,
};

export default function LazyRoute(props: IProps) {
  const { fallback = "normal", ...routeProps } = props;
  return (
    <Suspense fallback={fallbacks[fallback]}>
      <Route {...routeProps}></Route>
    </Suspense>
  );
}

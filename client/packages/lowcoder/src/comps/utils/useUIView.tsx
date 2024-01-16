import React, { ReactNode, Suspense } from "react";
import { useIsMobile } from "util/hooks";
import { default as Skeleton } from "antd/es/skeleton";

export function useUIView(mobileView: ReactNode, pcView: ReactNode) {
  return <>{useIsMobile() ? <Suspense fallback={<Skeleton />}>{mobileView}</Suspense> : pcView}</>;
}

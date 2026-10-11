import { useCallback, useEffect, useMemo, useState } from "react";
import { hookToStateComp } from "../generators/hookToComp";
import { CanvasContainerID } from "@lowcoder-ee/constants/domLocators";

enum ScreenTypes {
  Mobile = 'mobile',
  Tablet = 'tablet',
  Desktop = 'desktop',
}

type ScreenType = typeof ScreenTypes[keyof typeof ScreenTypes]

type ScreenInfo = {
  width?: number;
  height?: number;
  deviceType?: ScreenType;
  isDesktop?: boolean;
  isTablet?: boolean;
  isMobile?: boolean;
}

export function useScreenInfo() {
  const canvasContainer = document.getElementById(CanvasContainerID);
  const canvas = document.getElementsByClassName('lowcoder-app-canvas')?.[0];
  const canvasWidth = useMemo(() => {
    return canvasContainer?.clientWidth || canvas?.clientWidth;
  }, [canvasContainer?.clientWidth, canvas?.clientWidth]);

  const getDeviceType = (width: number) => {
    if (width < 768) return ScreenTypes.Mobile;
    if (width < 1024) return ScreenTypes.Tablet;
    return ScreenTypes.Desktop;
  }
  const getFlagsByDeviceType = (deviceType: ScreenType) => {
    const flags = {
      isMobile: false,
      isTablet: false,
      isDesktop: false,
    };
    if(deviceType === ScreenTypes.Mobile) {
      return { ...flags, isMobile: true };
    }
    if(deviceType === ScreenTypes.Tablet) {
      return { ...flags, isTablet: true };
    }
    return { ...flags, isDesktop: true };
  }

  const getScreenInfo = useCallback(() => {
    const { innerWidth, innerHeight } = window;
    const deviceType = getDeviceType(canvasWidth || window.innerWidth);
    const flags = getFlagsByDeviceType(deviceType);
    
    return {
      width: innerWidth,
      height: innerHeight,
      canvasWidth,
      deviceType,
      ...flags
    };
  }, [canvasWidth])

  const [screenInfo, setScreenInfo] = useState<ScreenInfo>({});
  
  const updateScreenInfo = useCallback(() => {
    setScreenInfo(getScreenInfo());
  }, [getScreenInfo])

  useEffect(() => {
    window.addEventListener('resize', updateScreenInfo);
    updateScreenInfo();
    return () => window.removeEventListener('resize', updateScreenInfo);
  }, [ updateScreenInfo ])

  useEffect(() => {
    if (canvasWidth) {
      updateScreenInfo();
    }
  }, [canvasWidth]);

  return screenInfo;
}

export const ScreenInfoHookComp = hookToStateComp(useScreenInfo);

import { EditorContext } from "comps/editorState";
import { EditorContainer } from "pages/common/styledComponent";
import React, { Profiler, useContext, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { profilerCallback } from "util/cacheUtils";
import {
  ContainerBaseProps,
  GridItemsType,
  GridLayoutType,
  InnerGrid,
} from "../containerComp/containerView";
import { CheckSelectFn, DragSelector } from "./dragSelector";
import { useMaxWidth } from "util/hooks";
import { ExternalEditorContext } from "util/context/ExternalEditorContext";
import { AppTypeEnum } from "constants/applicationConstants";
import { EditorContainerPadding, TopHeaderHeight } from "constants/style";
import { ThemeContext } from "comps/utils/themeContext";
import { checkIsMobile } from "util/commonUtils";
import { CanvasContainerID } from "constants/domLocators";
import { CNRootContainer } from "constants/styleSelectors";
import { isValidColor, isValidGradient, ScrollBar } from "lowcoder-design";
import { defaultTheme } from "@lowcoder-ee/constants/themeConstants";
import { isEqual } from "lodash";
import { DEFAULT_GRID_COLUMNS, DEFAULT_ROW_COUNT, DEFAULT_ROW_HEIGHT } from "@lowcoder-ee/layout/calculateUtils";
import { getBackgroundStyle } from "@lowcoder-ee/util/styleUtils";

const UICompContainer = styled.div<{
  $maxWidth?: number;
  $rowCount?: number;
  readOnly?: boolean;
  $bgColor: string;
  $bgImage?: string;
  $bgImageSize?: string;
  $bgImageRepeat?: string;
  $bgImageOrigin?: string;
  $bgImagePosition?: string;
}>`
  height: auto;
  min-height: ${props => props.$rowCount === Infinity ? '100%' : 'auto'};
  margin: 0 auto;
  max-width: ${(props) => props.$maxWidth || 1600}px;
  
  ${props => getBackgroundStyle({
    background: props.$bgColor,
    backgroundImage: props.$bgImage,
    backgroundImageSize: props.$bgImageSize,
    backgroundImageRepeat: props.$bgImageRepeat,
    backgroundImageOrigin: props.$bgImageOrigin,
    backgroundImagePosition: props.$bgImagePosition,
  })}
`;

// modal/drawer container
export const CanvasContainer = styled.div<{ $maxWidth: number }>`
  max-width: ${(props) => props.$maxWidth}px;
  min-width: min(${(props) => props.$maxWidth}px, 718px);
  margin: 0 auto;
  height: 100%;
  contain: paint;
`;

const DEFAULT_CONTAINER_PADDING = [20, 20] as [number, number];
const DEFAULT_MOBILE_PADDING = [4, 4] as [number, number];
const DEFAULT_EXTRA_HEIGHT = "25vh";

const gridLayoutCanvasProps = {
  autoHeight: true,
  isCanvas: true,
};

function getDragSelectedNames(
  items: GridItemsType,
  layout: GridLayoutType,
  checkSelectFunc?: CheckSelectFn
) {
  const selectedComps = new Set<string>();
  if (checkSelectFunc && selectedComps) {
    Object.values(layout).forEach((layoutItem) => {
      const key = layoutItem.i;
      if (items.hasOwnProperty(key)) {
        const item = items[key];
        const name = item.name;
        checkSelectFunc?.(
          document.getElementById(key) as HTMLDivElement, // fixme use react ref
          (result) => (result ? selectedComps?.add(name) : selectedComps?.delete(name))
        );
      }
    });
  }
  return selectedComps;
}

const EmptySet = new Set<string>();

export const CanvasView = React.memo((props: ContainerBaseProps) => {
  const currentTheme = useContext(ThemeContext)?.theme;
  const isDefaultTheme = useContext(ThemeContext)?.themeId === 'default-theme-id';
  const isPreviewTheme = useContext(ThemeContext)?.themeId === 'preview-theme';
  const editorState = useContext(EditorContext);
  const [dragSelectedComps, setDragSelectedComp] = useState(EmptySet);
  const scrollContainerRef = useRef(null);
  const appSettings = editorState.getAppSettings();
  const maxWidthFromHook = useMaxWidth();

  const maxWidth = useMemo(
    () => appSettings.maxWidth ?? maxWidthFromHook,
    [appSettings, maxWidthFromHook]
  );

  const preventStylesOverwriting = useMemo(
    () => appSettings.preventAppStylesOverwriting,
    [appSettings]
  );

  const isMobile = checkIsMobile(maxWidth);
  // const defaultContainerPadding = isMobile ? DEFAULT_MOBILE_PADDING : DEFAULT_CONTAINER_PADDING;

  const externalState = useContext(ExternalEditorContext);
  const {
    readOnly,
    appType,
    rootContainerExtraHeight = DEFAULT_EXTRA_HEIGHT,
    rootContainerPadding,
    rootContainerOverflow,
  } = externalState;

  const isModule = appType === AppTypeEnum.Module;

  const bgColor = useMemo(
    () => {
      if (isPreviewTheme) return currentTheme?.canvas ?? defaultTheme.canvas;

      const themeGridBgColor = preventStylesOverwriting ? undefined : currentTheme?.canvas;
      return themeGridBgColor || appSettings.gridBg || defaultTheme.canvas;
    },
    [preventStylesOverwriting, appSettings, currentTheme, defaultTheme]
  );

  const bgImage = useMemo(
    () => {
      if (isPreviewTheme) return currentTheme?.gridBgImage;

      const themeGridBgImage = preventStylesOverwriting ? undefined : currentTheme?.gridBgImage;
      return themeGridBgImage || appSettings.gridBgImage;
    },
    [preventStylesOverwriting, appSettings, currentTheme],
  );

  const bgImageRepeat = useMemo(
    () => {
      if (isPreviewTheme) return currentTheme?.gridBgImageRepeat ?? defaultTheme.gridBgImageRepeat;

      const themeGridBgImageRepeat = preventStylesOverwriting ? undefined : currentTheme?.gridBgImageRepeat;
      return themeGridBgImageRepeat || appSettings.gridBgImageRepeat || defaultTheme?.gridBgImageRepeat;
    },
    [preventStylesOverwriting, appSettings, currentTheme, defaultTheme],
  );
  const bgImageSize = useMemo(
    () => {
      if (isPreviewTheme) return currentTheme?.gridBgImageSize ?? defaultTheme.gridBgImageSize;

      const themeGridBgImageSize = preventStylesOverwriting ? undefined : currentTheme?.gridBgImageSize;
      return themeGridBgImageSize || appSettings.gridBgImageSize || defaultTheme?.gridBgImageSize;
    },
    [preventStylesOverwriting, appSettings, currentTheme, defaultTheme],
  );
  const bgImagePosition = useMemo(
    () => {
      if (isPreviewTheme) return currentTheme?.gridBgImagePosition ?? defaultTheme.gridBgImagePosition;

      const themeGridBgImagePosition = preventStylesOverwriting ? undefined : currentTheme?.gridBgImagePosition;
      return themeGridBgImagePosition || appSettings.gridBgImagePosition || defaultTheme?.gridBgImagePosition;
    },
    [preventStylesOverwriting, appSettings, currentTheme, defaultTheme],
  );
  const bgImageOrigin = useMemo(
    () => {
      if (isPreviewTheme) return currentTheme?.gridBgImageOrigin ?? defaultTheme.gridBgImageOrigin;

      const themeGridBgImageOrigin = preventStylesOverwriting ? undefined : currentTheme?.gridBgImageOrigin;
      return themeGridBgImageOrigin || appSettings.gridBgImageOrigin || defaultTheme?.gridBgImageOrigin;
    },
    [preventStylesOverwriting, appSettings, currentTheme, defaultTheme],
  );

  const defaultGrid = useMemo(() => {
    if (isPreviewTheme) return currentTheme?.gridColumns ?? defaultTheme.gridColumns ?? String(DEFAULT_GRID_COLUMNS);

    const themeGridColumns = preventStylesOverwriting ? undefined : currentTheme?.gridColumns;
    return themeGridColumns
      || String(appSettings?.gridColumns)
      || defaultTheme?.gridColumns
      || String(DEFAULT_GRID_COLUMNS);
  }, [preventStylesOverwriting, appSettings, currentTheme, defaultTheme]);

  const defaultRowHeight = useMemo(() => {
    if (isPreviewTheme) return currentTheme?.gridRowHeight ?? defaultTheme.gridRowHeight ?? String(DEFAULT_ROW_HEIGHT);

    const themeGridRowHeight = preventStylesOverwriting ? undefined : currentTheme?.gridRowHeight;
    return themeGridRowHeight
      || String(appSettings?.gridRowHeight)
      || defaultTheme?.gridRowHeight
      || String(DEFAULT_ROW_HEIGHT);
  }, [preventStylesOverwriting, appSettings, currentTheme, defaultTheme]);

  const defaultRowCount = useMemo(() => {
    if (isPreviewTheme) return currentTheme?.gridRowCount ?? defaultTheme.gridRowCount;

    const themeGridRowCount = preventStylesOverwriting ? undefined : currentTheme?.gridRowCount;
    return themeGridRowCount
      || appSettings?.gridRowCount
      || defaultTheme?.gridRowCount
      || DEFAULT_ROW_COUNT;
  }, [preventStylesOverwriting, appSettings, currentTheme, defaultTheme]);

  const defaultContainerPadding: [number, number] = useMemo(() => {
    const DEFAULT_PADDING = isMobile ? DEFAULT_MOBILE_PADDING : DEFAULT_CONTAINER_PADDING;
    
    if (isPreviewTheme) {
      return [
        currentTheme?.gridPaddingX ?? defaultTheme.gridPaddingX ?? DEFAULT_PADDING[0],
        currentTheme?.gridPaddingY ?? defaultTheme.gridPaddingY ?? DEFAULT_PADDING[1],
      ];
    }

    const themeGridPaddingX = preventStylesOverwriting || isDefaultTheme ? undefined : currentTheme?.gridPaddingX;
    const themeGridPaddingY = preventStylesOverwriting || isDefaultTheme ? undefined : currentTheme?.gridPaddingY;

    let paddingX = themeGridPaddingX ?? appSettings?.gridPaddingX ?? defaultTheme?.gridPaddingX ?? DEFAULT_PADDING[0];
    let paddingY = themeGridPaddingY ?? appSettings?.gridPaddingY ?? defaultTheme?.gridPaddingY ?? DEFAULT_PADDING[1];

    return [paddingX, paddingY];
  }, [preventStylesOverwriting, appSettings, isMobile, currentTheme, defaultTheme]);

  const defaultMinHeight = useMemo(() => {
    return defaultRowCount === DEFAULT_ROW_COUNT
      ? `calc(100vh - ${TopHeaderHeight} - ${EditorContainerPadding} * 2)`
      : undefined;
  }, [defaultRowCount]);

  const positionParams = useMemo(() => ({
    ...props.positionParams,
    cols: parseInt(defaultGrid),
    rowHeight: parseInt(defaultRowHeight),
  }), [props.positionParams, defaultGrid, defaultRowHeight]);

  if (readOnly) {
    return (
      <UICompContainer
        $maxWidth={maxWidth}
        $rowCount={defaultRowCount}
        readOnly={true}
        className={CNRootContainer}
        $bgColor={bgColor}
        $bgImage={bgImage}
        $bgImageSize={bgImageSize}
        $bgImageRepeat={bgImageRepeat}
        $bgImageOrigin={bgImageOrigin}
        $bgImagePosition={bgImagePosition}
      >
        <Profiler id="Panel" onRender={profilerCallback}>
          <InnerGrid
            containerPadding={defaultContainerPadding}
            overflow={rootContainerOverflow}
            {...props}
            positionParams={positionParams}
            {...gridLayoutCanvasProps}
            bgColor={bgColor}
            radius="0px"
            emptyRows={defaultRowCount}
            minHeight={defaultMinHeight}
            extraHeight={defaultRowCount === DEFAULT_ROW_COUNT ? rootContainerExtraHeight : undefined }
          />
        </Profiler>
      </UICompContainer>
    );
  }

  return (
    <CanvasContainer $maxWidth={maxWidth} id={CanvasContainerID}>
      <EditorContainer ref={scrollContainerRef}>
        <UICompContainer
          $maxWidth={maxWidth}
          $rowCount={defaultRowCount}
          className={CNRootContainer}
          $bgColor={bgColor}
          $bgImage={bgImage}
          $bgImageSize={bgImageSize}
          $bgImageRepeat={bgImageRepeat}
          $bgImageOrigin={bgImageOrigin}
          $bgImagePosition={bgImagePosition}
        >
          <DragSelector
            onMouseDown={() => {
              setDragSelectedComp(EmptySet);
            }}
            onMouseUp={() => {
              editorState.setSelectedCompNames(dragSelectedComps);
              setDragSelectedComp(EmptySet);
            }}
            onMouseMove={(checkSelectFunc) => {
              const selectedName = getDragSelectedNames(props.items, props.layout, checkSelectFunc);
              setDragSelectedComp(selectedName);
            }}
          >
            <Profiler id="Panel" onRender={profilerCallback}>
              <InnerGrid
                containerPadding={defaultContainerPadding}
                overflow={rootContainerOverflow}
                {...props}
                {...gridLayoutCanvasProps}
                dragSelectedComps={dragSelectedComps}
                scrollContainerRef={scrollContainerRef}
                isDroppable={!isModule}
                isDraggable={!isModule}
                enableGridLines
                bgColor={bgColor}
                positionParams={positionParams}
                emptyRows={defaultRowCount}
                minHeight={defaultMinHeight}
                extraHeight={defaultRowCount === DEFAULT_ROW_COUNT ? rootContainerExtraHeight : undefined }
              />
            </Profiler>
          </DragSelector>
        </UICompContainer>
      </EditorContainer>
    </CanvasContainer>
  );
}, (prevProps, newProps) => {
  return isEqual(prevProps, newProps);
});

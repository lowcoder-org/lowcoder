import { default as Pagination } from "antd/es/pagination";
import { EditorContext } from "comps/editorState";
import { BackgroundColorContext } from "comps/utils/backgroundColorContext";
import _, { findIndex } from "lodash";
import { ConstructorToView, deferAction } from "lowcoder-core";
import { DragIcon, HintPlaceHolder, ScrollBar, pageItemRender } from "lowcoder-design";
import { RefObject, useContext, createContext, useMemo, useRef, useEffect } from "react";
import { ResizePayload, useResizeDetector } from "react-resize-detector";
import styled from "styled-components";
import { checkIsMobile } from "util/commonUtils";
import { useDelayState } from "util/hooks";
import { SimpleContainerComp } from "../containerBase/simpleContainerComp";
import {
  ContainerBaseProps,
  gridItemCompToGridItems,
  InnerGrid,
} from "../containerComp/containerView";
import { ContextContainerComp } from "./contextContainerComp";
import { ListViewImplComp } from "./listViewComp";
import { getCurrentItemParams, getData } from "./listViewUtils";
import { useMergeCompStyles } from "@lowcoder-ee/util/hooks";
import { childrenToProps } from "@lowcoder-ee/comps/generators/multi";
import { AnimationStyleType } from "@lowcoder-ee/comps/controls/styleControlConstants";
import { getBackgroundStyle } from "@lowcoder-ee/util/styleUtils";
import { DndContext } from "@dnd-kit/core";
import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { JSONObject } from "@lowcoder-ee/util/jsonTypes";

const ListViewWrapper = styled.div<{ $style: any; $paddingWidth: string,$animationStyle:AnimationStyleType }>`
  height: 100%;
  border: 1px solid ${(props) => props.$style.border};
  border-radius: ${(props) => props.$style.radius};
  padding: 3px ${(props) => props.$paddingWidth};
  rotate: ${(props) => props.$style.rotation};
  ${props => getBackgroundStyle(props.$style)}
  ${props=>props.$animationStyle}
  
`;

const FooterWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3px;
`;

const BodyWrapper = styled.div<{ $autoHeight: boolean }>`
  overflow: ${(props) => (!props.$autoHeight ? "auto" : "hidden")}; 
  height: ${(props) => (props.$autoHeight ? "auto" : "calc(100% - 32px)")};
`;

const FlexWrapper = styled.div` 
  height: 100%;
  display: flex;
  align-items: center;
  // justify-content: center;
`;

const ListOrientationWrapper = styled.div<{
  $isHorizontal: boolean,
  $autoHeight : boolean,
  $isGrid: boolean,
}>`
  height: ${(props) => (props.$autoHeight ? "auto" : "100%")};
  display: flex;
  flex-direction: ${(props) => (props.$isHorizontal ? "row" : "column")};
`;

const StyledDragIcon = styled(DragIcon)`
  height: 16px;
  width: 16px;
  color: #8b8fa3;

  &:hover {
    cursor: grab;
    outline: none;
  }

  &:focus {
    cursor: grab;
    outline: none;
  }
`;

type MinHorizontalWidthContextType = {
  horizontalWidth: string,
  minHorizontalWidth?: string,
}

const MinHorizontalWidthContext = createContext<MinHorizontalWidthContextType>({
  horizontalWidth: '100%',
  minHorizontalWidth: '100px',
});

const ContainerInListView = (props: ContainerBaseProps & {itemIdx: number, enableSorting?: boolean} ) => {
  const {
    horizontalWidth,
    minHorizontalWidth
  } = useContext(MinHorizontalWidthContext);

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: String(props.itemIdx),
  });

  if (!props.enableSorting) {
    return (
      <div
        style={{
          width: horizontalWidth,
          minWidth: minHorizontalWidth || '0px',
        }}
      >
        <InnerGrid
          {...props}
          emptyRows={15}
          containerPadding={[4, 4]}
          hintPlaceholder={HintPlaceHolder}
        />
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        width: horizontalWidth,
        minWidth: minHorizontalWidth || '0px',
        transform: CSS.Transform.toString(transform),
        transition,
        display: 'flex',
        flexWrap: 'nowrap',
        alignItems: 'center',
      }}
    >
      {<StyledDragIcon {...attributes} {...listeners} />}
      <InnerGrid
        {...props}
        emptyRows={15}
        containerPadding={[4, 4]}
        hintPlaceholder={HintPlaceHolder}
      />
    </div>
  );
};

type ListItemProps = {
  itemIdx: number;
  offset: number;
  containerProps: ConstructorToView<typeof SimpleContainerComp>;
  horizontalGridCells?: number,
  autoHeight: boolean;
  scrollContainerRef?: RefObject<HTMLDivElement>;
  minHeight?: string;
  unMountFn?: () => void;
  minHorizontalWidth?: string;
  horizontalWidth: string;
  enableSorting?: boolean;
};

function ListItem({
  minHorizontalWidth,
  horizontalWidth,
  ...props
}: ListItemProps) {
  const {
    itemIdx,
    offset,
    containerProps,
    autoHeight,
    scrollContainerRef,
    minHeight,
    horizontalGridCells,
    enableSorting,
  } = props;

  // disable the unmount function to save user's state with pagination
  // useEffect(() => {
  //   return () => {
  //     props.unMountFn?.();
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

  return (
    <MinHorizontalWidthContext.Provider
      value={{
        horizontalWidth,
        minHorizontalWidth
      }}
    >
      <ContainerInListView
        itemIdx={itemIdx}
        layout={containerProps.layout}
        items={gridItemCompToGridItems(containerProps.items)}
        horizontalGridCells={horizontalGridCells}
        positionParams={containerProps.positionParams}
        // all layout changes should only reflect on the commonContainer
        dispatch={itemIdx === offset ? containerProps.dispatch : _.noop}
        style={{
          height: "100%",
          // in case of horizontal mode, minHorizontalWidth is 0px
          width: minHorizontalWidth || '100%',
          backgroundColor: "transparent",
          // flex: "auto",
        }}
        autoHeight={autoHeight}
        isDroppable={itemIdx === offset}
        isDraggable={itemIdx === offset}
        isResizable={itemIdx === offset}
        isSelectable={itemIdx === offset}
        scrollContainerRef={scrollContainerRef}
        overflow={"hidden"}
        minHeight={minHeight}
        enableGridLines={true}
        enableSorting={enableSorting}
      />
    </MinHorizontalWidthContext.Provider>
  );
}

type Props = {
  comp: InstanceType<typeof ListViewImplComp>;
};

export function ListView(props: Props) {
  const { comp } = props;
  const children = comp.children;
  const ref = useRef(null);
  const editorState = useContext(EditorContext);
  const isDragging = editorState.isDragging;
  const [listHeight, setListHeight] = useDelayState(0, isDragging);
  const dynamicHeight = useMemo(() => children.dynamicHeight.getView(), [children.dynamicHeight]);
  const heightUnitOfRow = useMemo(
    () => children.heightUnitOfRow.getView(),
    [children.heightUnitOfRow]
  );
  const containerFn = useMemo(() => children.container.getView(), [children.container]);
  const itemIndexName = useMemo(() => children.itemIndexName.getView(), [children.itemIndexName]);
  const itemDataName = useMemo(() => children.itemDataName.getView(), [children.itemDataName]);
  const { data, itemCount: totalCount } = useMemo(
    () => getData(children.noOfRows.getView()),
    [children.noOfRows]
  );
  const listData = useMemo(() => children.listData.getView(), [children.listData]);
  const horizontalGridCells = useMemo(() => children.horizontalGridCells.getView(), [children.horizontalGridCells]);
  const autoHeight = useMemo(() => children.autoHeight.getView(), [children.autoHeight]);
  const showHorizontalScrollbar = useMemo(() => children.showHorizontalScrollbar.getView(), [children.showHorizontalScrollbar]);
  const showVerticalScrollbar = useMemo(() => children.showVerticalScrollbar.getView(), [children.showVerticalScrollbar])
  const horizontal = useMemo(() => children.horizontal.getView(), [children.horizontal]);
  const minHorizontalWidth = useMemo(() => children.minHorizontalWidth.getView(), [children.minHorizontalWidth]);
  const noOfColumns = useMemo(
    () => Math.max(1, children.noOfColumns.getView()),
    [children.noOfColumns]
  );
  const pageInfo = useMemo(() => {
    const pagination = children.pagination.getView();
    const total = pagination.total || totalCount;
    let current = pagination.current;
    let offset = (current - 1) * pagination.pageSize;
    const currentPageSize = Math.max(0, Math.min(pagination.pageSize, total - offset));
    return {
      pagination: { ...pagination, current: current, total: total },
      offset,
      currentPageSize,
      total,
    };
  }, [children.pagination, totalCount]);

  const enableSorting = useMemo(() => children.enableSorting.getView(), [children.enableSorting]);

  useEffect(() => {
    children.listData.dispatchChangeValueAction(data);
  }, [JSON.stringify(data)]);

  const style = children.style.getView();
  const animationStyle = children.animationStyle.getView();

  const commonLayout = comp.realSimpleContainer()!.children.layout.getView();
  const isOneItem =
    pageInfo.currentPageSize > 0 && (_.isEmpty(commonLayout) || editorState.isDragging);
  const noOfRows = isOneItem
    ? 1
    : Math.floor((pageInfo.currentPageSize + noOfColumns - 1) / noOfColumns);
  const rowHeight = isOneItem ? "100%" : dynamicHeight ? "auto" : heightUnitOfRow * 44 + "px";

  // minHeight is used to ensure that the container height will not shrink when dragging, and the current padding needs to be subtracted during calculation
  const minHeight = isDragging && autoHeight ? listHeight + "px" : "100%";
  // log.log("List. listHeight: ", listHeight, " minHeight: ", minHeight);
  const renders = _.range(0, noOfRows).map((rowIdx) => {
    // log.log("renders. i: ", i, "containerProps: ", containerProps, " text: ", Object.values(containerProps.items as Record<string, any>)[0].children.comp.children.text);
    const items = _.range(0, noOfColumns);
    const render = (
      <div
        key={rowIdx}
        style={{
          height: rowHeight,
          width: '100%',
        }}
      >
        <FlexWrapper>
          {items.map((colIdx) => {
            const itemIdx = rowIdx * noOfColumns + colIdx + pageInfo.offset;
            if (
              itemIdx >= pageInfo.total ||
              itemIdx >= pageInfo.offset + pageInfo.pagination.pageSize ||
              (isOneItem && itemIdx > pageInfo.offset)
            ) {
              return <div key={itemIdx} style={{ flex: "auto" }}></div>;
            }
            const containerProps = containerFn(
              {
                [itemIndexName]: itemIdx,
                [itemDataName]: getCurrentItemParams(listData as JSONObject[], itemIdx)
              },
              String(itemIdx)
            ).getView();
            const unMountFn = () => {
              comp.children.container.dispatch(
                deferAction(ContextContainerComp.batchDeleteAction([String(itemIdx)]))
              );
            };

            return (
              <ListItem
                key={itemIdx}
                itemIdx={itemIdx}
                offset={pageInfo.offset}
                containerProps={containerProps}
                horizontalGridCells={horizontalGridCells}
                autoHeight={isDragging || dynamicHeight}
                scrollContainerRef={ref}
                minHeight={minHeight}
                unMountFn={unMountFn}
                horizontalWidth={`${100 / noOfColumns}%`}
                minHorizontalWidth={horizontal ? minHorizontalWidth : undefined}
                enableSorting={enableSorting}
              />
            );
          })}
        </FlexWrapper>
      </div>
    );

    return render;
  });

  const maxWidth = editorState.getAppSettings().maxWidth;
  const isMobile = checkIsMobile(maxWidth);
  const paddingWidth = isMobile ? "4px" : "16px";

  const childrenProps = childrenToProps(comp.children);

  useMergeCompStyles(childrenProps, comp.dispatch);

  const handleDragEnd = (e: { active: { id: string }; over: { id: string } | null }) => {
    if (!e.over) {
      return;
    }
    const fromIndex = Number(e.active.id);
    const toIndex = Number(e.over.id);
    if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
      return;
    }
    
    const newData = [...listData];
    const [movedItem] = newData.splice(fromIndex, 1);
    newData.splice(toIndex, 0, movedItem);

    children.listData.dispatchChangeValueAction(newData);
    children.onEvent.getView()('sortChange');
  };

  useResizeDetector({
    targetRef: ref,
    onResize: ({width, height}: ResizePayload) => {
      if (height) setListHeight(height);
    },
    observerOptions: { box: "border-box" },
  });

  // log.debug("renders: ", renders);

  return (
    <BackgroundColorContext.Provider value={style.background}>
      <ListViewWrapper $style={style} $paddingWidth={paddingWidth} $animationStyle={animationStyle}>
        <BodyWrapper ref={ref} $autoHeight={autoHeight}>
          <ScrollBar style={{ height: autoHeight ? "auto" : "100%", margin: "0px", padding: "0px" }} hideScrollbar={horizontal ? !showHorizontalScrollbar : !showVerticalScrollbar} overflow={autoHeight ? horizontal ? 'scroll' : 'hidden' : 'scroll'}>
            <ListOrientationWrapper
              $isHorizontal={horizontal}
              $isGrid={noOfColumns > 1}
              $autoHeight={autoHeight}
            >
              {!enableSorting
                ? renders
                : (
                  <DndContext onDragEnd={handleDragEnd}>
                    <SortableContext
                      items={
                        _.range(0, totalCount).map((colIdx) => String(colIdx))
                      }
                    >
                      {renders}
                    </SortableContext>
                  </DndContext>
                )
              }
            </ListOrientationWrapper>
          </ScrollBar>
        </BodyWrapper>
        <FooterWrapper>
          <Pagination size="small" itemRender={pageItemRender} {...pageInfo.pagination} />
        </FooterWrapper>
      </ListViewWrapper>
    </BackgroundColorContext.Provider>
  );
}


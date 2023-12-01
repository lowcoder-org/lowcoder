import {
  uiCompCategoryNames,
  UICompCategory,
  UICompManifest,
  uiCompRegistry,
} from "comps/uiCompRegistry";
import { draggingUtils } from "layout";
import { isEmpty } from "lodash";
import { language } from "i18n";
import {
  CompIconDiv,
  EmptyCompContent,
  RightPanelContentWrapper,
} from "pages/editor/right/styledComponent";
import { tableDragClassName } from "pages/tutorials/tutorialsConstant";
import React, { useContext, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import {
  BaseSection,
  PropertySectionContext,
  PropertySectionContextType,
  PropertySectionState,
  labelCss,
} from "lowcoder-design";
import { TransparentImg } from "../../../util/commonUtils";
import { RightContext } from "./rightContext";

const CompDiv = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 64px;
  margin-top: 4px;
`;

const CompNameLabel = styled.div`
  ${labelCss};
  line-height: 15px;
  display: table;
  margin: 3px auto 0;
  color: #333333;
  text-align: center;
  word-break: keep-all;
`;

const CompEnNameLabel = styled.span`
  ${labelCss};
  line-height: 14px;
  font-size: 12px;
  display: table;
  margin: 4px auto auto;
  color: #8b8fa3;
  text-align: center;
  word-spacing: 99px;
`;

const HovDiv = styled.div`
  display: inline-block;
  border-radius: 4px;

  &:hover + ${CompNameLabel} {
    color: #315efb;
  }
`;

const IconContain = (props: { Icon: React.FunctionComponent<React.SVGProps<SVGSVGElement>> }) => {
  const { Icon } = props;
  return (
    <CompIconDiv w={64} h={64}>
      <Icon />
    </CompIconDiv>
  );
};
const InsertContain = styled.div`
  width: 296px;
  display: flex;
  flex-wrap: wrap;
  padding: 4px 0 0 0;
  box-sizing: border-box;
  gap: 8px;
`;

const SectionWrapper = styled.div`
  .section-header {
    margin-left: 0;
  }
  &:not(:last-child){
    border-bottom: 1px solid #e1e3eb;
  }
`;

const stateCompName = 'UICompSections';
const initialState: PropertySectionState = { [stateCompName]: {}};
Object.keys(uiCompCategoryNames).forEach((cat) => {
  const key = uiCompCategoryNames[cat as UICompCategory];
  initialState[stateCompName][key] = key === uiCompCategoryNames.dashboards
})

export const UICompPanel = () => {
  const { onDrag, searchValue } = useContext(RightContext);
  const [propertySectionState, setPropertySectionState] = useState<PropertySectionState>(initialState);
  const [searchedPropertySectionState, setSearchedPropertySectionState] = useState<PropertySectionState>({});

  const categories = useMemo(() => {
    const cats: Record<string, [string, UICompManifest][]> = Object.fromEntries(
      Object.keys(uiCompCategoryNames).map((cat) => [cat, []])
    );
    Object.entries(uiCompRegistry).forEach(([name, manifest]) => {
      manifest.categories.forEach((cat) => {
        cats[cat].push([name, manifest]);
      });
    });
    return cats;
  }, []);

  const propertySectionContextValue = useMemo<PropertySectionContextType>(() => {
    const state = searchValue
      ? searchedPropertySectionState
      : propertySectionState;
    const setStateFn = searchValue
      ? setSearchedPropertySectionState
      : setPropertySectionState;

    return {
      compName: stateCompName,
      state,
      toggle: (compName: string, sectionName: string) => {
        setStateFn((oldState) => {
          const nextSectionState: PropertySectionState = { ...oldState };
          const compState = nextSectionState[compName] || {};
          compState[sectionName] = compState[sectionName] === false;
          nextSectionState[compName] = compState;
          return nextSectionState;
        });
      },
    };
  }, [searchValue, propertySectionState, searchedPropertySectionState]);

  useEffect(() => {
    if(!searchValue) {
      setSearchedPropertySectionState({})
    }
  }, [searchValue])

  const compList = useMemo(
    () =>
      Object.entries(categories)
        .filter(([key]) => !(!isEmpty(searchValue) && (key as UICompCategory) === "dashboards"))
        .map(([key, value], index) => {
          let infos = value;
          if (!isEmpty(searchValue)) {
            const searchString = searchValue.trim().toLocaleLowerCase();
            infos = infos.filter((info) =>
              info[1].keywords.toLowerCase().includes(searchString.toLowerCase())
            );
          }

          if (isEmpty(infos)) {
            return null;
          }

          return (
            <SectionWrapper key={index}>
              <BaseSection
                noMargin
                width={288}
                name={uiCompCategoryNames[key as UICompCategory]}
              >
                <InsertContain>
                  {infos.map((info) => (
                    <CompDiv key={info[0]} className={info[0] === "table" ? tableDragClassName : ""}>
                      <HovDiv
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("compType", info[0]);
                          e.dataTransfer.setDragImage(TransparentImg, 0, 0);
                          draggingUtils.setData("compType", info[0]);
                          onDrag(info[0]);
                        }}
                      >
                        <IconContain Icon={info[1].icon}></IconContain>
                      </HovDiv>
                      <CompNameLabel>{info[1].name}</CompNameLabel>
                      {language !== "en" && <CompEnNameLabel>{info[1].enName}</CompEnNameLabel>}
                    </CompDiv>
                  ))}
                </InsertContain>
              </BaseSection>
            </SectionWrapper>
          );
        })
        .filter((t) => t != null),
    [categories, searchValue, onDrag]
  );

  if(!compList.length) return (
    <RightPanelContentWrapper>
      <EmptyCompContent />
    </RightPanelContentWrapper>
  )

  return (
    <RightPanelContentWrapper>
      <PropertySectionContext.Provider
        value={propertySectionContextValue}
      >
        {compList}
      </PropertySectionContext.Provider>
    </RightPanelContentWrapper>
  );
};

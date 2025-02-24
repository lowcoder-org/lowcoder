import { ThemeDetail, ThemeType } from "api/commonSettingApi";
import { RecordConstructorToComp } from "lowcoder-core";
import { dropdownInputSimpleControl } from "comps/controls/dropdownInputSimpleControl";
import { MultiCompBuilder, valueComp, withDefault } from "comps/generators";
import { AddIcon, BaseSection, Dropdown } from "lowcoder-design";
import { EllipsisSpan } from "pages/setting/theme/styledComponents";
import { useContext, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { getDefaultTheme, getThemeList } from "redux/selectors/commonSettingSelectors";
import styled, { css } from "styled-components";
import { trans } from "i18n";
import { GreyTextColor } from "constants/style";
import { default as Divider } from "antd/es/divider";
import { THEME_SETTING } from "constants/routesURL";
import { CustomShortcutsComp } from "./customShortcutsComp";
import { DEFAULT_THEMEID } from "comps/utils/themeUtil";
import { NumberControl, RangeControl, StringControl } from "comps/controls/codeControl";
import { IconControl } from "comps/controls/iconControl";
import { dropdownControl } from "comps/controls/dropdownControl";
import { ApplicationCategoriesEnum } from "constants/applicationConstants";
import { BoolControl } from "../controls/boolControl";
import { getNpmPackageMeta } from "../utils/remote";
import { getPromiseAfterDispatch } from "@lowcoder-ee/util/promiseUtils";
import type { AppState } from "@lowcoder-ee/redux/reducers";
import { ColorControl } from "../controls/colorControl";
import { DEFAULT_ROW_COUNT } from "@lowcoder-ee/layout/calculateUtils";
import { AppSettingContext } from "../utils/appSettingContext";
import { isPublicApplication } from "@lowcoder-ee/redux/selectors/applicationSelector";

const TITLE = trans("appSetting.title");
const USER_DEFINE = "__USER_DEFINE";

const ItemSpan = styled.span`
  display: inline-flex;
  align-items: center;
  margin: 0 1px;
  max-width: 218px;
`;

const getTagStyle = (theme?: ThemeDetail) => {
  return css`
    background-color: ${theme?.canvas};
    padding: 3px 4px;
    .left,
    .right {
      width: 21px;
      border: 1px solid rgba(0, 0, 0, 0.1);
    }
    .left {
      background-color: ${theme?.primary};
      border-radius: 2px 0 0 2px;
    }
    .right {
      background-color: ${theme?.primarySurface};
      border-radius: 0 2px 2px 0;
    }
  `;
};

export const TagDesc = styled.span<{ $theme?: ThemeDetail }>`
  display: inline-flex;
  margin-right: 8px;
  height: 22px;
  width: 36px;
  border-radius: 2px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  font-size: 13px;
  ${(props) => getTagStyle(props.$theme)}
`;

export const DefaultSpan = styled.span`
  border: 1px solid #d6e4ff;
  border-radius: 8px;
  color: #4965f2;
  font-size: 12px;
  margin-left: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 16px;
  padding: 0 5px;
`;

const OPTIONS = [
  { label: trans("appSetting.450"), value: "450" },
  { label: trans("appSetting.800"), value: "800" },
  { label: trans("appSetting.1440"), value: "1440" },
  { label: trans("appSetting.1920"), value: "1920" },
  { label: trans("appSetting.3200"), value: "3200" },
  { label: trans("appSetting.autofill"), value: "Infinity" },
  { label: trans("appSetting.userDefined"), value: USER_DEFINE },
];

const Title = styled.div`
  font-weight: 500;
  font-size: 14px;
  color: #8b8fa3;
  line-height: 14px;
  margin-bottom: 16px;
`;

const SettingsStyled = styled.div`
  padding: 16px 16px 0 16px;
`;

const DivStyled = styled.div`
  margin: 0 16px;

  > div {
    flex-wrap: wrap;
    margin-bottom: 12px;
    
    > div {
      width: 100%;
      flex: 0 0 100%;
      display: block;

      .tooltipLabel {
        width: 100%;
      }
    }

    > div:first-child {
      margin-bottom: 6px;
    }
    
    > div:nth-child(2) {
      > div {
        width: 100%;
        justify-content: flex-start;
        > div:first-child {
          flex: 0 0 24px;
        }
        > div:nth-child(2) {
          flex: 1;
          > div:nth-child(2) {
            width: 100%;
          }
        }
      }
    }

  }
  // custom styles for icon selector
  .app-icon {
    > div {
      margin-bottom: 0;

      > div:first-child {
        margin-bottom: 6px;
      }
      > div:nth-child(2) {
        width: 88%;
        display: inline-block;
      }
    }
  }
`;

const StyledAddIcon = styled(AddIcon)`
  height: 16px;
  width: 16px;
  margin-right: 4px;
  color: ${GreyTextColor};
`;

const CreateDiv = styled.div`
  font-size: 13px;
  color: #333333;
  text-align: left;
  line-height: 13px;
  height: 32px;
  margin-right: 8px;
  display: flex;
  align-items: center;
  padding: 12px 0 12px 8px;
  border-radius: 4px;
  cursor: pointer;

  &:hover,
  &:focus {
    background-color: #f2f7fc;
    ${StyledAddIcon} path {
      fill: #315efb;
    }
  }
`;

const DividerStyled = styled(Divider)`
  margin: 6px 16px 6px 8px;
  width: auto;
  min-width: auto;
  border-color: #e1e3eb;
`;

type AppCategoriesEnumKey = keyof typeof ApplicationCategoriesEnum
const AppCategories = Object.keys(ApplicationCategoriesEnum).map(
  (cat) => {
    const value = ApplicationCategoriesEnum[cat as AppCategoriesEnumKey];
    return {
      label: value,
      value: cat
    }
  }
)

const childrenMap = {
  title: withDefault(StringControl, ''),
  description: withDefault(StringControl, ''),
  icon: IconControl,
  category: dropdownControl(AppCategories, ApplicationCategoriesEnum.BUSINESS),
  showHeaderInPublic: withDefault(BoolControl, true),
  themeId: valueComp<string>(DEFAULT_THEMEID),
  preventAppStylesOverwriting: withDefault(BoolControl, true),
  customShortcuts: CustomShortcutsComp,
  disableCollision: valueComp<boolean>(false),
  lowcoderCompVersion: withDefault(StringControl, 'latest'),
  maxWidth: dropdownInputSimpleControl(OPTIONS, USER_DEFINE, "1920"),
  gridColumns: RangeControl.closed(8, 48, 24),
  gridRowHeight: RangeControl.closed(4, 100, 8),
  gridRowCount: withDefault(NumberControl, DEFAULT_ROW_COUNT),
  gridPaddingX: withDefault(NumberControl, 20),
  gridPaddingY: withDefault(NumberControl, 20),
  gridBg: ColorControl,
  gridBgImage: StringControl,
  gridBgImageRepeat: StringControl,
  gridBgImageSize: StringControl,
  gridBgImagePosition: StringControl,
  gridBgImageOrigin: StringControl,
};
type ChildrenInstance = RecordConstructorToComp<typeof childrenMap> & {
  themeList: ThemeType[];
  defaultTheme: string;
};

function AppGeneralSettingsModal(props: ChildrenInstance) {
  const lowcoderCompsMeta = useSelector((state: AppState) => state.npmPlugin.packageMeta['lowcoder-comps']);
  const [lowcoderCompVersions, setLowcoderCompVersions] = useState(['latest']);
  const {
    title,
    description,
    icon,
    category,
    showHeaderInPublic,
    lowcoderCompVersion,
  } = props;
  
  useEffect(() => {
    setLowcoderCompVersions([
      'latest',
      ...Object.keys(lowcoderCompsMeta?.versions || []).reverse()
    ])
  }, [lowcoderCompsMeta])

  return (
    <>
      <BaseSection
        name={trans("appSetting.title")}
        width={288}
        noMargin
        style={{
          borderTop: "1px solid #e1e3eb",
          backgroundColor: "#fff",
        }}
      >
        <DivStyled>
          {title.propertyView({
            label: trans("appSetting.appTitle"),
            placeholder: trans("appSetting.appTitle")
          })}
          {description.propertyView({
            label: trans("appSetting.appDescription"),
            placeholder: trans("appSetting.appDescription")
          })}
          {category.propertyView({
            label: trans("appSetting.appCategory"),
          })}
          <div className="app-icon">
            {icon.propertyView({
              label: trans("icon"),
              tooltip: trans("aggregation.iconTooltip"),
            })}
          </div>
          <div style={{ margin: '20px 0'}}>
            {showHeaderInPublic.propertyView({
              label: trans("appSetting.showPublicHeader"),
            })}
          </div>
        </DivStyled>
      </BaseSection>
      <BaseSection
        name={"Lowcoder Comps"}
        width={288}
        noMargin
        style={{
          borderTop: "1px solid #e1e3eb",
          backgroundColor: "#fff",
        }}
      >
        <DivStyled>
          <Dropdown
            defaultValue={lowcoderCompVersion.getView()}
            placeholder={'Select version'}
            options={
              lowcoderCompVersions.map(version => ({label: version, value: version}))
            }
            label={'Current Version'}
            placement="bottom"
            onChange={async (value) => {
              await getPromiseAfterDispatch(
                lowcoderCompVersion.dispatch,
                lowcoderCompVersion.changeValueAction(value), {
                  autoHandleAfterReduce: true,
                }
              )
              setTimeout(() => {
                window.location.reload();
              }, 1000);
            }}
          />
        </DivStyled>
      </BaseSection>
      <BaseSection
        name={"Shortcuts"}
        width={288}
        noMargin
        style={{
          borderTop: "1px solid #e1e3eb",
          backgroundColor: "#fff",
        }}
      >
        <DivStyled>
          {props.customShortcuts.getPropertyView()}
        </DivStyled>
      </BaseSection>
    </>
  );
}

function AppCanvasSettingsModal(props: ChildrenInstance) {
  const isPublicApp = useSelector(isPublicApplication);
  const {
    themeList,
    defaultTheme,
    themeId,
    preventAppStylesOverwriting,
    maxWidth,
    gridColumns,
    gridRowHeight,
    gridRowCount,
    gridPaddingX,
    gridPaddingY,
    gridBg,
    gridBgImage,
    gridBgImageRepeat,
    gridBgImageSize,
    gridBgImagePosition,
    gridBgImageOrigin,
  } = props;

  const THEME_OPTIONS = themeList?.map((theme) => ({
    label: theme.name,
    value: theme.id + "",
  }));

  const themeWithDefault = (
    themeId.getView() === DEFAULT_THEMEID ||
    (!!themeId.getView() &&
      THEME_OPTIONS.findIndex((item) => item.value === themeId.getView()) === -1)
      ? DEFAULT_THEMEID
      : themeId.getView()
  ) as string;

  useEffect(() => {
    if (themeWithDefault === DEFAULT_THEMEID) {
      themeId.dispatchChangeValueAction(themeWithDefault);
    }
  }, [themeWithDefault]);

  const DropdownItem = (params: { value: string }) => {
    const themeItem = themeList.find((theme) => theme.id === params.value);
    return (
      <ItemSpan>
        <TagDesc $theme={themeItem?.theme}>
          <div className="left" />
          <div className="right" />
        </TagDesc>
        <EllipsisSpan style={{ maxWidth: "238px" }}>{themeItem?.name}</EllipsisSpan>
        {themeItem?.id === defaultTheme && <DefaultSpan>{trans("appSetting.default")}</DefaultSpan>}
      </ItemSpan>
    );
  };

  return (
    <>
      <BaseSection
        name={"Theme Settings"}
        width={288}
        noMargin
        style={{
          borderTop: "1px solid #e1e3eb",
          backgroundColor: "#fff",
        }}
      >
        <DivStyled>
          <Dropdown
            defaultValue={
              themeWithDefault === ""
                ? undefined
                : themeWithDefault === DEFAULT_THEMEID
                ? defaultTheme || undefined
                : themeWithDefault
            }
            placeholder={trans("appSetting.themeSettingDefault")}
            options={THEME_OPTIONS}
            label={trans("appSetting.themeSetting")}
            placement="bottom"
            itemNode={(value) => <DropdownItem value={value} />}
            preNode={() => (
              isPublicApp ? <></> : (
                <>
                  <CreateDiv onClick={() => window.open(THEME_SETTING)}>
                    <StyledAddIcon />
                    {trans("appSetting.themeCreate")}
                  </CreateDiv>
                  <DividerStyled />
                </>
              )
            )}
            allowClear
            onChange={(value) => {
              themeId.dispatchChangeValueAction(
                value === defaultTheme ? DEFAULT_THEMEID : value || ""
              );
            }}
          />
          <div style={{ margin: '20px 0'}}>
            {preventAppStylesOverwriting.propertyView({
              label: trans("prop.preventOverwriting"),
            })}
          </div>
        </DivStyled>
      </BaseSection>
      <BaseSection
        name={trans("appSetting.canvas")}
        width={288}
        noMargin
        style={{
          borderTop: "1px solid #e1e3eb",
          backgroundColor: "#fff",
        }}
      >
        <DivStyled>
          {maxWidth.propertyView({
            dropdownLabel: trans("appSetting.canvasMaxWidth"),
            inputLabel: trans("appSetting.userDefinedMaxWidth"),
            inputPlaceholder: trans("appSetting.inputUserDefinedPxValue"),
            placement: "bottom",
            min: 350,
            lastNode: <span>{trans("appSetting.maxWidthTip")}</span>,
          })}
          {gridColumns.propertyView({
            label: trans("appSetting.gridColumns"),
            placeholder: '24',
          })}
          {gridRowHeight.propertyView({
            label: trans("appSetting.gridRowHeight"),
            placeholder: '8',
          })}
          {gridRowCount.propertyView({
            label: trans("appSetting.gridRowCount"),
            placeholder: 'Infinity',
          })}
          {gridPaddingX.propertyView({
            label: trans("appSetting.gridPaddingX"),
            placeholder: '20',
          })}
          {gridPaddingY.propertyView({
            label: trans("appSetting.gridPaddingY"),
            placeholder: '20',
          })}
          {gridBg.propertyView({
            label: trans("style.background"),
            allowGradient: true,
          })}
          {gridBgImage.propertyView({
            label: trans("appSetting.gridBgImage"),
            placeholder: '',
          })}
          {gridBgImageRepeat.propertyView({
            label: trans("appSetting.gridBgImageRepeat"),
            placeholder: 'no-repeat',
          })}
          {gridBgImageSize.propertyView({
            label: trans("appSetting.gridBgImageSize"),
            placeholder: 'cover',
          })}
          {gridBgImagePosition.propertyView({
            label: trans("appSetting.gridBgImagePosition"),
            placeholder: 'center',
          })}
          {gridBgImageOrigin.propertyView({
            label: trans("appSetting.gridBgImageOrigin"),
            placeholder: 'no-padding',
          })}
        </DivStyled>
      </BaseSection>
    </>
  );
}


export const AppSettingsComp = new MultiCompBuilder(childrenMap, (props) => {
  return {
    ...props,
    maxWidth: Number(props.maxWidth),
  };
})
  .setPropertyViewFn((children) => {
    const { settingType } = useContext(AppSettingContext);
    const themeList = useSelector(getThemeList) || [];
    const defaultTheme = (useSelector(getDefaultTheme) || "").toString();

    return settingType === 'canvas'
      ? <AppCanvasSettingsModal {...children} themeList={themeList} defaultTheme={defaultTheme} />
      : <AppGeneralSettingsModal {...children} themeList={themeList} defaultTheme={defaultTheme} />;
  })
  .build();

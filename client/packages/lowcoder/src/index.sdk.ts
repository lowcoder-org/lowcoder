import numbro from "numbro";
import Papa from "papaparse";
import * as uuid from "uuid";
import * as supabase from "@supabase/supabase-js";
import * as alasql from "alasql";

import * as styledNameExports from "styled-components";
import styledDefault from "styled-components";
export * as styledm from "styled-components";
export * from "comps/comps/containerBase/containerCompBuilder";
export * from "comps/comps/containerBase/iContainer";
export * from "comps/comps/containerBase/utils";
export * from "comps/comps/containerBase/simpleContainerComp";
export * from "comps/utils/backgroundColorContext";
export { getData } from "comps/comps/listViewComp/listViewUtils";
export { gridItemCompToGridItems, InnerGrid } from "comps/comps/containerComp/containerView";
export type { ContainerBaseProps } from "comps/comps/containerComp/containerView";

export { Layers } from "constants/Layers";
export * from "comps/controls/eventHandlerControl";
export * from "comps/utils/methodUtils";
// export * from Button

export { useUserViewMode } from "util/hooks";
export * from "comps/editorState";
export * from "redux/store/store";

// util
export * from "util/appUtils";
export * from "util/bottomResUtils";
export * from "util/cacheUtils";
export * from "util/commonUtils";
export * from "util/convertUtils";
export * from "util/dateTimeUtils";
export * from "util/editoryHistory";
export * from "util/envUtils";
export * from "util/fileUtils";
export * from "util/history";
export * from "util/historyManager";
export * from "util/hooks";
export * from "util/hotkeys";
export * from "util/jsonTypes";
export * from "util/keyUtils";
export * from "util/localStorageUtil";
export * from "util/memoize";
export * from "util/objectUtils";
export * from "util/objectUtils";
export * from "util/perfUtils";
export * from "util/permissionUtils";
export * from "util/promiseUtils";
export * from "util/reducerUtils";
export * from "util/scheduleUtils";
export * from "util/stringUtils";
export * from "util/tutorialUtils";
export * from "util/uaUtils";
export * from "util/urlUtils";
export * from "util/context/ExternalEditorContext";

// constant
export { CanvasContainerID } from "constants/domLocators";

// comps
export * from "comps/index";
export * from "comps/comps/rootComp";

// comp utils
export * from "comps/utils/useCompInstance";
export * from "comps/utils/idGenerator";
export * from "comps/utils/propertyUtils";
export * from "comps/utils/globalSettings";
export * from "comps/utils";
export * from "comps/utils/themeContext";

// design
export * from "lowcoder-design";
export * from "lowcoder-core";

// controls
export * from "comps/controls/alignControl";
export * from "comps/controls/appSelectControl";
export * from "comps/controls/autoHeightControl";
export * from "comps/controls/boolControl";
export * from "comps/controls/codeControl";
export * from "comps/controls/codeStateControl";
export * from "comps/controls/codeTextControl";
export * from "comps/controls/colorControl";
export * from "comps/controls/compNameControl";
export * from "comps/controls/controlParams";
export * from "comps/controls/dropdownControl";
export * from "comps/controls/dropdownInputSimpleControl";
export * from "comps/controls/eventHandlerControl";
export * from "comps/controls/actionSelector/actionSelectorControl";
export * from "comps/controls/iconControl";
export * from "comps/controls/shapeControl";
export * from "comps/controls/keyValueControl";
export * from "comps/controls/keyValueListControl";
export * from "comps/controls/labelControl";
export * from "comps/controls/millisecondControl";
export * from "comps/controls/optionsControl";
export * from "comps/controls/paramsControl";
export * from "comps/controls/querySelectControl";
export * from "comps/controls/refControl";
export * from "comps/controls/simpleStringControl";
export * from "comps/controls/stringSimpleControl";
export * from "comps/controls/styleControl";
export * from "comps/controls/styleControlConstants";
export * from "comps/controls/slotControl";

// generators
export * from "comps/generators/changeDataType";
export * from "comps/generators/hookToComp";
export * from "comps/generators/index";
export * from "comps/generators/list";
export * from "comps/generators/multi";
export * from "comps/generators/sameTypeMap";
export * from "comps/generators/simpleGenerators";
export * from "comps/generators/uiCompBuilder";
export * from "comps/generators/withContext";
export * from "comps/generators/withDispatchHook";
export * from "comps/generators/withErrorBoundary";
export * from "comps/generators/withExposing";
export * from "comps/generators/withIsLoading";
export * from "comps/generators/withMethodExposing";
export * from "comps/generators/withType";
export * from "comps/generators/controlCompBuilder";

export * from "appView/bootstrapAt";
export * from "appView/LowcoderAppView";
export * from "appView/AppViewInstance";

export * from "ide/CompIde";
export * from "ide/CompPlayground";

export * as antd from "antd/es";
export const styled = { ...styledDefault, ...styledNameExports };

window.numbro = numbro;
window.Papa = Papa;
window.uuid = uuid;
window.supabase = supabase;
window.alasql = alasql;

import { TreeSelect } from "antd";
import { useMemo } from "react";
import { useSelector } from "react-redux";
import { useHistory, useParams } from "react-router-dom";
import { ALL_APPLICATIONS_URL, buildFolderUrl } from "constants/routesURL";
import { foldersSelector } from "redux/selectors/folderSelector";
import { buildFolderHierarchy, FolderHierarchyNode } from "util/folderUtils";
import { trans } from "i18n";

interface FolderOption { value: string; title: string; children: FolderOption[] }
const toOptions = (nodes: FolderHierarchyNode[]): FolderOption[] => nodes.map(({ folder, children }) => ({
  value: folder.folderId, title: folder.name, children: toOptions(children),
}));

export function FolderNavigator() {
  const folders = useSelector(foldersSelector);
  const { folderId } = useParams<{ folderId?: string }>();
  const history = useHistory();
  const options = useMemo(() => [{
    value: "__all_apps__", title: trans("home.allApplications"), children: toOptions(buildFolderHierarchy(folders)),
  }], [folders]);
  if (!folders.length) return null;
  return <TreeSelect
    aria-label={trans("home.yourFolders")}
    placeholder={trans("home.yourFolders")}
    value={folderId}
    treeData={options}
    treeDefaultExpandedKeys={["__all_apps__"]}
    showSearch
    treeNodeFilterProp="title"
    style={{ width: 220, maxWidth: "100%" }}
    onChange={(value: string) => history.push(value === "__all_apps__" ? ALL_APPLICATIONS_URL : buildFolderUrl(value))}
  />;
}

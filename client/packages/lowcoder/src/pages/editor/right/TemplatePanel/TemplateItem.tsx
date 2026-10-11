import axios from "axios";
import { EmptyContent } from "components/EmptyContent";
import { LinkButton } from "lowcoder-design";
import { useApplicationId, useShallowEqualSelector } from "util/hooks";
import { useContext, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "redux/reducers";
import { packageMetaReadyAction } from "redux/reduxActions/npmPluginActions";
import styled from "styled-components";
import { NpmPackageMeta } from "types/remoteComp";
import { PluginCompItem } from "../PluginPanel/PluginCompItem";
import { NPM_REGISTRY_URL } from "constants/npmPlugins";
import { trans } from "i18n";
import { RightContext } from "../rightContext";

const TemplateViewWrapper = styled.div`
  margin-bottom: 12px;
  .remove-btn {
    display: none;
  }
  &:hover {
    .remove-btn {
      display: block;
    }
  }
`;

const TemplateViewTitle = styled.div`
  height: 22px;
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-bottom: 2px;
`;

const TemplateViewTitleText = styled.div`
  flex: 1;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #b8b9bf;
`;

const TemplateViewContent = styled.div`
  padding-top: 4px;
  margin-bottom: 12px;
`;

interface TemplateItemProps {
  name: string;
  onRemove: () => void;
}

export function TemplateItem(props: TemplateItemProps) {
  const { name, onRemove } = props;
  const dispatch = useDispatch();
  const appId = useApplicationId();
  const { onDrag, searchValue } = useContext(RightContext);
  const [loading, setLoading] = useState(false);
  const packageMeta = useShallowEqualSelector(
    (state: AppState) => state.npmPlugin.packageMeta[name]
  );
  const currentVersion = useSelector((state: AppState) => state.npmPlugin.packageVersion[name]);
  const versions = useMemo(() => packageMeta?.versions || {}, [packageMeta?.versions]);
  const comps = versions[currentVersion]?.lowcoder?.comps || {};
  const compNames = Object.keys(comps);

  useEffect(() => {
    setLoading(true);
    axios.get<NpmPackageMeta>(`${NPM_REGISTRY_URL}/${appId || 'none'}/${name}`).then((res) => {
      if (res.status >= 400) {
        return;
      }
      setLoading(false);
      dispatch(packageMetaReadyAction(name, res.data));
    });
  }, [dispatch, name]);

  const filteredCompNames = compNames.filter(
    (i) => !searchValue || i.toLowerCase().indexOf(searchValue.toLowerCase()) !== -1
  );
  const hasComps = filteredCompNames.length > 0;

  return (
    <TemplateViewWrapper>
      <TemplateViewTitle>
        <TemplateViewTitleText>{name}</TemplateViewTitleText>
        <LinkButton
          onClick={onRemove}
          className="remove-btn"
          text={trans("npm.removeTemplateBtnText")}
        />
      </TemplateViewTitle>
      <TemplateViewContent>
        {!hasComps && <EmptyContent text={loading ? "Loading..." : "No components found."} />}
        {hasComps &&
          filteredCompNames.map((compName) => (
            <PluginCompItem
              onDrag={onDrag}
              key={compName}
              compName={compName}
              compMeta={comps[compName]}
              packageName={name}
              packageVersion={currentVersion}
            />
          ))}
      </TemplateViewContent>
    </TemplateViewWrapper>
  );
}

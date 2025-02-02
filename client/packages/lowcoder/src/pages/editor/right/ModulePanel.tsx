import { ApplicationMeta, AppTypeEnum, FolderMeta } from "constants/applicationConstants";
import {
    BorderActiveColor,
    NormalMenuIconColor,
} from "constants/style";
import { APPLICATION_VIEW_URL } from "constants/routesURL";
import { RightContext } from "./rightContext";
import {
    EditPopover,
    EditText,
    FoldedIcon,
    ModuleDocIcon,
    PointIcon,
    PopupCard,
    UnfoldIcon,
    FileFolderIcon, messageInstance, CustomModal
} from "lowcoder-design";
import {trans, transToNode} from "i18n";
import { draggingUtils } from "layout/draggingUtils";
import React, { useContext, useEffect, useState} from "react";
import { useDispatch, useSelector } from "react-redux";
import {fetchAllModules, recycleApplication, updateAppMetaAction} from "redux/reduxActions/applicationActions";
import styled from "styled-components";
import CreateAppButton from "components/CreateAppButton";
import { TransparentImg } from "util/commonUtils";
import { ComListTitle } from "./styledComponent";
import {folderElementsSelector} from "@lowcoder-ee/redux/selectors/folderSelector";
import {DraggableTree} from "@lowcoder-ee/components/DraggableTree/DraggableTree";
import { showAppSnapshotSelector} from "@lowcoder-ee/redux/selectors/appSnapshotSelector";
import {DraggableTreeNode, DraggableTreeNodeItemRenderProps} from "@lowcoder-ee/components/DraggableTree/types";
import { EmptyContent } from "components/EmptyContent";
import {deleteFolder, moveToFolder, updateFolder} from "@lowcoder-ee/redux/reduxActions/folderActions";
import { isPublicApplication } from "@lowcoder-ee/redux/selectors/applicationSelector";
const ItemWrapper = styled.div`
  display: flex;
  flex-direction: row;
  &:last-child {
    margin-bottom: 0;
  }
  .module-container {
      display: flex;
      width: 195px;
  }
  .module-icon {
    margin-right: 4px;
      width:19px;
      height: 19px;
  }
  .module-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    overflow: hidden;
  }
  .module-name {
    //flex-grow: 1;
    //margin-right: 8px;
    line-height: 1.5;
    font-size: 13px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
`;

type NodeType = {
    name: string;
    id: string;
    isFolder: boolean;
    containerSize?: { height: number; width: number };
    module?: ApplicationMeta;
    children: NodeType[];
    rename: (val: string) => string
    checkName: (val: string) => string
};



function buildTree(elementRecord: Record<string, Array<ApplicationMeta | FolderMeta>>): NodeType {
    const elements = elementRecord[""] || [];
    const elementMap: Record<string, NodeType> = {};
    let rootNode: NodeType = {
        name: "root",
        id: "",
        isFolder: true,
        children: [],
        rename: val => rootNode.name = val,
        checkName: val => val
    }

    // Initialize all folders and applications as NodeType
    for (const element of elements) {
        if (element.folder) {
            elementMap[element.folderId] = {
                name: element.name,
                id: element.folderId,
                isFolder: true,
                children: [],
                rename: val => elementMap[element.folderId].name = val,
                checkName: val => val
            };

            // Process subapplications inside the folder
            for (const app of element.subApplications || []) {
                if (!!app && app.applicationType === AppTypeEnum.Module) {
                    const appNode: NodeType = {
                        name: app.name,
                        id: app.applicationId,
                        containerSize: app.containerSize,
                        isFolder: false,
                        children: [],
                        module: app,
                        rename: val => appNode.name = val,
                        checkName: val => val
                    };
                    elementMap[element.folderId].children.push(appNode); // Add applications as children of the folder
                }
            }
        } else {
            if (element.applicationType === AppTypeEnum.Module) {
                elementMap[element.applicationId] = {
                    name: element.name,
                    containerSize: element.containerSize,
                    id: element.applicationId,
                    isFolder: false,
                    children: [],
                    module: element,
                    rename: val => elementMap[element.applicationId].name = val,
                    checkName: val => val
                };
            }
        }
    }

    // Build the tree structure
    for (const element of elements) {
        if (element.folder) {
            const parentId = element.parentFolderId;
            if (parentId && elementMap[parentId]) {
                elementMap[parentId].children.push(elementMap[element.folderId]);
            } else {
                rootNode.children.push(elementMap[element.folderId]);
            }
        } else if (elementMap[element.applicationId]) {
            rootNode.children.push(elementMap[element.applicationId]);
        }
    }
    rootNode.children.sort((a, b) => {
        if (a.isFolder && !b.isFolder) {
            return -1; // a is a isFolder and should come first
        } else if (!a.isFolder && b.isFolder) {
            return 1; // b is a folder and should come first
        } else {
            return 0; // both are folders or both are not, keep original order
        }
    });
    return rootNode;
}


interface ModuleItemProps {
    meta: ApplicationMeta;
    onDrag: (type: string) => void;
    isOverlay: boolean;
    selectedID: string;
    setSelectedID: (id: string) => void;
    selectedType: boolean;
    setSelectedType: (id: boolean) => void;
    resComp: NodeType;
    id: string;
    $level: number;
}

function ModuleItem(props: ModuleItemProps) {
    const compType = "module";
    const {
        meta ,
        isOverlay,
        selectedID,
        setSelectedID,
        selectedType,
        setSelectedType,
        resComp,
        id,
        $level,
    } = props;
    const dispatch = useDispatch();
    const type = resComp.isFolder;
    const name = resComp.name;
    const [error, setError] = useState<string | undefined>(undefined);
    const [editing, setEditing] = useState(false);
    const readOnly = useSelector(showAppSnapshotSelector);
    const isSelected = type === selectedType && id === selectedID;
    const handleFinishRename = (value: string) => {
        if (value !== "") {
            let success = false;
            let compId = name;
            if (resComp.rename) {
                compId = resComp.rename(value);
                success = !!compId;
            } else {
                compId = name;
                success = true;
            }
            if (success) {
                setSelectedID(compId);
                setSelectedType(type);
                setError(undefined);
                try {
                    dispatch(updateAppMetaAction({
                        applicationId: selectedID,
                        name: value
                    }));
                } catch (error) {
                    console.error("Error: Rename module in extension:", error);
                    throw error;
                }
            }
            setError(undefined);
        }
        setError(undefined);
    };

    const handleNameChange = (value: string) => {
        value === "" ? setError("Cannot Be Empty") : setError(undefined);
    };
    return (
        <ItemWrapper
            draggable
            onDragStart={(e) => {
                e.stopPropagation();
                e.dataTransfer.setData("compType", compType);
                e.dataTransfer.setDragImage(TransparentImg, 0, 0);
                draggingUtils.setData("compType", compType);
                draggingUtils.setData(
                    "compLayout",
                    meta.containerSize
                        ? { w: meta.containerSize.width, h: meta.containerSize.height }
                        : undefined
                );
                draggingUtils.setData("compInitialValue", {
                    appId: props.meta.applicationId,
                });
                props.onDrag(compType);
            }}
        >
            <div className="module-container" >
                <ModuleDocIcon className="module-icon"/>
                <div style={{ flexGrow: 1, maxWidth: 174 - $level*10 }}>
                        <EditText
                            style={{ width: "100%" }}
                        text={meta.name}
                        forceClickIcon={false}
                        disabled={!isSelected || readOnly || isOverlay}
                        onFinish={handleFinishRename}
                        onChange={handleNameChange}
                        onEditStateChange={(editing) => setEditing(editing)}
                    />
                    <PopupCard
                        editorFocus={!!error && editing}
                        title={error ? trans("error") : ""}
                        content={error}
                        hasError={!!error}
                    />
                </div>
            </div>
        </ItemWrapper>
    );
}

const HighlightBorder = styled.div<{ $active: boolean; $foldable: boolean; $level: number }>`
  max-width: 100%;
  flex: 1;
  display: flex;
  padding-left: ${(props) => props.$level * 10 + (props.$foldable ? 0 : 14)}px;
  border-radius: 4px;
  border: 1px solid ${(props) => (props.$active ? BorderActiveColor : "transparent")};
  align-items: center;
  justify-content: space-between;
`;

interface ColumnDivProps {
    $color?: boolean;
    $isOverlay: boolean;
}

const ColumnDiv = styled.div<ColumnDivProps>`
  width: 100%;
  height: 25px;
  display: flex;
  user-select: none;
  padding-left: 2px;
  padding-right: 15px;
  background-color: ${(props) => (props.$isOverlay ? "rgba(255, 255, 255, 0.11)" : "")};

  &&& {
    background-color: ${(props) => (props.$color && !props.$isOverlay ? "#f2f7fc" : null)};
  }

  &:hover {
    background-color: #f2f7fc80;
    cursor: pointer;
  }

  .taco-edit-text-wrapper {
    width: 100%;
    height: 21px;
    line-height: 21px;
    color: #222222;
    margin-left: 0;
    font-size: 13px;
    padding-left: 0;

    &:hover {
      background-color: transparent;
    }
  }

  .taco-edit-text-input {
    width: 100%;
    height: 21px;
    line-height: 21px;
    color: #222222;
    margin-left: 0;
    font-size: 13px;
    background-color: #fdfdfd;
    border: 1px solid #3377ff;
    border-radius: 2px;

    &:focus {
      border-color: #3377ff;
      box-shadow: 0 0 0 2px #d6e4ff;
    }
  }
`;

const FoldIconBtn = styled.div`
  width: 12px;
  height: 12px;
  display: flex;
  margin-right: 2px;
`;

const Icon = styled(PointIcon)`
  width: 16px;
  height: 16px;
  cursor: pointer;
  flex-shrink: 0;
  color: ${NormalMenuIconColor};

  &:hover {
    color: #315efb;
  }
`;

interface ModuleSidebarItemProps extends DraggableTreeNodeItemRenderProps {
    id: string;
    resComp: NodeType;
    onCopy: () => void;
    onSelect: () => void;
    onDelete: () => void;
    onToggleFold: () => void;
    selectedID: string;
    setSelectedID: (id: string) => void;
    selectedType: boolean;
    setSelectedType: (id: boolean) => void;
}

function ModuleSidebarItem(props: ModuleSidebarItemProps) {
    const dispatch = useDispatch();
    const {
        id,
        resComp,
        isOver,
        isOverlay,
        path,
        isFolded,
        selectedID,
        setSelectedID,
        selectedType,
        setSelectedType,
        onDelete,
        onCopy,
        onSelect,
        onToggleFold,
    } = props;
    const { onDrag } = useContext(RightContext);
    const [error, setError] = useState<string | undefined>(undefined);
    const [editing, setEditing] = useState(false);
    const readOnly = useSelector(showAppSnapshotSelector);
    const level = path.length - 1;
    const type = resComp.isFolder;
    const name = resComp.name;
    const isSelected = type === selectedType && id === selectedID;
    const isFolder = type;

    const handleFinishRename = (value: string) => {
        if (value !== ""){
            let success = false;
            let compId = name;
            if (resComp.rename) {
                compId = resComp.rename(value);
                success = !!compId;
            } else {
                compId = name;
                success = true;
            }
            if (success) {
                setSelectedID(compId);
                setSelectedType(type);
                setError(undefined);
                try{
                    dispatch(updateFolder({ id: selectedID, name: value }));
                } catch (error) {
                    console.error("Error: Delete module in extension:", error);
                    throw error;
                }

            }
            setError(undefined);
        }
    };

    const handleNameChange = (value: string) => {
        value === "" ? setError("Cannot Be Empty") : setError(undefined);
    };

    const handleClickItem = () => {
        if (isFolder) {
            onToggleFold();
        }
        onSelect();
    };

    return (
        <ColumnDiv onClick={handleClickItem} $color={isSelected} $isOverlay={isOverlay}>
            <HighlightBorder $active={isOver && isFolder} $level={level} $foldable={isFolder}>
                {isFolder && <FoldIconBtn>{!isFolded ? <FoldedIcon /> : <UnfoldIcon />}</FoldIconBtn>}
                { isFolder ?
                    <>
                        <FileFolderIcon style={{marginRight: "4px"}}/>
                        <div style={{ flexGrow: 1, marginRight: "8px", width: "calc(100% - 62px)" }}>
                            <EditText
                                text={name}
                                forceClickIcon={isFolder}
                                disabled={!isSelected || readOnly || isOverlay}
                                onFinish={handleFinishRename}
                                onChange={handleNameChange}
                                onEditStateChange={(editing) => setEditing(editing)}
                            />
                            <PopupCard
                                editorFocus={!!error && editing}
                                title={error ? trans("error") : ""}
                                content={error}
                                hasError={!!error}
                            />
                        </div>
                    </> :
                    <ModuleItem onDrag={onDrag}
                                key={id}
                                meta={resComp.module!}
                                isOverlay={isOverlay}
                                selectedID={selectedID}
                                setSelectedID={setSelectedID}
                                selectedType={selectedType}
                                setSelectedType={setSelectedType}
                                resComp = {resComp}
                                id={id}
                                $level={level}
                    />}
                {!readOnly && !isOverlay && (
                    <EditPopover del={() => onDelete()}>
                        <Icon tabIndex={-1} />
                    </EditPopover>
                )}
            </HighlightBorder>
        </ColumnDiv>
    );
}

export default function ModulePanel() {
    const dispatch = useDispatch();
    let elements = useSelector(folderElementsSelector);
    const isPublicApp = useSelector(isPublicApplication);
    const { searchValue } = useContext(RightContext);
    const [selectedID, setSelectedID] = useState("");
    const [selectedType, setSelectedType] = useState(false);
    let sourceFolderId : string = "";
    let sourceId : string = "";
    let folderId : string = "";
    const tree = buildTree(elements);
    const getById = (id: string): NodeType | undefined => getByIdFromNode(tree, id);
    let popedItemSourceId = "";

    useEffect(() => {
        if (isPublicApp) return;

        dispatch(fetchAllModules({}));
    }, [dispatch, isPublicApp]);

    const moveModule = () => {
        try{
            if (sourceId !== "") {
                dispatch(
                    moveToFolder(
                        {
                            sourceFolderId: sourceFolderId!,
                            sourceId: sourceId!,
                            folderId: folderId!,
                            moveFlag: true
                        },
                        () => {


                        },
                        () => {}
                    )
                );
            }
        } catch (error) {
            console.error("Error: Move module in extension:", error);
            throw error;
        } finally {
            folderId = "";
            sourceId = "";
            sourceFolderId = "";
        }

    }

    const getByIdFromNode = (root: NodeType | null, id: string): NodeType | undefined => {
        if (!root) {
            return;
        }

        if (root.id === id) {
            return root;
        }

        for (const child  of root.children) {
            const result = getByIdFromNode(child, id);
            if (result) {
                return result;
            }
        }
        return;
    }
    const convertRefTree = (treeNode: NodeType) => {    //Convert elements into tree
        const moduleResComp = getById(treeNode.id);
        const currentNodeType = moduleResComp?.isFolder;

        const childrenItems = treeNode.children
            .map((i) => convertRefTree(i as NodeType))
            .filter((i): i is DraggableTreeNode<NodeType> => !!i);
        const node: DraggableTreeNode<NodeType> = {
            id: moduleResComp?.id,
            canDropBefore: (source) => {
                if (currentNodeType) {
                    return source?.isFolder!;
                }

                return !source?.isFolder;
            },
            canDropAfter: (source) => {
                if (
                    !currentNodeType &&
                    source?.isFolder
                ) {
                    return false;
                }
                return true;
            },
            canDropIn: (source) => {
                if (!currentNodeType) {
                    return false;
                }
                if (!source) {
                    return true;
                }
                if (source.isFolder) {
                    return false;
                }
                return true;
            },
            items: childrenItems,
            data: moduleResComp,
            addSubItem(value) {
                folderId = node.id!;
                moveModule();
            },
            deleteItem(index) {
                sourceFolderId = node.id!;
                sourceId = node.items[index].id!;

            },
            addItem(value) {
                folderId = node.id!;
                moveModule();
            },
            moveItem(from, to) {
            },
        };

        if (
            searchValue &&
            moduleResComp &&
            !moduleResComp.name.toLowerCase().includes(searchValue.toLowerCase()) &&
            childrenItems.length === 0
        ) {
            return;
        }
        return node;
    };
    const node = convertRefTree(tree);
    function onCopy(type: boolean, id: string) {
    }

    function onSelect(type: boolean, id: string, meta: any) {
        setSelectedID(id);
        setSelectedType(type);
    }

    function onDelete(type: boolean, id: string, node: NodeType) {
        if (type) {
            if (node.children.length) {
                messageInstance.error(trans("module.folderNotEmpty"))
            } else {
                try {
                    dispatch(
                        deleteFolder(
                            {folderId: id, parentFolderId: ""},
                            () => {
                                messageInstance.success(trans("home.deleteSuccessMsg"));
                            },
                            () => {
                                messageInstance.error(trans("error"))
                            }
                        )
                    );
                } catch (error) {
                    console.error("Error: Remove folder in extension:", error);
                    throw error;
                }
            }
        } else {
            try {
                CustomModal.confirm({
                    title: trans("home.moveToTrash"),
                    content: transToNode("home.moveToTrashSubTitle", {
                        type: "",
                        name: "This file",
                    }),
                    onConfirm: () => {
                        dispatch(
                            recycleApplication(
                                {
                                    applicationId: id,
                                    folderId: popedItemSourceId,
                                },
                                () => {
                                    messageInstance.success(trans("success"));

                                },
                                () => {
                                    messageInstance.error(trans("error"));
                                }
                            )
                        )
                    },
                    confirmBtnType: "delete",
                    okText: trans("home.moveToTrash"),
                    onCancel: () => {}
                });
            } catch (error) {
                console.error("Error: Remove module in extension:", error);
                throw error;
            }
        }
    }
    return (
        <>
            <ComListTitle>{trans("rightPanel.moduleListTitle")}</ComListTitle>
            {node?.items.length ? <DraggableTree<NodeType>
                node={node!}
                disable={!!searchValue}
                unfoldAll={!!searchValue}
                showSubInDragOverlay={false}
                showDropInPositionLine={false}
                showPositionLineDot
                positionLineDotDiameter={4}
                positionLineHeight={1}
                itemHeight={25}
                positionLineIndent={(path, dropInAsSub) => {
                    const indent = 2 + (path.length - 1) * 30;
                    if (dropInAsSub) {
                        return indent + 12;
                    }
                    return indent;
                }}
                renderItemContent={(params) => {
                    const { node, onToggleFold, onDelete: onDeleteTreeItem, ...otherParams } = params;
                    const resComp = node.data;
                    if (!resComp) {
                        return null;
                    }
                    const id = resComp.id;
                    const isFolder = resComp.isFolder;
                    return (
                        <ModuleSidebarItem
                            id={id}
                            key={id}
                            node={node}
                            resComp={resComp}
                            onToggleFold={onToggleFold}
                            onCopy={() => onCopy(isFolder, id)}
                            onSelect={() => onSelect(isFolder, id, resComp)}
                            selectedID={selectedID}
                            setSelectedID={setSelectedID}
                            selectedType={selectedType}
                            setSelectedType={setSelectedType}
                            onDelete={() => {
                                (onDelete(isFolder, id, resComp))
                            }}
                            {...otherParams}
                        />
                    );
                }}
            /> : (
                <EmptyContent
                    text={
                        <>
                            <p>{trans("rightPanel.emptyModules")}</p>
                            {!isPublicApp && (
                                <CreateAppButton
                                    type={AppTypeEnum.Module}
                                    onSuccess={(app) => {
                                        const appId = app.applicationInfoView.applicationId;
                                        const url = APPLICATION_VIEW_URL(appId, "edit");
                                        window.open(url);
                                    }}
                                />
                            )}
                        </>
                    }
                />
            )}
        </>
    );
}

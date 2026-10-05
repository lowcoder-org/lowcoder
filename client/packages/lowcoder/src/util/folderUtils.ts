import { FolderMeta } from "constants/applicationConstants";

/**
 * The folders endpoint returns root folders with nested subFolders, while most
 * home-page consumers need an index containing every folder exactly once.
 */
export function flattenFolderTree(folders: FolderMeta[]): FolderMeta[] {
  const flattened: FolderMeta[] = [];
  const visited = new Set<string>();

  const visit = (folder: FolderMeta) => {
    if (!folder?.folderId || visited.has(folder.folderId)) {
      return;
    }

    visited.add(folder.folderId);
    flattened.push(folder);
    folder.subFolders?.forEach(visit);
  };

  folders.forEach(visit);
  return flattened;
}

/** Returns the path from the root folder to folderId, including folderId. */
export function getFolderPath(
  folderId: string | undefined,
  folders: FolderMeta[],
): FolderMeta[] {
  if (!folderId) {
    return [];
  }

  const folderById = new Map(
    flattenFolderTree(folders).map((folder) => [folder.folderId, folder]),
  );
  const path: FolderMeta[] = [];
  const visited = new Set<string>();
  let current = folderById.get(folderId);

  while (current && !visited.has(current.folderId)) {
    visited.add(current.folderId);
    path.unshift(current);
    current = current.parentFolderId
      ? folderById.get(current.parentFolderId)
      : undefined;
  }

  return path;
}

export function getFolderDisplayPath(
  folderId: string,
  folders: FolderMeta[],
): string {
  return getFolderPath(folderId, folders)
    .map((folder) => folder.name)
    .join(" / ");
}

export interface FolderHierarchyNode {
  folder: FolderMeta;
  children: FolderHierarchyNode[];
}

/** Builds a directory tree from either nested API folders or a flat folder index. */
export function buildFolderHierarchy(
  folders: FolderMeta[],
): FolderHierarchyNode[] {
  const allFolders = flattenFolderTree(folders);
  const nodeById = new Map<string, FolderHierarchyNode>(
    allFolders.map((folder) => [folder.folderId, { folder, children: [] }]),
  );
  const roots: FolderHierarchyNode[] = [];

  allFolders.forEach((folder) => {
    const node = nodeById.get(folder.folderId)!;
    const parent = folder.parentFolderId
      ? nodeById.get(folder.parentFolderId)
      : undefined;

    if (parent && parent !== node) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortByName = (nodes: FolderHierarchyNode[]) => {
    nodes.sort((a, b) => a.folder.name.localeCompare(b.folder.name));
    nodes.forEach((node) => sortByName(node.children));
  };
  sortByName(roots);

  return roots;
}

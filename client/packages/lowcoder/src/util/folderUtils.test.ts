import { FolderMeta } from "constants/applicationConstants";
import {
  buildFolderHierarchy,
  flattenFolderTree,
  getFolderDisplayPath,
  getFolderPath,
} from "./folderUtils";

const folder = (
  folderId: string,
  name: string,
  parentFolderId?: string,
  subFolders: FolderMeta[] = [],
): FolderMeta => ({
  folderId,
  parentFolderId,
  name,
  subFolders,
  folder: true,
  orgId: "org",
  createBy: "user",
  createAt: 0,
  manageable: true,
  lastViewTime: 0,
});

describe("folderUtils", () => {
  const pikachu = folder("pikachu", "Pikachu", "electric");
  const electric = folder("electric", "Electric", "pokemon", [pikachu]);
  const pokemon = folder("pokemon", "Pokemon", undefined, [electric]);

  it("flattens a nested API folder tree without duplicates", () => {
    expect(flattenFolderTree([pokemon, electric])).toEqual([
      pokemon,
      electric,
      pikachu,
    ]);
  });

  it("builds a complete path for a deeply nested folder", () => {
    expect(getFolderPath("pikachu", [pokemon])).toEqual([
      pokemon,
      electric,
      pikachu,
    ]);
    expect(getFolderDisplayPath("pikachu", [pokemon])).toBe(
      "Pokemon / Electric / Pikachu",
    );
  });

  it("returns an empty path for an unknown folder", () => {
    expect(getFolderPath("missing", [pokemon])).toEqual([]);
  });

  it("builds the same sorted hierarchy from flat folder data", () => {
    const animals = folder("animals", "Animals");
    const hierarchy = buildFolderHierarchy([
      electric,
      animals,
      pikachu,
      pokemon,
    ]);

    expect(hierarchy.map((node) => node.folder.name)).toEqual([
      "Animals",
      "Pokemon",
    ]);
    expect(hierarchy[1].children.map((node) => node.folder.name)).toEqual([
      "Electric",
    ]);
    expect(hierarchy[1].children[0].children[0].folder.name).toBe("Pikachu");
  });
});

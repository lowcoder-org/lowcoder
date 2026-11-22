import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { listOrgMembers, type RegisteredUser } from "../api/client";
import { adminOfApiUser, joinWorkspace, seedPrivateApp, type Actor, type ApiUserAsOwner, type SeededApp } from "./actors";

/** The actor fixture's signature (`tag` names the role in the e-mail). */
export type ActorFactory = (tag: string) => Promise<Actor>;

/** A, the owner and admin of workspace OA (the `apiUser`), with its private published app of `seedPrivateApp`. */
export interface Scene {
  a: ApiUserAsOwner;
  seeded: SeededApp;
}

/** Builds the scene of a role scenario: A is the `apiUser` of the test's page, the app is `seedPrivateApp`'s. */
export async function sceneOf(page: Page, apiUser: RegisteredUser): Promise<Scene> {
  const a = await adminOfApiUser(page.request, apiUser);
  return { a, seeded: await seedPrivateApp(a) };
}

/** An actor that is a plain member of the owner's workspace (invited, accepted, workspace current), nothing more. */
export async function memberOf(a: ApiUserAsOwner, actor: ActorFactory, tag: string): Promise<Actor> {
  const member = await actor(tag);
  await joinWorkspace(a, member);
  return member;
}

/** The role of the user in the member list of A's workspace (read by A), `undefined` when the user is no member. */
export async function roleOf(a: ApiUserAsOwner, userId: string): Promise<string | undefined> {
  return (await listOrgMembers(a.request, a.orgId)).find((member) => member.userId === userId)?.role;
}

/**
 * The id of a permission row, or a failed setup: a missing id must not turn into an empty path that any server denies for an
 * unrelated reason (the lesson of the first reviews).
 */
export function permissionIdOf(row: { permissionId?: string } | undefined, what: string): string {
  expect(row?.permissionId, `setup: ${what} has a permission row id`).toBeTruthy();
  return row?.permissionId as string;
}

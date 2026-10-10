import { applyAutomatorRecipe, AutomatorBuildState } from './buildState';
import { automatorRecipeQuery, exampleAutomatorRecipe } from './recipeExample';
import { readAutomatorBuildResult, withAutomatorBuildResult } from './buildMessage';
import { getAutomatorActionsFromMessage, toAssistantMessage } from 'comps/comps/chatComp/utils/assistantMessages';
import { deleteQueryAction } from 'comps/comps/preLoadComp/actions/queryManagement';
import { message } from 'antd';

jest.mock('antd', () => ({ message: { error: jest.fn() } }));
jest.mock('i18n', () => ({ trans: (key: string) => key }));

const recipe = [{ action: 'place_component', component_name: 'title' }, { action: 'set_properties', component_name: 'title' }, { action: 'set_style', component_name: 'title' }];

test('runs in order, settles editor changes, and distinguishes reported and thrown failures', async () => {
  const calls: string[] = [];
  const progress = jest.fn();
  const steps = await applyAutomatorRecipe(recipe, async (action, fail) => {
    calls.push(action.action);
    if (action.action === 'set_properties') fail('Missing component');
    if (action.action === 'set_style') throw new Error('Invalid style');
  }, () => { calls.push('guard'); }, progress, async () => { calls.push('settle'); });
  expect(calls).toEqual(['guard', 'place_component', 'settle', 'guard', 'set_properties', 'settle', 'guard', 'set_style']);
  expect(steps.map(step => step.status)).toEqual(['done', 'error', 'error']);
  expect(steps.map(step => step.error)).toEqual([undefined, 'Missing component', 'Invalid style']);
  expect(progress.mock.calls[0]).toEqual([[], recipe[0]]);
  expect(progress.mock.calls[5]).toEqual([steps]);
});

test('stops before the next mutation if editor access is lost', async () => {
  const execute = jest.fn().mockResolvedValue(undefined);
  let guarded = 0;
  await expect(applyAutomatorRecipe(recipe, execute, () => {
    if (++guarded === 2) throw new Error('Access changed');
  }, () => {}, async () => {})).rejects.toThrow('Access changed');
  expect(execute).toHaveBeenCalledTimes(1);
});

test('a real executor that handles its own failure is not counted as success', async () => {
  const steps = await applyAutomatorRecipe([{ action: 'delete_query', query_name: 'missing' }], async (actionPayload, onError) => {
    await deleteQueryAction.execute({ actionPayload, onError, editorState: { getQueriesComp: () => ({ getView: () => [] }) } } as any);
  }, () => {}, () => {});
  expect(steps[0]).toMatchObject({ status: 'error', error: 'Query "missing" not found' });
  expect(message.error).toHaveBeenCalledWith('Query "missing" not found');
});

test('copied JavaScript returns executable actions and safely refreshes the example on later runs', () => {
  const code = automatorRecipeQuery(exampleAutomatorRecipe(), true);
  const first = toAssistantMessage(new Function(code)());
  expect(getAutomatorActionsFromMessage(first)[0]).toMatchObject({ action: 'place_component', component: 'text', component_name: 'recipeTitle' });
  const repeated = toAssistantMessage(new Function('recipeTitle', code)({}));
  expect(getAutomatorActionsFromMessage(repeated)[0].action).toBe('set_properties');
  const reused = toAssistantMessage(new Function(automatorRecipeQuery(recipe))());
  expect(getAutomatorActionsFromMessage(reused)).toEqual(recipe);
});

test('finish reports survive content serialization and stay scoped to their app', () => {
  const assistant = toAssistantMessage(new Function(automatorRecipeQuery(recipe))());
  const build: AutomatorBuildState = { phase: 'partial', startedAt: 10, finishedAt: 20, recipe,
    steps: [{ action: 'place_component', status: 'done' }, { action: 'set_properties', status: 'error', error: 'Missing' }] };
  const saved = withAutomatorBuildResult(assistant, build, 'app-a');
  const restored = { ...saved, content: JSON.parse(JSON.stringify(saved.content)) };
  expect(readAutomatorBuildResult(restored, 'app-a')).toEqual(build);
  expect(readAutomatorBuildResult(restored, 'app-b')).toBeUndefined();
  expect(readAutomatorBuildResult(assistant, 'app-a')).toBeUndefined();
  expect(assistant.content[0]).not.toHaveProperty('result');
});

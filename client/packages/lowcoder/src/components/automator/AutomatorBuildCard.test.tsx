/** @jest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { AutomatorBuildCard } from './AutomatorBuildCard';
import { AutomatorLanguageGuide } from './AutomatorLanguageGuide';
import copy from 'copy-to-clipboard';
import { automatorRecipeQuery, exampleAutomatorRecipe } from './recipeExample';

jest.mock('antd', () => ({
  Button: ({ children, icon, type, ...props }: any) => <button {...props}>{icon}{children}</button>,
  Progress: ({ percent }: any) => <div role="progressbar" aria-valuenow={percent} />,
  Space: ({ children }: any) => <div>{children}</div>,
  Modal: ({ children, title, footer }: any) => <div role="dialog" aria-label={title}>{children}{footer}</div>,
  Segmented: ({ options, onChange }: any) => <div>{options.map((o: any) => <button key={o.value} onClick={() => onChange(o.value)}>{o.label}</button>)}</div>,
}));
jest.mock('copy-to-clipboard', () => jest.fn(() => true));
jest.mock('i18n', () => {
  const { en } = jest.requireActual('i18n/locales/en');
  return { trans: (key: string, vars: any = {}) => key.split('.').reduce((o: any, part: string) => o[part], en)
    .replace(/\{(\w+)\}/g, (_: string, name: string) => String(vars[name] ?? '')) };
});

const base = { startedAt: Date.now(), recipe: exampleAutomatorRecipe(), steps: [] };

test('waiting has no pretend percentage; action progress and finish actions use real outcomes', () => {
  const preview = jest.fn();
  const recipe = jest.fn();
  const { rerender } = render(<AutomatorBuildCard build={{ ...base, phase: 'planning' }} onPreview={preview} onRecipe={recipe} />);
  expect(screen.getByText('Your idea is taking shape')).toBeTruthy();
  expect(screen.queryByRole('progressbar')).toBeNull();
  expect(screen.queryByText('Preview app')).toBeNull();
  rerender(<AutomatorBuildCard build={{ ...base, phase: 'applying', current: base.recipe[0] }} onPreview={preview} onRecipe={recipe} />);
  expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('0');
  expect(screen.getByText('0 of 1 actions processed')).toBeTruthy();
  rerender(<AutomatorBuildCard build={{ ...base, phase: 'complete', finishedAt: Date.now(), steps: [{ action: 'place_component', status: 'done' }] }} onPreview={preview} onRecipe={recipe} />);
  expect(screen.getByText('Your changes are ready to explore')).toBeTruthy();
  fireEvent.click(screen.getByText('Preview app'));
  fireEvent.click(screen.getByText('See the JSON recipe'));
  expect(preview).toHaveBeenCalledTimes(1);
  expect(recipe).toHaveBeenCalledTimes(1);
});

test('a failed build never celebrates or offers a completed-app preview', () => {
  render(<AutomatorBuildCard build={{ ...base, phase: 'failed', finishedAt: Date.now(), steps: [{ action: 'place_component', status: 'error', error: 'Missing container' }] }} onPreview={jest.fn()} onRecipe={jest.fn()} />);
  expect(screen.getByText('This build needs attention')).toBeTruthy();
  expect(screen.getByText(/Missing container/)).toBeTruthy();
  expect(screen.queryByText('Preview app')).toBeNull();
});

test('guide copies both runnable JavaScript and JSON and explains the execution path', () => {
  render(<AutomatorLanguageGuide onClose={jest.fn()} />);
  fireEvent.click(screen.getByText('Copy code'));
  expect(copy).toHaveBeenLastCalledWith(JSON.stringify({ actions: exampleAutomatorRecipe() }, null, 2));
  fireEvent.click(screen.getByText('JavaScript query'));
  fireEvent.click(screen.getByText('Copy code'));
  expect(copy).toHaveBeenLastCalledWith(automatorRecipeQuery(exampleAutomatorRecipe(), true));
  expect(screen.getByText(/Run button only returns the recipe/)).toBeTruthy();
  expect(screen.getByText(/select that JavaScript query/)).toBeTruthy();
});

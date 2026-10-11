/** @jest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

jest.mock('pages/editor/bottom/BottomContent', () => ({ BottomContent: () => null }));
jest.mock('react-resizable', () => ({ ResizableBox: ({ children }: any) => <div>{children}</div> }));
jest.mock('pages/editor/editorLayoutStore', () => ({ useEditorLayoutStore: (selector: any) => selector({ panelStyle: { bottom: { h: 400 } }, setBottomHeight: jest.fn() }) }));
jest.mock('components/resultPanel/BottomResultPanel', () => ({ BottomResultPanel: () => null }));
jest.mock('redux/selectors/usersSelectors', () => ({ getUser: () => ({ currentOrgId: 'workspace-a' }) }));
jest.mock('react-redux', () => ({ connect: () => (component: any) => component, useSelector: (selector: any) => selector() }));
jest.mock('redux/selectors/subscriptionSelectors', () => ({
  getAiRobotAccess: () => mockAccess,
  getFetchSubscriptionsFinished: () => mockLoaded,
  getSubscriptionsError: () => mockError,
}));
jest.mock('constants/routesURL', () => ({ SUBSCRIPTION_SETTING: '/subscriptions', buildSubscriptionInfoLink: () => '/subscriptions/ai' }));
jest.mock('constants/Layers', () => ({ Layers: { bottomPanel: 1 } }));
jest.mock('constants/subscriptionConstants', () => ({ SubscriptionProductsEnum: { AIROBOT: 'ai' } }));
jest.mock('antd/es/button', () => ({ children, size, ...props }: any) => <button {...props}>{children}</button>);
jest.mock('antd/es/flex', () => ({ children }: any) => <div>{children}</div>);
jest.mock('antd/es/menu/menu', () => ({ items, onSelect }: any) => <div>{items.map((item: any) => <button key={item.key} onClick={() => onSelect({ key: item.key })}>{item.label}</button>)}</div>);
jest.mock('antd/es/select', () => ({ options, value }: any) => <select aria-label="Selected AI query" value={value || ''} onChange={() => {}}>{options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>);
jest.mock('@ant-design/icons', () => ({ DatabaseOutlined: () => null }));
jest.mock('lowcoder-design', () => ({ AIGenerate: () => null, DocLink: () => null }));
jest.mock('@lowcoder-ee/comps/comps/chatComp/components/ChatPanel', () => ({ ChatPanel: () => <div>Chat</div> }));
jest.mock('comps/editorState', () => ({ EditorContext: require('react').createContext({ queryCompInfoList: () => [] }) }));
jest.mock('i18n', () => ({ trans: (key: string) => key }));
jest.mock('components/automator/AutomatorTheme', () => ({ AutomatorTheme: ({ children }: any) => children, automatorColor: { accent: () => '#1677ff' } }));
jest.mock('components/automator/AutomatorHeader', () => ({ AutomatorHeader: () => null }));
jest.mock('components/automator/AutomatorLanguageGuide', () => ({ AutomatorLanguageGuide: () => null }));
jest.mock('components/automator/AutomatorWelcome', () => ({ AutomatorWelcome: ({ onSetup }: any) => <button onClick={onSetup}>Open setup</button> }));
jest.mock('components/automator/GuidedModelSetup', () => ({ AutomatorSetup: ({ onClose, accessStatus }: any) => <div>
  <input aria-label="Setup model" defaultValue="" />
  <span>{accessStatus}</span>
  <button onClick={onClose}>Close setup</button>
</div> }));
jest.mock('react-router-dom', () => ({ useLocation: () => ({ pathname: '/apps/app-a/edit' }) }));
jest.mock('util/localStorageUtil', () => ({ getSelectedAIQueryName: () => '', saveSelectedAIQueryName: jest.fn() }));

const BottomPanel = require('./BottomPanel').default;
let mockAccess = true;
let mockLoaded = true;
let mockError: string | undefined;

beforeEach(() => {
  mockAccess = true;
  mockLoaded = true;
  mockError = undefined;
});

test('an open setup survives the subscription refresh triggered on browser focus', () => {
  const { rerender } = render(<BottomPanel orgId="workspace-a" />);
  fireEvent.click(screen.getByText('automator.panel.lowcoderAI'));
  fireEvent.click(screen.getByText('Open setup'));
  fireEvent.change(screen.getByLabelText('Setup model'), { target: { value: 'keep-this-model' } });
  const field = screen.getByLabelText('Setup model');
  mockAccess = false;
  mockLoaded = false;
  fireEvent(window, new Event('focus'));
  rerender(<BottomPanel orgId="workspace-a" />);
  expect(screen.getByText('checking')).toBeTruthy();
  expect(screen.getByLabelText('Setup model')).toBe(field);
  mockLoaded = true;
  mockError = 'Network unavailable';
  rerender(<BottomPanel orgId="workspace-a" />);
  expect(screen.getByText('unavailable')).toBeTruthy();
  expect(screen.getByLabelText('Setup model')).toBe(field);
  mockAccess = true;
  mockError = undefined;
  rerender(<BottomPanel orgId="workspace-a" />);
  expect((screen.getByLabelText('Setup model') as HTMLInputElement).value).toBe('keep-this-model');
  fireEvent.focus(field);
  expect(screen.getByText('ready')).toBeTruthy();
  fireEvent.click(screen.getByText('Close setup'));
  expect(screen.queryByLabelText('Setup model')).toBeNull();
});

test('leaving the workspace closes the old workspace setup', () => {
  const { rerender } = render(<BottomPanel orgId="workspace-a" />);
  fireEvent.click(screen.getByText('automator.panel.lowcoderAI'));
  fireEvent.click(screen.getByText('Open setup'));
  rerender(<BottomPanel orgId="workspace-b" />);
  expect(screen.queryByLabelText('Setup model')).toBeNull();
});

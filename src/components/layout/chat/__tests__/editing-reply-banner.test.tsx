import React from 'react';
import { TouchableOpacity } from 'react-native';
import renderer, { act } from 'react-test-renderer';
import EditingReplyBanner from '@/components/layout/chat/editing-reply-banner';

jest.mock('@/components/ui/text', () => ({ AppText: 'AppText' }));
jest.mock('@/utils/normalize', () => ({
  normalize: (value: number) => value,
}));
jest.mock('@/theme/ThemeProvider', () => ({
  useTheme: () => ({
    colors: {
      surface: '#fff',
      border: '#ccc',
      textPrimary: '#000',
      primary: '#00f',
    },
  }),
}));

describe('EditingReplyBanner', () => {
  const environment = globalThis as typeof globalThis & {
    IS_REACT_ACT_ENVIRONMENT?: boolean;
  };
  const previousActEnvironment = environment.IS_REACT_ACT_ENVIRONMENT;
  let tree: renderer.ReactTestRenderer | undefined;

  beforeAll(() => {
    environment.IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterAll(() => {
    environment.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
  });

  afterEach(async () => {
    await act(async () => {
      tree?.unmount();
    });
    tree = undefined;
  });

  it('shows that a message is being edited and cancels on press', async () => {
    const onCancel = jest.fn();
    await act(async () => {
      tree = renderer.create(<EditingReplyBanner onCancel={onCancel} />);
    });

    expect(
      tree!.root.findByProps({ testID: 'editing-reply-banner' }),
    ).toBeTruthy();
    const labels = tree!.root
      .findAllByType('AppText' as any)
      .map(node => node.props.children);
    expect(labels).toEqual(['Editing message', 'Cancel']);

    const cancel = tree!.root.findByType(TouchableOpacity);
    expect(cancel.props.accessibilityLabel).toBe('Cancel editing');

    await act(async () => {
      cancel.props.onPress();
    });

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});

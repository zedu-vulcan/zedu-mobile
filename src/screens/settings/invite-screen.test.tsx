import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { Clipboard, Text, TouchableOpacity } from 'react-native';
import InvitePeopleScreen from './invite-screen';
import { GetRequest, PostRequest } from '@/utils/requests';

jest.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  Clipboard: { setString: jest.fn() },
  KeyboardAvoidingView: 'KeyboardAvoidingView',
  LayoutAnimation: {
    configureNext: jest.fn(),
    Presets: { easeInEaseOut: {} },
  },
  Platform: { OS: 'android' },
  ScrollView: 'ScrollView',
  Share: { share: jest.fn(), sharedAction: 'sharedAction' },
  Text: 'Text',
  TextInput: 'TextInput',
  TouchableOpacity: 'TouchableOpacity',
  View: 'View',
}));

jest.mock('@/components/layout/container', () => 'Container');
jest.mock('@/components/ui/text', () => ({
  AppText: require('react-native').Text,
}));
jest.mock('@/components/ui/toast', () => ({ ShowNotify: jest.fn() }));
jest.mock('@/theme/ThemeProvider', () => ({
  useTheme: () => ({ colors: {} }),
}));
jest.mock('@/theme/createScreenStyles', () => ({
  createInviteScreenStyles: () => ({}),
}));
jest.mock('@/utils/requests', () => ({
  GetRequest: jest.fn(),
  PostRequest: jest.fn(),
}));
jest.mock('@/store/useDataContext', () => ({
  useDataContext: () => ({
    state: { orgId: 'workspace' },
    dispatch: jest.fn(),
  }),
}));
jest.mock('react-native-vector-icons/Feather', () => 'Feather');
jest.mock('react-native-vector-icons/Ionicons', () => 'Ionicons');

const roles = [
  { id: 'user-role', name: 'User' },
  { id: 'guest-role', name: 'Guest' },
];

describe('Invite People role-specific links', () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;

  const button = (label: string) =>
    renderer.root
      .findAllByType(TouchableOpacity)
      .find(node =>
        node.findAllByType(Text).some(text => text.props.children === label),
      )!;

  const hasText = (label: string) =>
    renderer.root
      .findAllByType(Text)
      .some(node => node.props.children === label);

  const press = async (label: string) => {
    await act(async () => {
      await button(label).props.onPress();
    });
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.mocked(GetRequest).mockResolvedValue({
      data: { data: roles },
      error: null,
    });
    jest.mocked(PostRequest).mockResolvedValue({
      data: { data: { invitation_link: 'invite/user' } },
      error: null,
    });

    await act(async () => {
      renderer = ReactTestRenderer.create(
        <InvitePeopleScreen navigation={{ goBack: jest.fn() }} />,
      );
    });
  });

  afterEach(() => {
    act(() => renderer.unmount());
  });

  it('generates a link for the preselected User role', async () => {
    await press('Generate');

    expect(PostRequest).toHaveBeenCalledWith('/invite/general', {
      organisation_id: 'workspace',
      role_id: 'user-role',
    });
    expect(Clipboard.setString).toHaveBeenCalledWith(
      expect.stringContaining('/invite/user'),
    );
  });

  it('clears a generated link when the selected role changes', async () => {
    await press('Generate');
    const generatedLink = jest.mocked(Clipboard.setString).mock.calls[0][0];

    await press('Guest');

    expect(hasText(generatedLink)).toBe(false);
    expect(hasText('Create invite link')).toBe(true);
    expect(button('Generate').props.disabled).toBe(false);
    expect(button('Share link via...').props.disabled).toBe(true);
  });

  it('generates a new link for the newly selected role', async () => {
    await press('Guest');
    jest.mocked(PostRequest).mockResolvedValueOnce({
      data: { data: { invitation_link: 'invite/guest' } },
      error: null,
    });

    await press('Generate');

    expect(PostRequest).toHaveBeenCalledWith('/invite/general', {
      organisation_id: 'workspace',
      role_id: 'guest-role',
    });
    expect(Clipboard.setString).toHaveBeenCalledWith(
      expect.stringContaining('/invite/guest'),
    );
  });
});

/**
 * Reply edit flow shared by the channel, DM and group DM thread screens:
 * start, cancel, optimistic update, rollback on failure.
 */
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { useReplyEdit } from '@/hooks/useReplyEdit';
import { ACTIONS } from '@/store/types';
import { PutRequest } from '@/utils/requests';
import { ShowNotify } from '@/components/ui/toast';

const mockDispatch = jest.fn();
const mockState = { channelCallback: false, callback: false };

jest.mock('@/store/useDataContext', () => ({
  useDataContext: () => ({ state: mockState, dispatch: mockDispatch }),
}));
jest.mock('@/utils/requests', () => ({ PutRequest: jest.fn() }));
jest.mock('@/components/ui/toast', () => ({ ShowNotify: jest.fn() }));

const mockPut = PutRequest as jest.Mock;

type Api = ReturnType<typeof useReplyEdit>;

const original = {
  id: 'r1',
  thread_id: 'thread-1',
  message: '<p>hello <b>there</b></p>',
  edited: false,
};

describe('useReplyEdit', () => {
  const environment = globalThis as typeof globalThis & {
    IS_REACT_ACT_ENVIRONMENT?: boolean;
  };
  const previousActEnvironment = environment.IS_REACT_ACT_ENVIRONMENT;
  let api: Api;
  let setMessage: jest.Mock;
  let setMentionsMetadata: jest.Mock;
  let onTypingChange: jest.Mock;
  let tree: renderer.ReactTestRenderer | undefined;

  beforeAll(() => {
    environment.IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterAll(() => {
    environment.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
  });

  const Probe = ({ chatType }: { chatType: 'dm' | 'group_dm' | 'channel' }) => {
    api = useReplyEdit({
      channelId: 'chan-1',
      threadId: 'thread-1',
      chatType,
      setMessage,
      mentionsMetadata: [],
      setMentionsMetadata,
      onTypingChange,
    });
    return null;
  };

  const mount = async (chatType: 'dm' | 'group_dm' | 'channel' = 'channel') => {
    await act(async () => {
      tree = renderer.create(<Probe chatType={chatType} />);
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    setMessage = jest.fn();
    setMentionsMetadata = jest.fn();
    onTypingChange = jest.fn();
  });

  afterEach(async () => {
    await act(async () => {
      tree?.unmount();
    });
    tree = undefined;
  });

  it('loads the reply text into the input, without HTML, when editing starts', async () => {
    await mount();

    await act(async () => {
      api.startEdit(original);
    });

    expect(api.isEditing).toBe(true);
    expect(api.editingReplyId).toBe('r1');
    expect(setMessage).toHaveBeenLastCalledWith('hello there');
  });

  it('does not start editing without a reply id', async () => {
    await mount();

    await act(async () => {
      api.startEdit({ message: 'no id' });
    });

    expect(api.isEditing).toBe(false);
    expect(setMessage).not.toHaveBeenCalled();
  });

  it('clears the input and leaves edit mode on cancel', async () => {
    await mount();
    await act(async () => {
      api.startEdit(original);
    });

    await act(async () => {
      api.cancelEdit();
    });

    expect(api.isEditing).toBe(false);
    expect(api.editingReplyId).toBeNull();
    expect(setMessage).toHaveBeenLastCalledWith('');
    expect(mockPut).not.toHaveBeenCalled();
  });

  it('updates the reply right away and saves it', async () => {
    mockPut.mockResolvedValue({ data: { data: { id: 'r1', message: 'x' } } });
    await mount();
    await act(async () => {
      api.startEdit(original);
    });

    await act(async () => {
      await api.submitEdit('hello again');
    });

    expect(mockDispatch).toHaveBeenCalledWith({
      type: ACTIONS.REPLY_CHAT,
      payload: {
        updatedMessage: {
          id: 'r1',
          message: '<p>hello again</p>',
          edited: true,
        },
      },
    });
    expect(mockPut).toHaveBeenCalledWith('/channels/chan-1/messages', {
      content: '<p>hello again</p>',
      message_id: 'r1',
      thread_id: 'thread-1',
      mentions: [],
    });
    expect(api.isEditing).toBe(false);
    expect(onTypingChange).toHaveBeenCalledWith(false);
    expect(ShowNotify).not.toHaveBeenCalled();
  });

  it('refreshes the thread preview with the callback for the thread type', async () => {
    mockPut.mockResolvedValue({ data: {} });

    await mount('channel');
    await act(async () => {
      api.startEdit(original);
    });
    await act(async () => {
      await api.submitEdit('one');
    });
    expect(mockDispatch).toHaveBeenLastCalledWith({
      type: ACTIONS.CHANNEL_CALLBACK,
      payload: true,
    });

    await act(async () => {
      tree?.unmount();
    });
    await mount('dm');
    await act(async () => {
      api.startEdit(original);
    });
    await act(async () => {
      await api.submitEdit('two');
    });
    expect(mockDispatch).toHaveBeenLastCalledWith({
      type: ACTIONS.CALLBACK,
      payload: true,
    });
  });

  it('puts the original text back and shows an error when saving fails', async () => {
    mockPut.mockResolvedValue({ error: 'Network down' });
    await mount();
    await act(async () => {
      api.startEdit(original);
    });

    await act(async () => {
      await api.submitEdit('will fail');
    });

    expect(mockDispatch).toHaveBeenLastCalledWith({
      type: ACTIONS.REPLY_CHAT,
      payload: {
        updatedMessage: {
          id: 'r1',
          message: original.message,
          edited: false,
        },
      },
    });
    expect(ShowNotify).toHaveBeenCalledWith('Error', 'Network down');
  });

  it('ignores an empty edit', async () => {
    await mount();
    await act(async () => {
      api.startEdit(original);
    });

    await act(async () => {
      await api.submitEdit('   ');
    });

    expect(mockPut).not.toHaveBeenCalled();
    expect(mockDispatch).not.toHaveBeenCalled();
    expect(api.isEditing).toBe(true);
  });
});

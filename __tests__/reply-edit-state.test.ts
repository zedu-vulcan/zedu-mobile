/**
 * Editing a reply must update it where it is. The reducer used to only know
 * how to add a reply at the top, so an edit moved the reply or duplicated it.
 */
import reducers from '@/store/Reducers';
import { initialAppState } from '@/store/initial-state';
import { ACTIONS } from '@/store/types';
import { getReplyEditUrl } from '@/utils/thread-message';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const reply = (id: string, message: string, extra: object = {}) =>
  ({ id, message, thread_id: 't1', ...extra } as any);

const stateWith = (replyChat: any[]) => ({ ...initialAppState, replyChat });

describe('REPLY_CHAT updatedMessage', () => {
  it('updates the matching reply and keeps its position', () => {
    const state = stateWith([
      reply('3', 'third'),
      reply('2', 'second'),
      reply('1', 'first'),
    ]);

    const next = reducers(state, {
      type: ACTIONS.REPLY_CHAT,
      payload: { updatedMessage: { id: '2', message: 'edited', edited: true } },
    } as any);

    expect(next.replyChat.map((m: any) => m.id)).toEqual(['3', '2', '1']);
    expect(next.replyChat[1]).toMatchObject({
      id: '2',
      message: 'edited',
      edited: true,
      thread_id: 't1',
    });
    expect(next.replyChat[0].message).toBe('third');
  });

  it('matches by message_id and ignores id type differences', () => {
    const state = stateWith([{ message_id: 7, message: 'old' }]);

    const next = reducers(state, {
      type: ACTIONS.REPLY_CHAT,
      payload: { updatedMessage: { id: '7', message: 'new' } },
    } as any);

    expect(next.replyChat).toHaveLength(1);
    expect(next.replyChat[0].message).toBe('new');
  });

  it('does not add a reply that is not in the list', () => {
    const state = stateWith([reply('1', 'first')]);

    const next = reducers(state, {
      type: ACTIONS.REPLY_CHAT,
      payload: { updatedMessage: { id: '99', message: 'ghost' } },
    } as any);

    expect(next.replyChat).toEqual(state.replyChat);
  });

  it('ignores an update without an id', () => {
    const state = stateWith([reply('1', 'first')]);

    const next = reducers(state, {
      type: ACTIONS.REPLY_CHAT,
      payload: { updatedMessage: { message: 'no id' } },
    } as any);

    expect(next).toBe(state);
  });

  it('restores the original text when an edit is rolled back', () => {
    const state = stateWith([reply('1', 'original', { edited: false })]);
    const edited = reducers(state, {
      type: ACTIONS.REPLY_CHAT,
      payload: { updatedMessage: { id: '1', message: 'oops', edited: true } },
    } as any);

    const rolledBack = reducers(edited, {
      type: ACTIONS.REPLY_CHAT,
      payload: {
        updatedMessage: { id: '1', message: 'original', edited: false },
      },
    } as any);

    expect(rolledBack.replyChat[0]).toMatchObject({
      message: 'original',
      edited: false,
    });
  });
});

describe('REPLY_CHAT newMessage for a reply we already have', () => {
  it('replaces it in place instead of moving it to the top', () => {
    const state = stateWith([
      reply('3', 'third'),
      reply('2', 'second'),
      reply('1', 'first'),
    ]);

    const next = reducers(state, {
      type: ACTIONS.REPLY_CHAT,
      payload: { newMessage: reply('2', 'second (edited)', { edited: true }) },
    } as any);

    expect(next.replyChat.map((m: any) => m.id)).toEqual(['3', '2', '1']);
    expect(next.replyChat[1].message).toBe('second (edited)');
  });

  it('still adds a genuinely new reply at the top', () => {
    const state = stateWith([reply('1', 'first')]);

    const next = reducers(state, {
      type: ACTIONS.REPLY_CHAT,
      payload: { newMessage: reply('2', 'second') },
    } as any);

    expect(next.replyChat.map((m: any) => m.id)).toEqual(['2', '1']);
  });
});

describe('getReplyEditUrl', () => {
  it('uses the channel messages endpoint for every thread type', () => {
    expect(getReplyEditUrl('abc')).toBe('/channels/abc/messages');
  });
});

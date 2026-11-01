import { ACTIONS } from '@/store/types';

export type ThreadChatType = 'dm' | 'group_dm' | 'channel';

const REPLY_THREAD_SCREEN_NAMES = [
  'ChatThreadScreen',
  'GroupChatThreadScreen',
  'ChannelThread',
] as const;

export function isOnReplyThreadScreen(routeName: string): boolean {
  return REPLY_THREAD_SCREEN_NAMES.includes(
    routeName as (typeof REPLY_THREAD_SCREEN_NAMES)[number],
  );
}

export function getThreadMessageSendUrl(
  chatType: ThreadChatType,
  channelId: string,
): string {
  switch (chatType) {
    case 'group_dm':
      return `/group-dms/messages/${channelId}`;
    case 'channel':
      return `/channels/${channelId}/messages`;
    default:
      return `/dms/messages/${channelId}`;
  }
}

/**
 * Replies in every thread type (channel, DM, group DM) are edited through the
 * channel messages endpoint, the same one the web app uses.
 */
export function getReplyEditUrl(channelId: string): string {
  return `/channels/${channelId}/messages`;
}

export function getThreadMessageCallbackAction(chatType: ThreadChatType) {
  return chatType === 'channel' ? ACTIONS.CHANNEL_CALLBACK : ACTIONS.CALLBACK;
}

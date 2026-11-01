import { useCallback, useState } from 'react';
import { ACTIONS } from '@/store/types';
import { useDataContext } from '@/store/useDataContext';
import { PutRequest } from '@/utils/requests';
import { ShowNotify } from '@/components/ui/toast';
import { buildMentionHtmlTag } from '@/utils/message-text';
import {
  ThreadChatType,
  getReplyEditUrl,
  getThreadMessageCallbackAction,
} from '@/utils/thread-message';

interface UseReplyEditArgs {
  channelId: string;
  threadId: string;
  chatType: ThreadChatType;
  setMessage: (value: string) => void;
  mentionsMetadata: any[];
  setMentionsMetadata: (value: any[]) => void;
  onTypingChange?: (typing: boolean) => void;
}

const getReplyId = (item: any) => item?.id ?? item?.message_id;

const stripHtml = (html?: string) => (html || '').replace(/<[^>]*>?/gm, '');

/**
 * Edit flow for replies inside a thread (channel, DM and group DM threads).
 * The reply is updated in place straight away and rolled back if the
 * request fails.
 */
export const useReplyEdit = ({
  channelId,
  threadId,
  chatType,
  setMessage,
  mentionsMetadata,
  setMentionsMetadata,
  onTypingChange,
}: UseReplyEditArgs) => {
  const { state, dispatch } = useDataContext();
  const [editingReply, setEditingReply] = useState<any | null>(null);

  const editingReplyId = editingReply ? String(getReplyId(editingReply)) : null;

  const startEdit = useCallback(
    (item: any) => {
      if (!item || !getReplyId(item)) return;
      setEditingReply(item);
      setMentionsMetadata([]);
      setMessage(stripHtml(item.message || item.text));
    },
    [setMessage, setMentionsMetadata],
  );

  const cancelEdit = useCallback(() => {
    setEditingReply(null);
    setMentionsMetadata([]);
    setMessage('');
  }, [setMessage, setMentionsMetadata]);

  const submitEdit = useCallback(
    async (content: string) => {
      const original = editingReply;
      const messageId = getReplyId(original);
      if (!original || !messageId || !content.trim()) return;

      onTypingChange?.(false);

      let formattedContent = content;
      mentionsMetadata.forEach(m => {
        formattedContent = formattedContent.replace(
          `@${m.label}`,
          buildMentionHtmlTag(m),
        );
      });
      const finalHtml = `<p>${formattedContent}</p>`;

      // Optimistic update in place: no duplicate message is added
      dispatch({
        type: ACTIONS.REPLY_CHAT,
        payload: {
          updatedMessage: { id: messageId, message: finalHtml, edited: true },
        },
      });

      setEditingReply(null);
      setMessage('');
      setMentionsMetadata([]);

      const { data, error } = await PutRequest(getReplyEditUrl(channelId), {
        content: finalHtml,
        message_id: messageId,
        thread_id: original.thread_id || threadId,
        mentions: mentionsMetadata,
      });

      if (error) {
        dispatch({
          type: ACTIONS.REPLY_CHAT,
          payload: {
            updatedMessage: {
              id: messageId,
              message: original.message,
              edited: original.edited,
            },
          },
        });
        ShowNotify(
          'Error',
          typeof error === 'string' ? error : 'Failed to edit message',
        );
        return;
      }

      const saved = (data as any)?.data;
      if (saved && String(getReplyId(saved)) === String(messageId)) {
        dispatch({
          type: ACTIONS.REPLY_CHAT,
          payload: { updatedMessage: { ...saved, id: messageId } },
        });
      }

      // Refresh the parent message's thread preview
      dispatch({
        type: getThreadMessageCallbackAction(chatType),
        payload:
          chatType === 'channel' ? !state.channelCallback : !state.callback,
      } as any);
    },
    [
      editingReply,
      mentionsMetadata,
      channelId,
      threadId,
      chatType,
      dispatch,
      setMessage,
      setMentionsMetadata,
      onTypingChange,
      state.channelCallback,
      state.callback,
    ],
  );

  return {
    isEditing: Boolean(editingReply),
    editingReplyId,
    startEdit,
    cancelEdit,
    submitEdit,
  };
};

export default useReplyEdit;

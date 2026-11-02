import { Dispatch, SetStateAction, useState } from 'react';
import { ShowNotify } from '@/components/ui/toast';
import { ACTIONS } from '@/store/types';
import { useDataContext } from '@/store/useDataContext';
import { buildMentionHtmlTag } from '@/utils/message-text';
import {
  getReplyEditUrl,
  getThreadMessageCallbackAction,
  ThreadChatType,
} from '@/utils/thread-message';
import { PutRequest } from '@/utils/requests';

type MentionMetadata = {
  id: string;
  label: string;
  type?: string;
};

interface UseReplyEditArgs {
  channelId: string;
  threadId: string;
  chatType: ThreadChatType;
  setMessage: Dispatch<SetStateAction<string>>;
  mentionsMetadata: MentionMetadata[];
  setMentionsMetadata: Dispatch<SetStateAction<MentionMetadata[]>>;
  onTypingChange: (isTyping: boolean) => void;
}

export function useReplyEdit({
  channelId,
  threadId,
  chatType,
  setMessage,
  mentionsMetadata,
  setMentionsMetadata,
  onTypingChange,
}: UseReplyEditArgs) {
  const [editingReply, setEditingReply] = useState<any>(null);
  const { state, dispatch } = useDataContext();

  const startEdit = (item: any) => {
    setEditingReply(item);
    setMentionsMetadata([]);
    setMessage(item?.message?.replace(/<[^>]*>?/gm, '') || '');
  };

  const cancelEdit = () => {
    setEditingReply(null);
    setMessage('');
    setMentionsMetadata([]);
    onTypingChange(false);
  };

  const submitEdit = async (content: string) => {
    if (!content.trim() || !editingReply) return;

    const messageId = editingReply.id ?? editingReply.message_id;
    if (messageId == null) {
      ShowNotify('Error', 'Unable to edit this message');
      return;
    }

    onTypingChange(false);

    let formattedContent = content;
    mentionsMetadata.forEach(mention => {
      formattedContent = formattedContent.replace(
        `@${mention.label}`,
        buildMentionHtmlTag(mention),
      );
    });
    const finalHtml = `<p>${formattedContent}</p>`;
    const originalMessage = editingReply.message;
    const originalEdited = editingReply.edited;

    dispatch({
      type: ACTIONS.REPLY_CHAT,
      payload: {
        updatedMessage: {
          id: messageId,
          message: finalHtml,
          edited: true,
        },
      },
    });
    setMessage('');

    const { data, error } = await PutRequest(getReplyEditUrl(channelId), {
      content: finalHtml,
      message_id: messageId,
      thread_id: editingReply.thread_id || threadId,
      mentions: mentionsMetadata,
    });

    if (error) {
      dispatch({
        type: ACTIONS.REPLY_CHAT,
        payload: {
          updatedMessage: {
            id: messageId,
            message: originalMessage,
            edited: originalEdited,
          },
        },
      });
      setMessage(content);
      ShowNotify('Error', error || 'Failed to edit message');
      return;
    }

    const responseMessage = data?.data;
    const responseId = responseMessage?.id ?? responseMessage?.message_id;
    if (
      responseMessage &&
      responseId != null &&
      String(responseId) === String(messageId)
    ) {
      dispatch({
        type: ACTIONS.REPLY_CHAT,
        payload: { updatedMessage: responseMessage },
      });
    }

    dispatch({
      type: getThreadMessageCallbackAction(chatType),
      payload:
        chatType === 'channel' ? !state.channelCallback : !state.callback,
    });
    setEditingReply(null);
    setMentionsMetadata([]);
  };

  return {
    isEditing: editingReply !== null,
    editingReplyId:
      editingReply?.id != null || editingReply?.message_id != null
        ? String(editingReply.id ?? editingReply.message_id)
        : null,
    startEdit,
    cancelEdit,
    submitEdit,
  };
}

import React, { useMemo } from 'react';
import { View, TouchableOpacity, Image, ScrollView } from 'react-native';
import { AppText } from '@/components/ui/text';
import { useTheme } from '@/theme/ThemeProvider';
import { createMentionSheetStyles } from '@/theme/createChatOverlayStyles';

export interface ChannelMentionOption {
  channels_id: string;
  name: string;
  channel_slug?: string;
  description?: string;
  members_count?: number;
}

interface MentionSheetProps {
  query: string;
  mode?: 'user' | 'channel';
  channels?: ChannelMentionOption[];
  showChannelMention?: boolean;
  participants?: Array<{
    user_id: string | number;
    username?: string | null;
    avatar_url?: string | null;
    online?: boolean;
    default_avatar_url?: string | null;
  }>;
  onSelect: (item: any) => void;
}

const FALLBACK_AVATAR = require('@/assets/images/user.png');

export const MentionSheet = ({
  query,
  mode = 'user',
  channels = [],
  showChannelMention = false,
  participants = [],
  onSelect,
}: MentionSheetProps) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createMentionSheetStyles(colors), [colors]);

  const safeParticipants = useMemo(
    () => (Array.isArray(participants) ? participants : []),
    [participants],
  );

  const showChannelOption = useMemo(() => {
    if (mode === 'channel' || !showChannelMention) {
      return false;
    }

    const normalizedQuery = query.trim().toLowerCase();
    return (
      normalizedQuery.length === 0 || 'channel'.startsWith(normalizedQuery)
    );
  }, [mode, query, showChannelMention]);

  const filteredParticipants = useMemo(() => {
    if (mode === 'channel') {
      return [];
    }
    const q = query.trim().toLowerCase();
    if (!q) {
      return safeParticipants;
    }

    return safeParticipants.filter(participant => {
      const username = String(participant?.username || '').toLowerCase();
      return username.includes(q);
    });
  }, [mode, query, safeParticipants]);

  const filteredChannels = useMemo(() => {
    if (mode !== 'channel') {
      return [];
    }
    const q = query.trim().toLowerCase();
    const list = Array.isArray(channels) ? channels : [];
    if (!q) {
      return list;
    }
    return list.filter(channel => {
      const name = String(channel?.name || '').toLowerCase();
      const slug = String(channel?.channel_slug || '').toLowerCase();
      return name.includes(q) || slug.includes(q);
    });
  }, [channels, mode, query]);

  if (mode === 'channel') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <AppText variant="bold" size={14}>
            Link a channel
          </AppText>
          <AppText size={12} style={styles.headerHint}>
            {`Results for "#${query}"`}
          </AppText>
        </View>

        <ScrollView
          bounces={false}
          style={styles.list}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="always"
        >
          {filteredChannels.length > 0 ? (
            filteredChannels.map((item, index) => {
              const membersCount = item.members_count;
              const membersText =
                membersCount != null
                  ? `${membersCount} ${membersCount === 1 ? 'member' : 'members'}`
                  : '';
              const subtitle = item.description || membersText;

              return (
                <TouchableOpacity
                  key={String(item.channels_id || item.name || index)}
                  style={styles.memberRow}
                  onPress={() => onSelect(item)}
                >
                  <View style={styles.channelMentionBadge}>
                    <AppText
                      variant="bold"
                      size={13}
                      style={styles.channelMentionBadgeText}
                    >
                      #
                    </AppText>
                  </View>
                  <View style={styles.memberInfo}>
                    <AppText variant="medium" size={14} numberOfLines={1}>
                      {item.name}
                    </AppText>
                    {subtitle ? (
                      <AppText
                        size={12}
                        style={styles.statusText}
                        numberOfLines={1}
                      >
                        {subtitle}
                      </AppText>
                    ) : null}
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyContainer}>
              <AppText style={styles.emptyText}>No channels found</AppText>
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppText variant="bold" size={14}>
          Mention someone
        </AppText>
        <AppText size={12} style={styles.headerHint}>
          {query ? `Results for "@${query}"` : 'Members in this chat'}
        </AppText>
      </View>

      <ScrollView
        bounces={false}
        style={styles.list}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="always"
      >
        {showChannelOption ? (
          <TouchableOpacity
            style={styles.memberRow}
            onPress={() =>
              onSelect({
                user_id: 'channel',
                username: 'channel',
                type: 'channel',
              })
            }
          >
            <View style={styles.channelMentionBadge}>
              <AppText
                variant="bold"
                size={13}
                style={styles.channelMentionBadgeText}
              >
                @
              </AppText>
            </View>
            <View style={styles.memberInfo}>
              <AppText
                variant="medium"
                size={14}
                style={styles.channelMentionLabel}
              >
                channel
              </AppText>
              <AppText size={12} style={styles.statusText}>
                Notify everyone in this channel
              </AppText>
            </View>
          </TouchableOpacity>
        ) : null}

        {filteredParticipants.length > 0 ? (
          filteredParticipants.map((item, index) => {
            const avatarUri = item.avatar_url || item.default_avatar_url;
            return (
              <TouchableOpacity
                key={String(item.user_id ?? item.username ?? index)}
                style={styles.memberRow}
                onPress={() => onSelect(item)}
              >
                <View style={styles.avatarContainer}>
                  <Image
                    source={avatarUri ? { uri: avatarUri } : FALLBACK_AVATAR}
                    style={styles.avatar}
                  />
                  <View
                    style={
                      item.online ? styles.onlineBadge : styles.offlineBadge
                    }
                  />
                </View>

                <View style={styles.memberInfo}>
                  <AppText variant="medium" size={14}>
                    {item.username || 'Unknown'}
                  </AppText>
                  <AppText size={12} style={styles.statusText}>
                    {item.online ? 'Active' : 'Away'}
                  </AppText>
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <AppText style={styles.emptyText}>
              {safeParticipants.length === 0
                ? 'No members available'
                : 'No matches found'}
            </AppText>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

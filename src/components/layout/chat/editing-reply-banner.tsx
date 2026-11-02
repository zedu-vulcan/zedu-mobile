import React, { useMemo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppText } from '@/components/ui/text';
import { useTheme } from '@/theme/ThemeProvider';
import { normalize } from '@/utils/normalize';

const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };

interface EditingReplyBannerProps {
  onCancel: () => void;
}

/** Shown above the chat input while a reply is being edited. */
const EditingReplyBanner = ({ onCancel }: EditingReplyBannerProps) => {
  const { colors } = useTheme();
  const themed = useMemo(
    () =>
      StyleSheet.create({
        container: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        title: { color: colors.textPrimary },
        cancel: { color: colors.primary },
      }),
    [colors],
  );

  return (
    <View
      testID="editing-reply-banner"
      style={[styles.container, themed.container]}
    >
      <AppText size={13} variant="medium" style={themed.title}>
        Editing message
      </AppText>
      <TouchableOpacity
        onPress={onCancel}
        accessibilityRole="button"
        accessibilityLabel="Cancel editing"
        hitSlop={HIT_SLOP}
      >
        <AppText size={13} variant="semiBold" style={themed.cancel}>
          Cancel
        </AppText>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(8),
    borderTopWidth: 1,
  },
});

export default EditingReplyBanner;

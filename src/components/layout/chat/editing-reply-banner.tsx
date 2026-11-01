import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { AppText } from '@/components/ui/text';
import { useTheme } from '@/theme/ThemeProvider';
import { normalize } from '@/utils/normalize';

interface EditingReplyBannerProps {
  onCancel: () => void;
}

/** Shown above the chat input while a reply is being edited. */
const EditingReplyBanner = ({ onCancel }: EditingReplyBannerProps) => {
  const { colors } = useTheme();

  return (
    <View
      testID="editing-reply-banner"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: normalize(16),
        paddingVertical: normalize(8),
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.border,
      }}
    >
      <AppText size={13} variant="medium" style={{ color: colors.textPrimary }}>
        Editing message
      </AppText>
      <TouchableOpacity
        onPress={onCancel}
        accessibilityRole="button"
        accessibilityLabel="Cancel editing"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <AppText size={13} variant="semiBold" style={{ color: colors.primary }}>
          Cancel
        </AppText>
      </TouchableOpacity>
    </View>
  );
};

export default EditingReplyBanner;

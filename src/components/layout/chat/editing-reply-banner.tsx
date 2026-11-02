import React, { useMemo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppText } from '@/components/ui/text';
import { useTheme } from '@/theme/ThemeProvider';
import { normalize } from '@/utils/normalize';

interface EditingReplyBannerProps {
  onCancel: () => void;
}

const EditingReplyBanner = ({ onCancel }: EditingReplyBannerProps) => {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: normalize(16),
          paddingVertical: normalize(10),
          backgroundColor: colors.surface,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
        },
        label: { color: colors.textPrimary },
        cancelButton: {
          paddingHorizontal: normalize(10),
          paddingVertical: normalize(5),
        },
        cancelText: { color: colors.primary },
      }),
    [colors],
  );

  return (
    <View style={styles.container}>
      <AppText size={14} style={styles.label}>
        Editing message
      </AppText>
      <TouchableOpacity
        onPress={onCancel}
        accessibilityRole="button"
        accessibilityLabel="Cancel editing message"
        style={styles.cancelButton}
      >
        <AppText size={14} style={styles.cancelText}>
          Cancel
        </AppText>
      </TouchableOpacity>
    </View>
  );
};

export default EditingReplyBanner;

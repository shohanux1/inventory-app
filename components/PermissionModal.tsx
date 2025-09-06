import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { BlurView } from 'expo-blur';

interface PermissionModalProps {
  visible: boolean;
  onAllow: () => void;
  onDeny: () => void;
  permissionType: 'camera' | 'photos' | 'notifications';
  title?: string;
  description?: string;
  colors: typeof Colors.light;
}

export const PermissionModal: React.FC<PermissionModalProps> = ({
  visible,
  onAllow,
  onDeny,
  permissionType,
  title,
  description,
  colors,
}) => {
  const styles = createStyles(colors);

  const getIcon = () => {
    switch (permissionType) {
      case 'camera':
        return 'camera';
      case 'photos':
        return 'images';
      case 'notifications':
        return 'notifications';
      default:
        return 'shield-checkmark';
    }
  };

  const getDefaultTitle = () => {
    switch (permissionType) {
      case 'camera':
        return 'Camera Access';
      case 'photos':
        return 'Photo Library Access';
      case 'notifications':
        return 'Notifications';
      default:
        return 'Permission Required';
    }
  };

  const getDefaultDescription = () => {
    switch (permissionType) {
      case 'camera':
        return 'Allow access to your camera to scan barcodes and take product photos.';
      case 'photos':
        return 'Allow access to your photo library to select product images.';
      case 'notifications':
        return 'Allow notifications to receive important updates about your inventory and sales.';
      default:
        return 'This app needs your permission to continue.';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.6)' }]} />
        )}
        
        <View style={styles.container}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconBackground}>
              <Ionicons 
                name={getIcon() as any} 
                size={32} 
                color={colors.primary} 
              />
            </View>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.title}>
              {title || getDefaultTitle()}
            </Text>
            <Text style={styles.description}>
              {description || getDefaultDescription()}
            </Text>
          </View>

          {/* Privacy Note */}
          <View style={styles.privacyContainer}>
            <Ionicons 
              name="lock-closed" 
              size={14} 
              color={colors.textMuted} 
            />
            <Text style={styles.privacyText}>
              Your privacy is important to us
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity 
              style={[styles.button, styles.denyButton]} 
              onPress={onDeny}
              activeOpacity={0.8}
            >
              <Text style={styles.denyText}>Not Now</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.allowButton]} 
              onPress={onAllow}
              activeOpacity={0.8}
            >
              <Text style={styles.allowText}>Allow Access</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  container: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 20,
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconBackground: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  privacyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.background,
    borderRadius: 20,
  },
  privacyText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  denyButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  allowButton: {
    backgroundColor: colors.primary,
  },
  denyText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  allowText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
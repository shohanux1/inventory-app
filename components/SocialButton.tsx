import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  TouchableOpacityProps,
} from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';

interface SocialButtonProps extends TouchableOpacityProps {
  provider: 'google' | 'apple' | 'facebook';
  compact?: boolean;
}

export default function SocialButton({
  provider,
  compact = false,
  ...props
}: SocialButtonProps) {
  const getProviderIcon = () => {
    switch (provider) {
      case 'google':
        return <FontAwesome name="google" size={20} color="#111827" />;
      case 'apple':
        return <Ionicons name="logo-apple" size={20} color="#111827" />;
      case 'facebook':
        return <FontAwesome name="facebook" size={20} color="#111827" />;
    }
  };

  const getProviderName = () => {
    switch (provider) {
      case 'google':
        return 'Google';
      case 'apple':
        return 'Apple';
      case 'facebook':
        return 'Facebook';
    }
  };

  if (compact) {
    return (
      <TouchableOpacity style={styles.compactButton} activeOpacity={0.7} {...props}>
        {getProviderIcon()}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.button} activeOpacity={0.7} {...props}>
      {getProviderIcon()}
      <Text style={styles.text}>{getProviderName()}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  compactButton: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
});
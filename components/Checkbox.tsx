import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CheckboxProps {
  checked: boolean;
  onPress: () => void;
  label?: string | React.ReactNode;
  disabled?: boolean;
}

export default function Checkbox({ checked, onPress, label, disabled = false }: CheckboxProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={disabled}
    >
      <View style={[styles.checkbox, checked && styles.checkboxChecked, disabled && styles.checkboxDisabled]}>
        {checked && (
          <Ionicons name="checkmark" size={16} color="#FFFFFF" />
        )}
      </View>
      {label && (
        <View style={styles.labelContainer}>
          {typeof label === 'string' ? (
            <Text style={[styles.label, disabled && styles.labelDisabled]}>{label}</Text>
          ) : (
            label
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  checkboxDisabled: {
    opacity: 0.5,
  },
  labelContainer: {
    flex: 1,
    marginLeft: 12,
  },
  label: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  labelDisabled: {
    opacity: 0.5,
  },
});
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  StyleSheet,
  TextInput,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

interface SearchBarWithScannerProps {
  searchQuery: string;
  onSearchChange: (text: string) => void;
  onSearchFocus?: () => void;
  onSearchBlur?: () => void;
  onScanPress: () => void;
  onFilterPress?: () => void;
  placeholder?: string;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  showFilter?: boolean;
}

export const SearchBarWithScanner: React.FC<SearchBarWithScannerProps> = ({
  searchQuery,
  onSearchChange,
  onSearchFocus,
  onSearchBlur,
  onScanPress,
  onFilterPress,
  placeholder = "Search or scan products...",
  containerStyle,
  inputStyle,
  showFilter = false,
}) => {
  const colors = {
    background: '#FFFFFF',
    textPrimary: '#1a1a1a',
    textSecondary: '#666666',
    textMuted: '#999999',
    primary: '#007AFF',
    border: '#E5E5E7',
  };

  return (
    <View style={styles.container}>
      <View style={[styles.searchBar, containerStyle]}>
        <Ionicons name="search" size={18} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, inputStyle]}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={onSearchChange}
          onFocus={onSearchFocus}
          onBlur={onSearchBlur}
        />
        <TouchableOpacity onPress={onScanPress}>
          <Ionicons name="barcode-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>
      {showFilter && onFilterPress && (
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={onFilterPress}
        >
          <Ionicons name="filter" size={20} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    // paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    marginRight: 10,
    fontSize: 16,
    color: '#1a1a1a',
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E7',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
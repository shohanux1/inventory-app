import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
  Dimensions,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';
import { PermissionModal } from './PermissionModal';

interface BarcodeScannerProps {
  visible: boolean;
  onClose: () => void;
  onScan: (data: string, type: string) => void;
  title?: string;
  subtitle?: string;
}

export default function BarcodeScanner({
  visible,
  onClose,
  onScan,
  title = "Scan Product",
  subtitle = "Point your camera at a barcode or QR code"
}: BarcodeScannerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const styles = createStyles(colors);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const { width: screenWidth } = Dimensions.get('window');
  const scannerSize = screenWidth * 0.7;

  useEffect(() => {
    if (visible) {
      // Reset states when scanner opens
      setScanned(false);
      setFlashEnabled(false);
      
      // Check permission status
      if (!permission?.granted && permission?.canAskAgain) {
        setShowPermissionModal(true);
      }
    }
  }, [visible]);

  const handleBarCodeScanned = ({ type, data }: BarcodeScanningResult) => {
    if (scanned) return;
    
    setScanned(true);
    
    // Immediately close the scanner and call onScan
    onClose();
    
    // Call onScan after closing to prevent multiple alerts
    setTimeout(() => {
      onScan(data, type);
      // Reset scanned state after processing
      setScanned(false);
    }, 100);
  };

  const handlePermissionAllow = async () => {
    setShowPermissionModal(false);
    const result = await requestPermission();
    if (!result.granted) {
      Alert.alert(
        'Permission Denied',
        'Camera permission is required to scan barcodes. Please enable it in your device settings.',
        [{ text: 'OK', onPress: onClose }]
      );
    }
  };

  const handlePermissionDeny = () => {
    setShowPermissionModal(false);
    onClose();
  };

  if (!permission) {
    return null;
  }

  if (!permission.granted) {
    return (
      <>
        <PermissionModal
          visible={showPermissionModal}
          onAllow={handlePermissionAllow}
          onDeny={handlePermissionDeny}
          permissionType="camera"
          title="Camera Access Required"
          description="To scan product barcodes and QR codes, we need access to your camera. This helps you quickly add products to inventory or make sales."
          colors={colors}
        />
        {!showPermissionModal && (
          <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={onClose}
          >
            <View style={styles.permissionFallback}>
              <TouchableOpacity 
                style={styles.permissionFallbackOverlay} 
                onPress={onClose}
                activeOpacity={1}
              />
            </View>
          </Modal>
        )}
      </>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: [
              'qr',
              'ean13',
              'ean8',
              'upc_a',
              'upc_e',
              'code39',
              'code128',
              'pdf417',
              'aztec',
              'datamatrix',
            ],
          }}
          enableTorch={flashEnabled}
        />

        {/* Overlay */}
        <View style={styles.overlay}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.headerButton}>
              <Ionicons name="close" size={28} color="white" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>{title}</Text>
              <Text style={styles.headerSubtitle}>{subtitle}</Text>
            </View>
            <TouchableOpacity 
              onPress={() => setFlashEnabled(!flashEnabled)} 
              style={styles.headerButton}
            >
              <Ionicons 
                name={flashEnabled ? "flash" : "flash-off"} 
                size={24} 
                color="white" 
              />
            </TouchableOpacity>
          </View>

          {/* Scanner Frame */}
          <View style={styles.scannerContainer}>
            <View style={styles.scannerWrapper}>
              {/* Corner borders */}
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
              
              {/* Scanning line animation (optional) */}
              {!scanned && (
                <View style={styles.scanLine} />
              )}
              
              {/* Scanner frame */}
              <View style={[styles.scannerFrame, { width: scannerSize, height: scannerSize }]} />
            </View>

            {/* Scan status */}
            {scanned && (
              <View style={styles.scannedIndicator}>
                <Ionicons name="checkmark-circle" size={48} color="#4CAF50" />
                <Text style={styles.scannedText}>Scanned!</Text>
              </View>
            )}
          </View>

          {/* Bottom Instructions */}
          <View style={styles.bottomContainer}>
            <View style={styles.instructionBox}>
              <Ionicons name="information-circle-outline" size={20} color="white" />
              <Text style={styles.instructionText}>
                Align the code within the frame to scan automatically
              </Text>
            </View>

            {/* Manual Entry Option */}
            <TouchableOpacity 
              style={styles.manualButton}
              onPress={() => {
                onClose();
                // Just close scanner, user can type manually
              }}
            >
              <Ionicons name="keypad-outline" size={20} color="white" />
              <Text style={styles.manualButtonText}>Enter Manually</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  permissionFallback: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  permissionFallbackOverlay: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 22,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  scannerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerWrapper: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerFrame: {
    borderWidth: 2,
    borderColor: 'transparent',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: 'white',
  },
  topLeft: {
    top: -1,
    left: -1,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: -1,
    right: -1,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: -1,
    left: -1,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: -1,
    right: -1,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 12,
  },
  scanLine: {
    position: 'absolute',
    width: '100%',
    height: 2,
    backgroundColor: '#4CAF50',
    opacity: 0.7,
  },
  scannedIndicator: {
    position: 'absolute',
    alignItems: 'center',
  },
  scannedText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  instructionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  instructionText: {
    color: 'white',
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
  manualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  manualButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 8,
  },
});
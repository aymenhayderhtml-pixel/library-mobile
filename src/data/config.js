import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Resolve API host for Expo Go / emulator / physical device.
 * Falls back to localhost (iOS sim) or 10.0.2.2 (Android emulator).
 */
export function getApiBaseUrl() {
  const hostUri =
    Constants.expoConfig?.hostUri ??
    Constants.expoGoConfig?.debuggerHost ??
    Constants.manifest2?.extra?.expoGo?.debuggerHost ??
    Constants.manifest?.debuggerHost;

  if (hostUri) {
    const host = hostUri.split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:5000/api`;
    }
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api';
  }

  return 'http://localhost:5000/api';
}

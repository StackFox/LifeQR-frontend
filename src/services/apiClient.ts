import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Auto-detect backend URL based on platform:
// - Android emulator: 10.0.2.2 maps to host localhost
// - Real device (Expo Go): use debuggerHost IP (the dev machine's LAN IP)
// - iOS simulator: localhost works directly
function getBaseUrl(): string {
  if (Platform.OS === 'android') {
    // If running on real device via Expo Go, use the dev server's IP
    const debuggerHost = Constants.expoConfig?.hostUri ?? Constants.manifest2?.extra?.expoGo?.debuggerHost;
    if (debuggerHost) {
      const ip = debuggerHost.split(':')[0];
      return `http://${ip}:5000`;
    }
    // Fallback for emulator
    return 'http://10.0.2.2:5000';
  }
  return 'http://localhost:5000';
}

const API_BASE = getBaseUrl();

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

export default api;
export { API_BASE };

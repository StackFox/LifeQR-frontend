import axios from 'axios';
import Constants from 'expo-constants';

// Get the API base URL from environment variables
// Defaults to localhost:5000 for local development
function getBaseUrl(): string {
  const envApiUrl = Constants.expoConfig?.extra?.apiBaseUrl;

  if (envApiUrl) {
    return envApiUrl;
  }

  // Fallback for local development
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

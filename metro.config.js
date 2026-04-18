const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Handle .wasm files for expo-sqlite web worker
config.resolver.assetExts.push('wasm');

// Exclude web platform from sqlite worker resolution if needed
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.endsWith('.wasm') && platform === 'web') {
    return { type: 'empty' };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;

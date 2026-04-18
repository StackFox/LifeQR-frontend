// Polyfills MUST be imported before anything else
import 'react-native-get-random-values';
import { Buffer } from 'buffer';
(globalThis as any).Buffer = Buffer;

import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);

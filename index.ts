import { registerRootComponent } from 'expo';
import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App).
// Asegura que la app funcione tanto en Expo Go como en builds nativos.
registerRootComponent(App);

// ── Registro del Service Worker (solo en web) para soporte PWA ──
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register('/sw.js')
            .then((reg) => console.log('[PWA] Service Worker registrado:', reg.scope))
            .catch((err) => console.warn('[PWA] Error registrando SW:', err));
    });
}


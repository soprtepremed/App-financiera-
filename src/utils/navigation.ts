/**
 * safeGoBack — Intenta navegar atrás, si no hay historial va a home.
 * Evita el warning "The action 'GO_BACK' was not handled by any navigator"
 * que ocurre en web cuando se accede directamente a una ruta.
 */
import { Router } from 'expo-router';

export function safeGoBack(router: Router) {
    if (router.canGoBack()) {
        router.back();
    } else {
        router.replace('/(tabs)' as any);
    }
}

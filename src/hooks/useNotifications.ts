/**
 * useNotifications - Hook para gestionar notificaciones locales programadas
 * Recordatorios de pago de tarjeta y corte.
 * Usa expo-notifications (requiere permiso en dispositivo físico).
 */
import { useEffect, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { useCards } from './useCards';

// Configurar cómo se muestran las notificaciones cuando la app está en primer plano
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

/**
 * Solicita permisos de notificación al usuario.
 * Solo funciona en dispositivos físicos (no en simulador/emulador).
 * @returns true si el permiso fue otorgado
 */
export async function requestNotificationPermission(): Promise<boolean> {
    // Las notificaciones solo funcionan en dispositivos físicos
    if (!Device.isDevice) {
        console.warn('[Notifications] Solo disponible en dispositivos físicos');
        return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();

    if (existingStatus === 'granted') return true;

    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
}

/**
 * Cancela todas las notificaciones programadas (útil para re-programar)
 */
export async function cancelAllScheduledNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Programa recordatorios de pago para todas las tarjetas del usuario.
 * Cancela primero las existentes para evitar duplicados.
 */
export async function schedulePaymentReminders(cards: Array<{
    bank_name: string;
    card_alias?: string | null;
    last_four_digits: string;
    payment_due_day: number;
    cut_off_day: number;
    current_balance: number;
}>) {
    // Cancel existing to avoid duplicates
    await cancelAllScheduledNotifications();

    const now = new Date();
    const scheduledIds: string[] = [];

    for (const card of cards) {
        if (card.current_balance <= 0) continue; // No hay deuda, no hay recordatorio

        const cardName = card.card_alias ?? card.bank_name;

        // ── Recordatorio de pago: 3 días antes del día de pago ──
        const payDay = card.payment_due_day;
        const triggerDatePay = new Date(now.getFullYear(), now.getMonth(), payDay - 3, 9, 0, 0);

        // Si la fecha ya pasó este mes, programar para el próximo mes
        if (triggerDatePay <= now) {
            triggerDatePay.setMonth(triggerDatePay.getMonth() + 1);
        }

        try {
            const payId = await Notifications.scheduleNotificationAsync({
                content: {
                    title: `💳 Pago próximo — ${cardName}`,
                    body: `Tu pago de ${cardName} •••• ${card.last_four_digits} vence en 3 días (día ${payDay}). ¡No olvides pagarlo!`,
                    data: { type: 'payment_due', cardLastFour: card.last_four_digits },
                },
                trigger: { date: triggerDatePay } as any,
            });
            scheduledIds.push(payId);
        } catch (e) {
            console.warn('[Notifications] Error programando recordatorio de pago:', e);
        }

        // ── Recordatorio de corte: 2 días antes del corte ──
        const cutDay = card.cut_off_day;
        const triggerDateCut = new Date(now.getFullYear(), now.getMonth(), cutDay - 2, 9, 0, 0);

        if (triggerDateCut <= now) {
            triggerDateCut.setMonth(triggerDateCut.getMonth() + 1);
        }

        try {
            const cutId = await Notifications.scheduleNotificationAsync({
                content: {
                    title: `✂️ Corte próximo — ${cardName}`,
                    body: `El corte de ${cardName} •••• ${card.last_four_digits} es en 2 días (día ${cutDay}).`,
                    data: { type: 'cutoff', cardLastFour: card.last_four_digits },
                },
                trigger: { date: triggerDateCut } as any,
            });
            scheduledIds.push(cutId);
        } catch (e) {
            console.warn('[Notifications] Error programando recordatorio de corte:', e);
        }
    }

    return scheduledIds;
}

/**
 * Hook principal de notificaciones.
 * Se usa en NotificationsScreen para programar y gestionar recordatorios.
 */
export function useNotifications() {
    const { data: cards = [] } = useCards();

    /**
     * Inicializa notificaciones: solicita permiso y programa recordatorios.
     * Idempotente — cancela y re-programa si ya existían.
     */
    const initNotifications = useCallback(async (): Promise<{ success: boolean; count: number }> => {
        const hasPermission = await requestNotificationPermission();
        if (!hasPermission) return { success: false, count: 0 };

        const ids = await schedulePaymentReminders(cards);
        return { success: true, count: ids.length };
    }, [cards]);

    /**
     * Cancela todos los recordatorios programados.
     */
    const cancelAll = useCallback(async () => {
        await cancelAllScheduledNotifications();
    }, []);

    /**
     * Obtiene las notificaciones actualmente programadas.
     */
    const getScheduled = useCallback(async () => {
        return Notifications.getAllScheduledNotificationsAsync();
    }, []);

    return { initNotifications, cancelAll, getScheduled };
}

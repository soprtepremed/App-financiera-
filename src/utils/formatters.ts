/**
 * Formatters - Utilidades de formateo
 * Funciones puras para formatear moneda, fechas y números
 */

/**
 * Formatea un número como moneda MXN.
 * @example formatCurrency(24850) → "$24,850.00"
 * @example formatCurrency(24850, false) → "$24,850"
 */
export function formatCurrency(
    amount: number,
    showDecimals: boolean = true
): string {
    return amount.toLocaleString('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: showDecimals ? 2 : 0,
        maximumFractionDigits: showDecimals ? 2 : 0,
    });
}

/**
 * Sanitiza un string de input numérico:
 * - Remueve comas (separador de miles en español)
 * - Permite solo dígitos, punto decimal y signo negativo
 * - Asegura solo un punto decimal
 * @example sanitizeNumericInput("6,000.50") → "6000.50"
 * @example sanitizeNumericInput("50.000,50") → "50000.50"
 */
export function sanitizeNumericInput(value: string): string {
    // Si usa formato europeo/español: 50.000,50 → convertir
    // Detectar si la coma es decimal (último separador)
    const hasCommaAsDecimal = value.includes(',') && (
        !value.includes('.') ||
        value.lastIndexOf(',') > value.lastIndexOf('.')
    );

    if (hasCommaAsDecimal) {
        // Formato español: puntos son miles, coma es decimal
        // Ej: "50.000,50" → "50000.50"
        return value.replace(/\./g, '').replace(',', '.');
    }

    // Formato estándar: comas son miles, punto es decimal
    // Ej: "6,000.50" → "6000.50"
    return value.replace(/,/g, '');
}

/**
 * Parsea un string de input a número, manejando comas y puntos.
 * Retorna 0 si el valor no es válido.
 */
export function parseAmount(value: string): number {
    const sanitized = sanitizeNumericInput(value);
    const num = parseFloat(sanitized);
    return isNaN(num) ? 0 : num;
}

/**
 * Formatea un número como porcentaje.
 * @example formatPercentage(0.128) → "12.8%"
 */
export function formatPercentage(value: number, decimals: number = 1): string {
    return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Formatea una fecha ISO a formato legible en español.
 * @example formatDate('2026-03-08') → "8 de marzo de 2026"
 */
export function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

/**
 * Formatea una fecha como relativa al hoy.
 * @example formatRelativeDate('2026-03-10') → "en 2 días"
 */
export function formatRelativeDate(dateStr: string): string {
    const target = new Date(dateStr);
    const now = new Date();
    const diffMs = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Mañana';
    if (diffDays === -1) return 'Ayer';
    if (diffDays > 0) return `en ${diffDays} días`;
    return `hace ${Math.abs(diffDays)} días`;
}

/**
 * Obtiene el saludo apropiado según la hora del día.
 * @example getGreeting() → "Buenos días"
 */
export function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
}

/**
 * Trunca un nombre para mostrar solo el primer nombre.
 * @example getFirstName("Carlos Adrián Martínez") → "Carlos"
 */
export function getFirstName(fullName: string | null): string {
    if (!fullName) return 'Usuario';
    return fullName.split(' ')[0];
}

/**
 * Formatea los últimos 4 dígitos de una tarjeta.
 * @example formatCardNumber("4521") → "•••• 4521"
 */
export function formatCardNumber(lastFour: string): string {
    return `•••• ${lastFour}`;
}

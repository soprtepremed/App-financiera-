/**
 * Validators - Validaciones de formularios
 * Funciones puras de validación con mensajes en español
 */

/** Resultado de una validación */
export interface ValidationResult {
    isValid: boolean;
    error?: string;
}

/** Valida que el email tenga formato correcto */
export function validateEmail(email: string): ValidationResult {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
        return { isValid: false, error: 'El email es obligatorio' };
    }
    if (!emailRegex.test(email)) {
        return { isValid: false, error: 'Ingresa un email válido' };
    }
    return { isValid: true };
}

/** Valida la contraseña (mínimo 6 caracteres) */
export function validatePassword(password: string): ValidationResult {
    if (!password) {
        return { isValid: false, error: 'La contraseña es obligatoria' };
    }
    if (password.length < 6) {
        return { isValid: false, error: 'Mínimo 6 caracteres' };
    }
    return { isValid: true };
}

/** Valida que las contraseñas coincidan */
export function validatePasswordMatch(
    password: string,
    confirmPassword: string
): ValidationResult {
    if (password !== confirmPassword) {
        return { isValid: false, error: 'Las contraseñas no coinciden' };
    }
    return { isValid: true };
}

/** Valida que un campo no esté vacío */
export function validateRequired(
    value: string,
    fieldName: string
): ValidationResult {
    if (!value.trim()) {
        return { isValid: false, error: `${fieldName} es obligatorio` };
    }
    return { isValid: true };
}

/** Valida un monto monetario mayor a cero */
export function validateAmount(amount: string): ValidationResult {
    const num = parseFloat(amount.replace(/,/g, ''));
    if (isNaN(num) || num <= 0) {
        return { isValid: false, error: 'Ingresa un monto válido mayor a $0' };
    }
    return { isValid: true };
}

/** Valida últimos 4 dígitos de tarjeta */
export function validateLastFourDigits(digits: string): ValidationResult {
    if (!/^\d{4}$/.test(digits)) {
        return { isValid: false, error: 'Ingresa exactamente 4 dígitos' };
    }
    return { isValid: true };
}

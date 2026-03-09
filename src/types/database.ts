/**
 * Tipos globales - FinanzApp
 * Definiciones TypeScript para las entidades de la base de datos
 */

// ── Perfil de Usuario ──
export interface UserProfile {
    id: string;
    user_id: string;
    full_name: string | null;
    avatar_url: string | null;
    currency: string;
    timezone: string;
    onboarding_completed: boolean;
    onboarding_step: number;
    notification_preferences: NotificationPreferences;
    created_at: string;
    updated_at: string;
}

export interface NotificationPreferences {
    payment_reminders: boolean;
    cutoff_alerts: boolean;
    budget_alerts: boolean;
    savings_reminders: boolean;
    weekly_summary: boolean;
    days_before_payment: number;
    days_before_cutoff: number;
}

// ── Tarjetas de Crédito ──
export interface CreditCard {
    id: string;
    user_id: string;
    bank_name: string;
    card_alias: string | null;
    last_four_digits: string;
    card_type: 'visa' | 'mastercard' | 'amex';
    card_color: string;
    credit_limit: number;
    current_balance: number;
    minimum_payment: number;
    no_interest_payment: number;
    annual_interest_rate: number | null;
    cut_off_day: number;
    payment_due_day: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

/** Vista con cálculos adicionales */
export interface CreditCardSummary extends CreditCard {
    days_until_cutoff: number;
    days_until_payment: number;
    utilization_percentage: number;
    card_status: 'safe' | 'warning' | 'danger';
}

// ── Pagos de Tarjeta ──
export interface CardPayment {
    id: string;
    card_id: string;
    user_id: string;
    amount_paid: number;
    payment_date: string;
    payment_type: 'minimum' | 'no_interest' | 'full' | 'custom';
    notes: string | null;
    created_at: string;
}

// ── Fuentes de Ingreso ──
export interface IncomeSource {
    id: string;
    user_id: string;
    name: string;
    amount: number;
    frequency: 'weekly' | 'biweekly' | 'monthly' | 'yearly';
    day_of_month: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

// ── Categorías de Gasto ──
export interface ExpenseCategory {
    id: string;
    user_id: string | null;
    name: string;
    icon: string;
    color: string;
    is_default: boolean;
    sort_order: number;
    created_at: string;
}

// ── Gastos ──
export interface Expense {
    id: string;
    user_id: string;
    category_id: string;
    card_id: string | null;
    amount: number;
    description: string | null;
    expense_date: string;
    is_recurring: boolean;
    recurrence_period: 'weekly' | 'biweekly' | 'monthly' | null;
    parent_recurring_id: string | null;
    created_at: string;
    updated_at: string;
    /** Relación expandida */
    category?: ExpenseCategory;
    card?: CreditCard;
}

// ── Presupuestos ──
export interface Budget {
    id: string;
    user_id: string;
    month: number;
    year: number;
    total_income: number;
    total_planned_expenses: number;
    total_planned_savings: number;
    created_at: string;
    updated_at: string;
}

export interface BudgetCategory {
    id: string;
    budget_id: string;
    category_id: string;
    planned_amount: number;
    created_at: string;
    /** Relación expandida */
    category?: ExpenseCategory;
}

// ── Metas de Ahorro ──
export interface SavingsGoal {
    id: string;
    user_id: string;
    name: string;
    icon: string;
    description: string | null;
    target_amount: number;
    current_amount: number;
    start_date: string;
    target_date: string | null;
    status: 'active' | 'paused' | 'completed';
    priority: number;
    created_at: string;
    updated_at: string;
}

export interface SavingsEntry {
    id: string;
    goal_id: string;
    user_id: string;
    amount: number;
    entry_date: string;
    week_number: number | null;
    notes: string | null;
    created_at: string;
}

// ── Vista Resumen Mensual ──
export interface MonthlyExpenseSummary {
    user_id: string;
    year: number;
    month: number;
    category_id: string;
    category_name: string;
    category_icon: string;
    category_color: string;
    total_amount: number;
    transaction_count: number;
}

// ── Navegación ──
export type RootStackParamList = {
    '(auth)': undefined;
    '(tabs)': undefined;
    'card-detail': { cardId: string };
    'add-expense': { cardId?: string };
    'goal-detail': { goalId: string };
};

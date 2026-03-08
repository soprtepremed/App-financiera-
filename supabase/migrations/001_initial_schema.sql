-- ============================================================
-- FinanzApp - Migración Inicial
-- Fecha: 2026-03-07
-- Descripción: Esquema completo de la aplicación financiera
-- ============================================================

-- ============================================================
-- 1. PERFILES DE USUARIO
-- Extiende la tabla auth.users de Supabase con datos
-- adicionales del perfil financiero del usuario
-- ============================================================
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    -- Configuración financiera
    currency TEXT NOT NULL DEFAULT 'MXN',
    timezone TEXT NOT NULL DEFAULT 'America/Mexico_City',
    -- Estado del onboarding
    onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
    onboarding_step INTEGER NOT NULL DEFAULT 0,
    -- Preferencias de notificaciones
    notification_preferences JSONB NOT NULL DEFAULT '{
        "payment_reminders": true,
        "cutoff_alerts": true,
        "budget_alerts": true,
        "savings_reminders": true,
        "weekly_summary": true,
        "days_before_payment": 5,
        "days_before_cutoff": 7
    }'::jsonb,
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Un perfil por usuario
    CONSTRAINT unique_user_profile UNIQUE (user_id)
);

-- Índice para búsquedas rápidas por user_id
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);

-- ============================================================
-- 2. TARJETAS DE CRÉDITO
-- Almacena las tarjetas del usuario con sus ciclos de billing
-- NOTA: Solo se guardan los últimos 4 dígitos por seguridad
-- ============================================================
CREATE TABLE IF NOT EXISTS credit_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    -- Información básica de la tarjeta
    bank_name TEXT NOT NULL,
    card_alias TEXT,                    -- Nombre personalizado: "Mi BBVA", "NU Morada"
    last_four_digits CHAR(4) NOT NULL,
    card_type TEXT NOT NULL DEFAULT 'visa',  -- visa, mastercard, amex, other
    card_color TEXT DEFAULT '#6C63FF',  -- Color hex para UI
    -- Información financiera
    credit_limit DECIMAL(12,2) NOT NULL DEFAULT 0,
    current_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
    -- Pagos (ingresados por el usuario desde su estado de cuenta)
    minimum_payment DECIMAL(12,2) DEFAULT 0,
    no_interest_payment DECIMAL(12,2) DEFAULT 0,
    -- Tasa de interés (opcional, para proyecciones)
    annual_interest_rate DECIMAL(5,2) DEFAULT NULL, -- Ej: 36.50 = 36.50% anual
    -- Ciclo de billing
    cut_off_day INTEGER NOT NULL CHECK (cut_off_day BETWEEN 1 AND 31),
    payment_due_day INTEGER NOT NULL CHECK (payment_due_day BETWEEN 1 AND 31),
    -- Estado
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para consultas frecuentes
CREATE INDEX idx_credit_cards_user_id ON credit_cards(user_id);
CREATE INDEX idx_credit_cards_active ON credit_cards(user_id, is_active);

-- ============================================================
-- 3. PAGOS DE TARJETAS
-- Historial de pagos realizados a cada tarjeta
-- ============================================================
CREATE TABLE IF NOT EXISTS card_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id UUID NOT NULL REFERENCES credit_cards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    -- Detalle del pago
    amount_paid DECIMAL(12,2) NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_type TEXT NOT NULL DEFAULT 'custom',  -- minimum, no_interest, full, custom
    notes TEXT,
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_card_payments_card_id ON card_payments(card_id);
CREATE INDEX idx_card_payments_user_id ON card_payments(user_id);
CREATE INDEX idx_card_payments_date ON card_payments(payment_date);

-- ============================================================
-- 4. FUENTES DE INGRESO
-- Sueldo, freelance, y otras fuentes de ingreso del usuario
-- ============================================================
CREATE TABLE IF NOT EXISTS income_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    -- Detalle del ingreso
    name TEXT NOT NULL,                -- "Sueldo", "Freelance", "Renta de depa"
    amount DECIMAL(12,2) NOT NULL,
    frequency TEXT NOT NULL DEFAULT 'monthly',  -- monthly, biweekly, weekly, one_time
    day_of_month INTEGER DEFAULT 1,    -- Día en que llega el ingreso (1-31)
    -- Estado
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_income_sources_user_id ON income_sources(user_id);

-- ============================================================
-- 5. CATEGORÍAS DE GASTO
-- Categorías predefinidas + personalizadas por el usuario
-- Si user_id es NULL, la categoría es global (predefinida)
-- ============================================================
CREATE TABLE IF NOT EXISTS expense_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,  -- NULL = global
    -- Detalle de la categoría
    name TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT '📦',    -- Emoji o nombre de ícono
    color TEXT NOT NULL DEFAULT '#6C63FF', -- Color hex para gráficas
    -- Configuración
    is_default BOOLEAN NOT NULL DEFAULT FALSE,  -- Si es categoría del sistema
    sort_order INTEGER NOT NULL DEFAULT 0,
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_expense_categories_user_id ON expense_categories(user_id);

-- ============================================================
-- 6. GASTOS / TRANSACCIONES
-- Cada gasto registrado por el usuario
-- ============================================================
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES expense_categories(id),
    card_id UUID REFERENCES credit_cards(id) ON DELETE SET NULL,  -- NULL = efectivo/débito
    -- Detalle del gasto
    amount DECIMAL(12,2) NOT NULL,
    description TEXT,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    -- Recurrencia
    is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
    recurrence_period TEXT DEFAULT NULL,  -- monthly, weekly, biweekly, null
    parent_recurring_id UUID REFERENCES expenses(id) ON DELETE SET NULL,  -- Referencia al gasto recurrente original
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para consultas frecuentes de reportes
CREATE INDEX idx_expenses_user_id ON expenses(user_id);
CREATE INDEX idx_expenses_date ON expenses(user_id, expense_date);
CREATE INDEX idx_expenses_category ON expenses(user_id, category_id);
CREATE INDEX idx_expenses_card ON expenses(card_id);
CREATE INDEX idx_expenses_recurring ON expenses(user_id, is_recurring) WHERE is_recurring = TRUE;

-- ============================================================
-- 7. PRESUPUESTOS MENSUALES
-- Presupuesto planificado por mes
-- ============================================================
CREATE TABLE IF NOT EXISTS budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    -- Periodo
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL CHECK (year BETWEEN 2020 AND 2100),
    -- Totales planificados
    total_income DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_planned_expenses DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_planned_savings DECIMAL(12,2) NOT NULL DEFAULT 0,
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Un presupuesto por mes por usuario
    CONSTRAINT unique_budget_period UNIQUE (user_id, month, year)
);

CREATE INDEX idx_budgets_user_period ON budgets(user_id, year, month);

-- ============================================================
-- 8. CATEGORÍAS DE PRESUPUESTO
-- Desglose del presupuesto por categoría de gasto
-- ============================================================
CREATE TABLE IF NOT EXISTS budget_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES expense_categories(id),
    -- Montos
    planned_amount DECIMAL(12,2) NOT NULL DEFAULT 0,  -- Lo que planeaste gastar
    -- El gasto real se calcula con un query a expenses
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Una categoría por presupuesto
    CONSTRAINT unique_budget_category UNIQUE (budget_id, category_id)
);

CREATE INDEX idx_budget_categories_budget ON budget_categories(budget_id);

-- ============================================================
-- 9. METAS DE AHORRO
-- Objetivos financieros del usuario con tracking semanal
-- ============================================================
CREATE TABLE IF NOT EXISTS savings_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    -- Detalle de la meta
    name TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT '🎯',
    description TEXT,
    -- Montos
    target_amount DECIMAL(12,2) NOT NULL,
    current_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    -- Fechas
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    target_date DATE,  -- NULL = sin fecha límite
    -- Estado y prioridad
    status TEXT NOT NULL DEFAULT 'active',  -- active, completed, paused, cancelled
    priority INTEGER NOT NULL DEFAULT 1,    -- 1 = máxima prioridad
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_savings_goals_user_id ON savings_goals(user_id);
CREATE INDEX idx_savings_goals_status ON savings_goals(user_id, status);

-- ============================================================
-- 10. ENTRADAS DE AHORRO
-- Cada depósito/retiro hacia una meta de ahorro
-- ============================================================
CREATE TABLE IF NOT EXISTS savings_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID NOT NULL REFERENCES savings_goals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    -- Detalle
    amount DECIMAL(12,2) NOT NULL,      -- Positivo = depósito, Negativo = retiro
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    week_number INTEGER,                 -- Número de semana del año (1-53)
    notes TEXT,
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_savings_entries_goal ON savings_entries(goal_id);
CREATE INDEX idx_savings_entries_user ON savings_entries(user_id);
CREATE INDEX idx_savings_entries_date ON savings_entries(entry_date);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Cada usuario solo puede ver y modificar SUS datos
-- ============================================================

-- Activar RLS en todas las tablas
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_entries ENABLE ROW LEVEL SECURITY;

-- ── Políticas para user_profiles ──
CREATE POLICY "Users can view own profile"
    ON user_profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
    ON user_profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ── Políticas para credit_cards ──
CREATE POLICY "Users can CRUD own cards"
    ON credit_cards FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ── Políticas para card_payments ──
CREATE POLICY "Users can CRUD own card payments"
    ON card_payments FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ── Políticas para income_sources ──
CREATE POLICY "Users can CRUD own income sources"
    ON income_sources FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ── Políticas para expense_categories ──
-- Los usuarios pueden ver categorías globales (user_id IS NULL) Y las suyas
CREATE POLICY "Users can view global and own categories"
    ON expense_categories FOR SELECT
    USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can insert own categories"
    ON expense_categories FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories"
    ON expense_categories FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories"
    ON expense_categories FOR DELETE
    USING (auth.uid() = user_id);

-- ── Políticas para expenses ──
CREATE POLICY "Users can CRUD own expenses"
    ON expenses FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ── Políticas para budgets ──
CREATE POLICY "Users can CRUD own budgets"
    ON budgets FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ── Políticas para budget_categories ──
-- Las budget_categories no tienen user_id directamente,
-- por lo que la política se basa en el presupuesto padre
CREATE POLICY "Users can CRUD own budget categories"
    ON budget_categories FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM budgets
            WHERE budgets.id = budget_categories.budget_id
            AND budgets.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM budgets
            WHERE budgets.id = budget_categories.budget_id
            AND budgets.user_id = auth.uid()
        )
    );

-- ── Políticas para savings_goals ──
CREATE POLICY "Users can CRUD own savings goals"
    ON savings_goals FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ── Políticas para savings_entries ──
CREATE POLICY "Users can CRUD own savings entries"
    ON savings_entries FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- DATOS INICIALES: CATEGORÍAS DE GASTO PREDEFINIDAS
-- Estas categorías estarán disponibles para todos los usuarios
-- ============================================================
INSERT INTO expense_categories (user_id, name, icon, color, is_default, sort_order) VALUES
    (NULL, 'Renta / Vivienda',     '🏠', '#6366F1', TRUE, 1),
    (NULL, 'Comida',               '🍔', '#F59E0B', TRUE, 2),
    (NULL, 'Transporte',           '🚗', '#3B82F6', TRUE, 3),
    (NULL, 'Entretenimiento',      '🎮', '#EC4899', TRUE, 4),
    (NULL, 'Suscripciones',        '📱', '#06B6D4', TRUE, 5),
    (NULL, 'Salud',                '💊', '#10B981', TRUE, 6),
    (NULL, 'Educación',            '📚', '#8B5CF6', TRUE, 7),
    (NULL, 'Ropa',                 '👕', '#F97316', TRUE, 8),
    (NULL, 'Servicios (Luz/Agua)', '💡', '#EAB308', TRUE, 9),
    (NULL, 'Supermercado',         '🛒', '#22C55E', TRUE, 10),
    (NULL, 'Mascotas',             '🐾', '#A855F7', TRUE, 11),
    (NULL, 'Regalos',              '🎁', '#EF4444', TRUE, 12),
    (NULL, 'Ahorro / Inversión',   '💰', '#14B8A6', TRUE, 13),
    (NULL, 'Otro',                 '📦', '#94A3B8', TRUE, 99);

-- ============================================================
-- FUNCIONES Y TRIGGERS
-- ============================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers de updated_at en tablas relevantes
CREATE TRIGGER trigger_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_credit_cards_updated_at
    BEFORE UPDATE ON credit_cards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_income_sources_updated_at
    BEFORE UPDATE ON income_sources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_expenses_updated_at
    BEFORE UPDATE ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_budgets_updated_at
    BEFORE UPDATE ON budgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_savings_goals_updated_at
    BEFORE UPDATE ON savings_goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Función: Actualizar current_amount de una meta de ahorro
-- cuando se inserta/elimina una savings_entry
-- ============================================================
CREATE OR REPLACE FUNCTION update_savings_goal_amount()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Sumar al monto actual de la meta
        UPDATE savings_goals
        SET current_amount = current_amount + NEW.amount,
            -- Si alcanzó la meta, marcar como completada
            status = CASE
                WHEN current_amount + NEW.amount >= target_amount THEN 'completed'
                ELSE status
            END,
            updated_at = NOW()
        WHERE id = NEW.goal_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Restar del monto actual de la meta
        UPDATE savings_goals
        SET current_amount = GREATEST(0, current_amount - OLD.amount),
            status = CASE
                WHEN status = 'completed' AND current_amount - OLD.amount < target_amount THEN 'active'
                ELSE status
            END,
            updated_at = NOW()
        WHERE id = OLD.goal_id;
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_savings_amount
    AFTER INSERT OR DELETE ON savings_entries
    FOR EACH ROW EXECUTE FUNCTION update_savings_goal_amount();

-- ============================================================
-- Función: Crear perfil de usuario automáticamente al registrarse
-- Se ejecuta cuando un nuevo usuario se registra en Supabase Auth
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (user_id, full_name)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que se dispara cuando se crea un usuario nuevo en auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- VISTAS ÚTILES (para facilitar consultas en la app)
-- ============================================================

-- Vista: Resumen de tarjetas con días restantes para corte/pago
CREATE OR REPLACE VIEW credit_cards_summary AS
SELECT
    cc.*,
    -- Calcular días restantes para fecha de corte
    CASE
        WHEN cc.cut_off_day >= EXTRACT(DAY FROM CURRENT_DATE)
        THEN cc.cut_off_day - EXTRACT(DAY FROM CURRENT_DATE)::INTEGER
        ELSE (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' +
              (cc.cut_off_day - 1) * INTERVAL '1 day')::DATE - CURRENT_DATE
    END AS days_until_cutoff,
    -- Calcular días restantes para fecha de pago
    CASE
        WHEN cc.payment_due_day >= EXTRACT(DAY FROM CURRENT_DATE)
        THEN cc.payment_due_day - EXTRACT(DAY FROM CURRENT_DATE)::INTEGER
        ELSE (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' +
              (cc.payment_due_day - 1) * INTERVAL '1 day')::DATE - CURRENT_DATE
    END AS days_until_payment,
    -- Porcentaje de utilización del crédito
    CASE
        WHEN cc.credit_limit > 0
        THEN ROUND((cc.current_balance / cc.credit_limit) * 100, 1)
        ELSE 0
    END AS utilization_percentage,
    -- Semáforo de estado
    CASE
        WHEN cc.cut_off_day - EXTRACT(DAY FROM CURRENT_DATE)::INTEGER BETWEEN 0 AND 3
            THEN 'danger'    -- 🔴 No usar, corte inminente
        WHEN cc.cut_off_day - EXTRACT(DAY FROM CURRENT_DATE)::INTEGER BETWEEN 4 AND 7
            THEN 'warning'   -- 🟡 Precaución
        ELSE 'safe'          -- 🟢 Seguro para usar
    END AS card_status
FROM credit_cards cc
WHERE cc.is_active = TRUE;

-- Vista: Resumen mensual de gastos por categoría
CREATE OR REPLACE VIEW monthly_expense_summary AS
SELECT
    e.user_id,
    EXTRACT(YEAR FROM e.expense_date)::INTEGER AS year,
    EXTRACT(MONTH FROM e.expense_date)::INTEGER AS month,
    ec.id AS category_id,
    ec.name AS category_name,
    ec.icon AS category_icon,
    ec.color AS category_color,
    SUM(e.amount) AS total_amount,
    COUNT(*) AS transaction_count
FROM expenses e
JOIN expense_categories ec ON e.category_id = ec.id
GROUP BY e.user_id, EXTRACT(YEAR FROM e.expense_date),
         EXTRACT(MONTH FROM e.expense_date),
         ec.id, ec.name, ec.icon, ec.color;

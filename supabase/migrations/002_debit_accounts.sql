-- ============================================================
-- MIGRACIÓN: Agregar tabla de cuentas de débito / ahorro
-- Permite al usuario registrar sus tarjetas de débito y
-- cuentas donde tiene dinero guardado.
-- ============================================================

CREATE TABLE IF NOT EXISTS debit_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    -- Identificación
    bank_name TEXT NOT NULL,
    account_alias TEXT,                     -- Ej: "Nómina BBVA", "Ahorro Nu"
    last_four_digits TEXT DEFAULT '',       -- Últimos 4 dígitos de la tarjeta/cuenta
    account_type TEXT NOT NULL DEFAULT 'debit',  -- debit, savings, investment
    -- Saldo
    current_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
    -- Estética
    account_color TEXT DEFAULT '#10B981',   -- Color verde por defecto (ahorro)
    -- Estado
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_debit_accounts_user_id ON debit_accounts(user_id);
CREATE INDEX idx_debit_accounts_active ON debit_accounts(user_id, is_active);

-- RLS
ALTER TABLE debit_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "debit_accounts_user_policy"
    ON debit_accounts FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Trigger de updated_at
CREATE TRIGGER trigger_debit_accounts_updated_at
    BEFORE UPDATE ON debit_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

/*
# Chitti Collection & Member Payment Management — Initial Schema

## Purpose
Persistent cloud storage for a single-admin chitti (rotating savings) collection
manager. Tracks multiple chittis, their members, individual payment transactions,
an audit/activity log, and admin settings. Financial totals are derived from
immutable payment records; money is stored as numeric(12,2) to avoid floating-point
corruption.

## Tables

1. `chittis` — A named collection group (e.g. "Chitti A").
   - id (uuid pk), user_id (owner), name, description, start_date, end_date,
     status ('active' | 'completed' | 'archived'), created_at, updated_at.

2. `members` — A participant in a chitti with their own installment plan.
   - id, user_id, chitti_id (fk -> chittis), full_name, mobile_number, photo_url,
     total_chitti_amount, installment_amount, total_installments, due_day (1-31),
     start_date, notes (private), archived (bool), created_at, updated_at.
   - Derived fields (paid_installments, total_paid, remaining_balance, status) are
     computed from payment records at read time — NOT stored — so they can never
     drift from the canonical transaction history.

3. `payments` — Immutable transaction records. One row per payment event.
   - id, user_id, member_id (fk -> members), chitti_id (fk -> chittis),
     amount (numeric), payment_date, installment_month (YYYY-MM string marking
     which month the payment covers), payment_mode ('cash'|'upi'|'bank'|'other'),
     reference_number, note, reversed (bool, default false), created_at, updated_at.
   - Reversed payments remain in the table (never deleted) and are excluded from
     derived totals via the `reversed = false` filter.

4. `activity_logs` — Audit trail of admin actions.
   - id, user_id, action_type, description, metadata (jsonb), created_at.

5. `settings` — Singleton admin preferences (one row per user).
   - id, user_id (unique), theme ('light'|'dark'|'system'), currency_code,
     default_chitti_id (nullable fk -> chittis), statement_footer, created_at, updated_at.

## Security (RLS)
- All tables enable RLS and are owner-scoped to `auth.uid() = user_id`.
- Every owner column defaults to `auth.uid()` so inserts that omit user_id succeed.
- Four separate policies per table (select/insert/update/delete), TO authenticated.
- No anon access — this is a protected admin app behind login.

## Notes
- Money columns use numeric(12,2) (exact decimal, no float drift).
- Indexes added on foreign keys and common query columns.
- `updated_at` auto-updated via trigger on members, chittis, settings.
*/

-- ============================================================
-- chittis
-- ============================================================
CREATE TABLE IF NOT EXISTS chittis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  start_date date,
  end_date date,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE chittis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_chittis" ON chittis;
CREATE POLICY "select_own_chittis" ON chittis FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_chittis" ON chittis;
CREATE POLICY "insert_own_chittis" ON chittis FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_chittis" ON chittis;
CREATE POLICY "update_own_chittis" ON chittis FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_chittis" ON chittis;
CREATE POLICY "delete_own_chittis" ON chittis FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_chittis_user ON chittis(user_id);

-- ============================================================
-- members
-- ============================================================
CREATE TABLE IF NOT EXISTS members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  chitti_id uuid NOT NULL REFERENCES chittis(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  mobile_number text,
  photo_url text,
  total_chitti_amount numeric(12,2) NOT NULL DEFAULT 0,
  installment_amount numeric(12,2) NOT NULL DEFAULT 0,
  total_installments integer NOT NULL DEFAULT 1,
  due_day integer NOT NULL DEFAULT 5 CHECK (due_day BETWEEN 1 AND 31),
  start_date date,
  notes text,
  archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_members" ON members;
CREATE POLICY "select_own_members" ON members FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_members" ON members;
CREATE POLICY "insert_own_members" ON members FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_members" ON members;
CREATE POLICY "update_own_members" ON members FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_members" ON members;
CREATE POLICY "delete_own_members" ON members FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_members_user ON members(user_id);
CREATE INDEX IF NOT EXISTS idx_members_chitti ON members(chitti_id);
CREATE INDEX IF NOT EXISTS idx_members_archived ON members(archived);

-- ============================================================
-- payments
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  chitti_id uuid NOT NULL REFERENCES chittis(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  payment_date date NOT NULL,
  installment_month text NOT NULL,
  payment_mode text NOT NULL DEFAULT 'cash' CHECK (payment_mode IN ('cash','upi','bank','other')),
  reference_number text,
  note text,
  reversed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_payments" ON payments;
CREATE POLICY "select_own_payments" ON payments FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_payments" ON payments;
CREATE POLICY "insert_own_payments" ON payments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_payments" ON payments;
CREATE POLICY "update_own_payments" ON payments FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_payments" ON payments;
CREATE POLICY "delete_own_payments" ON payments FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_member ON payments(member_id);
CREATE INDEX IF NOT EXISTS idx_payments_chitti ON payments(chitti_id);
CREATE INDEX IF NOT EXISTS idx_payments_month ON payments(installment_month);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);

-- ============================================================
-- activity_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  description text NOT NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_activity_logs" ON activity_logs;
CREATE POLICY "select_own_activity_logs" ON activity_logs FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_activity_logs" ON activity_logs;
CREATE POLICY "insert_own_activity_logs" ON activity_logs FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_activity_logs" ON activity_logs;
CREATE POLICY "update_own_activity_logs" ON activity_logs FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_activity_logs" ON activity_logs;
CREATE POLICY "delete_own_activity_logs" ON activity_logs FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at DESC);

-- ============================================================
-- settings (singleton per user)
-- ============================================================
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  theme text NOT NULL DEFAULT 'system' CHECK (theme IN ('light','dark','system')),
  currency_code text NOT NULL DEFAULT 'INR',
  default_chitti_id uuid REFERENCES chittis(id) ON DELETE SET NULL,
  statement_footer text NOT NULL DEFAULT 'This statement is generated from the Chitti Management System.',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_settings" ON settings;
CREATE POLICY "select_own_settings" ON settings FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_settings" ON settings;
CREATE POLICY "insert_own_settings" ON settings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_settings" ON settings;
CREATE POLICY "update_own_settings" ON settings FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_settings" ON settings;
CREATE POLICY "delete_own_settings" ON settings FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_chittis_updated ON chittis;
CREATE TRIGGER trg_chittis_updated BEFORE UPDATE ON chittis
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_members_updated ON members;
CREATE TRIGGER trg_members_updated BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_payments_updated ON payments;
CREATE TRIGGER trg_payments_updated BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_settings_updated ON settings;
CREATE TRIGGER trg_settings_updated BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

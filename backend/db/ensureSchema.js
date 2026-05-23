import { query } from './query.js';

async function ensureCoreExtensions() {
  await query('CREATE EXTENSION IF NOT EXISTS pgcrypto');
  await query('CREATE EXTENSION IF NOT EXISTS citext');
}

async function ensureUsersTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT,
      email CITEXT UNIQUE,
      password_hash TEXT,
      role TEXT NOT NULL DEFAULT 'user',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT');
  await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name TEXT');
  await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS email CITEXT');
  await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT');
  await query("ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user'");
  await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()');
  await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()');
  await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE');

  await query('UPDATE users SET name = COALESCE(name, full_name) WHERE name IS NULL');
  await query('UPDATE users SET full_name = COALESCE(full_name, name) WHERE full_name IS NULL');
  await query("UPDATE users SET role = LOWER(COALESCE(role, 'user'))");
  await query("ALTER TABLE users ALTER COLUMN role SET DEFAULT 'user'");
  await query('ALTER TABLE users ALTER COLUMN email TYPE CITEXT USING email::CITEXT');
}

async function ensureBusinessProfilesTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS business_profiles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      business_name TEXT,
      trn TEXT,
      address TEXT,
      phone TEXT,
      email TEXT,
      activity TEXT,
      emirate TEXT,
      vat_filing_frequency TEXT,
      corporate_tax_year_start DATE,
      corporate_tax_year_end DATE,
      default_vat_pricing_mode TEXT,
      tax_settings JSONB,
      is_default BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query('ALTER TABLE business_profiles DROP CONSTRAINT IF EXISTS business_profiles_user_id_key');
  await query('ALTER TABLE business_profiles ADD COLUMN IF NOT EXISTS activity TEXT');
  await query('ALTER TABLE business_profiles ADD COLUMN IF NOT EXISTS emirate TEXT');
  await query('ALTER TABLE business_profiles ADD COLUMN IF NOT EXISTS vat_filing_frequency TEXT');
  await query('ALTER TABLE business_profiles ADD COLUMN IF NOT EXISTS corporate_tax_year_start DATE');
  await query('ALTER TABLE business_profiles ADD COLUMN IF NOT EXISTS corporate_tax_year_end DATE');
  await query('ALTER TABLE business_profiles ADD COLUMN IF NOT EXISTS default_vat_pricing_mode TEXT');
  await query("ALTER TABLE business_profiles ADD COLUMN IF NOT EXISTS tax_settings JSONB NOT NULL DEFAULT '{}'::JSONB");
  await query('ALTER TABLE business_profiles ADD COLUMN IF NOT EXISTS is_default BOOLEAN NOT NULL DEFAULT FALSE');
  await query('ALTER TABLE business_profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()');
  await query('ALTER TABLE business_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()');

  await query(
    `WITH ranked AS (
      SELECT id, user_id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY updated_at DESC, created_at DESC) AS rn
      FROM business_profiles
    )
    UPDATE business_profiles bp
    SET is_default = CASE WHEN ranked.rn = 1 THEN TRUE ELSE FALSE END
    FROM ranked
    WHERE bp.id = ranked.id`
  );
}

async function ensureUserProfilesTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS user_profiles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      phone TEXT,
      address TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function ensureVatRecordsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS vat_records (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      business_profile_id UUID REFERENCES business_profiles(id) ON DELETE SET NULL,
      period_type TEXT,
      period_start DATE,
      period_end DATE,
      taxable_sales NUMERIC(18,2) NOT NULL DEFAULT 0,
      output_vat NUMERIC(18,2) NOT NULL DEFAULT 0,
      taxable_purchases NUMERIC(18,2) NOT NULL DEFAULT 0,
      input_vat NUMERIC(18,2) NOT NULL DEFAULT 0,
      expenses NUMERIC(18,2) NOT NULL DEFAULT 0,
      adjustment_vat NUMERIC(18,2) NOT NULL DEFAULT 0,
      payable_vat NUMERIC(18,2) NOT NULL DEFAULT 0,
      refundable_vat NUMERIC(18,2) NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'draft',
      payload JSONB NOT NULL DEFAULT '{}'::JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query('ALTER TABLE vat_records ADD COLUMN IF NOT EXISTS period_type TEXT');
  await query('ALTER TABLE vat_records ADD COLUMN IF NOT EXISTS period_label TEXT');
  await query('ALTER TABLE vat_records ADD COLUMN IF NOT EXISTS period_start DATE');
  await query('ALTER TABLE vat_records ADD COLUMN IF NOT EXISTS period_end DATE');
  await query('ALTER TABLE vat_records ADD COLUMN IF NOT EXISTS filing_period_start DATE');
  await query('ALTER TABLE vat_records ADD COLUMN IF NOT EXISTS filing_period_end DATE');
  await query('ALTER TABLE vat_records ADD COLUMN IF NOT EXISTS taxable_sales NUMERIC(18,2) NOT NULL DEFAULT 0');
  await query('ALTER TABLE vat_records ADD COLUMN IF NOT EXISTS output_vat NUMERIC(18,2) NOT NULL DEFAULT 0');
  await query('ALTER TABLE vat_records ADD COLUMN IF NOT EXISTS taxable_purchases NUMERIC(18,2) NOT NULL DEFAULT 0');
  await query('ALTER TABLE vat_records ADD COLUMN IF NOT EXISTS input_vat NUMERIC(18,2) NOT NULL DEFAULT 0');
  await query('ALTER TABLE vat_records ADD COLUMN IF NOT EXISTS expenses NUMERIC(18,2) NOT NULL DEFAULT 0');
  await query('ALTER TABLE vat_records ADD COLUMN IF NOT EXISTS adjustment_vat NUMERIC(18,2) NOT NULL DEFAULT 0');
  await query('ALTER TABLE vat_records ADD COLUMN IF NOT EXISTS payable_vat NUMERIC(18,2) NOT NULL DEFAULT 0');
  await query('ALTER TABLE vat_records ADD COLUMN IF NOT EXISTS refundable_vat NUMERIC(18,2) NOT NULL DEFAULT 0');
  await query('ALTER TABLE vat_records ADD COLUMN IF NOT EXISTS sales_total NUMERIC(18,2) NOT NULL DEFAULT 0');
  await query('ALTER TABLE vat_records ADD COLUMN IF NOT EXISTS purchase_total NUMERIC(18,2) NOT NULL DEFAULT 0');
  await query('ALTER TABLE vat_records ADD COLUMN IF NOT EXISTS expenses_total NUMERIC(18,2) NOT NULL DEFAULT 0');
  await query('ALTER TABLE vat_records ADD COLUMN IF NOT EXISTS taxable_amount NUMERIC(18,2) NOT NULL DEFAULT 0');
  await query('ALTER TABLE vat_records ADD COLUMN IF NOT EXISTS vat_payable NUMERIC(18,2) NOT NULL DEFAULT 0');
  await query('ALTER TABLE vat_records ADD COLUMN IF NOT EXISTS vat_refundable NUMERIC(18,2) NOT NULL DEFAULT 0');
  await query("ALTER TABLE vat_records ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft'");
  await query("ALTER TABLE vat_records ADD COLUMN IF NOT EXISTS payload JSONB NOT NULL DEFAULT '{}'::JSONB");
  await query("ALTER TABLE vat_records ADD COLUMN IF NOT EXISTS export_metadata JSONB NOT NULL DEFAULT '{}'::JSONB");
  await query('ALTER TABLE vat_records ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()');
  await query('ALTER TABLE vat_records ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()');
}

async function ensureCorporateTaxRecordsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS corporate_tax_records (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      business_profile_id UUID REFERENCES business_profiles(id) ON DELETE SET NULL,
      period_start DATE,
      period_end DATE,
      revenue NUMERIC(18,2) NOT NULL DEFAULT 0,
      expenses NUMERIC(18,2) NOT NULL DEFAULT 0,
      taxable_profit NUMERIC(18,2) NOT NULL DEFAULT 0,
      tax_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'draft',
      payload JSONB NOT NULL DEFAULT '{}'::JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query('ALTER TABLE corporate_tax_records ADD COLUMN IF NOT EXISTS period_start DATE');
  await query('ALTER TABLE corporate_tax_records ADD COLUMN IF NOT EXISTS period_label TEXT');
  await query('ALTER TABLE corporate_tax_records ADD COLUMN IF NOT EXISTS period_end DATE');
  await query('ALTER TABLE corporate_tax_records ADD COLUMN IF NOT EXISTS filing_period_start DATE');
  await query('ALTER TABLE corporate_tax_records ADD COLUMN IF NOT EXISTS filing_period_end DATE');
  await query('ALTER TABLE corporate_tax_records ADD COLUMN IF NOT EXISTS revenue NUMERIC(18,2) NOT NULL DEFAULT 0');
  await query('ALTER TABLE corporate_tax_records ADD COLUMN IF NOT EXISTS expenses NUMERIC(18,2) NOT NULL DEFAULT 0');
  await query('ALTER TABLE corporate_tax_records ADD COLUMN IF NOT EXISTS taxable_profit NUMERIC(18,2) NOT NULL DEFAULT 0');
  await query('ALTER TABLE corporate_tax_records ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(18,2) NOT NULL DEFAULT 0');
  await query('ALTER TABLE corporate_tax_records ADD COLUMN IF NOT EXISTS sales_total NUMERIC(18,2) NOT NULL DEFAULT 0');
  await query('ALTER TABLE corporate_tax_records ADD COLUMN IF NOT EXISTS purchase_total NUMERIC(18,2) NOT NULL DEFAULT 0');
  await query('ALTER TABLE corporate_tax_records ADD COLUMN IF NOT EXISTS expenses_total NUMERIC(18,2) NOT NULL DEFAULT 0');
  await query('ALTER TABLE corporate_tax_records ADD COLUMN IF NOT EXISTS taxable_amount NUMERIC(18,2) NOT NULL DEFAULT 0');
  await query('ALTER TABLE corporate_tax_records ADD COLUMN IF NOT EXISTS corporate_tax_estimate NUMERIC(18,2) NOT NULL DEFAULT 0');
  await query("ALTER TABLE corporate_tax_records ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft'");
  await query("ALTER TABLE corporate_tax_records ADD COLUMN IF NOT EXISTS payload JSONB NOT NULL DEFAULT '{}'::JSONB");
  await query("ALTER TABLE corporate_tax_records ADD COLUMN IF NOT EXISTS export_metadata JSONB NOT NULL DEFAULT '{}'::JSONB");
  await query('ALTER TABLE corporate_tax_records ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()');
  await query('ALTER TABLE corporate_tax_records ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()');
}

async function ensureRemindersTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS reminders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT,
      title TEXT,
      due_date DATE,
      email_enabled BOOLEAN NOT NULL DEFAULT false,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    INSERT INTO reminders (id, user_id, type, title, due_date, email_enabled, status, created_at, updated_at)
    SELECT fr.id, fr.user_id, fr.type, fr.title, fr.due_date::date, fr.email_reminder_enabled, fr.status, fr.created_at, fr.updated_at
    FROM filing_reminders fr
    WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'filing_reminders')
      AND NOT EXISTS (SELECT 1 FROM reminders r WHERE r.id = fr.id)
  `).catch(() => {
    // No-op when filing_reminders table does not exist yet.
  });
}

async function ensureSmtpSettingsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS smtp_settings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      host TEXT,
      port INTEGER,
      secure BOOLEAN,
      username TEXT,
      password_encrypted TEXT,
      from_email TEXT,
      from_name TEXT,
      updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query('ALTER TABLE smtp_settings ADD COLUMN IF NOT EXISTS secure BOOLEAN');
  await query('ALTER TABLE smtp_settings ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id) ON DELETE SET NULL');
  await query('ALTER TABLE smtp_settings ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()');
  await query('ALTER TABLE smtp_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()');
}

async function ensureAuditLogsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID,
      action TEXT,
      module TEXT,
      metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
      ip TEXT,
      user_agent TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query("ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::JSONB");
  await query('ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS ip TEXT');
  await query('ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_agent TEXT');
  await query('ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()');
}

async function ensureIndexes() {
  await query('CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id)');
  await query('CREATE INDEX IF NOT EXISTS idx_business_profiles_user_id ON business_profiles(user_id)');
  await query('CREATE UNIQUE INDEX IF NOT EXISTS idx_business_profiles_default_per_user ON business_profiles(user_id) WHERE is_default = TRUE');
  await query('CREATE INDEX IF NOT EXISTS idx_vat_records_user_id ON vat_records(user_id)');
  await query('CREATE INDEX IF NOT EXISTS idx_vat_records_created_at ON vat_records(created_at DESC)');
  await query('CREATE INDEX IF NOT EXISTS idx_vat_records_period_start ON vat_records(period_start)');
  await query('CREATE INDEX IF NOT EXISTS idx_corp_records_user_id ON corporate_tax_records(user_id)');
  await query('CREATE INDEX IF NOT EXISTS idx_corp_records_created_at ON corporate_tax_records(created_at DESC)');
  await query('CREATE INDEX IF NOT EXISTS idx_corp_records_period_start ON corporate_tax_records(period_start)');
  await query('CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id)');
  await query('CREATE INDEX IF NOT EXISTS idx_reminders_created_at ON reminders(created_at DESC)');
  await query('CREATE INDEX IF NOT EXISTS idx_reminders_due_date ON reminders(due_date)');
  await query('CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id)');
  await query('CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC)');
}

export async function ensureSchema() {
  await ensureCoreExtensions();
  await ensureUsersTable();
  await ensureUserProfilesTable();
  await ensureBusinessProfilesTable();
  await ensureVatRecordsTable();
  await ensureCorporateTaxRecordsTable();
  await ensureRemindersTable();
  await ensureSmtpSettingsTable();
  await ensureAuditLogsTable();
  await ensureIndexes();
}

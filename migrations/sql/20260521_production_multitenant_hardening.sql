BEGIN;

CREATE TABLE IF NOT EXISTS tax_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_profile_id UUID REFERENCES business_profiles(id) ON DELETE SET NULL,
  period_type TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'OPEN',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE business_profiles
  ADD COLUMN IF NOT EXISTS corporate_tax_registration_number TEXT,
  ADD COLUMN IF NOT EXISTS license_number TEXT,
  ADD COLUMN IF NOT EXISTS activity_type TEXT,
  ADD COLUMN IF NOT EXISTS default_filing_frequency TEXT;

ALTER TABLE vat_records
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN IF NOT EXISTS sales_amount NUMERIC(18,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS output_vat NUMERIC(18,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS purchase_amount NUMERIC(18,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS input_vat NUMERIC(18,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS expenses NUMERIC(18,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS adjustment_vat NUMERIC(18,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payable_refundable NUMERIC(18,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE corporate_tax_records
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN IF NOT EXISTS revenue NUMERIC(18,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS expenditure NUMERIC(18,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gross_profit NUMERIC(18,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS other_expenses NUMERIC(18,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS net_profit NUMERIC(18,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS taxable_income NUMERIC(18,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_liability NUMERIC(18,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_payable NUMERIC(18,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS due_date DATE;

CREATE TABLE IF NOT EXISTS pdf_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_profile_id UUID REFERENCES business_profiles(id) ON DELETE SET NULL,
  record_type TEXT NOT NULL,
  record_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tax_periods_user ON tax_periods(user_id);
CREATE INDEX IF NOT EXISTS idx_tax_periods_business_profile ON tax_periods(business_profile_id);
CREATE INDEX IF NOT EXISTS idx_tax_periods_dates ON tax_periods(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_tax_periods_status ON tax_periods(status);
CREATE INDEX IF NOT EXISTS idx_vat_records_status ON vat_records(status);
CREATE INDEX IF NOT EXISTS idx_vat_records_business_profile ON vat_records(business_profile_id);
CREATE INDEX IF NOT EXISTS idx_corporate_tax_records_status ON corporate_tax_records(status);
CREATE INDEX IF NOT EXISTS idx_corporate_tax_records_business_profile ON corporate_tax_records(business_profile_id);
CREATE INDEX IF NOT EXISTS idx_pdf_exports_user ON pdf_exports(user_id);
CREATE INDEX IF NOT EXISTS idx_pdf_exports_business_profile ON pdf_exports(business_profile_id);

COMMIT;


ALTER TABLE public.assets
  ADD COLUMN purchase_price numeric NOT NULL DEFAULT 0,
  ADD COLUMN warranty_months integer NOT NULL DEFAULT 0,
  ADD COLUMN warranty_end_date date,
  ADD COLUMN vendor_name text NOT NULL DEFAULT '',
  ADD COLUMN vendor_phone text NOT NULL DEFAULT '',
  ADD COLUMN purchased_by text NOT NULL DEFAULT '',
  ADD COLUMN add_to_accounting boolean NOT NULL DEFAULT false;

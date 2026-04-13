ALTER TABLE public.payment_accounts
ADD CONSTRAINT payment_accounts_owner_id_key UNIQUE (owner_id);

ALTER TABLE public.landlord_settings
ADD CONSTRAINT landlord_settings_owner_id_key_key UNIQUE (owner_id, key);
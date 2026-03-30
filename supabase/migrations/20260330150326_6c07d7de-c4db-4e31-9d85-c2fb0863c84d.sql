
-- Dependent tables
CREATE TABLE public.bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL, tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  room_id uuid NOT NULL REFERENCES public.rooms(id), month text NOT NULL,
  rent_amount numeric NOT NULL DEFAULT 0, electricity_charge numeric NOT NULL DEFAULT 0,
  water_charge numeric NOT NULL DEFAULT 0, gas_charge numeric NOT NULL DEFAULT 0,
  service_charge numeric NOT NULL DEFAULT 0, garage_charge numeric NOT NULL DEFAULT 0,
  wifi_charge numeric NOT NULL DEFAULT 0, generator_charge numeric NOT NULL DEFAULT 0,
  security_charge numeric NOT NULL DEFAULT 0, vat numeric NOT NULL DEFAULT 0,
  other_charges numeric NOT NULL DEFAULT 0, advance numeric NOT NULL DEFAULT 0,
  total_amount numeric NOT NULL DEFAULT 0, received_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'unpaid', due_date date,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL, tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  bill_id uuid NOT NULL REFERENCES public.bills(id), amount numeric NOT NULL,
  payment_method text NOT NULL DEFAULT 'cash', payment_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'pending', notes text, rejection_note text,
  verified boolean NOT NULL DEFAULT false, verified_at timestamptz, verified_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.accounting_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL, type text NOT NULL, category text NOT NULL,
  amount numeric NOT NULL DEFAULT 0, description text NOT NULL DEFAULT '',
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  bill_id uuid REFERENCES public.bills(id), payment_id uuid REFERENCES public.payments(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.garages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL, property_id uuid NOT NULL REFERENCES public.properties(id),
  room_id uuid REFERENCES public.rooms(id), tenant_id uuid REFERENCES public.tenants(id),
  garage_number text NOT NULL, garage_type text NOT NULL DEFAULT 'car',
  status text NOT NULL DEFAULT 'vacant', assignment_type text NOT NULL DEFAULT 'individual',
  rent_amount numeric NOT NULL DEFAULT 0, description text NOT NULL DEFAULT '',
  is_tolet boolean NOT NULL DEFAULT false, external_tenant_name text, external_tenant_phone text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.meters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL, room_id uuid REFERENCES public.rooms(id),
  tenant_id uuid REFERENCES public.tenants(id), meter_number text NOT NULL,
  meter_type text NOT NULL DEFAULT 'electricity', billing_type text NOT NULL DEFAULT 'postpaid',
  status text NOT NULL DEFAULT 'active', last_reading numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.guests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  guest_name text NOT NULL DEFAULT '', phone text NOT NULL DEFAULT '',
  visitor_type text NOT NULL DEFAULT 'guest', visit_date date NOT NULL DEFAULT CURRENT_DATE,
  duration_days integer NOT NULL DEFAULT 1, expires_at timestamptz, qr_code text,
  status text NOT NULL DEFAULT 'pending', notes text, verified_by uuid, verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL, tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  title text NOT NULL DEFAULT '', description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'other', priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL, title text NOT NULL DEFAULT '', description text NOT NULL DEFAULT '',
  target_type text NOT NULL DEFAULT 'all', target_id uuid, attachment_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id uuid NOT NULL, tenant_user_id uuid, room_id uuid REFERENCES public.rooms(id),
  visitor_name text, visitor_phone text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id),
  sender_id uuid, sender_type text NOT NULL, content text NOT NULL,
  is_read boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.property_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id),
  image_url text NOT NULL, sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.room_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id),
  image_url text NOT NULL, sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.tenant_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  name text NOT NULL, relation text NOT NULL DEFAULT '', phone text, age integer,
  gender text, occupation text, nid text, photo_url text, doc_url text,
  status text NOT NULL DEFAULT 'active', verified_by uuid, verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.tolet_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id),
  tenant_user_id uuid NOT NULL, landlord_user_id uuid NOT NULL,
  message text, status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.staff_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL, preset_id uuid REFERENCES public.permission_presets(id),
  scope text NOT NULL DEFAULT 'admin', staff_type text NOT NULL DEFAULT 'general',
  landlord_id uuid, assigned_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.property_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id),
  staff_user_id uuid NOT NULL, owner_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.payment_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL, bank_name text NOT NULL DEFAULT '', branch_name text NOT NULL DEFAULT '',
  account_name text NOT NULL DEFAULT '', account_number text NOT NULL DEFAULT '',
  routing_number text NOT NULL DEFAULT '', bkash_number text NOT NULL DEFAULT '',
  nagad_number text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.landlord_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL, key text NOT NULL, value jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL, value jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '', ad_type text NOT NULL DEFAULT 'banner',
  placement text NOT NULL DEFAULT 'listing_detail', image_url text NOT NULL DEFAULT '',
  link_url text NOT NULL DEFAULT '', is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0, impressions integer NOT NULL DEFAULT 0,
  clicks integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.cms_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL, title_bn text NOT NULL DEFAULT '', title_en text NOT NULL DEFAULT '',
  content_bn text NOT NULL DEFAULT '', content_en text NOT NULL DEFAULT '',
  section text NOT NULL DEFAULT 'general', is_published boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.landing_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text NOT NULL, value_bn text NOT NULL DEFAULT '', value_en text NOT NULL DEFAULT '',
  section_group text NOT NULL DEFAULT 'general', is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.tutorials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_bn text NOT NULL DEFAULT '', title_en text NOT NULL DEFAULT '',
  description_bn text NOT NULL DEFAULT '', description_en text NOT NULL DEFAULT '',
  youtube_url text NOT NULL DEFAULT '', thumbnail_url text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'general', is_published boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL, plan_id uuid NOT NULL REFERENCES public.subscription_plans(id),
  product_type text NOT NULL DEFAULT 'room', status text NOT NULL DEFAULT 'active',
  room_count integer NOT NULL DEFAULT 0, tolet_count integer NOT NULL DEFAULT 0,
  sale_listing_count integer NOT NULL DEFAULT 0, tolet_price_per_unit numeric NOT NULL DEFAULT 0,
  duration_months integer NOT NULL DEFAULT 1, discount_percent numeric NOT NULL DEFAULT 0,
  coupon_code text, starts_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.subscription_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL, product_type text NOT NULL DEFAULT 'room',
  amount numeric NOT NULL DEFAULT 0, room_count integer NOT NULL DEFAULT 0,
  tolet_count integer NOT NULL DEFAULT 0, duration_months integer NOT NULL DEFAULT 1,
  discount_percent numeric NOT NULL DEFAULT 0, coupon_code text,
  status text NOT NULL DEFAULT 'pending', payment_method text, transaction_id text, metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.boost_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL, boost_type text NOT NULL DEFAULT '3_day',
  total_count integer NOT NULL DEFAULT 0, used_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.room_boosts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id), owner_id uuid NOT NULL,
  boost_type text NOT NULL DEFAULT '3_day', starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.sale_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL, property_id uuid REFERENCES public.properties(id),
  room_id uuid REFERENCES public.rooms(id), title text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '', property_type text NOT NULL DEFAULT 'building',
  sale_scope text NOT NULL DEFAULT 'property', price numeric NOT NULL DEFAULT 0,
  area_sqft integer NOT NULL DEFAULT 0, floor integer NOT NULL DEFAULT 0,
  bedrooms integer NOT NULL DEFAULT 0, bathrooms integer NOT NULL DEFAULT 0,
  division text NOT NULL DEFAULT '', district text NOT NULL DEFAULT '',
  thana text NOT NULL DEFAULT '', area text NOT NULL DEFAULT '',
  location_address text NOT NULL DEFAULT '', contact_phone text NOT NULL DEFAULT '',
  contact_whatsapp text NOT NULL DEFAULT '', show_contact_phone boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'active', sale_slot_used boolean NOT NULL DEFAULT false,
  views_count integer NOT NULL DEFAULT 0, transfer_status text NOT NULL DEFAULT 'none',
  transferred_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.sale_listing_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.sale_listings(id),
  image_url text NOT NULL, sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.sale_buy_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.sale_listings(id),
  buyer_id uuid NOT NULL, seller_id uuid NOT NULL, message text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.sale_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.sale_listings(id),
  buyer_id uuid NOT NULL, seller_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.sale_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.sale_conversations(id),
  sender_id uuid NOT NULL, content text NOT NULL DEFAULT '',
  is_read boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.sale_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.sale_listings(id),
  user_id uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.property_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id),
  from_user_id uuid NOT NULL, to_user_id uuid NOT NULL,
  room_id uuid REFERENCES public.rooms(id),
  source_listing_id uuid REFERENCES public.sale_listings(id),
  new_property_id uuid REFERENCES public.properties(id),
  transfer_scope text NOT NULL DEFAULT 'property', include_tenants boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'completed', created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.scheduled_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL, tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  action_type text NOT NULL DEFAULT 'release', scheduled_date date NOT NULL,
  status text NOT NULL DEFAULT 'pending', remarks text,
  executed_at timestamptz, cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.password_reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL, token text NOT NULL, used boolean NOT NULL DEFAULT false,
  expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL, endpoint text NOT NULL, p256dh text NOT NULL DEFAULT '',
  auth text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.landlord_discounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL, applied_by uuid NOT NULL,
  discount_type text NOT NULL DEFAULT 'percentage', discount_percent numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true, notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.suppressed_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL, reason text NOT NULL, metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.email_send_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email text NOT NULL, template_name text NOT NULL, status text NOT NULL,
  message_id text, error_message text, metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.email_send_state (
  id integer PRIMARY KEY DEFAULT 1,
  batch_size integer NOT NULL DEFAULT 10, send_delay_ms integer NOT NULL DEFAULT 200,
  auth_email_ttl_minutes integer NOT NULL DEFAULT 15,
  transactional_email_ttl_minutes integer NOT NULL DEFAULT 60,
  retry_after_until timestamptz, updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.email_unsubscribe_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL, token text NOT NULL, used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);


-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgmq";

-- Enum
DO $$ BEGIN CREATE TYPE public.app_role AS ENUM ('landlord', 'tenant', 'staff', 'admin', 'employee', 'landlord_staff'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Base functions
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- Core tables (no cross-FKs)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  full_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  avatar_url text,
  language text NOT NULL DEFAULT 'bn',
  date_of_birth date,
  auto_tolet boolean NOT NULL DEFAULT true,
  is_verified boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

CREATE TABLE public.properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name text NOT NULL,
  address text NOT NULL DEFAULT '',
  property_type text NOT NULL DEFAULT 'building',
  division text NOT NULL DEFAULT '',
  district text NOT NULL DEFAULT '',
  thana text NOT NULL DEFAULT '',
  area text NOT NULL DEFAULT '',
  house_number text NOT NULL DEFAULT '',
  road_number text NOT NULL DEFAULT '',
  sector text NOT NULL DEFAULT '',
  block text NOT NULL DEFAULT '',
  postal_code text NOT NULL DEFAULT '',
  nearest_police_station text NOT NULL DEFAULT '',
  nearest_fire_service text NOT NULL DEFAULT '',
  nearest_electricity_office text NOT NULL DEFAULT '',
  tolet_phone text NOT NULL DEFAULT '',
  map_url text DEFAULT '',
  total_rooms integer NOT NULL DEFAULT 0,
  has_lift boolean NOT NULL DEFAULT false,
  has_generator boolean NOT NULL DEFAULT false,
  has_garage boolean NOT NULL DEFAULT false,
  has_internet boolean NOT NULL DEFAULT false,
  has_security boolean NOT NULL DEFAULT false,
  has_rooftop_access boolean NOT NULL DEFAULT false,
  has_water_supply boolean NOT NULL DEFAULT false,
  has_gas_supply boolean NOT NULL DEFAULT false,
  has_parking boolean NOT NULL DEFAULT false,
  has_cctv boolean NOT NULL DEFAULT false,
  has_dish boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  user_id uuid,
  full_name text NOT NULL,
  phone text NOT NULL,
  secondary_phone text,
  status text NOT NULL DEFAULT 'active',
  billing_type text NOT NULL DEFAULT 'billing',
  room_id uuid,
  nid text, gender text, date_of_birth date, occupation text, emergency_contact text,
  permanent_address text, permanent_division text, permanent_district text, permanent_thana text, permanent_village text,
  present_address text, present_division text, present_district text, present_thana text, present_village text,
  doc_type text, doc_number text, doc_front_url text, doc_back_url text, photo_url text,
  move_in_date date, move_out_date date, meter_number text, last_meter_reading numeric,
  advance_balance numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id),
  tenant_id uuid REFERENCES public.tenants(id),
  room_number text NOT NULL,
  room_type text NOT NULL DEFAULT 'residential',
  status text NOT NULL DEFAULT 'vacant',
  rent_amount numeric NOT NULL DEFAULT 0,
  floor integer NOT NULL DEFAULT 0,
  bedrooms integer NOT NULL DEFAULT 1,
  bathrooms integer NOT NULL DEFAULT 1,
  balconies integer NOT NULL DEFAULT 0,
  area_sqft integer NOT NULL DEFAULT 0,
  has_kitchen boolean NOT NULL DEFAULT false,
  has_drawing_room boolean NOT NULL DEFAULT false,
  has_dining_room boolean NOT NULL DEFAULT false,
  has_roof_access boolean NOT NULL DEFAULT false,
  description text NOT NULL DEFAULT '',
  is_tolet boolean NOT NULL DEFAULT false,
  tolet_slot_used boolean DEFAULT false,
  available_from date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tenants ADD CONSTRAINT tenants_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id);

CREATE TABLE public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_bn text NOT NULL DEFAULT '', name_en text NOT NULL DEFAULT '',
  description_bn text NOT NULL DEFAULT '', description_en text NOT NULL DEFAULT '',
  price numeric NOT NULL DEFAULT 0, duration_days integer NOT NULL DEFAULT 30,
  features jsonb NOT NULL DEFAULT '[]', is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL, title text NOT NULL DEFAULT '', body text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'general', reference_id uuid, is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.permission_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, permissions jsonb NOT NULL DEFAULT '[]',
  scope text NOT NULL DEFAULT 'admin', created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- has_role function (needs user_roles table)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

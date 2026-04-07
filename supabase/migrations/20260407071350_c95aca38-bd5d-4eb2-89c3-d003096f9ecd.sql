ALTER TABLE public.properties
  ADD COLUMN common_bathrooms integer NOT NULL DEFAULT 0,
  ADD COLUMN common_washrooms integer NOT NULL DEFAULT 0,
  ADD COLUMN common_kitchens integer NOT NULL DEFAULT 0,
  ADD COLUMN common_stoves integer NOT NULL DEFAULT 0,
  ADD COLUMN utilities_included boolean NOT NULL DEFAULT false;

-- Functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, phone, email, date_of_birth)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    TRIM(COALESCE(NEW.raw_user_meta_data->>'phone', '')),
    COALESCE(NEW.raw_user_meta_data->>'email', ''),
    CASE WHEN NEW.raw_user_meta_data->>'date_of_birth' IS NOT NULL
         THEN (NEW.raw_user_meta_data->>'date_of_birth')::date ELSE NULL END
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'landlord'));
  IF COALESCE(NEW.raw_user_meta_data->>'role', 'landlord') = 'tenant' THEN
    INSERT INTO public.tenants (user_id, owner_id, full_name, phone, status)
    VALUES (NEW.id, NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
            TRIM(COALESCE(NEW.raw_user_meta_data->>'phone', '')), 'active');
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_complaint_status_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE tenant_user uuid;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    SELECT user_id INTO tenant_user FROM tenants WHERE id = NEW.tenant_id;
    IF tenant_user IS NOT NULL THEN
      INSERT INTO notifications (user_id, title, body, type, reference_id)
      VALUES (tenant_user, 'Complaint Updated',
        'Your complaint "' || COALESCE(NEW.title, '') || '" status changed to ' || NEW.status || '.',
        'complaint_update', NEW.id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_new_complaint()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  tenant_name text; tenant_owner uuid; tenant_user uuid; target_landlord uuid;
BEGIN
  SELECT full_name, owner_id, user_id INTO tenant_name, tenant_owner, tenant_user
  FROM tenants WHERE id = NEW.tenant_id;
  IF NEW.owner_id IS NOT NULL AND tenant_user IS NOT NULL AND NEW.owner_id IS DISTINCT FROM tenant_user THEN
    target_landlord := NEW.owner_id;
  ELSIF tenant_owner IS NOT NULL AND tenant_user IS NOT NULL AND tenant_owner IS DISTINCT FROM tenant_user THEN
    target_landlord := tenant_owner;
  ELSE
    SELECT tr.landlord_user_id INTO target_landlord FROM tolet_requests tr
    WHERE tr.tenant_user_id = tenant_user AND tr.status = 'accepted'
    ORDER BY tr.updated_at DESC LIMIT 1;
  END IF;
  IF target_landlord IS NOT NULL THEN
    INSERT INTO notifications (user_id, title, body, type, reference_id)
    VALUES (target_landlord, 'New Complaint',
      COALESCE(tenant_name, 'A tenant') || ' submitted: ' || COALESCE(NEW.title, ''),
      'new_complaint', NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_new_tolet_request()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE room_label text;
BEGIN
  SELECT r.room_number || ' — ' || p.name INTO room_label
  FROM rooms r JOIN properties p ON p.id = r.property_id WHERE r.id = NEW.room_id;
  INSERT INTO notifications (user_id, title, body, type, reference_id)
  VALUES (NEW.landlord_user_id, 'New Rental Request',
    'A tenant has requested to rent ' || COALESCE(room_label, 'a room') || '.', 'new_request', NEW.id);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_current_tenant_notice_context()
RETURNS TABLE(tenant_id uuid, linked_owner_id uuid, fallback_owner_id uuid, property_id uuid)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  WITH current_tenant AS (
    SELECT t.id AS tenant_id,
      CASE WHEN t.owner_id IS DISTINCT FROM t.user_id THEN t.owner_id ELSE NULL END AS linked_owner_id, t.room_id
    FROM public.tenants t WHERE t.user_id = auth.uid() AND t.status = 'active'
    ORDER BY t.created_at DESC LIMIT 1
  ),
  accepted_request AS (
    SELECT tr.landlord_user_id AS fallback_owner_id, tr.room_id
    FROM public.tolet_requests tr WHERE tr.tenant_user_id = auth.uid() AND tr.status = 'accepted'
    ORDER BY tr.updated_at DESC, tr.created_at DESC LIMIT 1
  )
  SELECT ct.tenant_id, ct.linked_owner_id, ar.fallback_owner_id,
    COALESCE(rt.property_id, rr.property_id) AS property_id
  FROM current_tenant ct LEFT JOIN accepted_request ar ON TRUE
  LEFT JOIN public.rooms rt ON rt.id = ct.room_id
  LEFT JOIN public.rooms rr ON rr.id = ar.room_id;
$$;

-- PGMQ helper functions
CREATE OR REPLACE FUNCTION public.enqueue_email(queue_name text, payload jsonb)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN RETURN pgmq.send(queue_name, payload);
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name); RETURN pgmq.send(queue_name, payload);
END; $$;

CREATE OR REPLACE FUNCTION public.delete_email(queue_name text, message_id bigint)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN RETURN pgmq.delete(queue_name, message_id);
EXCEPTION WHEN undefined_table THEN RETURN FALSE;
END; $$;

CREATE OR REPLACE FUNCTION public.read_email_batch(queue_name text, batch_size integer, vt integer)
RETURNS TABLE(msg_id bigint, read_ct integer, message jsonb)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN RETURN QUERY SELECT r.msg_id, r.read_ct, r.message FROM pgmq.read(queue_name, vt, batch_size) r;
EXCEPTION WHEN undefined_table THEN PERFORM pgmq.create(queue_name); RETURN;
END; $$;

CREATE OR REPLACE FUNCTION public.move_to_dlq(source_queue text, dlq_name text, message_id bigint, payload jsonb)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE new_id BIGINT;
BEGIN
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  PERFORM pgmq.delete(source_queue, message_id); RETURN new_id;
EXCEPTION WHEN undefined_table THEN
  BEGIN PERFORM pgmq.create(dlq_name); EXCEPTION WHEN OTHERS THEN NULL; END;
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  BEGIN PERFORM pgmq.delete(source_queue, message_id); EXCEPTION WHEN undefined_table THEN NULL; END;
  RETURN new_id;
END; $$;

-- Triggers
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON public.properties FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON public.rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bills_updated_at BEFORE UPDATE ON public.bills FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_garages_updated_at BEFORE UPDATE ON public.garages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_meters_updated_at BEFORE UPDATE ON public.meters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_complaints_updated_at BEFORE UPDATE ON public.complaints FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ads_updated_at BEFORE UPDATE ON public.ads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cms_pages_updated_at BEFORE UPDATE ON public.cms_pages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_landing_sections_updated_at BEFORE UPDATE ON public.landing_sections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tutorials_updated_at BEFORE UPDATE ON public.tutorials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sale_listings_updated_at BEFORE UPDATE ON public.sale_listings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_landlord_settings_updated_at BEFORE UPDATE ON public.landlord_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_accounts_updated_at BEFORE UPDATE ON public.payment_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tolet_requests_updated_at BEFORE UPDATE ON public.tolet_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sale_buy_requests_updated_at BEFORE UPDATE ON public.sale_buy_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sale_conversations_updated_at BEFORE UPDATE ON public.sale_conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_landlord_discounts_updated_at BEFORE UPDATE ON public.landlord_discounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER on_complaint_status_change AFTER UPDATE ON public.complaints FOR EACH ROW EXECUTE FUNCTION notify_complaint_status_change();
CREATE TRIGGER on_new_complaint AFTER INSERT ON public.complaints FOR EACH ROW EXECUTE FUNCTION notify_new_complaint();
CREATE TRIGGER on_new_tolet_request AFTER INSERT ON public.tolet_requests FOR EACH ROW EXECUTE FUNCTION notify_new_tolet_request();

-- Enable RLS on ALL tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.garages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tolet_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permission_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landlord_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutorials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boost_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_boosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_listing_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_buy_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landlord_discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppressed_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_send_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_send_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_unsubscribe_tokens ENABLE ROW LEVEL SECURITY;

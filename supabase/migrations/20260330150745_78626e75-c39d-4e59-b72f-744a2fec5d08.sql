
-- conversations
CREATE POLICY "Admins can manage all conversations" ON public.conversations FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Landlords can manage own conversations" ON public.conversations FOR ALL TO authenticated USING (auth.uid() = landlord_id) WITH CHECK (auth.uid() = landlord_id);
CREATE POLICY "Tenants can create conversations" ON public.conversations FOR INSERT TO authenticated WITH CHECK (auth.uid() = tenant_user_id);
CREATE POLICY "Tenants can view own conversations" ON public.conversations FOR SELECT TO authenticated USING (auth.uid() = tenant_user_id);

-- messages
CREATE POLICY "Admins can manage all messages" ON public.messages FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Participants can read messages" ON public.messages FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM conversations c WHERE c.id = messages.conversation_id AND (c.landlord_id = auth.uid() OR c.tenant_user_id = auth.uid())));
CREATE POLICY "Participants can insert messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id AND EXISTS (SELECT 1 FROM conversations c WHERE c.id = messages.conversation_id AND (c.landlord_id = auth.uid() OR c.tenant_user_id = auth.uid())));
CREATE POLICY "Participants can update messages" ON public.messages FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM conversations c WHERE c.id = messages.conversation_id AND (c.landlord_id = auth.uid() OR c.tenant_user_id = auth.uid())));

-- property_images
CREATE POLICY "Admins can manage all property images" ON public.property_images FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners can manage property images" ON public.property_images FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM properties WHERE properties.id = property_images.property_id AND properties.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM properties WHERE properties.id = property_images.property_id AND properties.owner_id = auth.uid()));
CREATE POLICY "Public can read property images" ON public.property_images FOR SELECT TO anon, authenticated USING (true);

-- room_images
CREATE POLICY "Admins can manage all room images" ON public.room_images FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners can manage room images" ON public.room_images FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM rooms JOIN properties ON properties.id = rooms.property_id WHERE rooms.id = room_images.room_id AND properties.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM rooms JOIN properties ON properties.id = rooms.property_id WHERE rooms.id = room_images.room_id AND properties.owner_id = auth.uid()));
CREATE POLICY "Public can read room images" ON public.room_images FOR SELECT TO anon, authenticated USING (true);

-- tenant_members
CREATE POLICY "Admins can manage all tenant_members" ON public.tenant_members FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners can manage tenant_members" ON public.tenant_members FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = tenant_members.tenant_id AND tenants.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = tenant_members.tenant_id AND tenants.owner_id = auth.uid()));
CREATE POLICY "Tenants can manage own members" ON public.tenant_members FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = tenant_members.tenant_id AND tenants.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = tenant_members.tenant_id AND tenants.user_id = auth.uid()));

-- tolet_requests
CREATE POLICY "Admins can manage all tolet_requests" ON public.tolet_requests FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Landlords can manage tolet_requests" ON public.tolet_requests FOR ALL TO authenticated USING (auth.uid() = landlord_user_id) WITH CHECK (auth.uid() = landlord_user_id);
CREATE POLICY "Tenants can manage own tolet_requests" ON public.tolet_requests FOR ALL TO authenticated USING (auth.uid() = tenant_user_id) WITH CHECK (auth.uid() = tenant_user_id);

-- permission_presets
CREATE POLICY "Admins can manage permission_presets" ON public.permission_presets FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can read permission_presets" ON public.permission_presets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Landlords can insert own presets" ON public.permission_presets FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by AND created_by IS NOT NULL);
CREATE POLICY "Landlords can update own presets" ON public.permission_presets FOR UPDATE TO authenticated USING (auth.uid() = created_by AND created_by IS NOT NULL) WITH CHECK (auth.uid() = created_by AND created_by IS NOT NULL);
CREATE POLICY "Landlords can delete own presets" ON public.permission_presets FOR DELETE TO authenticated USING (auth.uid() = created_by AND created_by IS NOT NULL);

-- staff_assignments
CREATE POLICY "Admins can manage all staff_assignments" ON public.staff_assignments FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Assigned users can view own" ON public.staff_assignments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Landlords can manage own staff" ON public.staff_assignments FOR ALL TO authenticated USING (auth.uid() = assigned_by) WITH CHECK (auth.uid() = assigned_by);

-- property_staff
CREATE POLICY "Admins can manage all property_staff" ON public.property_staff FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners can manage own property_staff" ON public.property_staff FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Staff can view own assignments" ON public.property_staff FOR SELECT TO authenticated USING (auth.uid() = staff_user_id);

-- payment_accounts
CREATE POLICY "Admins can manage all payment_accounts" ON public.payment_accounts FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners can manage own payment_accounts" ON public.payment_accounts FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Tenants can view landlord payment_accounts" ON public.payment_accounts FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM tenants t WHERE t.user_id = auth.uid() AND t.owner_id = payment_accounts.owner_id AND t.owner_id IS DISTINCT FROM t.user_id)
  OR EXISTS (SELECT 1 FROM tolet_requests tr WHERE tr.tenant_user_id = auth.uid() AND tr.landlord_user_id = payment_accounts.owner_id AND tr.status = 'accepted')
);

-- landlord_settings
CREATE POLICY "Admins can manage all landlord_settings" ON public.landlord_settings FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners can manage own settings" ON public.landlord_settings FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- site_settings
CREATE POLICY "Admins can manage site_settings" ON public.site_settings FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Public can read site_settings" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);

-- ads
CREATE POLICY "Admins can manage all ads" ON public.ads FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Public can read active ads" ON public.ads FOR SELECT TO anon, authenticated USING (is_active = true);

-- cms_pages
CREATE POLICY "Admins can manage cms_pages" ON public.cms_pages FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Public can read published cms_pages" ON public.cms_pages FOR SELECT TO anon, authenticated USING (is_published = true);

-- landing_sections
CREATE POLICY "Admins can manage all landing_sections" ON public.landing_sections FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Public can read active landing_sections" ON public.landing_sections FOR SELECT TO anon, authenticated USING (is_active = true);

-- tutorials
CREATE POLICY "Admins can manage tutorials" ON public.tutorials FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Public can read published tutorials" ON public.tutorials FOR SELECT TO anon, authenticated USING (is_published = true);

-- subscription_plans
CREATE POLICY "Admins can manage subscription_plans" ON public.subscription_plans FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Public can read active plans" ON public.subscription_plans FOR SELECT TO anon, authenticated USING (is_active = true);

-- user_subscriptions
CREATE POLICY "Admins can manage all user_subscriptions" ON public.user_subscriptions FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own subscriptions" ON public.user_subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subscriptions" ON public.user_subscriptions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- subscription_payments
CREATE POLICY "Admins can manage all subscription_payments" ON public.subscription_payments FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own subscription_payments" ON public.subscription_payments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subscription_payments" ON public.subscription_payments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- boost_balances
CREATE POLICY "Admins can manage all boost_balances" ON public.boost_balances FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own boost_balances" ON public.boost_balances FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own boost_balances" ON public.boost_balances FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- room_boosts
CREATE POLICY "Admins can manage all room_boosts" ON public.room_boosts FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners can manage own room_boosts" ON public.room_boosts FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Public can read active room_boosts" ON public.room_boosts FOR SELECT TO anon, authenticated USING (expires_at > now());

-- sale_listings
CREATE POLICY "Admins can manage all sale_listings" ON public.sale_listings FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners can manage own sale_listings" ON public.sale_listings FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Public can read active sale_listings" ON public.sale_listings FOR SELECT TO anon, authenticated USING (status = 'active');

-- sale_listing_images
CREATE POLICY "Admins can manage all sale_listing_images" ON public.sale_listing_images FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners can manage own listing images" ON public.sale_listing_images FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM sale_listings WHERE sale_listings.id = sale_listing_images.listing_id AND sale_listings.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM sale_listings WHERE sale_listings.id = sale_listing_images.listing_id AND sale_listings.owner_id = auth.uid()));
CREATE POLICY "Public can read listing images" ON public.sale_listing_images FOR SELECT TO anon, authenticated USING (true);

-- sale_buy_requests
CREATE POLICY "Admins can manage all sale_buy_requests" ON public.sale_buy_requests FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Buyers can manage own requests" ON public.sale_buy_requests FOR ALL TO authenticated USING (auth.uid() = buyer_id) WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Sellers can view requests" ON public.sale_buy_requests FOR SELECT TO authenticated USING (auth.uid() = seller_id);
CREATE POLICY "Sellers can update requests" ON public.sale_buy_requests FOR UPDATE TO authenticated USING (auth.uid() = seller_id);

-- sale_conversations
CREATE POLICY "Admins can manage all sale_conversations" ON public.sale_conversations FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Participants can manage conversations" ON public.sale_conversations FOR ALL TO authenticated USING (auth.uid() = buyer_id OR auth.uid() = seller_id) WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- sale_messages
CREATE POLICY "Admins can manage all sale_messages" ON public.sale_messages FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Participants can manage sale_messages" ON public.sale_messages FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM sale_conversations sc WHERE sc.id = sale_messages.conversation_id AND (sc.buyer_id = auth.uid() OR sc.seller_id = auth.uid())))
  WITH CHECK (auth.uid() = sender_id AND EXISTS (SELECT 1 FROM sale_conversations sc WHERE sc.id = sale_messages.conversation_id AND (sc.buyer_id = auth.uid() OR sc.seller_id = auth.uid())));

-- sale_favorites
CREATE POLICY "Users can manage own favorites" ON public.sale_favorites FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- property_transfers
CREATE POLICY "Admins can manage all transfers" ON public.property_transfers FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert own transfers" ON public.property_transfers FOR INSERT TO authenticated WITH CHECK (auth.uid() = from_user_id);
CREATE POLICY "Users can view own transfers" ON public.property_transfers FOR SELECT TO authenticated USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);
CREATE POLICY "Property owners can view transfer history" ON public.property_transfers FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM properties WHERE properties.id = property_transfers.property_id AND properties.owner_id = auth.uid()));
CREATE POLICY "Buyers can update own pending transfers" ON public.property_transfers FOR UPDATE TO authenticated USING (auth.uid() = to_user_id AND status = 'pending') WITH CHECK (auth.uid() = to_user_id);

-- scheduled_actions
CREATE POLICY "Admins can manage all scheduled_actions" ON public.scheduled_actions FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners can manage own scheduled_actions" ON public.scheduled_actions FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- push_subscriptions
CREATE POLICY "Admins can manage all push subscriptions" ON public.push_subscriptions FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can manage own push subscriptions" ON public.push_subscriptions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- password_reset_tokens
CREATE POLICY "Admins can manage password_reset_tokens" ON public.password_reset_tokens FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own tokens" ON public.password_reset_tokens FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- landlord_discounts
CREATE POLICY "Admins can manage all landlord_discounts" ON public.landlord_discounts FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Employees can manage landlord_discounts" ON public.landlord_discounts FOR ALL TO authenticated USING (has_role(auth.uid(), 'employee')) WITH CHECK (has_role(auth.uid(), 'employee'));
CREATE POLICY "Users can view own discount" ON public.landlord_discounts FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- email tables (service_role only)
CREATE POLICY "Service role can insert send log" ON public.email_send_log FOR INSERT TO public WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role can read send log" ON public.email_send_log FOR SELECT TO public USING (auth.role() = 'service_role');
CREATE POLICY "Service role can update send log" ON public.email_send_log FOR UPDATE TO public USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role can manage send state" ON public.email_send_state FOR ALL TO public USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role can insert tokens" ON public.email_unsubscribe_tokens FOR INSERT TO public WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role can read tokens" ON public.email_unsubscribe_tokens FOR SELECT TO public USING (auth.role() = 'service_role');
CREATE POLICY "Service role can mark tokens as used" ON public.email_unsubscribe_tokens FOR UPDATE TO public USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role can manage suppressed" ON public.suppressed_emails FOR ALL TO public USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('property-images', 'property-images', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('tenant-documents', 'tenant-documents', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('sale-listing-images', 'sale-listing-images', true) ON CONFLICT DO NOTHING;

-- Storage policies
CREATE POLICY "Public read property-images" ON storage.objects FOR SELECT TO public USING (bucket_id = 'property-images');
CREATE POLICY "Auth upload property-images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'property-images');
CREATE POLICY "Auth delete property-images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'property-images');
CREATE POLICY "Public read avatars" ON storage.objects FOR SELECT TO public USING (bucket_id = 'avatars');
CREATE POLICY "Auth upload avatars" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "Auth delete avatars" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars');
CREATE POLICY "Public read tenant-documents" ON storage.objects FOR SELECT TO public USING (bucket_id = 'tenant-documents');
CREATE POLICY "Auth upload tenant-documents" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'tenant-documents');
CREATE POLICY "Auth delete tenant-documents" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'tenant-documents');
CREATE POLICY "Public read sale-listing-images" ON storage.objects FOR SELECT TO public USING (bucket_id = 'sale-listing-images');
CREATE POLICY "Auth upload sale-listing-images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'sale-listing-images');
CREATE POLICY "Auth delete sale-listing-images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'sale-listing-images');

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sale_messages;

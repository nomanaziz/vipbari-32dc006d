
-- profiles policies
CREATE POLICY "Admins can manage all profiles" ON public.profiles FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO public USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO public WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO public USING (auth.uid() = user_id);
CREATE POLICY "Landlords can view all profiles" ON public.profiles FOR SELECT TO public USING (has_role(auth.uid(), 'landlord'));
CREATE POLICY "Tenants can view landlord profile" ON public.profiles FOR SELECT TO authenticated USING (
  (EXISTS (SELECT 1 FROM tenants WHERE tenants.user_id = auth.uid() AND tenants.owner_id = profiles.user_id AND tenants.owner_id IS DISTINCT FROM tenants.user_id))
  OR (EXISTS (SELECT 1 FROM tolet_requests tr WHERE tr.tenant_user_id = auth.uid() AND tr.landlord_user_id = profiles.user_id AND tr.status = 'accepted'))
);

-- properties policies
CREATE POLICY "Admins can manage all properties" ON public.properties FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners can manage own properties" ON public.properties FOR ALL TO public USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Authenticated can view properties for tolet" ON public.properties FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anon can view properties" ON public.properties FOR SELECT TO anon USING (true);
CREATE POLICY "Staff can view assigned properties" ON public.properties FOR SELECT TO public USING (has_role(auth.uid(), 'staff'));

-- rooms policies
CREATE POLICY "Admins can manage all rooms" ON public.rooms FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Anon can view tolet rooms" ON public.rooms FOR SELECT TO anon USING (is_tolet = true AND status = 'vacant');
CREATE POLICY "Authenticated can view tolet rooms" ON public.rooms FOR SELECT TO authenticated USING (is_tolet = true);
CREATE POLICY "Owners can manage rooms" ON public.rooms FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM properties WHERE properties.id = rooms.property_id AND properties.owner_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM properties WHERE properties.id = rooms.property_id AND properties.owner_id = auth.uid())
);

-- tenants policies
CREATE POLICY "Admins can manage all tenants" ON public.tenants FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners can manage own tenants" ON public.tenants FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Tenants can view own record" ON public.tenants FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Tenants can update own record" ON public.tenants FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- bills policies
CREATE POLICY "Admins can manage all bills" ON public.bills FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners can manage bills" ON public.bills FOR ALL TO public USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Tenants can view own bills" ON public.bills FOR SELECT TO public USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = bills.tenant_id AND tenants.user_id = auth.uid()));

-- payments policies
CREATE POLICY "Admins can manage all payments" ON public.payments FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners can manage payments" ON public.payments FOR ALL TO public USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Tenants can view own payments" ON public.payments FOR SELECT TO public USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = payments.tenant_id AND tenants.user_id = auth.uid()));
CREATE POLICY "Tenants can insert own payments" ON public.payments FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM tenants t WHERE t.id = payments.tenant_id AND t.user_id = auth.uid()));
CREATE POLICY "Tenants can cancel own pending payments" ON public.payments FOR UPDATE TO authenticated
  USING (status = 'pending' AND EXISTS (SELECT 1 FROM tenants t WHERE t.id = payments.tenant_id AND t.user_id = auth.uid()))
  WITH CHECK (status = 'cancelled' AND EXISTS (SELECT 1 FROM tenants t WHERE t.id = payments.tenant_id AND t.user_id = auth.uid()));

-- accounting_entries policies
CREATE POLICY "Admins can manage all accounting_entries" ON public.accounting_entries FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners can manage own accounting_entries" ON public.accounting_entries FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- garages policies
CREATE POLICY "Admins can manage all garages" ON public.garages FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners can manage own garages" ON public.garages FOR ALL TO public USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Anyone can view tolet garages" ON public.garages FOR SELECT TO anon, authenticated USING (is_tolet = true AND status = 'vacant');
CREATE POLICY "Tenants can view assigned garages" ON public.garages FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = garages.tenant_id AND tenants.user_id = auth.uid()));

-- meters policies
CREATE POLICY "Admins can manage all meters" ON public.meters FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners can manage meters" ON public.meters FOR ALL TO public USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- guests policies
CREATE POLICY "Admins can manage all guests" ON public.guests FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners can manage guests" ON public.guests FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = guests.tenant_id AND tenants.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = guests.tenant_id AND tenants.owner_id = auth.uid()));
CREATE POLICY "Tenants can manage own guests" ON public.guests FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = guests.tenant_id AND tenants.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = guests.tenant_id AND tenants.user_id = auth.uid()));

-- complaints policies
CREATE POLICY "Admins can manage all complaints" ON public.complaints FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners can manage complaints" ON public.complaints FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Tenants can manage own complaints" ON public.complaints FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = complaints.tenant_id AND tenants.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = complaints.tenant_id AND tenants.user_id = auth.uid()));
CREATE POLICY "Landlords can manage tenant complaints" ON public.complaints FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = complaints.tenant_id AND (tenants.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM tolet_requests tr WHERE tr.tenant_user_id = tenants.user_id AND tr.landlord_user_id = auth.uid() AND tr.status = 'accepted'))))
  WITH CHECK (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = complaints.tenant_id AND (tenants.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM tolet_requests tr WHERE tr.tenant_user_id = tenants.user_id AND tr.landlord_user_id = auth.uid() AND tr.status = 'accepted'))));

-- notices policies
CREATE POLICY "Admins can manage all notices" ON public.notices FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners can manage own notices" ON public.notices FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- notifications policies
CREATE POLICY "Admins can manage all notifications" ON public.notifications FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role can insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can read own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

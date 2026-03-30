

# VIP Bari — Database Migration Plan

## Overview
Fully recreate the VIP Bari property management database from your previous Lovable project into your new Supabase instance. This includes **35+ tables**, **1 enum**, **6+ functions**, **10+ triggers**, **100+ RLS policies**, **4 storage buckets**, and **30 edge functions**.

---

## Phase 1: Foundation (Enum, Core Tables, Base Functions)

Create the consolidated "final state" schema in correct dependency order:

1. **Enum**: `app_role` with values: `landlord`, `tenant`, `staff`, `admin`, `employee`, `landlord_staff`
2. **Extensions**: `pgmq`, `supabase_vault` (pg_cron and pg_net are usually pre-installed)
3. **Base function**: `update_updated_at_column()` trigger function
4. **Core tables** (no FK dependencies):
   - `profiles` (user_id → auth.users)
   - `user_roles` (user_id → auth.users)
   - `properties` (owner_id → auth.users)
   - `subscription_plans`
   - `cms_pages`, `site_settings`, `tutorials`
   - `ads`, `landing_sections`
   - `password_reset_tokens`
   - `notifications`, `push_subscriptions`
   - `permission_presets`
   - `landlord_discounts`, `landlord_settings`
   - `email_send_log`, `email_send_state`, `suppressed_emails`, `email_unsubscribe_tokens`
   - `subscription_payments`, `boost_balances`
   - `scheduled_actions` (partial — tenant FK added later)

5. **`has_role()` security definer function**

## Phase 2: Dependent Tables

Tables with foreign keys to Phase 1 tables:

- `tenants` → rooms (FK added after rooms), auth.users
- `rooms` → properties, tenants
- `bills` → tenants, rooms
- `payments` → bills, tenants
- `garages` → properties, rooms, tenants
- `meters` → rooms, tenants
- `tenant_members` → tenants
- `guests` → tenants
- `complaints` → tenants
- `notices`
- `conversations`, `messages`
- `tolet_requests` → rooms
- `accounting_entries` → bills, payments
- `property_images` → properties
- `room_images` → rooms
- `property_staff` → properties
- `payment_accounts`
- `user_subscriptions` → subscription_plans
- `staff_assignments` → permission_presets
- `room_boosts` → rooms
- `sale_listings` → properties, rooms
- `sale_listing_images` → sale_listings
- `sale_favorites` → sale_listings
- `sale_conversations` → sale_listings
- `sale_messages` → sale_conversations
- `sale_buy_requests` → sale_listings
- `property_transfers` → properties, rooms, sale_listings

## Phase 3: Functions & Triggers

- `handle_new_user()` — auto-create profile + role + tenant on signup (trigger on `auth.users`)
- `get_current_tenant_notice_context()` — tenant notice context
- `notify_new_tolet_request()` — trigger on tolet_requests INSERT
- `notify_new_complaint()` — trigger on complaints INSERT
- `notify_complaint_status_change()` — trigger on complaints UPDATE
- Email queue RPC wrappers: `enqueue_email`, `read_email_batch`, `delete_email`, `move_to_dlq`
- `updated_at` triggers on all relevant tables
- Email queues via pgmq: `auth_emails`, `transactional_emails` + DLQ queues

## Phase 4: RLS Policies

All 100+ RLS policies covering:
- Owner/landlord access to own data
- Tenant access to own records
- Admin full access via `has_role()`
- Staff access via `staff_assignments`
- Public/anon access for tolet listings, CMS, ads, tutorials
- Service role access for email infrastructure

## Phase 5: Storage Buckets

- `property-images` (public)
- `avatars` (public)
- `tenant-documents` (public)
- `sale-listing-images` (public)
- Storage RLS policies for each bucket

## Phase 6: Realtime & Seed Data

- Enable realtime on `messages`, `notifications`, `sale_messages`
- Seed default `permission_presets` (Admin + Landlord scopes)
- Initialize `email_send_state` row

## Phase 7: Edge Functions

Copy and deploy all **30 edge functions** from the previous project:
- Auth: `login-with-email`, `login-with-phone`, `forgot-email`, `request-password-reset`, `verify-reset-token`, `check-registration`
- Admin: `admin-create-user`, `admin-delete-user`, `admin-manage-user`, `admin-add-balance`, `admin-reassign`
- Tenant: `create-tenant-user`, `link-tenant`, `migrate-existing-users`
- Payment: `approve-manual-payment`, `create-boost-payment`, `verify-boost-payment`, `create-subscription-payment`, `verify-subscription-payment`
- Property: `transfer-property`, `handle-tolet-accept`
- Staff: `invite-staff`, `manage-staff-password`
- Data: `export-data`, `import-data`
- Email: `process-email-queue`, `check-email-status`
- Other: `auto-generate-bills`, `send-push-notification`, `visitor-chat`

## Phase 8: Copy Frontend Code

Copy all source code from the previous project (components, pages, hooks, utilities, types) to the new project.

---

## Execution Notes
- All SQL will use `IF NOT EXISTS` / `DROP IF EXISTS` for idempotency
- Foreign keys use proper CASCADE/SET NULL as per original
- CHECK constraints on email tables preserved
- Numeric columns use proper precision matching original schema
- The migration will be split into manageable chunks for the migration tool


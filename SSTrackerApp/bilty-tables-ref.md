create table public.bilty (
  id uuid not null default extensions.uuid_generate_v4 (),
  gr_no character varying(50) not null,
  branch_id uuid not null,
  staff_id uuid not null,
  from_city_id uuid null,
  to_city_id uuid null,
  bilty_date date not null,
  delivery_type character varying(50) null,
  consignor_name character varying(200) not null,
  consignor_gst character varying(50) null,
  consignor_number character varying(20) null,
  consignee_name character varying(200) null,
  consignee_gst character varying(50) null,
  consignee_number character varying(20) null,
  transport_name character varying(200) null,
  transport_gst character varying(50) null,
  transport_number character varying(20) null,
  payment_mode character varying(50) null,
  contain text null,
  invoice_no character varying(100) null,
  invoice_value numeric(15, 2) null default 0,
  invoice_date date null,
  e_way_bill character varying(100) null,
  document_number character varying(100) null,
  no_of_pkg integer null default 0,
  wt numeric(10, 3) null,
  rate numeric(10, 2) null,
  pvt_marks text null,
  freight_amount numeric(15, 2) null,
  labour_charge numeric(15, 2) null,
  bill_charge numeric(15, 2) null,
  toll_charge numeric(15, 2) null,
  dd_charge numeric(15, 2) null,
  other_charge numeric(15, 2) null,
  total numeric(15, 2) null,
  remark text null,
  saving_option character varying(20) null default 'SAVE'::character varying,
  is_active boolean null default true,
  deleted_at timestamp with time zone null,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp with time zone null default CURRENT_TIMESTAMP,
  pf_charge numeric(15, 2) null default 0,
  labour_rate numeric(10, 2) null default null::numeric,
  bilty_image text null,
  constraint bilty_pkey primary key (id),
  constraint bilty_gr_no_branch_id_unique unique (gr_no, branch_id)
) TABLESPACE pg_default;

create index IF not exists idx_bilty_gr_no on public.bilty using btree (gr_no) TABLESPACE pg_default;

create index IF not exists idx_bilty_branch_id on public.bilty using btree (branch_id) TABLESPACE pg_default;

create index IF not exists idx_bilty_staff_id on public.bilty using btree (staff_id) TABLESPACE pg_default;

create index IF not exists idx_bilty_bilty_date on public.bilty using btree (bilty_date) TABLESPACE pg_default;

create index IF not exists idx_bilty_consignor_name on public.bilty using btree (consignor_name) TABLESPACE pg_default;

create index IF not exists idx_bilty_consignee_name on public.bilty using btree (consignee_name) TABLESPACE pg_default;

create index IF not exists idx_bilty_transport_name on public.bilty using btree (transport_name) TABLESPACE pg_default;

create index IF not exists idx_bilty_payment_mode on public.bilty using btree (payment_mode) TABLESPACE pg_default;

create index IF not exists idx_bilty_invoice_no on public.bilty using btree (invoice_no) TABLESPACE pg_default;

create index IF not exists idx_bilty_saving_option on public.bilty using btree (saving_option) TABLESPACE pg_default;

create index IF not exists idx_bilty_is_active on public.bilty using btree (is_active) TABLESPACE pg_default;

create index IF not exists idx_bilty_deleted_at on public.bilty using btree (deleted_at) TABLESPACE pg_default;

create index IF not exists idx_bilty_created_at on public.bilty using btree (created_at) TABLESPACE pg_default;

create index IF not exists idx_bilty_pf_charge on public.bilty using btree (pf_charge) TABLESPACE pg_default;

create index IF not exists idx_bilty_branch_active_date on public.bilty using btree (branch_id, is_active, bilty_date) TABLESPACE pg_default;

create index IF not exists idx_bilty_labour_rate on public.bilty using btree (labour_rate) TABLESPACE pg_default;

create index IF not exists idx_bilty_gr_no_branch_active on public.bilty using btree (gr_no, branch_id, is_active) TABLESPACE pg_default
where
  (is_active = true);

create index IF not exists idx_bilty_gr_no_lower on public.bilty using btree (lower((gr_no)::text)) TABLESPACE pg_default;

create index IF not exists idx_bilty_branch_date_gr on public.bilty using btree (branch_id, bilty_date, lower((gr_no)::text)) TABLESPACE pg_default;

create index IF not exists idx_bilty_consignor_lower on public.bilty using btree (lower((consignor_name)::text)) TABLESPACE pg_default;

create index IF not exists idx_bilty_consignee_lower on public.bilty using btree (lower((consignee_name)::text)) TABLESPACE pg_default;

create index IF not exists idx_bilty_pvt_marks_lower on public.bilty using btree (lower(COALESCE(pvt_marks, ''::text))) TABLESPACE pg_default;

create index IF not exists idx_bilty_total_amount on public.bilty using btree (total) TABLESPACE pg_default;

create index IF not exists idx_bilty_to_city_id on public.bilty using btree (to_city_id) TABLESPACE pg_default;

create trigger update_bilty_updated_at BEFORE
update on bilty for EACH row
execute FUNCTION update_updated_at_column ();


create table public.cities (
  id uuid not null default extensions.uuid_generate_v4 (),
  city_code character varying(50) not null,
  city_name character varying(100) not null,
  constraint cities_pkey primary key (id),
  constraint cities_city_code_key unique (city_code)
) TABLESPACE pg_default;

create index IF not exists idx_cities_city_name_lower on public.cities using btree (lower((city_name)::text)) TABLESPACE pg_default;

create index IF not exists idx_cities_city_code on public.cities using btree (city_code) TABLESPACE pg_default;

create index IF not exists idx_cities_city_code_lower on public.cities using btree (lower((city_code)::text)) TABLESPACE pg_default;

create table public.branches (
  id uuid not null default extensions.uuid_generate_v4 (),
  branch_code character varying(50) not null,
  city_code character varying(100) not null,
  address text not null,
  manager_id uuid null,
  branch_name character varying(100) not null,
  default_bill_book_id uuid null,
  is_active boolean null default true,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp with time zone null default CURRENT_TIMESTAMP,
  constraint branches_pkey primary key (id),
  constraint branches_branch_code_key unique (branch_code),
  constraint branches_manager_id_fkey foreign KEY (manager_id) references users (id) on delete set null
) TABLESPACE pg_default;
create table if not exists properties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  name text not null,
  address text,
  insurer text,
  policy_number text,
  insured_value numeric default 0,
  refurbishment_cost numeric default 0,
  updated_value numeric default 0,
  renewal_date date,
  reminder_date date,
  status text default 'upcoming',
  suggested_insured_value numeric,
  suggested_value_source text,
  suggested_value_confidence numeric,
  suggested_value_review_status text default 'unreviewed',
  created_at timestamptz not null default now()
);

create table if not exists renewal_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  property_id uuid references properties(id) on delete cascade,
  previous_insured_value numeric,
  new_insured_value numeric,
  refurbishment_cost numeric,
  updated_value numeric,
  renewal_date date,
  notes text,
  created_at timestamptz not null default now()
);

alter table properties enable row level security;
alter table renewal_records enable row level security;

drop policy if exists "properties_v1_read" on properties;
create policy "properties_v1_read" on properties for select using (true);
drop policy if exists "properties_v1_write" on properties;
create policy "properties_v1_write" on properties for all using (true) with check (true);

drop policy if exists "renewal_records_v1_read" on renewal_records;
create policy "renewal_records_v1_read" on renewal_records for select using (true);
drop policy if exists "renewal_records_v1_write" on renewal_records;
create policy "renewal_records_v1_write" on renewal_records for all using (true) with check (true);

insert into properties (name, address, insurer, policy_number, insured_value, refurbishment_cost, updated_value, renewal_date, reminder_date, status) values
  ('Marina Bay Tower', '1 Marina Boulevard, Singapore', 'AIG Asia Pacific', 'AIG-2024-001', 12000000, 500000, 12500000, '2025-01-15', '2024-12-16', 'due'),
  ('Riverside Plaza', '15 Robertson Quay, Singapore', 'AXA Insurance', 'AXA-2024-014', 8500000, 0, 8500000, '2025-03-01', '2025-01-30', 'upcoming'),
  ('Orchard Commons', '200 Orchard Road, Singapore', 'Chubb Insurance', 'CHB-2024-077', 15000000, 1200000, 16200000, '2024-11-01', '2024-10-02', 'lapsed'),
  ('Sentosa Cove Villa', '7 Ocean Drive, Singapore', 'Allianz', 'ALZ-2024-205', 6800000, 350000, 7150000, '2025-06-20', '2025-05-21', 'upcoming'),
  ('Chinatown Heritage Block', '32 Smith Street, Singapore', 'Tokio Marine', 'TM-2024-088', 4200000, 800000, 5000000, '2024-12-10', '2024-11-10', 'due')
on conflict do nothing;

insert into renewal_records (property_id, previous_insured_value, new_insured_value, refurbishment_cost, updated_value, renewal_date, notes) values
  (null, 11000000, 12000000, 500000, 12500000, '2024-01-15', 'Annual renewal with lobby refurbishment'),
  (null, 8000000, 8500000, 0, 8500000, '2024-03-01', 'Standard annual renewal'),
  (null, 14000000, 15000000, 1200000, 16200000, '2023-11-01', 'Major HVAC and facade refurbishment')
on conflict do nothing;
-- Apply once after 0001_init.sql. Does not overwrite existing property values.
begin;

alter table public.properties add column if not exists revision integer not null default 0;
alter table public.properties alter column insured_value set not null;
alter table public.properties alter column refurbishment_cost set not null;
alter table public.properties alter column renewal_date set not null;
alter table public.properties add constraint properties_nonnegative_values
  check (insured_value >= 0 and refurbishment_cost >= 0
    and insured_value <= 999999999999.99 and refurbishment_cost <= 999999999999.99
    and insured_value=round(insured_value,2) and refurbishment_cost=round(refurbishment_cost,2));
alter table public.properties add constraint properties_name_required check (length(trim(name)) > 0);

create or replace function public.calculate_property_fields()
returns trigger language plpgsql set search_path = public as $$
begin
  new.name := trim(new.name);
  new.updated_value := round(coalesce(new.insured_value,0) + coalesce(new.refurbishment_cost,0),2);
  new.reminder_date := new.renewal_date - 30;
  if tg_op = 'UPDATE' then new.revision := old.revision + 1; end if;
  return new;
end;
$$;
create trigger property_derived_values before insert or update on public.properties
for each row execute function public.calculate_property_fields();

create or replace function public.process_property_renewal(
  p_property_id uuid, p_new_insured_value numeric, p_refurbishment_cost numeric,
  p_expected_revision integer, p_notes text default ''
) returns public.properties
language plpgsql security invoker set search_path = public as $$
declare
  current_property public.properties;
  result public.properties;
  business_today date := (now() at time zone 'Asia/Kuala_Lumpur')::date;
begin
  if p_new_insured_value is null or p_new_insured_value < 0
     or p_refurbishment_cost is null or p_refurbishment_cost < 0
     or p_new_insured_value > 999999999999.99 or p_refurbishment_cost > 999999999999.99
     or p_new_insured_value != round(p_new_insured_value,2)
     or p_refurbishment_cost != round(p_refurbishment_cost,2) then
    raise exception 'Enter nonnegative amounts with at most two decimal places.';
  end if;
  select * into current_property from public.properties where id = p_property_id for update;
  if not found then raise exception 'This property no longer exists.'; end if;
  if current_property.revision is distinct from p_expected_revision then
    raise exception 'This property changed. Refresh before renewing again.';
  end if;
  if current_property.renewal_date is null then raise exception 'Set a renewal date before renewing.'; end if;
  insert into public.renewal_records
    (property_id,user_id,previous_insured_value,new_insured_value,refurbishment_cost,updated_value,renewal_date,notes)
  values (current_property.id,current_property.user_id,current_property.insured_value,p_new_insured_value,
    p_refurbishment_cost,p_new_insured_value+p_refurbishment_cost,business_today,left(coalesce(p_notes,''),2000));
  update public.properties set insured_value = p_new_insured_value, refurbishment_cost = p_refurbishment_cost,
    renewal_date = (current_property.renewal_date + interval '1 year')::date, status = 'renewed'
  where id = p_property_id returning * into result;
  return result;
end;
$$;
revoke all on function public.process_property_renewal(uuid,numeric,numeric,integer,text) from public;
grant execute on function public.process_property_renewal(uuid,numeric,numeric,integer,text) to anon,authenticated;
grant select,insert,update,delete on public.properties,public.renewal_records to anon,authenticated;
create index if not exists properties_reminder_idx on public.properties(reminder_date,renewal_date);
create index if not exists renewal_records_property_idx on public.renewal_records(property_id,created_at desc);
-- Reconcile derived columns without changing the current insured value or renewal date.
update public.properties set updated_value=coalesce(insured_value,0)+coalesce(refurbishment_cost,0),
  reminder_date=renewal_date-30;
commit;

-- Admin sign-in: is this address an admin? Answered without creating anything, so the admin's
-- sign-in form can never create accounts (Supabase's generateLink creates unknown users).
create or replace function public.admin_id_for_email(p_email text)
returns uuid
language sql stable security definer set search_path = '' as $$
  select u.id
    from auth.users u
    join public.profiles p on p.id = u.id
   where lower(u.email) = lower(trim(p_email))
     and p.role = 'admin'
   limit 1;
$$;

revoke execute on function public.admin_id_for_email(text) from public, anon, authenticated;
grant execute on function public.admin_id_for_email(text) to service_role;

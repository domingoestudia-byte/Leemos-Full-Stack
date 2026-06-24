-- Políticas RLS para Storage
create policy "avatares son publicos" on storage.objects
  for select using (bucket_id = 'avatares');

create policy "usuarios suben su avatar" on storage.objects
  for insert with check (
    bucket_id = 'avatares' AND
    auth.role() = 'authenticated'
  );

create policy "portadas son publicas" on storage.objects
  for select using (bucket_id = 'portadas');

create policy "usuarios suben portadas" on storage.objects
  for insert with check (
    bucket_id = 'portadas' AND
    auth.role() = 'authenticated'
  );

-- Trigger para crear perfil automáticamente al registrar usuario
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
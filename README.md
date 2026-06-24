# Leemos — Red Social de Libros (Fullstack)

> Aplicación fullstack de recomendaciones de libros con autenticación, perfiles, likes y subida de imágenes. Construida con Next.js + Supabase + PWA.

---

## ¿Qué es esto?

Leemos es una red social minimalista donde los usuarios comparten recomendaciones de libros. Incluye registro/login, perfiles públicos con avatar, feed de recomendaciones con portadas, sistema de likes (sin duplicados) y funcionalidad PWA offline.

Está diseñada con la estética **Art Nouveau** usando la paleta de la guía Tailwind Art Nouveau: dorados, verdes oliva, beiges cálidos y cremas.

---

## Demo

- **Repositorio:** [https://github.com/domingoestudia-byte/Leemos-Full-Stack](https://github.com/domingoestudia-byte/Leemos-Full-Stack)
- **Deploy:** Pendiente — se desplegará en Vercel

---

## Tecnologías usadas

- **Next.js** (App Router) — Framework React con renderizado híbrido
- **Supabase Auth** — Registro y login con email/contraseña
- **Supabase Database** — PostgreSQL con RLS
- **Supabase Storage** — Subida de avatares y portadas
- **next-pwa** — Service Worker para funcionalidad offline
- **Tailwind CSS** — Estilos utility-first con paleta Art Nouveau
- **Docker** — Para ejecutar Supabase en local

---

## Cómo correrlo en local

```bash
# 1. Clonar el repositorio
git clone git@github.com:domingoestudia-byte/Leemos-Full-Stack.git
cd Leemos-Full-Stack

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno (crear .env.local):
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key

# 4. Asegúrate de tener Supabase Local corriendo (Docker)

# 5. Ejecutar los scripts SQL en orden:
#    - setup.sql (crea tablas, RLS, políticas)
#    - setup-storage.sql (buckets Storage, trigger perfil automático)

# 6. Arrancar en desarrollo
npm run dev
```

### Variables de entorno

```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_tu-anon-key
```

---

## SQL completo para crear la base de datos

### 1. `setup.sql` — Tablas, RLS y políticas

```sql
-- Tabla de perfiles (uno por usuario de auth)
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null,
  bio text,
  avatar_url text,
  created_at timestamp with time zone default now()
);

-- Tabla de recomendaciones
create table recomendaciones (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  titulo_libro text not null,
  resena text not null,
  portada_url text,
  created_at timestamp with time zone default now()
);

-- Tabla de likes (relación muchos a muchos)
create table likes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  recomendacion_id uuid references recomendaciones(id) on delete cascade not null,
  created_at timestamp with time zone default now(),
  unique(user_id, recomendacion_id)  -- evita duplicados a nivel de BD
);

-- RLS
alter table profiles enable row level security;
alter table recomendaciones enable row level security;
alter table likes enable row level security;

-- Políticas de perfiles
create policy "perfiles son publicos" on profiles
  for select using (true);
create policy "usuario actualiza su perfil" on profiles
  for update using (auth.uid() = id);
create policy "usuario crea su perfil" on profiles
  for insert with check (auth.uid() = id);

-- Políticas de recomendaciones
create policy "recomendaciones son publicas" on recomendaciones
  for select using (true);
create policy "usuario crea sus recomendaciones" on recomendaciones
  for insert with check (auth.uid() = user_id);
create policy "usuario borra sus recomendaciones" on recomendaciones
  for delete using (auth.uid() = user_id);

-- Políticas de likes
create policy "likes son publicos" on likes
  for select using (true);
create policy "usuario da likes" on likes
  for insert with check (auth.uid() = user_id);
create policy "usuario quita sus likes" on likes
  for delete using (auth.uid() = user_id);

-- Permisos
grant usage on schema public to anon;
grant all privileges on all tables in schema public to anon;
grant all privileges on all sequences in schema public to anon;
grant usage on schema public to authenticated;
grant all privileges on all tables in schema public to authenticated;
grant all privileges on all sequences in schema public to authenticated;
```

### 2. `setup-storage.sql` — Buckets Storage + Trigger perfil

```sql
-- Buckets públicos para avatares y portadas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
('avatares', 'avatares', true, 2097152, '{image/jpeg,image/png,image/webp}'),
('portadas', 'portadas', true, 5242880, '{image/jpeg,image/png,image/webp}');

-- Políticas Storage
create policy "avatares son publicos" on storage.objects
  for select using (bucket_id = 'avatares');
create policy "usuarios suben su avatar" on storage.objects
  for insert with check (bucket_id = 'avatares' AND auth.role() = 'authenticated');
create policy "portadas son publicas" on storage.objects
  for select using (bucket_id = 'portadas');
create policy "usuarios suben portadas" on storage.objects
  for insert with check (bucket_id = 'portadas' AND auth.role() = 'authenticated');

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
```

---

## Estructura del proyecto

```
├── app/
│   ├── api/auth/logout/route.js   # API route para logout
│   ├── globals.css                # Estilos Art Nouveau
│   ├── layout.js                  # Layout base (metadatos, manifest)
│   ├── page.js                    # Feed público de recomendaciones
│   ├── login/page.js              # Login
│   ├── registro/page.js           # Registro
│   ├── nueva/page.js              # Nueva recomendación (ruta protegida)
│   └── perfil/
│       ├── [username]/page.js      # Perfil público
│       └── editar/page.js          # Editar perfil (ruta protegida)
├── components/
│   ├── Navbar.js                  # Navegación sticky
│   ├── TarjetaRecomendacion.js    # Componente de recomendación
│   ├── BotonLike.js               # Componente de likes
│   └── OnlineIndicator.js         # Badge online/offline
├── lib/
│   └── supabaseClient.js          # Cliente Supabase
├── public/
│   ├── manifest.json              # Web App Manifest PWA
│   └── sw.js                      # Service Worker (generado por next-pwa)
├── setup.sql                      # SQL de tablas y RLS
├── setup-storage.sql              # SQL de Storage y trigger
├── next.config.js                 # Configuración next-pwa
├── .env.local
└── README.md
```

---

## Funcionalidades implementadas

### Requeridas
- ✅ **Autenticación**: Registro, login y logout con Supabase Auth
- ✅ **Protección de rutas**: `/nueva` y `/perfil/editar` redirigen a login si no hay sesión
- ✅ **Perfil de usuario**: Avatar (Storage), nombre de usuario, bio, página pública
- ✅ **Feed público**: Recomendaciones ordenadas por fecha (más reciente primero)
- ✅ **Publicar recomendación**: Portada (Storage), título, reseña
- ✅ **Borrar recomendación**: El usuario puede borrar solo sus propias recomendaciones
- ✅ **Sistema de likes**: Sin duplicados (constraint `unique(user_id, recomendacion_id)` en BD)
- ✅ **Contador de likes** visible en cada recomendación
- ✅ **RLS correcto** en todas las tablas
- ✅ **Supabase Storage**: Avatares (2MB) y portadas (5MB)
- ✅ **Trigger automático**: Perfil creado al registrar usuario

### Opcionales
- ✅ **PWA instalable**: manifest.json + Service Worker
- ✅ **Indicador online/offline**: Visual en todas las páginas
- ✅ **Estilo Art Nouveau**: Paleta completa (dorados, verdes oliva, cremas)

### Pendientes / Mejoras
- ❌ Comentarios en recomendaciones
- ❌ Paginación / infinite scroll
- ❌ Búsqueda por título
- ❌ Deploy en Vercel
- ❌ Iconos PWA reales (actualmente usa placeholders del sistema)

---

## Decisiones técnicas

### 1. ¿Por qué una tabla `profiles` separada de `auth.users`?

Supabase gestiona `auth.users` internamente y no se puede modificar. La tabla `profiles` extiende los datos del usuario con información pública (username, bio, avatar) y se vincula mediante FK a `auth.users(id)`. Es el patrón estándar recomendado por Supabase.

### 2. ¿Cómo evitas que un usuario dé like dos veces?

**Doble capa de seguridad:**
1. **Frontend**: Antes de insertar un like, el componente `BotonLike` comprueba si el usuario ya dio like (para UX: mostrar ❤️ o 🤍).
2. **Base de datos**: `unique(user_id, recomendacion_id)` en la tabla `likes`. Si llega un duplicado por un race condition o una petición directa, PostgreSQL lo rechaza con error 23505.

La defensa real está en la BD. La validación en frontend es solo para experiencia de usuario.

### 3. ¿Cómo se protegen las rutas?

Cada página protegida (`/nueva`, `/perfil/editar`) verifica la sesión con `supabase.auth.getUser()` en un `useEffect`. Si no hay usuario autenticado, redirige a `/login` con `router.push()`. Esto es suficiente para una app mid-level; en producción añadiríamos middleware de Next.js.

### 4. ¿Cómo funciona la subida de imágenes?

- **Avatares**: Se almacenan en el bucket `avatares` con ruta `{userId}/avatar.{extension}`. Si el usuario ya tenía avatar, se elimina el anterior antes de subir el nuevo. Upsert activado.
- **Portadas**: Bucket `portadas` con ruta `{userId}/{timestamp}.{extension}`. Se muestra vista previa local antes de enviar.

Ambos buckets tienen políticas RLS de Storage que permiten insert solo a usuarios autenticados.

### 5. ¿Por qué el trigger `handle_new_user`?

Sin el trigger, al registrarse un usuario nuevo no tendría perfil. La alternativa manual (crear perfil en el callback del signup) es frágil: si el callback falla o el usuario no completa el flujo, se queda sin perfil. El trigger en PostgreSQL es más robusto y garantiza que siempre exista un perfil.

### 6. ¿Por qué paleta Art Nouveau?

La guía de implementación Tailwind Art Nouveau proporciona una paleta completa (dorados, verdes oliva, beiges, cremas) que transmite elegancia y calidez. Es la misma estética que en el resto de pruebas técnicas, manteniendo coherencia visual entre proyectos pero con identidad propia para cada app.

### 7. ¿Por qué `NetworkFirst` para la caché PWA?

Igual que en la prueba de CocinaFácil: priorizamos datos frescos de Supabase cuando hay conexión. La cache (5 min TTL) es un respaldo para cuando no hay red. Los assets estáticos (imágenes) usan `CacheFirst` con 30 días de TTL.

### 8. ¿Por qué no hay autenticación server-side con cookies?

Dado que Supabase Local usa HTTP, los Service Workers requieren HTTPS, y el logout usa un API route simple que redirige, optamos por el patrón cliente (`supabase.auth.getUser()`) en lugar de `@supabase/ssr`. Para producción con Vercel (HTTPS) se migraría a cookies y middleware.

---

## Flujo de likes (detalle)

```
[Usuario da clic en ❤️]
       │
       ├── BotonLike envía DELETE o INSERT a supabase
       ├── RLS verifica: auth.uid() = user_id
       ├── CONSTRAINT unique(user_id, recomendacion_id) evita duplicados
       ├── Si falla (código 23505): error silencioso
       └── Estado local actualiza contador y color del botón
```

El contador de likes se obtiene de la query del feed: `likes(count)`.

---

## Criterios de evaluación y estado

| Criterio | Peso | Estado |
|---|---|---|
| Funcionalidad completa (todas las features obligatorias) | Alto | ✅ |
| RLS correcto en todas las tablas | Muy alto | ✅ |
| Diseño de BD (FKs, estructura, unique constraint) | Alto | ✅ |
| Supabase Storage: avatares y portadas funcionando | Alto | ✅ |
| Código organizado y legible | Medio | ✅ |
| README completo (setup, SQL, decisiones técnicas) | Medio | ✅ |
| Deploy en Vercel | Medio | ❌ Pendiente |
| PWA instalable | Extra | ✅ |

---

## Qué usé de IA y para qué

Usé asistencia de IA (Cline, basado en Claude) para:

- Generar la estructura del proyecto con `create-next-app` e integrar `next-pwa` y `@supabase/supabase-js`.
- Implementar todos los componentes y páginas (Navbar, TarjetaRecomendacion, BotonLike, login, registro, feed, perfiles).
- Escribir las políticas RLS, el trigger `handle_new_user` y los scripts SQL.
- Diseñar la paleta Art Nouveau en `globals.css` y aplicarla a todos los componentes.
- Documentar las decisiones técnicas y el README completo.
- Depurar errores de compilación (build con `--webpack` para compatibilidad con `next-pwa`).

Cada línea de código y cada explicación fueron revisadas y entendidas antes de integrarlas.

---

## Qué mejoraría con más tiempo

- [ ] **Comentarios**: Tabla `comentarios` con FK a recomendaciones y usuarios.
- [ ] **Paginación**: Implementar `range()` en Supabase queries o infinite scroll.
- [ ] **Búsqueda**: Input en el feed que filtre por `titulo_libro` usando `ilike`.
- [ ] **Deploy en Vercel**: Publicar con HTTPS para Service Worker completo.
- [ ] **Iconos PWA**: Reemplazar placeholders con iconos reales de 192x192 y 512x512.
- [ ] **Toast / notificaciones**: Feedback visual al dar like o publicar (actualmente no hay).
- [ ] **Middleware de autenticación**: Migrar a `@supabase/ssr` con cookies para proteger rutas server-side.
- [ ] **Test unitarios**: Componentes clave como BotonLike y TarjetaRecomendacion.

---

## Lo que aprendí con esta prueba

1. **Diseño de base de datos fullstack**: Aprendí a modelar relaciones 1:N (perfil → recomendaciones) y M:N (likes con tabla puente), usando FKs con `on delete cascade` y constraints `unique` compuestos.
2. **RLS complejo**: En las pruebas anteriores solo usé `FOR SELECT USING (true)`. Aquí tuve que escribir políticas para `INSERT`, `UPDATE` y `DELETE` por tabla, diferenciando entre anónimos y autenticados.
3. **Supabase Storage**: Implementé subida de imágenes con validación de tipo/tamaño, rutas por usuario, upsert y eliminación de archivos anteriores.
4. **Trigger PostgreSQL**: Creé un trigger `on_auth_user_created` para garantizar que cada usuario tenga un perfil automáticamente. Esto evita el error común de "usuario sin perfil" que menciona la guía de solución.
5. **Likes sin duplicados**: La combinación de validación frontend + constraint unique en BD es el estándar de la industria. Aprendí a implementarlo correctamente.
6. **Next.js App Router**: Trabajé con rutas dinámicas `[username]`, páginas protegidas con `useEffect` + `router.push()`, y layout compartido con Navbar.
7. **next-pwa con webpack**: En Next.js 16, `next-pwa` requiere el flag `--webpack` porque Turbopack no es compatible con plugins webpack. Aprendí a detectar y resolver este error.
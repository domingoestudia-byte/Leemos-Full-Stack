'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import supabase from '@/lib/supabaseClient';
import OnlineIndicator from '@/components/OnlineIndicator';

export default function EditarPerfilPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState(null);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    verificarSesion();
  }, []);

  const verificarSesion = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      const { data: perfil } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (perfil) {
        setUsuario(perfil);
        setUsername(perfil.username || '');
        setBio(perfil.bio || '');
        if (perfil.avatar_url) setAvatarPreview(perfil.avatar_url);
      }
    } catch (err) {
      console.error('Error al verificar sesión:', err);
      router.push('/login');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten imágenes.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('La imagen no puede superar 2MB.');
      return;
    }
    setAvatar(file);
    setAvatarPreview(URL.createObjectURL(file));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    if (!username.trim()) {
      setError('El nombre de usuario es obligatorio.');
      setCargando(false);
      return;
    }

    try {
      let avatar_url = usuario.avatar_url;

      // Subir nuevo avatar si cambió
      if (avatar && avatar !== usuario.avatar_url) {
        const extension = avatar.name.split('.').pop();
        const nombreArchivo = `${usuario.id}/avatar.${extension}`;
        
        // Intentar eliminar avatar anterior si existe
        if (usuario.avatar_url) {
          const pathAnterior = usuario.avatar_url.split('/').slice(-2).join('/');
          await supabase.storage.from('avatares').remove([pathAnterior]);
        }

        const { error: uploadError } = await supabase.storage
          .from('avatares')
          .upload(nombreArchivo, avatar, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('avatares')
          .getPublicUrl(nombreArchivo);

        avatar_url = urlData.publicUrl;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          username: username.trim(),
          bio: bio.trim(),
          avatar_url,
        })
        .eq('id', usuario.id);

      if (updateError) throw updateError;

      router.push('/perfil/' + username.trim());
      router.refresh();
    } catch (err) {
      console.error('Error al actualizar perfil:', err);
      setError(err.message || 'Error al actualizar el perfil.');
    } finally {
      setCargando(false);
    }
  };

  if (!usuario) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar user={usuario} />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-8">
        <h1 className="text-3xl font-bold text-nouveau-accent ornament-top mb-8">
          Editar perfil
        </h1>

        <div className="card-nouveau p-6 sm:p-8">
          {error && (
            <div className="bg-red-50 border border-accent-rose/30 text-accent-burgundy px-4 py-3 rounded-lg text-sm mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary shadow-lg flex-shrink-0">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-secondary flex items-center justify-center text-white font-bold text-4xl">
                    {username?.charAt(0).toUpperCase() || '?'}
                  </div>
                )}
              </div>
              <div>
                <label htmlFor="avatar" className="btn-nouveau-secondary inline-block cursor-pointer">
                  Cambiar avatar
                </label>
                <input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <p className="text-xs text-text-light mt-2">Máximo 2MB. JPG, PNG o WebP.</p>
              </div>
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-text-dark mb-2">
                Nombre de usuario *
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="input-nouveau w-full"
                placeholder="usuario123"
              />
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-text-dark mb-2">
                Bio
              </label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                className="input-nouveau w-full resize-none"
                placeholder="Cuéntanos sobre ti y tus gustos literarios..."
              />
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="btn-nouveau-secondary"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={cargando}
                className="btn-nouveau disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cargando ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </div>
      </main>

      <OnlineIndicator />
    </div>
  );
}
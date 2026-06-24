'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import supabase from '@/lib/supabaseClient';
import OnlineIndicator from '@/components/OnlineIndicator';

export default function NuevaRecomendacionPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState(null);
  const [titulo, setTitulo] = useState('');
  const [resena, setResena] = useState('');
  const [portada, setPortada] = useState(null);
  const [portadaPreview, setPortadaPreview] = useState(null);
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
      setUsuario(perfil || { id: user.id, username: user.email });
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
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no puede superar 5MB.');
      return;
    }
    setPortada(file);
    setPortadaPreview(URL.createObjectURL(file));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    if (!titulo.trim() || !resena.trim()) {
      setError('El título y la reseña son obligatorios.');
      setCargando(false);
      return;
    }

    try {
      let portada_url = null;

      if (portada) {
        const extension = portada.name.split('.').pop();
        const nombreArchivo = `${usuario.id}/${Date.now()}.${extension}`;
        const { error: uploadError } = await supabase.storage
          .from('portadas')
          .upload(nombreArchivo, portada);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('portadas')
          .getPublicUrl(nombreArchivo);

        portada_url = urlData.publicUrl;
      }

      const { error: insertError } = await supabase
        .from('recomendaciones')
        .insert({
          user_id: usuario.id,
          titulo_libro: titulo.trim(),
          resena: resena.trim(),
          portada_url,
        });

      if (insertError) throw insertError;

      router.push('/');
      router.refresh();
    } catch (err) {
      console.error('Error al crear recomendación:', err);
      setError(err.message || 'Error al publicar la recomendación.');
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
          Nueva recomendación
        </h1>

        <div className="card-nouveau p-6 sm:p-8">
          {error && (
            <div className="bg-red-50 border border-accent-rose/30 text-accent-burgundy px-4 py-3 rounded-lg text-sm mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="portada" className="block text-sm font-medium text-text-dark mb-2">
                Portada del libro (opcional)
              </label>
              <input
                id="portada"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-text-light file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-secondary file:text-white hover:file:bg-secondary-dark"
              />
              {portadaPreview && (
                <div className="mt-4 w-32 h-48 rounded-lg overflow-hidden bg-gray-100">
                  <img src={portadaPreview} alt="Vista previa" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            <div>
              <label htmlFor="titulo" className="block text-sm font-medium text-text-dark mb-2">
                Título del libro *
              </label>
              <input
                id="titulo"
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                required
                className="input-nouveau w-full"
                placeholder="Ej: Cien años de soledad"
              />
            </div>

            <div>
              <label htmlFor="resena" className="block text-sm font-medium text-text-dark mb-2">
                Reseña *
              </label>
              <textarea
                id="resena"
                value={resena}
                onChange={(e) => setResena(e.target.value)}
                required
                rows={5}
                className="input-nouveau w-full resize-none"
                placeholder="¿Qué te pareció este libro? ¿Por qué lo recomiendas?"
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
                {cargando ? 'Publicando...' : 'Publicar recomendación'}
              </button>
            </div>
          </form>
        </div>
      </main>

      <OnlineIndicator />
    </div>
  );
}
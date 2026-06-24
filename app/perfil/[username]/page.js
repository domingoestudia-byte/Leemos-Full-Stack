'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import TarjetaRecomendacion from '@/components/TarjetaRecomendacion';
import supabase from '@/lib/supabaseClient';
import OnlineIndicator from '@/components/OnlineIndicator';

export default function PerfilPage() {
  const params = useParams();
  const username = params.username;
  const [perfil, setPerfil] = useState(null);
  const [recomendaciones, setRecomendaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarPerfil();
  }, [username]);

  const cargarPerfil = async () => {
    try {
      const { data: perfilData, error: perfilError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();

      if (perfilError) throw perfilError;
      setPerfil(perfilData);

      const { data: recs, error: recsError } = await supabase
        .from('recomendaciones_with_likes')
        .select(`
          *,
          profiles(username, avatar_url)
        `)
        .eq('user_id', perfilData.id)
        .order('created_at', { ascending: false });

      if (recsError) throw recsError;
      const transformed = (recs || []).map(r => ({
        ...r,
        likes: [{ count: r.likes_count || 0 }],
        likes_count: r.likes_count || 0,
      }));
      setRecomendaciones(transformed);
    } catch (err) {
      console.error('Error al cargar perfil:', err);
      setError('No se pudo cargar el perfil.');
    } finally {
      setCargando(false);
    }
  };

  if (cargando) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Navbar user={null} />
        <div className="flex flex-1 items-center justify-center">
          <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      </div>
    );
  }

  if (error || !perfil) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Navbar user={null} />
        <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-12 text-center">
          <div className="card-nouveau py-12">
            <span className="text-6xl mb-4 block">😕</span>
            <h2 className="text-2xl font-bold text-primary mb-2">Usuario no encontrado</h2>
            <p className="text-text-light mb-6">{error || 'Este usuario no existe.'}</p>
            <Link href="/" className="btn-nouveau inline-block">
              Volver al inicio
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar user={null} />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">
        {/* Cabecera del perfil */}
        <div className="card-nouveau p-6 sm:p-8 mb-8 animate-fade-in">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary shadow-lg flex-shrink-0">
              {perfil.avatar_url ? (
                <img
                  src={perfil.avatar_url}
                  alt={perfil.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-secondary flex items-center justify-center text-white font-bold text-4xl">
                  {perfil.username?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-primary ornament-top">
                {perfil.username}
              </h1>
              {perfil.bio && (
                <p className="text-text-light mt-2 max-w-xl">{perfil.bio}</p>
              )}
              <p className="text-sm text-text-light mt-3">
                {recomendaciones.length} {recomendaciones.length === 1 ? 'recomendación' : 'recomendaciones'}
              </p>
            </div>
          </div>
        </div>

        {/* Recomendaciones del usuario */}
        <h2 className="text-2xl font-semibold text-nouveau-accent mb-6 ornament-top">
          Sus recomendaciones
        </h2>

        {recomendaciones.length === 0 ? (
          <div className="card-nouveau text-center py-12">
            <span className="text-4xl mb-3 block">📚</span>
            <p className="text-text-light">Este usuario aún no ha publicado recomendaciones.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recomendaciones.map((rec) => (
              <TarjetaRecomendacion
                key={rec.id}
                recomendacion={rec}
                usuarioActual={null}
              />
            ))}
          </div>
        )}
      </main>

      <OnlineIndicator />
    </div>
  );
}
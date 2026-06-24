'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import TarjetaRecomendacion from '@/components/TarjetaRecomendacion';
import supabase from '@/lib/supabaseClient';
import OnlineIndicator from '@/components/OnlineIndicator';

export default function Home() {
  const router = useRouter();
  const [recomendaciones, setRecomendaciones] = useState([]);
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    verificarSesion();
    cargarFeed();
  }, []);

  const verificarSesion = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: perfil } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setUsuario(perfil || { id: user.id, username: user.email });
      }
    } catch (err) {
      console.error('Error al verificar sesión:', err);
    }
  };

  const cargarFeed = async () => {
    try {
      // 1. Obtener recomendaciones
      const { data: recs, error: recsErr } = await supabase
        .from('recomendaciones')
        .select('*')
        .order('created_at', { ascending: false });

      if (recsErr) throw recsErr;

      // 2. Obtener todos los perfiles (para mapear user_id -> username/avatar)
      const { data: perfiles } = await supabase
        .from('profiles')
        .select('*');

      const perfilPorId = {};
      (perfiles || []).forEach(p => { perfilPorId[p.id] = p; });

      // 3. Para cada recomendación, contar likes
      const withLikes = await Promise.all((recs || []).map(async (r) => {
        const { count } = await supabase
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .eq('recomendacion_id', r.id);
        return {
          ...r,
          profiles: perfilPorId[r.user_id] || { username: 'Usuario', avatar_url: null },
          likes: [{ count: count || 0 }],
          likes_count: count || 0,
        };
      }));
      setRecomendaciones(withLikes);
    } catch (err) {
      console.error('Error al cargar feed:', err);
      setError('No se pudieron cargar las recomendaciones.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 bg-background min-h-screen">
      <Navbar user={usuario} />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-nouveau-accent ornament-top">
            Recomendaciones de la comunidad
          </h1>
          <p className="text-text-light mt-2">Descubre tu próxima lectura favorita</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-accent-rose/30 text-accent-burgundy px-4 py-3 rounded-lg mb-6">
            {error}
            <button 
              onClick={cargarFeed} 
              className="ml-4 underline text-sm hover:text-accent-burgundy"
            >
              Reintentar
            </button>
          </div>
        )}

        {cargando ? (
          <div className="flex flex-col items-center justify-center py-16 text-text-light">
            <svg className="animate-spin h-8 w-8 mb-3 text-primary" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-sm">Cargando recomendaciones...</p>
          </div>
) : recomendaciones.length === 0 ? (
          <div className="card-nouveau text-center py-16">
            <span className="text-6xl mb-4 block">📖</span>
            <h3 className="text-xl font-semibold text-primary mb-2">No hay recomendaciones aún</h3>
            <p className="text-text-light">Sé el primero en compartir un libro con la comunidad</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recomendaciones.map((rec) => (
              <TarjetaRecomendacion
                key={rec.id}
                recomendacion={rec}
                usuarioActual={usuario}
              />
            ))}
          </div>
        )}
      </main>

      <OnlineIndicator />
    </div>
  );
}
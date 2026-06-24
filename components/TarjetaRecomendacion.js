'use client';

import { useState } from 'react';
import Link from 'next/link';
import BotonLike from './BotonLike';

export default function TarjetaRecomendacion({ recomendacion, usuarioActual }) {
  const [imagenError, setImagenError] = useState(false);

  return (
    <div className="card-nouveau p-5 animate-fade-in">
      <div className="flex items-start gap-4">
        {/* Avatar del autor */}
        <Link href={`/perfil/${recomendacion.profiles?.username}`} className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary">
            {recomendacion.profiles?.avatar_url && !imagenError ? (
              <img
                src={recomendacion.profiles.avatar_url}
                alt={recomendacion.profiles.username}
                className="w-full h-full object-cover"
                onError={() => setImagenError(true)}
              />
            ) : (
              <div className="w-full h-full bg-secondary flex items-center justify-center text-white font-bold text-lg">
                {recomendacion.profiles?.username?.charAt(0).toUpperCase() || '?'}
              </div>
            )}
          </div>
        </Link>

        <div className="flex-1 min-w-0">
          {/* Autor y fecha */}
          <div className="flex items-center justify-between mb-2">
            <Link
              href={`/perfil/${recomendacion.profiles?.username}`}
              className="text-sm font-semibold text-nouveau-accent hover:text-primary-dark transition-colors"
            >
              {recomendacion.profiles?.username || 'Usuario'}
            </Link>
            <span className="text-xs text-text-light">
              {new Date(recomendacion.created_at).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>

          {/* Portada del libro */}
          {recomendacion.portada_url && (
            <div className="mb-4 w-32 h-48 rounded-lg overflow-hidden bg-gray-100 shadow-sm">
              <img
                src={recomendacion.portada_url}
                alt={recomendacion.titulo_libro}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Título y reseña */}
          <h3 className="text-lg font-semibold text-primary mb-2 ornament-top">
            {recomendacion.titulo_libro}
          </h3>
          <p className="text-text-light text-sm leading-relaxed mb-4">
            {recomendacion.resena}
          </p>

          {/* Acciones */}
          <div className="flex items-center gap-4">
            <BotonLike
              recomendacionId={recomendacion.id}
              usuarioActual={usuarioActual}
              likesCount={recomendacion.likes_count || recomendacion.likes?.length || 0}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
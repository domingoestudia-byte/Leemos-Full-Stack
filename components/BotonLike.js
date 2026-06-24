'use client';

import { useState } from 'react';
import supabase from '@/lib/supabaseClient';

export default function BotonLike({ recomendacionId, usuarioActual, likesCount }) {
  const [likes, setLikes] = useState(likesCount || 0);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLike = async () => {
    if (!usuarioActual) return;
    setLoading(true);

    try {
      if (liked) {
        // Quitar like
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('user_id', usuarioActual.id)
          .eq('recomendacion_id', recomendacionId);

        if (error) throw error;
        setLikes((prev) => prev - 1);
        setLiked(false);
      } else {
        // Dar like
        const { error } = await supabase
          .from('likes')
          .insert({
            user_id: usuarioActual.id,
            recomendacion_id: recomendacionId,
          });

        if (error) throw error;
        setLikes((prev) => prev + 1);
        setLiked(true);
      }
    } catch (err) {
      console.error('Error al dar like:', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLike}
      disabled={loading || !usuarioActual}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
        liked
          ? 'bg-accent-rose/10 text-accent-burgundy border border-accent-rose/30'
          : 'bg-background text-text-light border border-border hover:border-accent-rose/50 hover:text-accent-burgundy'
      } ${!usuarioActual ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={!usuarioActual ? 'Inicia sesión para dar likes' : liked ? 'Quitar like' : 'Dar like'}
    >
      <span className="text-lg">{liked ? '❤️' : '🤍'}</span>
      <span>{likes}</span>
    </button>
  );
}
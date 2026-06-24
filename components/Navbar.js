'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

export default function Navbar({ user }) {
  const router = useRouter();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) router.push('/login');
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    }
  };

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'gradient-nouveau shadow-lg' : 'bg-card border-b border-border'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link
            href="/"
            className="flex items-center gap-3 group"
          >
            <span className="text-2xl group-hover:scale-110 transition-transform">📚</span>
            <span
              className={`text-xl font-bold tracking-tight transition-colors ${
                scrolled ? 'text-white' : 'text-nouveau-accent'
              }`}
            >
              Leemos
            </span>
          </Link>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link
                  href="/nueva"
                  className={`hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    scrolled
                      ? 'bg-white/20 text-white hover:bg-white/30'
                      : 'btn-nouveau'
                  }`}
                >
                  <span>+</span> Nueva recomendación
                </Link>
                <Link
                  href="/perfil"
                  className="flex items-center gap-2 group"
                >
                  <div
                    className={`w-8 h-8 rounded-full overflow-hidden border-2 transition-colors ${
                      scrolled ? 'border-white/50' : 'border-primary'
                    }`}
                  >
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-secondary flex items-center justify-center text-white font-bold">
                        {user.username?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <span
                    className={`hidden md:inline text-sm font-medium transition-colors ${
                      scrolled ? 'text-white' : 'text-text-dark'
                    }`}
                  >
                    {user.username}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className={`text-sm font-medium transition-colors ${
                    scrolled
                      ? 'text-white/80 hover:text-white'
                      : 'text-text-light hover:text-primary'
                  }`}
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className={`text-sm font-medium transition-colors ${
                    scrolled
                      ? 'text-white/80 hover:text-white'
                      : 'text-text-light hover:text-primary'
                  }`}
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/registro"
                  className={`text-sm font-medium px-4 py-2 rounded-lg transition-all ${
                    scrolled
                      ? 'bg-white/20 text-white hover:bg-white/30'
                      : 'btn-nouveau'
                  }`}
                >
                  Registrarse
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
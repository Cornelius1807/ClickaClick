'use client';

import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import type { Video, DeviceType } from '@/types';
import { useVideos } from '@/hooks/useApi';

const Lottie = dynamic(() => import('lottie-react'), { ssr: false });
import videotecaMascotAnimation from './animations/videoteca-mascot-animation';

// ───── category helpers ─────────────────────────────────────
const CATEGORY_ICONS: Record<string, string> = {
  'comunicación':  '💬',
  'ajustes':      '⚙️',
  'conectividad': '📶',
  'multimedia':   '📸',
  'apps':         '📱',
  'otros':        '📋',
};

function categorize(intentName: string): string {
  const n = intentName.toLowerCase();
  if (/whatsapp|llamad|contacto|mensaje/.test(n)) return 'comunicación';
  if (/brillo|volumen|letra|tamano/.test(n)) return 'ajustes';
  if (/wifi|bluetooth|datos|internet|conectar/.test(n)) return 'conectividad';
  if (/cámara|foto|video|galería/.test(n)) return 'multimedia';
  if (/descargar|app|aplicación|instalar/.test(n)) return 'apps';
  return 'otros';
}

function formatDuration(seconds?: number): string {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ───── props ────────────────────────────────────────────────
interface VideotecaProps {
  isOpen: boolean;
  onClose: () => void;
  device: DeviceType;
  darkMode: boolean;
  fontScale: number;
  onSendVideoQuestion?: (question: string) => void;
}

// ───── component ────────────────────────────────────────────
export const Videoteca: React.FC<VideotecaProps> = ({
  isOpen,
  onClose,
  device,
  darkMode,
  fontScale,
  onSendVideoQuestion,
}) => {
  const { getVideos } = useVideos();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasAppeared, setHasAppeared] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Fetch videos when opened
  useEffect(() => {
    if (isOpen && device) {
      setLoading(true);
      getVideos(device)
        .then((data) => {
          setVideos(data.videos || []);
        })
        .catch(() => setVideos([]))
        .finally(() => setLoading(false));
    }
  }, [isOpen, device, getVideos]);

  // Focus search when opened
  useEffect(() => {
    if (isOpen) {
      setHasAppeared(true);
      setTimeout(() => searchRef.current?.focus(), 400);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Grouped videos by category
  const grouped = useMemo(() => {
    const filtered = videos.filter((v) => {
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return v.title.toLowerCase().includes(q) || v.intentName.toLowerCase().includes(q);
    });

    const groups: Record<string, Video[]> = {};
    filtered.forEach((v) => {
      const cat = categorize(v.intentName);
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(v);
    });
    return groups;
  }, [videos, searchTerm]);

  const categories = Object.keys(grouped).sort();

  const handlePlayVideo = useCallback((videoId: string) => {
    setPlayingId(playingId === videoId ? null : videoId);
  }, [playingId]);

  const handleAskAbout = useCallback((intentName: string) => {
    if (onSendVideoQuestion) {
      onSendVideoQuestion(`¿Cómo hago para ${intentName.toLowerCase()}?`);
      onClose();
    }
  }, [onSendVideoQuestion, onClose]);

  if (!hasAppeared && !isOpen) return null;

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className={`videoteca-backdrop ${isOpen ? 'open' : 'closed'}`}
        onClick={onClose}
        aria-hidden
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`videoteca-drawer ${isOpen ? 'open' : 'closed'} ${darkMode ? 'dark' : ''}`}
        role="dialog"
        aria-label="Videoteca"
        aria-modal="true"
      >
        {/* ───── Header ───── */}
        <div className={`videoteca-header ${darkMode ? 'dark' : ''}`}>
          <div className="videoteca-header-top">
            <div className="videoteca-mascot">
              <Lottie animationData={videotecaMascotAnimation} loop autoplay style={{ width: 64, height: 64 }} />
            </div>
            <div className="videoteca-header-text">
              <h2 style={{ fontSize: `${18 * fontScale}px` }}>
                🎬 Videoteca
              </h2>
              <p style={{ fontSize: `${12 * fontScale}px` }}>
                {device === 'ios' ? '📱 iPhone' : '🤖 Android'} • {videos.length} video{videos.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              className={`videoteca-close-btn ${darkMode ? 'dark' : ''}`}
              onClick={onClose}
              aria-label="Cerrar videoteca"
            >
              ✕
            </button>
          </div>

          {/* Search bar */}
          <div className={`videoteca-search ${darkMode ? 'dark' : ''}`}>
            <span className="videoteca-search-icon">🔍</span>
            <input
              ref={searchRef}
              type="text"
              placeholder="Buscar tutorial..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`videoteca-search-input ${darkMode ? 'dark' : ''}`}
              style={{ fontSize: `${14 * fontScale}px` }}
            />
            {searchTerm && (
              <button
                className="videoteca-search-clear"
                onClick={() => setSearchTerm('')}
                aria-label="Limpiar búsqueda"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category pills */}
          {categories.length > 1 && (
            <div className="videoteca-pills">
              <button
                className={`videoteca-pill ${activeCategory === null ? 'active' : ''} ${darkMode ? 'dark' : ''}`}
                onClick={() => setActiveCategory(null)}
                style={{ fontSize: `${12 * fontScale}px` }}
              >
                Todos
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`videoteca-pill ${activeCategory === cat ? 'active' : ''} ${darkMode ? 'dark' : ''}`}
                  onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                  style={{ fontSize: `${12 * fontScale}px` }}
                >
                  {CATEGORY_ICONS[cat] || '📋'} {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ───── Content ───── */}
        <div className="videoteca-content">
          {loading ? (
            <div className="videoteca-loading">
              <div className="videoteca-loading-mascot">
                <Lottie animationData={videotecaMascotAnimation} loop autoplay style={{ width: 100, height: 100 }} />
              </div>
              <p style={{ fontSize: `${14 * fontScale}px` }}>Cargando videos...</p>
            </div>
          ) : videos.length === 0 ? (
            <div className="videoteca-empty">
              <div className="videoteca-empty-mascot">
                <Lottie animationData={videotecaMascotAnimation} loop autoplay style={{ width: 120, height: 120 }} />
              </div>
              <p className="videoteca-empty-title" style={{ fontSize: `${16 * fontScale}px` }}>
                ¡Pronto habrá videos aquí!
              </p>
              <p className="videoteca-empty-sub" style={{ fontSize: `${13 * fontScale}px` }}>
                Estamos preparando tutoriales para {device === 'ios' ? 'iPhone' : 'Android'}.
                <br />Mientras tanto, pregúntame en el chat 💬
              </p>
            </div>
          ) : Object.keys(grouped).filter(cat => !activeCategory || cat === activeCategory).length === 0 ? (
            <div className="videoteca-empty">
              <p style={{ fontSize: `${14 * fontScale}px` }}>
                No se encontraron videos para &ldquo;{searchTerm}&rdquo; 🔍
              </p>
            </div>
          ) : (
            /* Video list grouped by category */
            (activeCategory ? [activeCategory] : categories).map((cat) =>
              grouped[cat] ? (
                <div key={cat} className="videoteca-category">
                  <h3
                    className={`videoteca-category-title ${darkMode ? 'dark' : ''}`}
                    style={{ fontSize: `${14 * fontScale}px` }}
                  >
                    {CATEGORY_ICONS[cat] || '📋'} {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    <span className="videoteca-category-count">{grouped[cat].length}</span>
                  </h3>

                  <div className="videoteca-grid">
                    {grouped[cat].map((video, idx) => (
                      <div
                        key={video.id}
                        className={`videoteca-card ${darkMode ? 'dark' : ''}`}
                        style={{ animationDelay: `${idx * 60}ms` }}
                      >
                        {/* Thumbnail / Player */}
                        <div
                          className="videoteca-thumb"
                          onClick={() => video.youtubeId && handlePlayVideo(video.id)}
                        >
                          {playingId === video.id && video.youtubeId ? (
                            <iframe
                              src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=1&rel=0`}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              className="videoteca-iframe"
                            />
                          ) : (
                            <>
                              {video.youtubeId ? (
                                <Image
                                  src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`}
                                  alt={video.title}
                                  className="videoteca-thumb-img"
                                  loading="lazy"
                                  width={320}
                                  height={180}
                                  unoptimized
                                />
                              ) : (
                                <div className={`videoteca-thumb-placeholder ${darkMode ? 'dark' : ''}`}>
                                  🎬
                                </div>
                              )}
                              {video.youtubeId && (
                                <div className="videoteca-play-overlay">
                                  <div className="videoteca-play-btn">▶</div>
                                </div>
                              )}
                              {video.durationSeconds && (
                                <span className="videoteca-duration">
                                  {formatDuration(video.durationSeconds)}
                                </span>
                              )}
                            </>
                          )}
                        </div>

                        {/* Info */}
                        <div className="videoteca-card-info">
                          <p
                            className={`videoteca-card-title ${darkMode ? 'dark' : ''}`}
                            style={{ fontSize: `${13 * fontScale}px` }}
                          >
                            {video.title}
                          </p>
                          <div className="videoteca-card-actions">
                            <span
                              className={`videoteca-intent-badge ${darkMode ? 'dark' : ''}`}
                              style={{ fontSize: `${11 * fontScale}px` }}
                            >
                              {video.intentName}
                            </span>
                            {onSendVideoQuestion && (
                              <button
                                className={`videoteca-ask-btn ${darkMode ? 'dark' : ''}`}
                                onClick={() => handleAskAbout(video.intentName)}
                                title="Preguntar sobre esto en el chat"
                                style={{ fontSize: `${11 * fontScale}px` }}
                              >
                                💬 Preguntar
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null
            )
          )}
        </div>

        {/* ───── Footer ───── */}
        <div className={`videoteca-footer ${darkMode ? 'dark' : ''}`}>
          <p style={{ fontSize: `${11 * fontScale}px` }}>
            💡 Toca un video para verlo. ¡También puedes preguntar en el chat!
          </p>
        </div>
      </div>
    </>
  );
};

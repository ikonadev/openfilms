import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function Movie() {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const movieTitle = location.state?.title;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [iframeSrc, setIframeSrc] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchMovie = async () => {
      setLoading(true);
      setError(null);
      setIframeSrc(null);

      try {
        let queryParam = '';
        if (type === 'kp') queryParam = `kp=${id}`;
        else if (type === 'imdb') queryParam = `imdb=${id}`;
        else if (type === 'tmdb') queryParam = `tmdb=${id}`;

        const response = await fetch(`https://api.apbugall.org/?token=YOUR_API_ALOHATV_TOKEN_HERE&${queryParam}`);
        const apiData = await response.json();

        if (!isMounted) return;

        if (apiData.status === 'success' && apiData.iframe) {
          setIframeSrc(apiData.iframe);
        } else if (apiData.status === 'success' && apiData.data && apiData.data.iframe) {
          setIframeSrc(apiData.data.iframe);
        } else {
          setError(apiData.error_info === 'not movie' ? 'Фильм не найден в базе плеера.' : (apiData.error_info || 'Ошибка загрузки плеера.'));
        }
      } catch (err) {
        if (isMounted) {
          console.error(err);
          setError('Ошибка соединения с сервером плеера.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchMovie();

    return () => { isMounted = false; };
  }, [type, id]);

  return (
    <div className="page-fade-in" style={{ padding: '20px' }}>
      <button
        onClick={() => navigate('/')}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: 'transparent', border: 'none', color: '#a1a1aa',
          cursor: 'pointer', marginBottom: '20px', fontSize: '16px'
        }}
      >
        <ArrowLeft size={20} /> Назад в каталог
      </button>

      <div className="player-wrapper" style={{ margin: '0 auto', maxWidth: '1000px' }}>
        <div className="player-header">
          <h2>
            {type === 'kp' && `Kinopoisk ID: ${id}`}
            {type === 'imdb' && `IMDB ID: ${id}`}
            {type === 'tmdb' && `TMDB ID: ${id}`}
            {movieTitle && ` | ${movieTitle}`}
          </h2>
        </div>

        {/* We fix the player container to NOT clip by allowing it to grow */}
        <div className="player-container" style={{ width: '100%', minHeight: '600px', display: 'flex', flexDirection: 'column' }}>
          {loading && <div style={{ padding: 40, textAlign: 'center' }}>Загрузка плеера...</div>}
          {error && <div style={{ padding: 40, textAlign: 'center', color: '#ff4b4b' }}>{error}</div>}
          {!loading && !error && iframeSrc && (
            <iframe
              src={iframeSrc}
              style={{ width: '100%', minHeight: '600px', flexGrow: 1, border: 'none' }}
              frameBorder="0"
              scrolling="no"
              allowFullScreen
            />
          )}
        </div>
      </div>
    </div>
  );
}

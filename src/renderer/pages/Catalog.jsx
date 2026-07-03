import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Play, Star, Flame, Trophy, Award, Crown, Link as LinkIcon, Type } from 'lucide-react';
import { extractMovieData } from '../../shared/parser';

const TMDB_API_KEY = 'YOUR_TMDB_API_KEY_HERE';

export default function Catalog() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('link'); // 'link' or 'name'
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('popular'); // 'popular', 'top50', 'top100', 'top250'

  const filterMenuRef = useRef(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });

  // Update sliding indicator position
  useEffect(() => {
    if (filterMenuRef.current) {
      const activeBtn = filterMenuRef.current.querySelector('.filter-btn.active');
      if (activeBtn) {
        setIndicatorStyle({
          left: activeBtn.offsetLeft,
          width: activeBtn.offsetWidth,
          opacity: 1
        });
      } else {
        setIndicatorStyle({ opacity: 0 });
      }
    }
  }, [activeFilter, movies]);

  useEffect(() => {
    // Skip catalog fetch when we're in search results mode
    if (activeFilter === 'search') return;

    const fetchMovies = async () => {
      try {
        setLoading(true);
        if (activeFilter === 'popular') {
          const res = await fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&language=ru-RU&page=1`);
          const data = await res.json();
          if (data.results) setMovies(data.results);
        } else {
          const limit = activeFilter === 'top50' ? 50 : (activeFilter === 'top100' ? 100 : 250);
          const pages = Math.ceil(limit / 20);
          const fetchPromises = Array.from({ length: pages }, (_, i) =>
            fetch(`https://api.themoviedb.org/3/movie/top_rated?api_key=${TMDB_API_KEY}&language=ru-RU&page=${i + 1}`).then(r => r.json())
          );
          const results = await Promise.all(fetchPromises);
          const allMovies = results.flatMap(data => data.results).slice(0, limit);
          setMovies(allMovies);
        }
      } catch (e) {
        console.error("Failed to fetch TMDB", e);
      } finally {
        setLoading(false);
      }
    };
    fetchMovies();
  }, [activeFilter]);

  const handleOpenExternal = (url) => {
    if (window.electronAPI && window.electronAPI.openExternal) {
      window.electronAPI.openExternal(url);
    } else {
      window.open(url, '_blank');
    }
  };

  const [searchStatus, setSearchStatus] = useState(null); // null | 'searching' | 'done'

  const smartSearch = async (query) => {
    const yearMatch = query.match(/\((\d{4})\)/);
    const year = yearMatch ? yearMatch[1] : null;
    const cleanedQuery = query.replace(/\(\d{4}\)/g, '').trim();

    // Collect candidate queries: full, Cyrillic part, Latin part
    const allQueries = new Set();
    allQueries.add(cleanedQuery);

    const cyrillicPart = cleanedQuery.match(/[а-яёА-ЯЁ][а-яёА-ЯЁ\s]*/g)?.join(' ').trim();
    const latinPart = cleanedQuery.match(/[a-zA-Z][a-zA-Z\s]*/g)?.join(' ').trim();
    if (cyrillicPart && cyrillicPart !== cleanedQuery) allQueries.add(cyrillicPart);
    if (latinPart && latinPart !== cleanedQuery) allQueries.add(latinPart);

    // Use /search/multi so we get both movies AND TV shows (Интерны is a TV show)
    const doFetch = (q, lang) => {
      let url = `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&language=${lang}&query=${encodeURIComponent(q)}&include_adult=false`;
      if (year) url += `&year=${year}`;
      return fetch(url).then(r => r.json()).catch(() => ({ results: [] }));
    };

    const promises = [...allQueries].flatMap(q => [
      doFetch(q, 'ru-RU'),
      doFetch(q, 'en-US'),
    ]);
    const responses = await Promise.all(promises);

    // Merge, deduplicate, keep only movies and TV shows
    const seen = new Set();
    const merged = [];
    responses.forEach(resp => {
      (resp.results || []).forEach(item => {
        if ((item.media_type === 'movie' || item.media_type === 'tv') && !seen.has(item.id + item.media_type)) {
          seen.add(item.id + item.media_type);
          merged.push(item);
        }
      });
    });

    // Sort: exact title match first, then by popularity
    const lowerQuery = cleanedQuery.toLowerCase();
    merged.sort((a, b) => {
      const aTitle = (a.title || a.name || '').toLowerCase();
      const bTitle = (b.title || b.name || '').toLowerCase();
      const aExact = aTitle === lowerQuery ? 0 : 1;
      const bExact = bTitle === lowerQuery ? 0 : 1;
      if (aExact !== bExact) return aExact - bExact;
      return (b.popularity || 0) - (a.popularity || 0);
    });

    return merged;
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    if (searchType === 'link') {
      const data = extractMovieData(searchQuery);
      if (data.kinopoisk) navigate(`/movie/kp/${data.kinopoisk}`, { state: { title: data.title } });
      else if (data.imdb) navigate(`/movie/imdb/${data.imdb}`, { state: { title: data.title } });
      else if (data.tmdb) navigate(`/movie/tmdb/${data.tmdb}`, { state: { title: data.title } });
      else {
        alert('Пожалуйста, введите валидную ссылку на Kinopoisk, IMDB или TMDB');
      }
    } else {
      try {
        setLoading(true);
        setSearchStatus('searching');
        const results = await smartSearch(searchQuery);
        setMovies(results);
        setActiveFilter('search');
        setSearchStatus('done');
      } catch (err) {
        console.error("Failed to search TMDB", err);
        setSearchStatus(null);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="page-fade-in" style={{ padding: '0 20px 40px 20px' }}>

      <div className="hero-section" style={{ padding: '40px 0' }}>
        <h1 className="hero-title">
          Open<span>Films</span>
        </h1>
        <p className="hero-subtitle">
          Выберите популярный фильм, найдите по названию или вставьте прямую ссылку
        </p>

        <div className="search-toggle-group">
          <button
            className={`search-toggle-btn ${searchType === 'link' ? 'active' : ''}`}
            onClick={() => setSearchType('link')}
          >
            <LinkIcon size={16} /> По ссылке
          </button>
          <button
            className={`search-toggle-btn ${searchType === 'name' ? 'active' : ''}`}
            onClick={() => setSearchType('name')}
          >
            <Type size={16} /> По названию
          </button>
        </div>

        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-wrapper">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              className="search-input"
              placeholder={searchType === 'link' ? "Вставьте ссылку, например https://www.kinopoisk.ru/film/435/" : "Введите название фильма, например 'Интерстеллар'"}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button type="submit" className="search-button">
            Найти
          </button>
        </form>

        <div className="filter-menu" ref={filterMenuRef} style={{ position: 'relative' }}>
          <div
            className="filter-indicator"
            style={{
              left: `${indicatorStyle.left}px`,
              width: `${indicatorStyle.width}px`,
              opacity: indicatorStyle.opacity
            }}
          />
          <button
            className={`filter-btn ${activeFilter === 'popular' ? 'active' : ''}`}
            onClick={() => setActiveFilter('popular')}
          >
            <Flame size={18} /> Популярные
          </button>
          <button
            className={`filter-btn ${activeFilter === 'top50' ? 'active' : ''}`}
            onClick={() => setActiveFilter('top50')}
          >
            <Award size={18} /> Топ 50
          </button>
          <button
            className={`filter-btn ${activeFilter === 'top100' ? 'active' : ''}`}
            onClick={() => setActiveFilter('top100')}
          >
            <Trophy size={18} /> Топ 100
          </button>
          <button
            className={`filter-btn ${activeFilter === 'top250' ? 'active' : ''}`}
            onClick={() => setActiveFilter('top250')}
          >
            <Crown size={18} /> Топ 250
          </button>
        </div>

        <div className="footer-links">
          <button className="link-btn donate" onClick={() => handleOpenExternal('https://send.monobank.ua/jar/2JiFMVhcQC')}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
            Донат автору
          </button>
          <button className="link-btn tg" onClick={() => handleOpenExternal('https://t.me/ikonaDev')}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>
            Telegram Канал
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Поиск...</div>
      ) : movies.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Ничего не найдено. Попробуйте другой запрос.</div>
      ) : (
        <div className="catalog-grid">
          {movies.map((item, index) => {
            // /search/multi returns both movies (title, release_date) and TV shows (name, first_air_date)
            const title = item.title || item.name || 'Без названия';
            const date = item.release_date || item.first_air_date || '';
            const year = date ? date.split('-')[0] : 'N/A';
            const mediaType = item.media_type || 'movie';
            const routePath = mediaType === 'tv' ? `/movie/tmdb/${item.id}` : `/movie/tmdb/${item.id}`;
            return (
              <div
                key={item.id + (item.media_type || '')}
                className="movie-card"
                style={{ animationDelay: `${index * 0.04}s` }}
                onClick={() => navigate(routePath, { state: { title } })}
              >
                <div className="poster-wrapper">
                  <img
                    src={item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Poster'}
                    alt={title}
                    loading="lazy"
                  />
                  <div className="poster-overlay">
                    <Play size={48} className="play-icon" />
                  </div>
                  <div className="rating-badge">
                    <Star size={12} fill="#ffd700" color="#ffd700" />
                    {item.vote_average ? item.vote_average.toFixed(1) : '0.0'}
                  </div>
                </div>
                <div className="movie-info">
                  <h3 title={title}>{title}</h3>
                  <p>{year}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

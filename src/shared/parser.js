/**
 * Extract movie data from a URL or ID string
 * Based on Tape-Operator-main regex logic
 */

const KINOPOISK_MATCHER = /kinopoisk\.ru\/(film|series)\/(\d+)/;
const IMDB_MATCHER = /imdb\.com\/title\/(tt\d+)/;
const TMDB_MATCHER = /themoviedb\.org\/(movie|tv)\/(\d+)/;

export function extractMovieData(input) {
  let url = input.trim();
  
  const data = {
    kinopoisk: '',
    imdb: '',
    tmdb: '',
    title: ''
  };

  // Kinopoisk ID extraction
  if (url.match(KINOPOISK_MATCHER)) {
    const match = url.match(KINOPOISK_MATCHER);
    data.kinopoisk = match[2];
    data.title = `Kinopoisk ID: ${data.kinopoisk}`;
    return data;
  }

  // IMDB ID extraction
  if (url.match(IMDB_MATCHER)) {
    const match = url.match(IMDB_MATCHER);
    data.imdb = match[1];
    data.title = `IMDB ID: ${data.imdb}`;
    return data;
  }

  // TMDB ID extraction
  if (url.match(TMDB_MATCHER)) {
    const match = url.match(TMDB_MATCHER);
    data.tmdb = match[2];
    data.title = `TMDB ID: ${data.tmdb}`;
    return data;
  }

  // If the user just typed an ID
  if (/^\d+$/.test(url)) {
    data.kinopoisk = url;
    data.title = `Kinopoisk ID: ${url}`;
    return data;
  }

  if (/^tt\d+$/.test(url)) {
    data.imdb = url;
    data.title = `IMDB ID: ${url}`;
    return data;
  }

  // Fallback: use as string title (though tapeop mostly needs ids)
  data.title = url;
  return data;
}

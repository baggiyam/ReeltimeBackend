const axios = require('axios');
require('dotenv').config();

const tmdbBaseURL = 'https://api.themoviedb.org/3';

const languageMap = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  ru: 'Russian',
  pt: 'Portuguese',
  ko: 'Korean',
  ml: 'Malayalam',
  hi: 'Hindi',
  ja: 'Japanese',
  th: 'Thai',
  zh: 'Chinese',  // Simplified Chinese
  zh_tw: 'Chinese (Traditional)',
  ar: 'Arabic',
  tr: 'Turkish',
  vi: 'Vietnamese',
  ta: 'Tamil',
  te: 'Telugu',
  bn: 'Bengali',
  mr: 'Marathi',
  pa: 'Punjabi',
  pl: 'Polish',
  ro: 'Romanian',
  sv: 'Swedish',
  da: 'Danish',
  no: 'Norwegian',
  fi: 'Finnish',
  nl: 'Dutch',
  cs: 'Czech',
  el: 'Greek',
  sr: 'Serbian',
  hr: 'Croatian',
  bg: 'Bulgarian',
  hu: 'Hungarian',
  he: 'Hebrew',
  id: 'Indonesian',
  sw: 'Swahili',
  ur: 'Urdu',
  ms: 'Malay',
};


const fetchMovieDetails = async (title) => {
  try {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) {
      console.error('TMDB API Key missing!');
      return null;
    }

    // 1. Search Movie by Title
    const searchRes = await axios.get(`${tmdbBaseURL}/search/movie`, {
      params: { api_key: apiKey, query: title },
    });

    const results = searchRes.data.results;
    if (!results || results.length === 0) {
      console.log(`No movie found for title: ${title}`);
      return null;
    }

    // 2. Filter Exact Match
    let movie = results.find(
      (m) => m.title.toLowerCase() === title.toLowerCase()
    );

    if (!movie) {
      console.log(`Exact match not found for "${title}". Please enter manually.`);
      return null;
    } else {
      console.log(`Exact match found: ${movie.title}`);
    }

    // 3. Get Genre Names
    const genresRes = await axios.get(`${tmdbBaseURL}/genre/movie/list`, {
      params: { api_key: apiKey },
    });

    const genreMap = {};
    genresRes.data.genres.forEach((g) => (genreMap[g.id] = g.name));
    const genres = movie.genre_ids.map((id) => genreMap[id] || 'Unknown');

    // 4. Prepare Poster URL
    const posterUrl = movie.poster_path
      ? `https://image.tmdb.org/t/p/w780${movie.poster_path}`
      : '';

    // 5. Prepare Backdrop URL (fallback to poster if no backdrop)
    let backdropUrl = movie.backdrop_path
      ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
      : '';
    if (!backdropUrl && posterUrl) {
      backdropUrl = posterUrl;
      console.log(`No backdrop available, using poster as backdrop: ${posterUrl}`);
    }

    // 6. Get Videos (Trailer)
    const videosRes = await axios.get(`${tmdbBaseURL}/movie/${movie.id}/videos`, {
      params: { api_key: apiKey },
    });

    const videos = videosRes.data.results;

    let trailerUrl = '';
    const preferredSites = ['YouTube', 'Vimeo'];
    const preferredTypes = ['Trailer', 'Teaser', 'Clip'];

    for (const type of preferredTypes) {
      for (const site of preferredSites) {
        const video = videos.find((vid) => vid.type === type && vid.site === site);
        if (video) {
          trailerUrl = site === 'YouTube'
            ? `https://www.youtube.com/watch?v=${video.key}`
            : `https://vimeo.com/${video.key}`;
          break;
        }
      }
      if (trailerUrl) break;
    }

    // 7. Apply Trailer Fallback Logic: trailer → backdrop → poster → empty
    let finalTrailerUrl = '';
    if (trailerUrl) {
      finalTrailerUrl = trailerUrl;
      console.log(`Trailer found: ${trailerUrl}`);
    } else if (backdropUrl) {
      finalTrailerUrl = backdropUrl;
      console.log(`No trailer video. Using backdrop as trailer: ${backdropUrl}`);
    } else if (posterUrl) {
      finalTrailerUrl = posterUrl;
      console.log(`No trailer & backdrop. Using poster as trailer: ${posterUrl}`);
    } else {
      finalTrailerUrl = '';
      console.log(`No trailer, backdrop, or poster available.`);
    }

    // 8. Return structured data
    const languageName = languageMap[movie.original_language] || movie.original_language;
    return {
      title: movie.title,
      description: movie.overview || 'No description available.',
      releaseDate: movie.release_date || 'N/A',
      language: [languageName],
      genre: genres,
      imdbRating: movie.vote_average ? parseFloat(movie.vote_average.toFixed(1)) : 0,
      popularity: movie.popularity ? parseFloat(movie.popularity.toFixed(1)) : 0,
      poster: posterUrl,
      backdrop: backdropUrl,
      trailer: finalTrailerUrl,
    };
  } catch (err) {
    console.error('Error fetching movie details:', err.response?.data || err.message);
    return null;
  }
};

module.exports = { fetchMovieDetails };

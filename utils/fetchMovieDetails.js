const axios = require('axios');
require('dotenv').config(); 

const tmdbBaseURL = 'https://api.themoviedb.org/3';

const DEBUG = false;

const fetchMovieDetails = async (title) => {
  try {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) {
      console.error('TMDB API Key missing!');
      return null;
    }

    // Step 1: Search Movie by Title
    const searchRes = await axios.get(`${tmdbBaseURL}/search/movie`, {
      params: { api_key: apiKey, query: title },
    });

    if (DEBUG) console.log(`Search result for "${title}":`, searchRes.data.results);

    if (!searchRes.data.results || searchRes.data.results.length === 0) {
      console.log(`No movie found for title: ${title}`);
      return null;
    }

    const movie = searchRes.data.results[0];

    // Step 2: Get Genre Names
    const genresRes = await axios.get(`${tmdbBaseURL}/genre/movie/list`, {
      params: { api_key: apiKey },
    });

    const genreMap = {};
    genresRes.data.genres.forEach((g) => (genreMap[g.id] = g.name));
    const genres = movie.genre_ids.map((id) => genreMap[id] || 'Unknown');

    // Step 3: Get Trailer
    const videosRes = await axios.get(`${tmdbBaseURL}/movie/${movie.id}/videos`, {
      params: { api_key: apiKey },
    });

    const trailerObj = videosRes.data.results.find(
      (vid) => vid.type === 'Trailer' && vid.site === 'YouTube'
    );

    const trailerUrl = trailerObj
      ? `https://www.youtube.com/watch?v=${trailerObj.key}`
      : '';

    // Final structured data
    return {
      title: movie.title,
      description: movie.overview || 'No description available.',
      releaseDate: movie.release_date || 'N/A',
      language: [movie.original_language],
      genre: genres,
      imdbRating: movie.vote_average || 0,
      popularity: movie.popularity || 0,
      poster: movie.poster_path
        ? `https://image.tmdb.org/t/p/w780${movie.poster_path}`
        : '',
      backdrop: movie.backdrop_path
        ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
        : '',
      trailer: trailerUrl,
    };
  } catch (err) {
    console.error('Error fetching movie details:', err.response?.data || err.message);
    return null;
  }
};

module.exports = { fetchMovieDetails };

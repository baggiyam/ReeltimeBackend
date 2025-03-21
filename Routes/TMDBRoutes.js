const express = require('express');
const router = express.Router();
const { fetchMovieDetails } = require('../utils/fetchMovieDetails');

router.get('/movie/:title', async (req, res) => {
  const { title } = req.params;
  try {
    const movieDetails = await fetchMovieDetails(title);

    if (!movieDetails) {
      return res.status(404).json({ message: `No details found for "${title}"` });
    }


    res.status(200).json({
      title: movieDetails.title,
      description: movieDetails.description,
      releaseDate: movieDetails.releaseDate,
      language: movieDetails.language,
      genre: movieDetails.genre,
      imdbRating: movieDetails.imdbRating,
      voteCount: movieDetails.voteCount,
      poster: movieDetails.poster,
      backdrop: movieDetails.backdrop,
      trailer: movieDetails.trailer,
    });
  } catch (error) {
    console.error('Error in /movie/:title route:', error.response?.data || error.message);
    res.status(500).json({ message: 'Error fetching movie details. Please try again.' });
  }
});

module.exports = router;

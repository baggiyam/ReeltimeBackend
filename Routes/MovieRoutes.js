const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Movie = require("../Models/Movies");
const Watchlist = require("../Models/Watchlist");
const Favorites = require("../Models/Favorites");
const WatchedMovies = require("../Models/Watched");
const { protect, admin } = require("../middleware/authMiddleware");
const handleError = require("../utils/errorHandler");
const { fetchMovieDetails } = require('../utils/fetchMovieDetails');


router.post("/fetchDetails", protect, async (req, res) => {
  try {
    const { title } = req.body;
    const tmdbData = await fetchMovieDetails(title);

    if (!tmdbData) {
      return res.status(404).json({ message: 'No matching movie found. Please check the title and spacing.' });
    }

    res.status(200).json({ movie: tmdbData });
  } catch (error) {
    console.error('Error fetching movie details:', error.message);
    res.status(500).json({ message: 'Failed to fetch movie details.' });
  }
});

// ➤ Add a new movie
router.post("/add", protect, async (req, res) => {
  try {
    const { title, description, releaseDate, language, genre, imdbRating, poster, trailer, backdrop } = req.body;
    const userAdded = req.user._id; 
    const newMovie = new Movie({
      title,
      description,
      releaseDate,
      language,
      genre,
      imdbRating,
      backdrop,
      poster,
      trailer,
      userAdded,
    });

    await newMovie.save();
    res.status(201).json({ message: "Movie added successfully!", movie: newMovie });
  } catch (error) {
    handleError(res, error, "Error adding new movie");
  }
});


router.get("/", async (req, res) => {
  try {
    const movies = await Movie.find();
    res.status(200).json(movies);
  } catch (error) {
    handleError(res, error, "Error fetching all movies");
  }
});

router.get("/", async (req, res) => {
  try {
    const movies = await Movie.find();
    res.status(200).json(movies);
  } catch (error) {
    handleError(res, error, "Error fetching all movies");
  }
});

router.get("/watchlist", protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const watchlist = await Watchlist.find({ user: userId }).populate("movie");

    res.status(200).json({
      success: true,
      data: watchlist.map(entry => entry.movie) || [],
    });
  } catch (error) {
    handleError(res, error, "Error fetching watchlist");
  }
});


router.get("/favorites", protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const favorites = await Favorites.find({ user: userId }).populate("movie");

    res.status(200).json(favorites.map(entry => entry.movie));
  } catch (error) {
    handleError(res, error, "Error fetching favorites");
  }
});


router.get("/watched", protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const watchedMovies = await WatchedMovies.find({ user: userId }).populate("movie");

    res.status(200).json(watchedMovies.map(entry => entry.movie));
  } catch (error) {
    handleError(res, error, "Error fetching watched movies");
  }
});


router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;


    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid movie ID" });
    }

    const movie = await Movie.findById(id);
    if (!movie) return res.status(404).json({ message: "Movie not found" });

    res.status(200).json(movie);
  } catch (error) {
    handleError(res, error, "Error fetching movie details");
  }
});


router.post("/add-to-watchlist/:movieId", protect, async (req, res) => {
  try {
    const { movieId } = req.params;
    const userId = req.user._id;

    if (!(await Movie.findById(movieId))) return res.status(404).json({ message: "Movie not found" });

    if (await Watchlist.findOne({ user: userId, movie: movieId }))
      return res.status(400).json({ message: "Movie already in watchlist" });

    await Watchlist.create({ user: userId, movie: movieId });

    res.status(200).json({ message: "Movie added to watchlist" });
  } catch (error) {
    handleError(res, error, "Error adding movie to watchlist");
  }
});


router.post("/add-to-favorites/:movieId", protect, async (req, res) => {
  try {
    const { movieId } = req.params;
    const userId = req.user._id;

    if (!(await Movie.findById(movieId))) return res.status(404).json({ message: "Movie not found" });

    if (await Favorites.findOne({ user: userId, movie: movieId }))
      return res.status(400).json({ message: "Movie already in favorites" });

    await Favorites.create({ user: userId, movie: movieId });

    res.status(200).json({ message: "Movie added to favorites" });
  } catch (error) {
    handleError(res, error, "Error adding movie to favorites");
  }
});


router.post("/add-to-watched/:movieId", protect, async (req, res) => {
  try {
    const { movieId } = req.params;
    const userId = req.user._id;

    if (!(await Movie.findById(movieId))) return res.status(404).json({ message: "Movie not found" });

    if (await WatchedMovies.findOne({ user: userId, movie: movieId }))
      return res.status(400).json({ message: "Movie already marked as watched" });

    await WatchedMovies.create({ user: userId, movie: movieId });

    res.status(200).json({ message: "Movie marked as watched" });
  } catch (error) {
    handleError(res, error, "Error adding movie to watched list");
  }
});


router.delete("/watchlist/:movieId", protect, async (req, res) => {
  try {
    const { movieId } = req.params;
    const userId = req.user._id;

    const watchlistEntry = await Watchlist.findOneAndDelete({ user: userId, movie: movieId });

    if (!watchlistEntry) {
      return res.status(404).json({ message: "Movie not found in watchlist" });
    }

    res.status(200).json({ message: "Movie removed from watchlist" });
  } catch (error) {
    handleError(res, error, "Error removing movie from watchlist");
  }
});

router.delete("/favorites/:movieId", protect, async (req, res) => {
  try {
    const { movieId } = req.params;
    const userId = req.user._id;

    // Fix: Use Favorite model, not Watchlist
    const favorite = await Favorite.findOneAndDelete({ user: userId, movie: movieId });

    if (!favorite) {
      return res.status(404).json({ message: "Movie not found in favorites" });
    }

    res.status(200).json({ message: "Movie removed from favorites" });
  } catch (error) {
    handleError(res, error, "Error removing movie from favorites");
  }
});
router.put("/:id", protect, admin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid movie ID" });
    }

    const updatedMovie = await Movie.findByIdAndUpdate(id, req.body, { new: true });

    if (!updatedMovie) return res.status(404).json({ message: "Movie not found" });

    res.status(200).json(updatedMovie);
  } catch (error) {
    handleError(res, error, "Error updating movie");
  }
});

router.delete("/:id", protect, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid movie ID" });
    }

    const deletedMovie = await Movie.findByIdAndDelete(id);

    if (!deletedMovie) return res.status(404).json({ message: "Movie not found" });

    res.status(200).json({ message: "Movie deleted successfully" });
  } catch (error) {
    handleError(res, error, "Error deleting movie");
  }
});


module.exports = router;

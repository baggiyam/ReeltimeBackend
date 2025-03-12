const express = require("express");
const router = express.Router();
const Movie = require("../Models/Movies");
const Watchlist = require("../Models/Watchlist");
const Favorites = require("../Models/Favorites");
const WatchedMovies = require("../Models/Watched");
const { protect } = require("../middleware/authMiddleware");
const handleError = require("../utils/errorHandler");

// ➤ Add a new movie
router.post("/", protect, async (req, res) => {
  try {
    const { title, description, releaseDate, language, genre, imdbRating, googleRating, poster, trailer, suggestedToAll } = req.body;
    const userAdded = req.user._id; // Get the user ID from auth middleware

    const newMovie = new Movie({
      title,
      description,
      releaseDate,
      language,
      genre,
      imdbRating,
      googleRating,
      suggestedToAll,
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

// ➤ Get all movies
router.get("/", async (req, res) => {
  try {
    const movies = await Movie.find();
    res.status(200).json(movies);
  } catch (error) {
    handleError(res, error, "Error fetching all movies");
  }
});

// ➤ Get a single movie by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const movie = await Movie.findById(id);

    if (!movie) return res.status(404).json({ message: "Movie not found" });

    res.status(200).json(movie);
  } catch (error) {
    handleError(res, error, "Error fetching movie details");
  }
});

// ➤ Update a movie
router.put("/:id", protect, async (req, res) => {
  try {
    const { id } = req.params;
    const updatedMovie = await Movie.findByIdAndUpdate(id, req.body, { new: true });

    if (!updatedMovie) return res.status(404).json({ message: "Movie not found" });

    res.status(200).json(updatedMovie);
  } catch (error) {
    handleError(res, error, "Error updating movie");
  }
});

// ➤ Delete a movie
router.delete("/:id", protect, async (req, res) => {
  try {
    const { id } = req.params;
    const deletedMovie = await Movie.findByIdAndDelete(id);

    if (!deletedMovie) return res.status(404).json({ message: "Movie not found" });

    res.status(200).json({ message: "Movie deleted successfully" });
  } catch (error) {
    handleError(res, error, "Error deleting movie");
  }
});

// ➤ Add to Watchlist
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

// ➤ Add to Favorites
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

// ➤ Add to Watched Movies
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

// ➤ Get user's Watchlist
router.get("/watchlist", protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const watchlist = await Watchlist.find({ user: userId }).populate("movie");

    res.status(200).json(watchlist.map(entry => entry.movie));
  } catch (error) {
    handleError(res, error, "Error fetching watchlist");
  }
});

// ➤ Get user's Favorites
router.get("/favorites", protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const favorites = await Favorites.find({ user: userId }).populate("movie");

    res.status(200).json(favorites.map(entry => entry.movie));
  } catch (error) {
    handleError(res, error, "Error fetching favorites");
  }
});

// ➤ Get user's Watched Movies
router.get("/watched", protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const watchedMovies = await WatchedMovies.find({ user: userId }).populate("movie");

    res.status(200).json(watchedMovies.map(entry => entry.movie));
  } catch (error) {
    handleError(res, error, "Error fetching watched movies");
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
module.exports = router;

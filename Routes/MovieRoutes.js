const express = require("express");
const router = express.Router();
const Movie = require("../Models/Movies");
const User = require("../Models/User"); // Import the User model
const { protect } = require("../middleware/authMiddleware");
const handleError = require("../utils/errorHandler");

router.post("/", protect, async (req, res) => {
  try {
    const { title, description, releaseDate, language, genre, imdbRating, poster, trailer, googleRating, suggestedToAll } = req.body;

    // Get the logged-in user from req.user (set by protect middleware)
    const userAdded = req.user._id;

    // Create a new movie document
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
      userAdded, // Assign the user who added the movie
    });

    // Save the movie to the database
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
router.get("/:id", async (req, res) => {
  try {
   
    const { id } = req.params;


    const movie = await Movie.findById(id);


    if (!movie) {
      return res.status(404).json({ message: "Movie not found" });
    }

    // If movie is found, return the movie details
    res.status(200).json(movie);
  } catch (error) {
    handleError(res, error, "Error fetching movie details");
  }
});



router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params; 
    const { title, description, releaseDate, language, genre, imdbRating, poster, trailer } = req.body; // Extract data from the request body

    // Find the movie by its ID and update it with the new data
    const updatedMovie = await Movie.findByIdAndUpdate(
      id, // The ID of the movie to update
      {
        title,
        description,
        releaseDate,
        language,
        genre,
        imdbRating,
        poster,
        trailer
      }, // The new values to update
      { new: true } // Return the updated movie instead of the original
    );

    // If the movie wasn't found, return a 404 error
    if (!updatedMovie) {
      return res.status(404).json({ message: "Movie not found" });
    }

    // If the update is successful, send the updated movie as the response
    res.status(200).json(updatedMovie);
  } catch (error) {
    console.error(error); // Log the error for debugging
    res.status(500).json({ message: "Server error" }); // Return a 500 error for unexpected issues
  }
});

// Add movie to the watchlist
router.post("/add-to-watchlist/:movieId", protect, async (req, res) => {
  try {
    const { movieId } = req.params;
    const user = req.user;

    // Check if the movie exists
    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({ message: "Movie not found" });
    }

    // Check if movie is already in watchlist
    if (user.watchlist.includes(movieId)) {
      return res.status(400).json({ message: "Movie already in watchlist" });
    }

    // Add the movie to the user's watchlist
    user.watchlist.push(movieId);
    await user.save();

    res.status(200).json({ message: "Movie added to watchlist" });
  } catch (error) {
    handleError(res, error, "Error adding movie to watchlist");
  }
});

// Add movie to the favorites
router.post("/add-to-favorites/:movieId", protect, async (req, res) => {
  try {
    const { movieId } = req.params;
    const user = req.user;

    // Check if the movie exists
    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({ message: "Movie not found" });
    }

    // Check if movie is already in favorites
    if (user.favorites.includes(movieId)) {
      return res.status(400).json({ message: "Movie already in favorites" });
    }

    // Add the movie to the user's favorites
    user.favorites.push(movieId);
    await user.save();

    res.status(200).json({ message: "Movie added to favorites" });
  } catch (error) {
    handleError(res, error, "Error adding movie to favorites");
  }
});

// Add movie to watched
router.post("/add-to-watched/:movieId", protect, async (req, res) => {
  try {
    const { movieId } = req.params;
    const user = req.user;

    // Check if the movie exists
    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({ message: "Movie not found" });
    }

    // Check if movie is already in watched
    if (user.watchedMovies.includes(movieId)) {
      return res.status(400).json({ message: "Movie already marked as watched" });
    }

    // Add the movie to the user's watched list
    user.watchedMovies.push(movieId);
    await user.save();

    res.status(200).json({ message: "Movie marked as watched" });
  } catch (error) {
    handleError(res, error, "Error adding movie to watched list");
  }
});

// Get all movies in the watchlist of the logged-in user
router.get("/watchlist", protect, async (req, res) => {
  try {
    const user = req.user;
    const populatedUser = await User.findById(user._id).populate("watchlist");
    res.status(200).json(populatedUser.watchlist);
  } catch (error) {
    handleError(res, error, "Error fetching watchlist");
  }
});

// Get all movies in the favorites list of the logged-in user
router.get("/favorites", protect, async (req, res) => {
  try {
    const user = req.user;
    await user.populate("favorites");
    res.status(200).json(user.favorites);
  } catch (error) {
    handleError(res, error, "Error fetching favorites");
  }
});

// Get all movies in the watched list of the logged-in user
router.get("/watched", protect, async (req, res) => {
  try {
    const user = req.user;
    await user.populate("watched");
    res.status(200).json(user.watched);
  } catch (error) {
    handleError(res, error, "Error fetching watched movies");
  }
});

module.exports = router;

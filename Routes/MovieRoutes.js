const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Movie = require("../Models/Movies");
const Watchlist = require("../Models/Watchlist");
const Favorites = require("../Models/Favorites");
const WatchedMovies = require("../Models/Watched");
const User = require("../Models/User"); 
const MovieSuggestion=  require("../Models/Moviesuggestion");
const { protect, admin } = require("../middleware/authMiddleware");
const handleError = require("../utils/errorHandler");
const { fetchMovieDetails } = require('../utils/fetchMovieDetails');

router.get('/suggested', protect, async (req, res) => {
  try {
    const userId = req.user._id; 

    // Fetch the user and populate movieId and senderId in suggestedMovies
    const user = await User.findById(userId)
      .populate({
        path: 'suggestedMovies.movieId', 
        select: 'title poster description language genre' // Populate movieId with necessary fields
      })
      .populate({
        path: 'suggestedMovies.senderId',  // Populate the senderId field
        select: 'username' // Select only the username field from the sender
      })
      .lean();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the user has any movie suggestions
    if (!user.suggestedMovies || user.suggestedMovies.length === 0) {
      return res.status(200).json({ message: 'No movie suggestions available' });
    }

    // Filter out any entries with missing movieId or senderId
    const suggestedMovies = user.suggestedMovies
      .filter(entry => entry.movieId && entry.senderId)  // Ensure movieId and senderId exist
      .map(entry => ({
        movie: entry.movieId,   // Populated movie data
        sender: entry.senderId  // Populated sender data
      }));  // Return an array of movie and sender info

    // Return the populated movie data along with sender information
    return res.status(200).json(suggestedMovies);
  } catch (error) {
    console.error('Error fetching suggested movies:', error);
    res.status(500).json({ message: 'Error fetching movie suggestions' });
  }
});

// Fetch movie details by title from request body
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

// Fetch movie details by title from URL parameter
router.get("/fetchDetails/:title", protect, async (req, res) => {
  try {
    const { title } = req.params; // Get movie title from URL parameter

    if (!title) {
      return res.status(400).json({ message: 'Movie title is required in the URL.' });
    }

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

// Add a new movie to the database
router.post("/add", protect, async (req, res) => {
  try {
    const { title, description, releaseDate, language, genre, imdbRating, poster, trailer, backdrop } = req.body;
    const userAdded = req.user._id;

    const existingMovie = await Movie.findOne({
      title: { $regex: new RegExp(`^${title}$`, 'i') }, 
      language: { $in: language }, 
    });

    if (existingMovie) {
      return res.status(400).json({ message: "Movie with this title and language already exists!" });
    }

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

// Fetch all movies
router.get("/", async (req, res) => {
  try {
    const movies = await Movie.find();
    res.status(200).json(movies);
  } catch (error) {
    handleError(res, error, "Error fetching all movies");
  }
});

// Fetch watchlist for the authenticated user
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

// Fetch favorites for the authenticated user
router.get("/favorites", protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const favorites = await Favorites.find({ user: userId }).populate("movie");

    res.status(200).json(favorites.map(entry => entry.movie));
  } catch (error) {
    handleError(res, error, "Error fetching favorites");
  }
});

// Fetch watched movies for the authenticated user
router.get("/watched", protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const watchedMovies = await WatchedMovies.find({ user: userId }).populate("movie");

    res.status(200).json(watchedMovies.map(entry => entry.movie));
  } catch (error) {
    handleError(res, error, "Error fetching watched movies");
  }
});

// Fetch movie details by ID
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
router.put("/:movieId", protect, admin, async (req, res) => {
  try {
    const { movieId } = req.params;
    const { title, description, releaseDate, language, genre, imdbRating, poster, trailer, backdrop } = req.body;

    // Check if movie exists
    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({ message: "Movie not found" });
    }

    // Check for existing movie with the same title and language
    const existingMovie = await Movie.findOne({
      title: { $regex: new RegExp(`^${title}$`, 'i') }, 
      language: { $in: language }, 
      _id: { $ne: movieId } // Exclude the current movie from this check
    });

    if (existingMovie) {
      return res.status(400).json({ message: "Movie with this title and language already exists!" });
    }

    // Update movie details
    movie.title = title || movie.title;
    movie.description = description || movie.description;
    movie.releaseDate = releaseDate || movie.releaseDate;
    movie.language = language || movie.language;
    movie.genre = genre || movie.genre;
    movie.imdbRating = imdbRating || movie.imdbRating;
    movie.poster = poster || movie.poster;
    movie.trailer = trailer || movie.trailer;
    movie.backdrop = backdrop || movie.backdrop;

    await movie.save();
    res.status(200).json({ message: "Movie updated successfully!", movie });
  } catch (error) {
    console.error('Error updating movie:', error);
    res.status(500).json({ message: 'Error updating movie' });
  }
});
// Add movie to the watchlist
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

// Add movie to favorites
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

// Add movie to watched list
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

// Delete movie from watchlist
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

    const favoriteEntry = await favorites.findOneAndDelete({ user: userId, movie: movieId });

    if (!favoriteEntry) {
      return res.status(404).json({ message: "Movie not found in watchlist" });
    }

    res.status(200).json({ message: "Movie removed from watchlist" });
  } catch (error) {
    handleError(res, error, "Error removing movie from watchlist");
  }
});
// Delete movie from favorites

router.delete("/:movieId", async (req, res) => {
  try {
    const { movieId } = req.params;

    if (!movieId) {
      return res.status(400).json({ message: "Invalid movie ID" });
    }

    const deletedMovie = await Movie.findByIdAndDelete(movieId);

    if (!deletedMovie) {
      return res.status(404).json({ message: "Movie not found" });
    }

    res.status(200).json({ message: "Movie deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting movie" });
  }
});


// Suggest a movie to a friend

router.post("/suggest/:movieId", protect, async (req, res) => {
  try {
    const { movieId } = req.params;  // Movie ID from the URL
    const { friends } = req.body;    // List of friends' IDs from the request body
    
   
    if (!friends || friends.length === 0) {
      return res.status(400).json({ message: "Please select at least one friend to suggest the movie." });
    }


    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

  
    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({ message: "Movie not found." });
    }

    for (let friendId of friends) {
      if (!user.friends.includes(friendId)) {
        return res.status(400).json({ message: `You are not friends with user ${friendId}.` });
      }

      const friend = await User.findById(friendId);
      if (!friend) {
        return res.status(404).json({ message: `Friend with ID ${friendId} not found.` });
      }

     
      friend.notifications.push({
        type: "movie_suggestion",
        movieId: movie._id,
        sender: req.user._id,  
        message: `You have a new movie suggestion: ${movie.title}`,
      });
      friend.suggestedMovies.push({
        movieId: movie._id,
        senderId: req.user._id,  
        suggestedAt: new Date(),
      });

      await friend.save(); 
    }

    return res.status(200).json({ message: "Movie suggestion sent successfully!" });
  } catch (err) {
    console.error("Error sending movie suggestion:", err);
return res.status(500).json({ message: "Server error. Please try again.", error: err.message });
  }
});



module.exports = router;





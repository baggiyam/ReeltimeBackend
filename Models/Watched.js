const mongoose = require("mongoose");

const watchedMovieSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  movie: { type: mongoose.Schema.Types.ObjectId, ref: "Movie", required: true },
  watchedAt: { type: Date, default: Date.now }, // When the movie was watched
  rating: { type: Number, min: 0, max: 10 }, // User rating for the movie
  review: { type: String, default: "" }, // Optional review
});

const WatchedMovie = mongoose.model("WatchedMovie", watchedMovieSchema);
module.exports = WatchedMovie;
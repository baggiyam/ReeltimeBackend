const mongoose = require("mongoose");

const suggestedMovieSchema = new mongoose.Schema(
  {
    movieId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Movie",  // Reference to Movie model
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",  // Reference to User model
      required: true,
    },
    friendId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",  // Reference to User model (the recipient)
      required: true,
    },
  },
  { timestamps: true }
);

const SuggestedMovie = mongoose.model("SuggestedMovie", suggestedMovieSchema);
module.exports = SuggestedMovie;

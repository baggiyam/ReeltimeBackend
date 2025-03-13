// backend/Models/Movie.js

const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    releaseDate: {
      type: Date,
      required: true,
    },
    language: {
      type: [String],
      required: true,
    },
    genre: {
      type: [String],
      required: true,
    },
    imdbRating: {
      type: Number,
      required: true,
      min: 0,
  max: 10,
    },
    googleRating: {
      type: Number,
      required: true,
      min: 0,
  max: 10,
    },
    userAdded: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    poster: {
      type: String, 
      required: true,
    },
    trailer: {
      type: String, 
      required: true,
    },
    suggestedToAll: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Movie = mongoose.model("Movie", movieSchema);
module.exports = Movie;

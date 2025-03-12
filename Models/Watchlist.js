const mongoose = require("mongoose");

const watchlistSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  movie: { type: mongoose.Schema.Types.ObjectId, ref: "Movie", required: true },
  
});

const Watchlist = mongoose.model("Watchlist", watchlistSchema);
module.exports = Watchlist;
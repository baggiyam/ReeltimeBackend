const mongoose = require("mongoose");

const favoriteSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  movie: { type: mongoose.Schema.Types.ObjectId, ref: "Movie", required: true },
 
  note: { type: String, default: "" }, 
});

const Favorite = mongoose.model("Favorite", favoriteSchema);
module.exports = Favorite;

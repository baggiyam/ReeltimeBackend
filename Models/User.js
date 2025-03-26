const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    password: {
      type: String,
      required: true,
    },
    verificationToken: { type: Number },
    verificationTokenExpiration: {
      type: Date,
      required: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    profileImage: {
      type: String,
      default: "",
    },
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    // Suggested Movies Array
    suggestedMovies: [
      {
        movieId: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie' },
        senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
      }
    ],
    
    notifications: [
      {
        type: { type: String, required: true }, // Example: 'movie_suggestion'
        movieId: { type: mongoose.Schema.Types.ObjectId, ref: "Movie" },
        sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        message: String,
      },
    ],
    
    
  },
  
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

module.exports = User;

const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const morgan = require("morgan");
const mongoose = require("mongoose");
const authRoutes = require('./Routes/authroutes'); 
const User = require('./Models/User'); 
const Movies=require('./Models/Movies')
const movieRoutes = require('./Routes/MovieRoutes');
const indexRoutes = require('./Routes/index');
const TMDBRoutes=require("./Routes/TMDBRoutes")

dotenv.config(); // Load environment variables

const app = express();

// Middleware
app.use(express.json());
app.use(morgan("dev"));
app.use(cors({
  origin: process.env.CLIENT_URL, 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],  
  credentials: true,  
}));
// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log(" Connected to MongoDB"))
  .catch((err) => console.error(" MongoDB connection error:", err));


  
// Use the auth routes for handling signup and login
app.use("/api", indexRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/movies", movieRoutes);
app.use("/api/tmdb",TMDBRoutes)


// Basic Route
app.get("/", (req, res) => {
  res.send("Welcome to the backend of the Movie App!");
});

// Start Server
const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
process.on('SIGINT', () => {
  console.log('Shutting down the server...');
  mongoose.connection.close().then(() => {
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
     match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
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
isVerified:{
  type:Boolean,
  default:false,
},
role: {
  type: String,
  enum: ["user", "admin"],
  default: "user",
}
}

);

const User = mongoose.model('User', userSchema);

module.exports = User;

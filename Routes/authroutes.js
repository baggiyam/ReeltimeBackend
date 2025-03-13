const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const router = express.Router();
const User = require("../Models/User.js");
const nodemailer = require("nodemailer");
require("dotenv").config(); // Load environment variables

// Configure Nodemailer with SMTP
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,  // TLS
  auth: {
    user: process.env.ADMIN_EMAIL,  // Gmail email
    pass: process.env.ADMIN_EMAIL_PASSWORD,  // Gmail app password
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error("Email server error:", error);
  } else {
    console.log("Email server is ready to send messages");
  }
});

// Signup Route with Email Verification
router.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists!" });
    }

    // Hash the password before saving to the database
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate a verification token (4 digits) and set an expiration
    const verificationToken = Math.floor(1000 + Math.random() * 9000);
    const verificationTokenExpiration = Date.now() + 24 * 60 * 60 * 1000; // 24 hours expiry

    // Create the new user object
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      verificationToken,
      verificationTokenExpiration,
      isVerified: false, // Default to false until verified
    });

    // Save the user to the database
    await newUser.save();

    // Mail options for the verification email
    const mailOptions = {
      from: `"ReelTime Team" <${process.env.ADMIN_EMAIL}>`,
      to: email,
      subject: "Email Verification",
      text: `Hello ${username},\n\nPlease enter this verification code on the website: \n\n${verificationToken}\n\nBest Regards,\nReelTime Team`,
      replyTo: process.env.ADMIN_EMAIL,
    };

    // Send the verification email
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log("Verification email sent:", info.response);
      res.status(200).json({
        message: "Signup successful! please check your email for verification code.",
      });
    } catch (emailError) {
      console.error("❌ Error sending email:", emailError);
      return res.status(500).json({ message: "Failed to send verification email." });
    }

  } catch (error) {
    res.status(500).json({ message: "Server error during signup", error: error.message });
  }
});

router.post("/verification", async (req, res) => {
  const { email, verificationCode } = req.body;
  console.log(req.body);
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found!" });
    }

    // Convert the provided verification code to a number for comparison
    if (user.verificationToken !== Number(verificationCode)) {
      return res.status(400).json({ message: "Invalid verification code!" });
    }

    if (user.verificationTokenExpiration < Date.now()) {
      return res.status(400).json({ message: "Verification code has expired!" });
    }

    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpiration = null; 
    await user.save();

    const token = jwt.sign(
      { email: user.email, userId: user._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1h' } // Token expiration (optional)
    );

    return res.status(200).json({
      message: "Verification successful!",
      token: token 
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error!" });
  }
});

// Login Route
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "The email is not yet registered. Please sign up." });
    }

    if (!user.isVerified) {
      return res.status(400).json({ message: "Please verify your email before logging in." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid credentials!" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    res.status(200).json({
      message: "Login successful!",
      token,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error!", error: error.message });
  }
});

module.exports = router;

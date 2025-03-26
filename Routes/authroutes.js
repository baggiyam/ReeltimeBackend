const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const router = express.Router();
const User = require("../Models/User.js");
const nodemailer = require("nodemailer");
require("dotenv").config(); 
const multer = require('multer');
const path = require('path');
const { protect } = require('../middleware/authMiddleware');


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); 
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Route to upload
router.post('/upload-profile', protect, upload.single('profileImage'), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.profileImage = req.file.filename;
    await user.save();
    res.json({ success: true, profileImage: req.file.filename });
  } catch (error) {
    res.status(500).json({ error: "Profile upload failed" });
  }
});

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

    // Generate JWT including user role
    const token = jwt.sign(
      { userId: user._id, role: user.role,username: user.username},
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(200).json({
      message: "Login successful!",
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role, // Returning role for frontend use
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error!", error: error.message });
  }
});
router.post("/resend-code", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required!" });
  }

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({ message: "User not found!" });
  }

  if (user.isVerified) {
    return res.status(400).json({ message: "User is already verified!" });
  }

  try {
    // Generate a new verification code
    const newCode = Math.floor(100000 + Math.random() * 900000);
    user.verificationToken = newCode;
    user.verificationTokenExpiration = Date.now() + 24 * 60 * 60 * 1000; // 24 hours expiry
    await user.save();

    // Mail options for the verification email
    const mailOptions = {
      from: `"ReelTime Team" <${process.env.ADMIN_EMAIL}>`,
      to: email,
      subject: "Resend: Email Verification Code",
      text: `Hello,\n\nYour new verification code is: ${newCode}\n\nBest Regards,\nReelTime Team`,
    };

    // Send the verification email
    await transporter.sendMail(mailOptions);

    res.json({ message: "Verification code resent successfully!" });
  } catch (err) {
    console.error("Error resending code:", err);
    res.status(500).json({ message: "Failed to resend code. Try again later!" });
  }

});
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Email not found!" });

    // Generate reset token
    const resetToken = Math.floor(100000 + Math.random() * 900000); 
    const expires = Date.now() + 15 * 60 * 1000; 

    // Save to DB
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = expires;
    await user.save();

    // Send Email
    const mailOptions = {
      from: `"ReelTime Team" <${process.env.ADMIN_EMAIL}>`,
      to: email,
      subject: "Password Reset Request",
      text: `Hello ${user.username},\n\nYour password reset code is:\n\n${resetToken}\n\nThis code will expire in 15 minutes.`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Password reset code sent to your email." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error!" });
  }
});
// POST /reset-password
router.post("/reset-password", async (req, res) => {
  const { email, resetCode, newPassword } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || user.resetPasswordToken !=(resetCode)) {
      return res.status(400).json({ message: "Invalid code!" });
    }
    if (user.resetPasswordExpires < Date.now()) {
      return res.status(400).json({ message: "Reset code expired!" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Password reset successful! You can now log in." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error!" });
  }
});
router.get("/search/:identifier", protect, async (req, res) => {
  try {
    const { identifier } = req.params; 

   
    if (!identifier) {
      return res.status(400).json({ message: 'Username or email is required in the URL.' });
    }

    
    const user = await User.findOne({
      $or: [{ username: identifier }, { email: identifier }],
    });

 
    if (!user) {
      return res.status(404).json({ message: 'No matching user found. Please check the username or email.' });
    }

    
    const userDetails = {
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture,
      // Include other fields as necessary, excluding sensitive data
    };

    res.status(200).json({ user: userDetails });
  } catch (error) {
    console.error('Error fetching user details:', error.message);
    res.status(500).json({ message: 'Failed to fetch user details.' });
  }
});

module.exports = router;

const express = require("express");
const { protect } = require('../middleware/authMiddleware'); // Protect route middleware
const router = express.Router();
const FriendRequest = require("../Models/FriendRequest");
const User = require("../Models/User.js");

// Send Friend Request
router.post("/send", protect, async (req, res) => {
  console.log("🔹 Friend request route hit");
  const { receiver } = req.body;
  const senderId = req.user.id;

  try {
    // 🔹 Find the receiver user by username or email
    const receiverUser = await User.findOne({
      $or: [{ username: receiver }, { email: receiver }]
    });

    if (!receiverUser) {
     
      return res.status(404).json({ message: "Receiver not found." });
    }

    console.log("Receiver Found:", receiverUser.username);

    // 🔹 Prevent sending a request to self
    if (senderId === receiverUser._id.toString()) {
      
      return res.status(400).json({ message: "You cannot send a request to yourself." });
    }

    //  Check if a friend request already exists
    const existingRequest = await FriendRequest.findOne({
      sender: senderId,
      receiver: receiverUser._id
    });

    if (existingRequest) {
   
      return res.status(400).json({ message: "Friend request already sent." });
    }

    //  Create and save new friend request
    const newRequest = new FriendRequest({
      sender: senderId,
      receiver: receiverUser._id,
      status: "pending" 
    });

    await newRequest.save();

    console.log("Friend request sent successfully.");
    return res.status(201).json({ message: "Friend request sent successfully." });

  } catch (error) {
    console.error("Error sending friend request:", error);
    return res.status(500).json({ message: "Server error. Please try again." });
  }
});

// Accept Friend Request
router.post("/accept/:id", protect, async (req, res) => {
  try {
    const request = await FriendRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found." });

    if (request.receiver.toString() !== req.user.id)
      return res.status(403).json({ message: "Unauthorized action." });

    
    request.status = "accepted";
    await request.save();

   
    const sender = await User.findById(request.sender);
    const receiver = await User.findById(request.receiver);

    if (!sender || !receiver) {
      return res.status(404).json({ message: "User not found." });
    }

    sender.friends.push(receiver._id);
    receiver.friends.push(sender._id);
    await sender.save();
    await receiver.save();

    res.json({ message: "Friend request accepted successfully." });
  } catch (error) {
    console.error("Error accepting request:", error);
    res.status(500).json({ message: "Server error." });
  }
});

// Reject Friend Request
router.post("/reject/:id", protect, async (req, res) => {
  try {
    const request = await FriendRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found." });

    if (request.receiver.toString() !== req.user.id)
      return res.status(403).json({ message: "Unauthorized action." });

  
    await FriendRequest.findByIdAndDelete(req.params.id);

    res.json({ message: "Friend request rejected successfully." });
  } catch (error) {
    console.error("Error rejecting request:", error);
    res.status(500).json({ message: "Server error." });
  }
});

router.get("/pending", protect, async (req, res) => {
  try {
      console.log("Authenticated User ID:", req.user?._id); // Debugging step

      if (!req.user) {
          return res.status(400).json({ message: "User authentication failed" });
      }

      const userId = req.user._id;

      const pendingRequests = await FriendRequest.find({
          receiver: userId,
          status: "pending",
      }).populate("sender", "username email profilePicture");

      console.log("Pending Friend Requests:", pendingRequests); // Debugging step

      res.status(200).json(pendingRequests);
  } catch (error) {
      console.error("Error fetching pending requests:", error);
      res.status(500).json({ message: "Server error" });
  }
});



// Get List of Friends
router.get("/friendlist", protect, async (req, res) => {
  try {
    // Fetch the user by the ID of the authenticated user
    const user = await User.findById(req.user.id).populate("friends", "_id username email");

    
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }


    res.json(user.friends);
  } catch (error) {
    console.error("Error fetching friends:", error);
    res.status(500).json({ message: "Server error." });
  }
});


module.exports = router;

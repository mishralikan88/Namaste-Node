const express = require("express");
const requestRouter = express.Router();
const { userAuth } = require("../Middlewares/auth");
const { ConnectionRequestModel } = require("../Models/connectionRequest");
const User = require("../Models/user");

requestRouter.post(
  "/request/send/:status/:toUserId",
  userAuth,
  async (req, res) => {
    try {
      const user = req.user;
      const fromUserId = req.user._id;
      const toUserId = req.params.toUserId;
      const status = req.params.status;

      // ✅ Recipient existence & security check:
      // Why needed? 🔒
      // Hackers (or malicious clients) could bypass the frontend/UI and call the API directly,
      // attempting to send friend requests to random or even fake user IDs.
      // Example: they could try to send a request to themselves or to an ID that doesn’t exist in your DB.
      //
      // This validation ensures:
      // 1. The target user (`toUserId`) actually exists in the database.
      // 2. Prevents storing invalid connection requests to non-existent users.
      // 3. Blocks attackers from creating fake relationships that break system integrity.
      const toUser = await User.findById(toUserId);
      if (!toUser) {
        return res.status(400).json({
          message: "User not found",
          success: false,
        });
      }

      // ✅ Status validation:
      // User can only choose between "ignored" (left swipe) or "interested" (right swipe).
      // If the provided status is not in the allowed list, throw an error.
      const allowedStatuses = ["ignored", "intrested"];
      if (!allowedStatuses.includes(status)) {
        throw new Error("Invalid status type:" + status);
      }

      // ✅ Check for existing connection request:
      // Prevent duplicate requests between the same pair of users.
      // 1. If sender (fromUserId) has already sent a request to receiver (toUserId), block it.
      // 2. If receiver has already sent a request to sender, block it as well.
      // This ensures only one active connection request exists between two users at a time.
      const existingConnectionRequest = await ConnectionRequestModel.findOne({
        $or: [
          { fromUserId, toUserId },
          { fromUserId: toUserId, toUserId: fromUserId },
        ],
      });
      console.log(existingConnectionRequest);
      if (existingConnectionRequest) {
        throw new Error("Already sent the connection request before");
      }

      const connectionRequest = new ConnectionRequestModel({
        fromUserId,
        toUserId,
        status,
      });

      const data = await connectionRequest.save();
      res.status(200).json({
        message: user.firstName + " is " + status + " in " + toUser.firstName,
        data,
        success: true,
      });
    } catch (error) {
      res.status(400).json({
        message: error.message,
      });
    }
  }
);

requestRouter.post(
  "/request/review/:status/:requestId",
  userAuth,
  async (req, res) => {
    try {
      const loggedInUser = req.user;
      const { status, requestId } = req.params;

      //Validate Status
      const allowedStatuses = ["accepted", "rejected"];
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          message: "Invalid Status or Status not allowed",
          success: false,
        });
      }

      //validating the request
      const connectionRequest = await ConnectionRequestModel.findOne({
        _id: requestId,
        toUserId: loggedInUser._id,
        status: "intrested",
      });

      if (!connectionRequest) {
        return res.status(404).json({
          message: "request not found ",
          success: false,
        });
      }

      connectionRequest.status = status;
      const data = await connectionRequest.save();

      res.status(200).json({
        message: "Connection request " + status,
        data,
        success: true,
      });
    } catch (error) {
      res.status(400).send("ERROR:" + error.message);
    }
  }
);

module.exports = requestRouter;

// Index usage in database - 

// Index = Faster lookups by index value (avoids full collection scan).
// ✅ Index = Faster lookups by index value (avoids full collection scan).
// db.users.createIndex({ email: 1 }); 
// db.users.find({ email: "abc@example.com" });
// → Instead of scanning all documents, MongoDB jumps directly using the email index.

// Ensures uniqueness (e.g., no duplicate emails).
// ✅ Ensures uniqueness (e.g., no duplicate emails).
// db.users.createIndex({ email: 1 }, { unique: true });
// db.users.insertOne({ email: "abc@example.com" }); // ✅ Works
// db.users.insertOne({ email: "abc@example.com" }); // ❌ Error → E11000 duplicate key error


// Default _id index is always created.
// ✅ Default _id index is always created.
// db.users.find({ _id: ObjectId("6521abc123...") });
// → No need to manually create an index; every collection has _id indexed by default.

// Trade-off → Speeds up reads but slows down writes & uses memory.
// ❌ Trade-off → Speeds up reads but slows down writes & uses memory.
// db.users.insertOne({ email: "new@example.com" });
// → Insert is slightly slower since MongoDB must update *all* indexes (email index + _id index).
// More indexes = more write overhead + extra storage usage.

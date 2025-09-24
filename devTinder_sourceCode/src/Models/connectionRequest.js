const mongoose = require("mongoose");

//Connection request schema
const connectionRequestSchema = new mongoose.Schema(
  {
    fromUserId: {
      type: mongoose.Schema.Types.ObjectId, // Stores the ObjectId of the "from" user
      ref: "User",                          // References the "User" collection
      required: true,                       // Cannot be null or undefined
    },
    toUserId: {
      type: mongoose.Schema.Types.ObjectId, // Stores the ObjectId of the "to" user
      ref: "User",                          // References the "User" collection
      required: true,                       // Cannot be null or undefined
    },
    status: {
      type: String,          // The field must be of type String
      required: true,        // This field is mandatory

      enum: {                // enum restricts the field to only specific values
        values: ["ignored", "accepted", "rejected", "interested"], 
        // Allowed values → anything outside this will throw a ValidationError

        message: `{VALUE} is incorrect status type`, 
        // Custom error message → {VALUE} will be replaced with the invalid value
      }, // ✅ You missed this comma earlier
    },
    // 🔹 Notes:
    // 1. "enum" validation is applied by Mongoose before saving to MongoDB.
    // 2. MongoDB itself does not have an "enum" type → it's only a Mongoose schema restriction.
    // 3. {VALUE} placeholder = the actual wrong input, {PATH} placeholder = the field name.
  },
  {
    timestamps: true, // Auto-creates createdAt and updatedAt fields
  }
);


//compound index
connectionRequestSchema.index({ fromUserId: 1, toUserId: 1 });


connectionRequestSchema.pre("save", function (next) {
  // `pre("save")` middleware runs automatically before saving a document in MongoDB.
  // - It acts like a validation hook to enforce custom business rules.
  // - Arrow functions are NOT allowed here because we need access to `this`
  //   (the current document instance being saved).

  const connectionRequest = this;

  // 🔒 Self-request check:
  // Ensure that a user cannot send a connection request to themselves.
  // If `fromUserId` and `toUserId` are the same, throw an error.
  if (connectionRequest.fromUserId.equals(connectionRequest.toUserId)) {
    throw new Error("You cannot send a connection request to yourself");
  }

  // ✅ Continue to the next middleware / save operation
  next();
}); // we have handled this in schema level. We could have also handled this in API level as well.


const ConnectionRequestModel = new mongoose.model(
  "ConnectionRequest",
  connectionRequestSchema
);
module.exports = {
  ConnectionRequestModel,
};

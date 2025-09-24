const mongoose = require("mongoose");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// User Model
const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      minLength: 3,
      maxLenght: 50,
    },
    lastName: {
      type: String,
      required: true,
    },
    emailId: {
      type: String,
      lowercase: true,
      required: true,
      unique: true, // unique id for Email
      trim: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Invalid Email :" + value);
        }
      },
    },
    password: {
      type: String,
      required: true,
      validate(value) {
        if (!validator.isStrongPassword(value)) {
          throw new Error("Enter Strong password :" + value);
        }
      },
    },
    age: {
      type: Number,
      required: false,
      min: 18,
    },
    gender: {
      type: String,
      required: false,
      trim: true,
      validate(value) { // We can use enum alternatively for validation check without the need of validate function. 
        if (!["male", "female", "others","Male", "Female", "Others"].includes(value)) {
          throw new Error("Not a valid gender (Male , Female and other)");
        }
      },
    },
    about: {
      type: String,
      // default: "Dev is in search for someone here",
    },
    photoURL: {
      type: String,
      default: "https://img.freepik.com/free-vector/user-blue-gradient_78370-4692.jpg?t=st=1740779693~exp=1740783293~hmac=3ffc11733917c931bddeec957e8fa649e6a1590282b3210d816ccbf54dab2e94&w=900",
      validate(value) {
        if (!validator.isURL(value)) {
          throw new Error("Invalid URL :" + value);
        }
      },
    },
    skills: {
      type: [String],
    },
  },
  {
    timestamps: true,
  }
);

//compound index
userSchema.index({ firstName: 1, lastName: 1 });

userSchema.methods.getjwt = async function () {
  const user = this;
  const token = await jwt.sign({ _id: this._id }, "999@Akshad", {
    expiresIn: "1d",
  });

  return token;
};

// userSchema.methods.encryptPassword = async function (passwordInputByUser) {
//     const passwordHash = await bcrypt.hash(passwordInputByUser, 10)
//     return passwordHash
// }

userSchema.methods.validatePassword = async function (passwordInputByUser) {
  const user = this;
  const passwordHash = user.password;
  const isValidPassword = await bcrypt.compare(
    passwordInputByUser,
    passwordHash
  );
  return isValidPassword;
};

mongoose.model("User", userSchema);
module.exports = mongoose.model("User", userSchema);


// 🍫 Imagine you’re in a chocolate shop

// You want to find a chocolate by flavor (e.g., "Mango").

// The shopkeeper arranges chocolates in alphabetical order of flavors.
// 👉 That’s like a single-field index on flavor.

// 🍫 Now imagine you want chocolates by flavor + size

// You want "Mango" chocolates in Large size.

// If the shopkeeper only sorted by flavor, he’d have to search through all mango chocolates to find the large ones.

// But if the chocolates are sorted by flavor first, then size inside each flavor,
// 👉 The shopkeeper can find Mango → Large super fast.

// That’s a compound index → it sorts and organizes two fields together.

// 🔹 In MongoDB terms

// Single index → { flavor: 1 }

// Compound index → { flavor: 1, size: 1 }

// 👉 This makes queries like:

// db.chocolates.find({ flavor: "Mango", size: "Large" })


// very fast 🚀

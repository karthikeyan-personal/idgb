// Import required modules
const express = require("express");
const multer = require("multer");
const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const cors = require("cors");
const nodemailer = require("nodemailer");

// Load environment variables

require("dotenv").config();

// Create Express app
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Set up multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Destination folder for uploaded files
  },
  filename: function (req, file, cb) {
    // Rename uploaded files to avoid name collisions
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

// Initialize multer upload middleware
const upload = multer({ storage: storage });

// Form route
app.post("/submit-form", upload.single("pdf"), (req, res) => {
  const { name, email } = req.body;
  const pdfFile = req.file;

  // Send email to admin
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "professionalfreelancing.a2z@gmail.com",
      pass: "oury zitf vcqn wpeg",
    },
  });

  const mailOptions = {
    from: "professionalfreelancing.a2z@gmail.com",
    to: "professionalfreelancing.a2z@gmail.com",
    subject: "New Form Submission",
    text: `Name: ${name}\nEmail: ${email}`,
    attachments: [
      {
        filename: pdfFile.originalname,
        content: pdfFile.buffer,
        path: __dirname + "/uploads/" + pdfFile.filename,
      },
    ],
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error(error);
      res.status(500).send("Error sending email");
    } else {
      console.log("Email sent: " + info.response);
      res.send("Form submitted successfully");
    }
  });
});

// Connect to MongoDB
mongoose.connect("mongodb+srv://admin:admin@cluster0.rewsd3n.mongodb.net/", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));

// Define User schema
const userSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  mobileNo: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  institutionName: String,
  address: String,
  address1: String,
  city: String,
  state: String,
  country: String,
  postalCode: String,
});

const User = mongoose.model("User", userSchema);

// Middleware to parse JSON requests
app.use(bodyParser.json());

// Registration endpoint
app.post("/api/register", async (req, res) => {
  try {
    const {
      userName,
      firstName,
      lastName,
      mobileNo,
      email,
      password,
      institutionName,
      address,
      address1,
      city,
      state,
      country,
      postalCode,
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ userName }, { email }] });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      userName,
      firstName,
      lastName,
      mobileNo,
      email,
      password: hashedPassword,
      institutionName,
      address,
      address1,
      city,
      state,
      country,
      postalCode,
    });
    await newUser.save();

    return res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Login endpoint
app.post("/api/login", async (req, res) => {
  try {
    const { userName, password } = req.body;

    // Find user by username
    const user = await User.findOne({ userName });
    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Check if password is correct
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid username or password" });
    }
    // generate token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // Password is correct, user is authenticated
    return res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    console.error("Error logging in user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Start the server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

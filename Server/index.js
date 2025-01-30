const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const PORT = 3000;

// User schema
const schema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  photo: { type: String },
});

const User = mongoose.model("UserInfo", schema);

// Post schema
const postSchema = new mongoose.Schema({
  Text: { type: String },
  File: { type: String },
  userId: { type: String, required: true },
  postId: { type: String, required: true, unique: true },
  user: { type: String, required: true },
});
const Post = mongoose.model("Post", postSchema);

// Connect to MongoDB
mongoose
  .connect("mongodb://127.0.0.1:27017/social")
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Express app setup
const app = express();
// const corsOptions = {
//   origin: ["http://localhost:5173", "https://cat-post.netlify.app"], // Your frontend's URL
//   methods: ["GET", "POST", "PUT", "DELETE"], // Specify allowed HTTP methods
//   allowedHeaders: ["Content-Type", "Authorization"], // Specify allowed headers
// };

app.use(cors());
app.use(express.json());

// Register user
app.post("/register", async (req, res) => {
  const { email, displayName, photoURL, uid } = req.body;
  try {
    const data = await User.create({
      uid,
      name: displayName,
      email,
      photo: photoURL || "",
    });
    res.status(200).json({ message: "User registered", data });
  } catch (error) {
    res.status(500).json({ message: "Error registering user", error });
  }
});

// Create a post
app.post("/post", async (req, res) => {
  const { text, img, userId, postId,user } = req.body;
  try {
    const result = await Post.create({ Text: text, File: img, userId, postId,user });
    res.status(200).json({ message: "Post created successfully", result });
  } catch (error) {
    res.status(500).json({ message: "Error creating post", error });
  }
});

// Get all posts
app.get("/posts", async (req, res) => {
  const { user } = req.query;
  try {
    const posts = user ? await Post.find({ user }) : await Post.find();
    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ message: "Error fetching posts", error });
  }
});

// Start server
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);

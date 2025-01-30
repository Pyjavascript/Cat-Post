const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const PORT = 3000;

// MongoDB Atlas Connection
mongoose
  .connect("mongodb+srv://admin:<password>@catpost.edwjx.mongodb.net/social?retryWrites=true&w=majority&appName=CatPost", {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log("✅ MongoDB Atlas connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Express app setup
const app = express();
app.use(cors({
  origin: 'https://cat-post.netlify.app', // Replace with your Netlify URL
  methods: 'GET,POST,PUT,DELETE',
  credentials: true, // If using cookies or authentication
}));

app.use(express.json());

// User Schema
const schema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  photo: { type: String },
});
const User = mongoose.model("UserInfo", schema);

// Post Schema
const postSchema = new mongoose.Schema({
  Text: { type: String },
  File: { type: String },
  userId: { type: String, required: true },
  postId: { type: String, required: true, unique: true },
  user: { type: String, required: true },
});
const Post = mongoose.model("Post", postSchema);

// Test Route
app.get("/test", (req, res) => {
  res.send("✅ Website Working");
});

// Register User
app.post("/register", async (req, res) => {
  const { email, displayName, photoURL, uid } = req.body;
  try {
    const data = await User.create({
      uid,
      name: displayName,
      email,
      photo: photoURL || "",
    });
    res.status(200).json({ message: "✅ User registered", data });
  } catch (error) {
    res.status(500).json({ message: "❌ Error registering user", error });
  }
});

// Create a Post
app.post("/post", async (req, res) => {
  const { text, img, userId, postId, user } = req.body;
  try {
    const result = await Post.create({ Text: text, File: img, userId, postId, user });
    res.status(200).json({ message: "✅ Post created successfully", result });
  } catch (error) {
    res.status(500).json({ message: "❌ Error creating post", error });
  }
});

// Get All Posts
app.get("/posts", async (req, res) => {
  const { user } = req.query;
  try {
    const posts = user ? await Post.find({ user }) : await Post.find();
    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ message: "❌ Error fetching posts", error });
  }
});

// Start Server
app.listen(PORT, () =>
  console.log(`🚀 Server running on https://cat-post.onrender.com/`)
);

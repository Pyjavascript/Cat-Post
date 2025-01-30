const express = require("express");
const { MongoClient } = require("mongodb");
const cors = require("cors");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;

// MongoDB Atlas Connection
const uri = process.env.MONGO_URI; // Mongo URI from your .env file
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    console.log("✅ MongoDB Atlas connected");

    const db = client.db("social"); // Database name
    const userCollection = db.collection("users"); // User collection
    const postCollection = db.collection("posts"); // Post collection

    // Express app setup
    const app = express();

    // CORS setup
    app.use(
      cors({
        origin: 'https://cat-post.netlify.app', // Replace with your Netlify URL
        methods: 'GET,POST,PUT,DELETE',
        credentials: true, // If using cookies or authentication
      })
    );

    app.use(express.json());

    // Test Route
    app.get("/test", (req, res) => {
      res.send("✅ Website Working");
    });

    // Register User
    app.post("/register", async (req, res) => {
      const { email, displayName, photoURL, uid } = req.body;
      try {
        const result = await userCollection.insertOne({
          uid,
          name: displayName,
          email,
          photo: photoURL || "",
        });
        res.status(200).json({ message: "✅ User registered", data: result });
      } catch (error) {
        res.status(500).json({ message: "❌ Error registering user", error });
      }
    });

    // Create a Post
    app.post("/post", async (req, res) => {
      const { text, img, userId, postId, user } = req.body;
      try {
        const result = await postCollection.insertOne({
          Text: text,
          File: img,
          userId,
          postId,
          user,
        });
        res.status(200).json({ message: "✅ Post created successfully", result });
      } catch (error) {
        res.status(500).json({ message: "❌ Error creating post", error });
      }
    });

    // Get All Posts
    app.get("/posts", async (req, res) => {
      const { user } = req.query;
      try {
        const posts = user
          ? await postCollection.find({ user }).toArray()
          : await postCollection.find().toArray();
        res.status(200).json(posts);
      } catch (error) {
        res.status(500).json({ message: "❌ Error fetching posts", error });
      }
    });

    // Start Server
    app.listen(PORT, () =>
      console.log(`🚀 Server running on http://localhost:${PORT}/` || `https://cat-post.onrender.com/`)
    );
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
  }
}

run().catch(console.dir);

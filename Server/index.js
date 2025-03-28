const express = require("express");
const multer = require("multer");
const { MongoClient } = require("mongodb");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const PORT = 5000;

const uri = process.env.MONGODB_URI;

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
    const upload = multer({ dest: "uploads/" });

    // CORS setup
    app.use(
      cors({
        origin: ['https://cat-post.netlify.app','http://localhost:5173','http://localhost:5174'],
        methods: 'GET,POST,PUT,DELETE',
        credentials: true,
      })
    );

    app.use(express.json());

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
    app.post("/post", upload.single("audio"), async (req, res) => {
      try {
          const { text, img, userId, postId, user } = req.body;
          const audioFilePath = req.file ? req.file.path : null; // Store file path in DB
  
          const result = await postCollection.insertOne({
              text,
              img,
              audioFile: audioFilePath, // Store the file path
              userId,
              postId,
              user,
          });
  
          res.status(200).json({ message: "✅ Post created successfully", result });
      } catch (error) {
          res.status(500).json({ message: "❌ Error creating post", error });
      }
  });
  // Serve static files
app.use("/uploads", express.static("uploads"));  

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

    // Delete User
    app.delete("/delete", async (req, res) => {
      const { email } = req.body;
      try {
        const result = await userCollection.deleteOne({ email });
        const posts = await postCollection.deleteMany({ "user": email });
        res.status(200).json({ message: "✅ User and posts deleted", userDeleted: result, postsDeleted: posts });
      } catch (error) {
        res.status(500).json({ message: "❌ Error deleting user and posts", error });
      }
    }); 

    // Get All Users EXCEPT the current user
    app.get("/users", async (req, res) => {
      const { email } = req.query;
      try {
        const users = await userCollection.find({ email: { $ne: email } }).toArray();
        res.status(200).json(users);
      } catch (error) {
        res.status(500).json({ message: "❌ Error fetching users", error });
      }
    });

    app.listen(PORT, () =>
      console.log(`🚀 Server running on http://localhost:${PORT}/` || `http://localhost:5000/`)
    );
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
  }
}

run().catch(console.dir);

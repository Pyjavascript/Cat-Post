const express = require("express");
const multer = require("multer");
const { MongoClient } = require("mongodb");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");
const { randomUUID } = require("crypto");

dotenv.config();

const PORT = process.env.PORT || 5000;
const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
const uploadsDir = path.join(__dirname, "uploads");

if (!uri) {
  throw new Error("MONGODB_URI or MONGO_URI is not set");
}

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const client = new MongoClient(uri);
const app = express();
const upload = multer({ dest: uploadsDir });
const allowedOrigins = [
  process.env.CLIENT_URL,
  "https://cat-post.netlify.app",
  "http://localhost:5173",
  "http://localhost:5174",
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin not allowed by CORS"));
    },
    methods: ["GET", "POST", "PATCH", "DELETE"],
    credentials: true,
  })
);
app.use(express.json());
app.use("/uploads", express.static(uploadsDir));

const sanitizeText = (value = "") => String(value).trim();
const buildConversationId = (userA, userB) =>
  [userA, userB].map((value) => value.toLowerCase()).sort().join("::");

async function run() {
  try {
    await client.connect();
    console.log("MongoDB Atlas connected");

    const db = client.db("social");
    const userCollection = db.collection("users");
    const postCollection = db.collection("posts");
    const messageCollection = db.collection("messages");

    app.get("/test", (req, res) => {
      res.send("Website Working");
    });

    app.post("/register", async (req, res) => {
      const { email, displayName, photoURL, uid } = req.body;
      const safeEmail = sanitizeText(email).toLowerCase();

      if (!safeEmail || !uid) {
        res.status(400).json({ message: "Email and uid are required" });
        return;
      }

      try {
        const userDoc = {
          uid,
          email: safeEmail,
          name: sanitizeText(displayName) || "Cat User",
          photo: sanitizeText(photoURL),
          updatedAt: new Date(),
        };

        await userCollection.updateOne(
          { email: safeEmail },
          {
            $set: userDoc,
            $setOnInsert: {
              createdAt: new Date(),
            },
          },
          { upsert: true }
        );

        const savedUser = await userCollection.findOne(
          { email: safeEmail },
          { projection: { _id: 0 } }
        );

        res.status(200).json({ message: "User registered", data: savedUser });
      } catch (error) {
        res.status(500).json({ message: "Error registering user", error });
      }
    });

    app.patch("/update", async (req, res) => {
      const { email, name, photo } = req.body;
      const safeEmail = sanitizeText(email).toLowerCase();

      if (!safeEmail) {
        res.status(400).json({ message: "Email is required" });
        return;
      }

      try {
        await userCollection.updateOne(
          { email: safeEmail },
          {
            $set: {
              name: sanitizeText(name),
              photo: sanitizeText(photo),
              updatedAt: new Date(),
            },
          }
        );

        const updatedUser = await userCollection.findOne(
          { email: safeEmail },
          { projection: { _id: 0 } }
        );

        res.status(200).json({ message: "Profile updated", data: updatedUser });
      } catch (error) {
        res.status(500).json({ message: "Error updating profile", error });
      }
    });

    app.post("/post", upload.single("audio"), async (req, res) => {
      try {
        const text = sanitizeText(req.body.text);
        const img = sanitizeText(req.body.img);
        const video = sanitizeText(req.body.video);
        const userId = sanitizeText(req.body.userId);
        const postId = sanitizeText(req.body.postId) || randomUUID();
        const userEmail = sanitizeText(req.body.user).toLowerCase();
        const authorName = sanitizeText(req.body.userName) || "Cat User";
        const authorPhoto = sanitizeText(req.body.userPhoto);
        const audioFile = req.file ? `/uploads/${req.file.filename}` : "";

        if (!userEmail || !userId) {
          res.status(400).json({ message: "User information is required" });
          return;
        }

        if (!text && !img && !video && !audioFile) {
          res.status(400).json({ message: "Add some text or media to post" });
          return;
        }

        const postDoc = {
          postId,
          userId,
          user: userEmail,
          authorName,
          authorPhoto,
          text,
          img,
          video,
          audioFile,
          likes: [],
          createdAt: new Date(),
        };

        await postCollection.insertOne(postDoc);
        res.status(200).json({ message: "Post created successfully", result: postDoc });
      } catch (error) {
        res.status(500).json({ message: "Error creating post", error });
      }
    });

    app.get("/posts", async (req, res) => {
      const user = sanitizeText(req.query.user).toLowerCase();

      try {
        const query = user ? { user } : {};
        const posts = await postCollection
          .find(query)
          .project({ _id: 0 })
          .sort({ createdAt: -1 })
          .toArray();

        res.status(200).json(posts);
      } catch (error) {
        res.status(500).json({ message: "Error fetching posts", error });
      }
    });

    app.patch("/posts/:postId/like", async (req, res) => {
      const postId = sanitizeText(req.params.postId);
      const userEmail = sanitizeText(req.body.userEmail).toLowerCase();

      if (!postId || !userEmail) {
        res.status(400).json({ message: "postId and userEmail are required" });
        return;
      }

      try {
        const existingPost = await postCollection.findOne({ postId });

        if (!existingPost) {
          res.status(404).json({ message: "Post not found" });
          return;
        }

        const alreadyLiked = Array.isArray(existingPost.likes)
          ? existingPost.likes.includes(userEmail)
          : false;

        const update = alreadyLiked
          ? { $pull: { likes: userEmail } }
          : { $addToSet: { likes: userEmail } };

        await postCollection.updateOne({ postId }, update);

        const updatedPost = await postCollection.findOne(
          { postId },
          { projection: { _id: 0 } }
        );

        res.status(200).json({
          message: alreadyLiked ? "Like removed" : "Post liked",
          data: updatedPost,
        });
      } catch (error) {
        res.status(500).json({ message: "Error toggling like", error });
      }
    });

    app.post("/messages", async (req, res) => {
      const senderEmail = sanitizeText(req.body.senderEmail).toLowerCase();
      const senderName = sanitizeText(req.body.senderName) || "Cat User";
      const senderPhoto = sanitizeText(req.body.senderPhoto);
      const receiverEmail = sanitizeText(req.body.receiverEmail).toLowerCase();
      const text = sanitizeText(req.body.text);

      if (!senderEmail || !receiverEmail || !text) {
        res
          .status(400)
          .json({ message: "senderEmail, receiverEmail and text are required" });
        return;
      }

      try {
        const messageDoc = {
          messageId: randomUUID(),
          conversationId: buildConversationId(senderEmail, receiverEmail),
          senderEmail,
          senderName,
          senderPhoto,
          receiverEmail,
          text,
          createdAt: new Date(),
        };

        await messageCollection.insertOne(messageDoc);
        res.status(200).json({ message: "Message sent", data: messageDoc });
      } catch (error) {
        res.status(500).json({ message: "Error sending message", error });
      }
    });

    app.get("/messages", async (req, res) => {
      const userA = sanitizeText(req.query.userA).toLowerCase();
      const userB = sanitizeText(req.query.userB).toLowerCase();

      if (!userA || !userB) {
        res.status(400).json({ message: "userA and userB are required" });
        return;
      }

      try {
        const messages = await messageCollection
          .find({ conversationId: buildConversationId(userA, userB) })
          .project({ _id: 0 })
          .sort({ createdAt: 1 })
          .toArray();

        res.status(200).json(messages);
      } catch (error) {
        res.status(500).json({ message: "Error fetching messages", error });
      }
    });

    app.delete("/delete", async (req, res) => {
      const email = sanitizeText(req.body.email).toLowerCase();

      if (!email) {
        res.status(400).json({ message: "Email is required" });
        return;
      }

      try {
        const userDeleted = await userCollection.deleteOne({ email });
        const postsDeleted = await postCollection.deleteMany({ user: email });
        const messagesDeleted = await messageCollection.deleteMany({
          $or: [{ senderEmail: email }, { receiverEmail: email }],
        });

        res.status(200).json({
          message: "User and posts deleted",
          userDeleted,
          postsDeleted,
          messagesDeleted,
        });
      } catch (error) {
        res.status(500).json({ message: "Error deleting user and posts", error });
      }
    });

    app.get("/users", async (req, res) => {
      const email = sanitizeText(req.query.email).toLowerCase();

      try {
        const query = email ? { email: { $ne: email } } : {};
        const users = await userCollection
          .find(query)
          .project({ _id: 0, password: 0 })
          .sort({ name: 1 })
          .toArray();

        res.status(200).json(users);
      } catch (error) {
        res.status(500).json({ message: "Error fetching users", error });
      }
    });

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
}

run().catch(console.dir);

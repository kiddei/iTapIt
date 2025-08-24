// server.js
import express from "express";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// MongoDB setup
const client = new MongoClient(process.env.MONGO_URI);

// Cloudinary setup
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_KEY,
  api_secret: process.env.CLOUD_SECRET,
});

async function syncCloudinaryToMongo() {
  try {
    await client.connect();
    const db = client.db("SharedLens");
    const mediaCollection = db.collection("media");

    // Fetch first 100 images from Cloudinary
    const result = await cloudinary.api.resources({
      type: "upload",
      resource_type: "image",
      max_results: 100,
    });

    for (const img of result.resources) {
      // Check if image already exists (by Cloudinary id)
      const exists = await mediaCollection.findOne({ cloudinary_id: img.public_id });

      if (!exists) {
        // Get the current highest media_id
        const lastDoc = await mediaCollection.find().sort({ media_id: -1 }).limit(1).toArray();
        const nextId = lastDoc.length > 0 ? lastDoc[0].media_id + 1 : 1;

        // Build new doc
        const newMedia = {
          media_id: nextId,                // 🔥 auto-incrementing number
          cloudinary_id: img.public_id,    // keep original id for reference
          media_link: img.secure_url,
          format: img.format,
          width: img.width,
          height: img.height,
          bytes: img.bytes,
          created_at: new Date(img.created_at),
          reactions: {
            likes: 0,
            dislikes: 0,
            hearts: 0,
          },
          tags: img.tags || [],
        };

        await mediaCollection.insertOne(newMedia);
        console.log(`✅ Added ${newMedia.media_id} (${img.public_id})`);
      } else {
        console.log(`⚡ Already exists: ${img.public_id}`);
      }
    }
  } catch (err) {
    console.error("❌ Error syncing:", err);
  }
}

app.use(express.static("public"));

// Routes
app.get("/sync", async (req, res) => {
  await syncCloudinaryToMongo();
  res.send("Sync completed ✅");
});

// Add this route in your server.js
app.get("/media", async (req, res) => {
  try {
    await client.connect();
    const db = client.db("SharedLens");
    const mediaCollection = db.collection("media");

    const mediaList = await mediaCollection.find().sort({ media_id: 1 }).toArray();
    res.json(mediaList);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching media");
  }
});


// Start server
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});

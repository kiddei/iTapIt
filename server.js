// server.js
import express from "express";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse incoming JSON + form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


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

   const result = await cloudinary.api.resources({
  type: "upload",
  resource_type: "image",
  max_results: 100,
  tags: true   // 🔑 This makes Cloudinary include tags in the response
});


    for (const img of result.resources) {
      // Check if image already exists (by Cloudinary id)
      const exists = await mediaCollection.findOne({ cloudinary_id: img.public_id });

      if (!exists) {
        // Get the current highest media_id
        const lastDoc = await mediaCollection.find().sort({ media_id: -1 }).limit(1).toArray();
        const nextId = lastDoc.length > 0 ? lastDoc[0].media_id + 1 : 1;

        console.log("Checking image:", img.public_id, "tags:", img.tags);

        // Check tags for "featured"
        const isFeatured = (img.tags && img.tags.includes("featured")) ? 1 : 0;

        // Build new doc
        const newMedia = {
          media_id: nextId,
          cloudinary_id: img.public_id,
          media_link: img.secure_url,
          format: img.format,
          width: img.width,
          height: img.height,
          bytes: img.bytes,
          created_at: new Date(img.created_at),
          reactions: 0,
          tags: img.tags || [],
          is_featured: isFeatured
        };

        await mediaCollection.insertOne(newMedia);
        console.log(`✅ Added ${newMedia.media_id} (${img.public_id}) | Featured: ${isFeatured}`);
      } else {
        console.log(`⚡ Already exists: ${img.public_id}`);
      }
    }
  } catch (err) {
    console.error("❌ Error syncing:", err);
  }
}

// Endpoint to generate signature for uploads
app.get("/get-signature", (req, res) => {
  const timestamp = Math.round(new Date().getTime() / 1000);

  // Restrict resource type & tags for safety
  const params = {
    timestamp,
    folder: "user_uploads", // uploads go here
  };

  const signature = cloudinary.utils.api_sign_request(params, process.env.CLOUD_SECRET);

  res.json({
    signature,
    timestamp,
    cloudName: process.env.CLOUD_NAME,
    apiKey: process.env.CLOUD_KEY,
    folder: "user_uploads",
  });
});


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

// Increment like count for a media item
app.post("/like/:id", async (req, res) => {
  try {
    const mediaId = parseInt(req.params.id, 10);
    const db = client.db("SharedLens");
    const mediaCollection = db.collection("media");

    const result = await mediaCollection.findOneAndUpdate(
      { media_id: mediaId },
      { $inc: { reactions: 1 } },
      { returnDocument: "after" } // gives the updated doc
    );

    if (!result.value) {
      return res.status(404).json({ success: false, message: "Media not found" });
    }

    res.json({ success: true, newCount: result.value.reactions });
  } catch (err) {
    console.error("❌ Error liking media:", err);
    res.status(500).json({ success: false });
  }
});

// Delete media (DB + Cloudinary)
app.delete("/delete/:id", async (req, res) => {
  try {
    const mediaId = parseInt(req.params.id, 10);
    const db = client.db("SharedLens");
    const mediaCollection = db.collection("media");

    // Find the doc so we know its Cloudinary ID
    const mediaDoc = await mediaCollection.findOne({ media_id: mediaId });
    if (!mediaDoc) {
      return res.status(404).json({ success: false, message: "Media not found" });
    }

    // 1. Delete from Cloudinary
    await cloudinary.uploader.destroy(mediaDoc.cloudinary_id);

    // 2. Delete from MongoDB
    await mediaCollection.deleteOne({ media_id: mediaId });

    res.json({ success: true, message: "Deleted from DB & Cloudinary" });
  } catch (err) {
    console.error("❌ Error deleting media:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create album
app.post("/folders", async (req, res) => {
  try {
    await client.connect();
    const db = client.db("SharedLens");
    const foldersCollection = db.collection("folders");

    const { folder_name, folder_description } = req.body;

    if (!folder_name) {
      return res.status(400).json({ success: false, message: "Album name is required" });
    }

    // Get last folder_id
    const lastDoc = await foldersCollection.find().sort({ folder_id: -1 }).limit(1).toArray();
    const nextId = lastDoc.length > 0 ? lastDoc[0].folder_id + 1 : 1;

    const newFolder = {
      folder_id: nextId,
      folder_name,
      folder_description: folder_description || ""
    };

    await foldersCollection.insertOne(newFolder);

    res.json({ success: true, folder: newFolder });
  } catch (err) {
    console.error("❌ Error creating folder:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Fetch all folders
app.get("/folders", async (req, res) => {
  try {
    await client.connect();
    const db = client.db("SharedLens");
    const foldersCollection = db.collection("folders");

    const folders = await foldersCollection.find().sort({ folder_id: 1 }).toArray();
    res.json(folders);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching folders");
  }
});

// Add media to album
app.post("/folder_items", async (req, res) => {
  try {
    await client.connect();
    const db = client.db("SharedLens");
    const folderItemsCollection = db.collection("folder_items");

    const { folder_id, media_ids } = req.body;

    if (!folder_id || !Array.isArray(media_ids) || media_ids.length === 0) {
      return res.status(400).json({ success: false, message: "Missing folder_id or media_ids" });
    }

    const folderIdInt = parseInt(folder_id, 10);
    const mediaIdsInt = media_ids.map(mid => parseInt(mid, 10));

    // 🔹 Find already existing entries
    const existing = await folderItemsCollection.find({
      folder_id: folderIdInt,
      media_id: { $in: mediaIdsInt }
    }).toArray();

    const existingIds = new Set(existing.map(doc => doc.media_id));

    // 🔹 Filter out duplicates
    const newDocs = mediaIdsInt
      .filter(mid => !existingIds.has(mid))
      .map(mid => ({
        folder_id: folderIdInt,
        media_id: mid
      }));

    let insertedCount = 0;
    if (newDocs.length > 0) {
      const result = await folderItemsCollection.insertMany(newDocs);
      insertedCount = result.insertedCount;
    }

    const skippedCount = mediaIdsInt.length - insertedCount;

    res.json({
      success: true,
      added: insertedCount,
      skipped: skippedCount
    });
  } catch (err) {
    console.error("❌ Error adding to album:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// server.js
app.get("/folders/:id/media", async (req, res) => {
  try {
    await client.connect();
    const db = client.db("SharedLens");
    const folderItemsCollection = db.collection("folder_items");
    const mediaCollection = db.collection("media");

    const folderId = parseInt(req.params.id, 10);

    // find all media_ids inside this album
    const folderItems = await folderItemsCollection.find({ folder_id: folderId }).toArray();
    const mediaIds = folderItems.map(fi => fi.media_id);

    let mediaList = [];
    if (mediaIds.length > 0) {
      mediaList = await mediaCollection.find({ media_id: { $in: mediaIds } }).toArray();
    }

    res.json({ success: true, media: mediaList });
  } catch (err) {
    console.error("❌ Error fetching album media:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});



// Start server
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});

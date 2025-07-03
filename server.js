// server.js
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
const app = express();
const PORT = 3000;

const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);
let db;

app.use(cors());
app.use(express.json());

// 🧪 Seed sample data
async function seedData() {
  db = client.db('testDB');
  const users = db.collection('users');
  const rides = db.collection('rides');

  await users.deleteMany({});
  await rides.deleteMany({});

  const userResult = await users.insertMany([
    { name: "Alice", email: "alice@example.com", password: "123", role: "customer", phone: "0111111" },
    { name: "Bob", email: "bob@example.com", password: "123", role: "customer", phone: "0222222" },
    { name: "Charlie", email: "charlie@example.com", password: "123", role: "driver", phone: "0333333", vehicle: "Myvi" }
  ]);

  await rides.insertMany([
    { userId: userResult.insertedIds[0], driverId: userResult.insertedIds[2], origin: "UTeM", destination: "Sentral", status: "completed", fare: 20.5, distance: 10.5 },
    { userId: userResult.insertedIds[0], driverId: userResult.insertedIds[2], origin: "MITC", destination: "Aeon", status: "completed", fare: 17.3, distance: 10.2 },
    { userId: userResult.insertedIds[1], driverId: userResult.insertedIds[2], origin: "UTeM", destination: "Bukit Beruang", status: "completed", fare: 18.75, distance: 9.8 }
  ]);

  console.log("✅ Sample data inserted");
}

// 📊 API: Passenger Analytics
app.get('/analytics/passengers', async (req, res) => {
  const rides = db.collection('rides');

  const result = await rides.aggregate([
    { $match: { status: "completed" } },
    {
      $group: {
        _id: "$userId",
        totalRides: { $sum: 1 },
        totalFare: { $sum: "$fare" },
        avgDistance: { $avg: "$distance" }
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user"
      }
    },
    { $unwind: "$user" },
    {
      $project: {
        _id: 0,
        name: "$user.name",
        totalRides: 1,
        totalFare: 1,
        avgDistance: 1
      }
    }
  ]).toArray();

  res.json(result);
});

// 🚀 Start server
async function start() {
  try {
    await client.connect();
    await seedData();
    app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
  } catch (err) {
    console.error("❌ Failed to start server:", err);
  }
}

start();

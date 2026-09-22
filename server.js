const path = require("path");
const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
const MONGODB_DB = process.env.MONGODB_DB || "food_order";

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

let db;

async function connectDb() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  db = client.db(MONGODB_DB);
  await db.collection("orders").createIndex({ createdAt: -1 });
  console.log("Connected to MongoDB");
}

app.get("/api/menu", (req, res) => {
  const menu = [
    {
      id: "m1",
      name: "Spicy Veg Burger",
      price: 6.5,
      desc: "Grilled patty, lettuce, tomato, house sauce",
      tag: "Bestseller"
    },
    {
      id: "m2",
      name: "Paneer Wrap",
      price: 5.5,
      desc: "Smoky paneer, onions, mint chutney",
      tag: "New"
    },
    {
      id: "m3",
      name: "Masala Fries",
      price: 3.0,
      desc: "Crispy fries tossed in masala",
      tag: "Snack"
    },
    {
      id: "m4",
      name: "Mango Lassi",
      price: 2.5,
      desc: "Chilled yogurt drink",
      tag: "Drink"
    }
  ];

  res.json(menu);
});

app.post("/api/orders", async (req, res) => {
  const order = req.body;

  if (!order || !order.items || !order.items.length) {
    return res.status(400).json({ message: "Order must include items." });
  }

  const payload = {
    ...order,
    createdAt: new Date()
  };

  try {
    const result = await db.collection("orders").insertOne(payload);
    res.status(201).json({ id: result.insertedId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to save order." });
  }
});

app.get("/api/orders", async (req, res) => {
  try {
    const orders = await db
      .collection("orders")
      .find({})
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray();
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load orders." });
  }
});

connectDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Mongo connection failed", err);
    process.exit(1);
  });

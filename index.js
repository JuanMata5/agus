import dotenv from "dotenv";
dotenv.config();

import express from "express";
import clientPromise from "./lib/db.js";

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;

// favicon
app.get("/favicon.ico", (req, res) => {
  res.status(204).end();
});

// HOME + guardar IP + redirect
app.get("/", async (req, res) => {
  try {
    const client = await clientPromise;
    const db = client.db("ipdb");

    let ip =
      req.headers["x-forwarded-for"] ||
      req.ip ||
      req.socket?.remoteAddress;

    if (ip?.includes(",")) {
      ip = ip.split(",")[0].trim();
    }

    const country =
      req.headers["x-vercel-ip-country"] || "unknown";

    await db.collection("ips").insertOne({
      ip,
      country,
      date: new Date(),
    });

  } catch (err) {
    console.error(err);
  }

  // redirect
  res.redirect("https://google.com");
});

// API
app.get("/api/ip", async (req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Servidor en puerto ${PORT}`);
});
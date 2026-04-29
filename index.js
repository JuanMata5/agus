
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { readFileSync } from "fs";

import ipHandler from "./api/ip.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;

// favicon
app.get("/favicon.ico", (req, res) => {
  res.status(204).end();
});

// home
app.get("/", (req, res) => {
  try {
    const html = readFileSync(
      path.join(__dirname, "index.html"),
      "utf-8"
    );

    res.send(html);
  } catch {
    res.send("Servidor funcionando ✔");
  }
});

// API
app.get("/api/ip", ipHandler);

app.listen(PORT, () => {
  console.log(`Servidor en puerto ${PORT}`);
});
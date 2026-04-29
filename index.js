import express from "express";
import ipHandler from "./api/ip.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Servir archivos estáticos (incluye favicon.ico)
app.use(express.static(path.join(__dirname, "public")));

// Ruta específica para favicon.ico para evitar 500
app.get("/favicon.ico", (req, res) => {
  res.status(204).end();
});

app.use("/api/ip", ipHandler);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

export default app;
import express from "express";
import ipHandler from "./api/ip.js";

const app = express();
app.use(express.json());

app.use("/api/ip", ipHandler);

app.get("/", (req, res) => {
  res.send("API funcionando ✔");
});

export default app;
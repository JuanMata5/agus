const express = require("express");
const fs = require("fs");

const app = express();

// IMPORTANTE si estás detrás de proxy
app.set("trust proxy", true);

app.use((req, res, next) => {
  const ip =
    req.headers["x-forwarded-for"] || req.socket.remoteAddress;

  const log = `${new Date().toISOString()} - ${ip}\n`;

  fs.appendFile("ips.txt", log, (err) => {
    if (err) console.error("Error guardando IP:", err);
  });

  next();
});

app.get("/", (req, res) => {
  res.send("IP registrada ✔");
});

app.listen(3000, () => {
  console.log("Servidor en http://localhost:3000");
});
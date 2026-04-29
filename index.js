import path from "path";
import { fileURLToPath } from "url";
import { readFileSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Vercel Serverless Function
export default function handler(req, res) {
  // Ruta específica para favicon.ico
  if (req.url === "/favicon.ico") {
    return res.status(204).send("");
  }

  // Servir index.html
  if (req.url === "/" || req.url === undefined) {
    try {
      const html = readFileSync(path.join(__dirname, "index.html"), "utf-8");
      return res.status(200).send(html);
    } catch (e) {
      return res.status(200).send("API funcionando ✔");
    }
  }

  // Para otras rutas, devolver mensaje por defecto
  return res.status(200).json({ 
    message: "API funcionando", 
    endpoints: ["/api/ip"] 
  });
}
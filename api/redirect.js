import clientPromise from "../lib/db.js";

export default async function handler(req, res) {
  try {
    const client = await clientPromise;
    const db = client.db("ipdb");

    // 1. Obtención de la IP
    let ip = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "";
    if (ip.includes(",")) ip = ip.split(",")[0].trim();

    // Fix local
    if (ip === "::1" || ip === "127.0.0.1") ip = "186.157.76.46"; 

    // 2. Consulta API
    const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city,lat,lon,timezone,isp`);
    const geo = await geoRes.json();

    const data = {
      ip,
      city: geo.city || "Desconocido",
      region: geo.regionName || "Desconocido",
      country: geo.country || "Desconocido",
      lat: geo.lat || 0,
      lon: geo.lon || 0,
      isp: geo.isp || "N/A",
      ua: req.headers["user-agent"]
    };

    // 3. Guardar en DB
    await db.collection("ips").insertOne({ ...data, date: new Date() });

    // 4. RESPUESTA CON HTML Y CSS
    res.setHeader("Content-Type", "text/html");
    return res.status(200).send(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Detalles de Conexión</title>
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            background-color: #0f172a; 
            color: #f1f5f9; 
            display: flex; justify-content: center; align-items: center; 
            min-height: 100vh; margin: 0; 
          }
          .card { 
            background: #1e293b; border-radius: 16px; padding: 2rem; 
            box-shadow: 0 10px 25px rgba(0,0,0,0.5); width: 90%; max-width: 450px; 
            border: 1px solid #334155;
          }
          h1 { color: #38bdf8; font-size: 1.5rem; margin-top: 0; }
          .stat { margin-bottom: 1rem; border-bottom: 1px solid #334155; padding-bottom: 0.5rem; }
          .label { font-size: 0.75rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
          .value { font-size: 1.1rem; font-weight: 600; color: #f8fafc; }
          .coords { display: flex; gap: 20px; }
          .map-btn {
            display: inline-block; margin-top: 1rem; width: 100%; text-align: center;
            background: #38bdf8; color: #0f172a; padding: 10px; border-radius: 8px;
            text-decoration: none; font-weight: bold; transition: background 0.3s;
          }
          .map-btn:hover { background: #7dd3fc; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>📍 Ubicación Detectada</h1>
          
          <div class="stat">
            <div class="label">Dirección IP</div>
            <div class="value">${data.ip}</div>
          </div>

          <div class="stat">
            <div class="label">País / Región</div>
            <div class="value">${data.country}, ${data.region}</div>
          </div>

          <div class="stat">
            <div class="label">Ciudad</div>
            <div class="value">${data.city}</div>
          </div>

          <div class="coords">
            <div class="stat" style="flex:1">
              <div class="label">Latitud</div>
              <div class="value">${data.lat}</div>
            </div>
            <div class="stat" style="flex:1">
              <div class="label">Longitud</div>
              <div class="value">${data.lon}</div>
            </div>
          </div>

          <div class="stat">
            <div class="label">Proveedor (ISP)</div>
            <div class="value">${data.isp}</div>
          </div>

          <a href="https://www.google.com/maps?q=${data.lat},${data.lon}" target="_blank" class="map-btn">
            Ver en Google Maps
          </a>
        </div>
      </body>
      </html>
    `);

  } catch (err) {
    return res.status(500).send("<h1>Error al procesar la solicitud</h1>");
  }
}
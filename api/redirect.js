import clientPromise from "../lib/db.js";

export default async function handler(req, res) {
  try {
    const client = await clientPromise;
    const db = client.db("ipdb");

    // 1. Obtención de la IP del cliente
    let ip =
      req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      "";

    if (ip.includes(",")) {
      ip = ip.split(",")[0].trim();
    }

    // Fix para desarrollo local (puedes quitar esto en producción)
    if (ip === "::1" || ip === "127.0.0.1" || ip.includes("ffff:")) {
      ip = "186.157.76.46"; 
    }

    // 2. Consulta a la API de Geolocalización (ip-api.com)
    const geoRes = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,message,country,regionName,city,lat,lon,timezone,isp`
    );
    const geo = await geoRes.json();

    // 3. Preparación del objeto de datos
    const data = {
      ip: ip,
      city: geo.status === "success" ? geo.city : "Desconocido",
      region: geo.status === "success" ? geo.regionName : "Desconocido",
      country: geo.status === "success" ? geo.country : "Desconocido",
      latitude: geo.status === "success" ? geo.lat : null,
      longitude: geo.status === "success" ? geo.lon : null,
      timezone: geo.status === "success" ? geo.timezone : "UTC",
      org: geo.status === "success" ? geo.isp : "N/A",
      userAgent: req.headers["user-agent"] || "Unknown",
      date: new Date(),
    };

    // 4. Guardar en la base de datos (MongoDB)
    await db.collection("ips").insertOne(data);

    // 5. RESPUESTA DIRECTA EN JSON
    // Esto mostrará el JSON en el navegador en lugar de redirigir
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(data);

  } catch (err) {
    console.error("Error crítico:", err);
    
    // En caso de error, devolvemos el error también en formato JSON
    return res.status(500).json({
      error: "No se pudieron procesar los datos",
      message: err.message
    });
  }
}
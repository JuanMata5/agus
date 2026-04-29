import clientPromise from "../lib/db.js";

export default async function handler(req, res) {
  try {
    const client = await clientPromise;
    const db = client.db("ipdb");

    let ip = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "";

    // Limpiar IP si viene con puerto o es una lista
    if (ip.includes(",")) {
      ip = ip.split(",")[0].trim();
    }
    
    // Normalizar IPv6 de localhost a una IP de prueba
    if (ip === "::1" || ip === "127.0.0.1") {
      ip = "181.98.56.62"; // Una IP real para testear
    }

    // Llamada a la API con manejo de errores
    const geoRes = await fetch(`https://ipapi.co/${ip}/json/`);
    const geo = await geoRes.json();

    // Verificación: Si la API devuelve un error, no guardamos basura
    if (geo.error) {
      console.error("Error de ipapi.co:", geo.reason);
      // Opcional: podrías usar otra API de respaldo aquí
    }

    const data = {
      ip,
      // Usamos cortocircuitos (||) para asegurar que no se guarde 'undefined'
      city: geo.city || "N/A",
      region: geo.region || "N/A",
      country: geo.country_name || "N/A",
      latitude: geo.latitude || null,
      longitude: geo.longitude || null,
      timezone: geo.timezone || "N/A",
      org: geo.org || "N/A",
      userAgent: req.headers["user-agent"] || "Desconocido",
      date: new Date(),
    };

    await db.collection("ips").insertOne(data);

    // Redirección
    res.writeHead(302, {
      Location: "https://open.spotify.com/intl-es/artist/4IwOItqRhsIoRuD5HP4vyC?si=eY1M8B1pRbCg62plQvDO5w",
    });
    return res.end();

  } catch (err) {
    console.error("Error en el handler:", err);
    // Intentar redirigir incluso si falla la DB o la API para no romper la experiencia del usuario
    res.writeHead(302, { Location: "https://www.google.com" });
    return res.end();
  }
}

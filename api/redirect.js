import clientPromise from "../lib/db.js";

export default async function handler(req, res) {
  try {
    const client = await clientPromise;
    const db = client.db("ipdb");

    let ip =
      req.headers["x-forwarded-for"] ||
      req.socket?.remoteAddress;

    if (ip?.includes(",")) {
      ip = ip.split(",")[0].trim();
    }

    // localhost fix
    if (ip === "::1") {
      ip = "8.8.8.8";
    }

    // GEO API
    const geoRes = await fetch(
      `https://ipapi.co/${ip}/json/`
    );

    const geo = await geoRes.json();

    const data = {
      ip,
      city: geo.city,
      region: geo.region,
      country: geo.country_name,
      latitude: geo.latitude,
      longitude: geo.longitude,
      timezone: geo.timezone,
      org: geo.org,
      userAgent: req.headers["user-agent"],
      date: new Date(),
    };

    await db.collection("ips").insertOne(data);

    res.statusCode = 302;

    res.setHeader(
      "Location",
      "https://open.spotify.com/intl-es/artist/4IwOItqRhsIoRuD5HP4vyC?si=eY1M8B1pRbCg62plQvDO5w"
    );

    return res.end();

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: err.message
    });
  }
}

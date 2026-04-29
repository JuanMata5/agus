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

    const country =
      req.headers["x-vercel-ip-country"] || "unknown";

    await db.collection("ips").insertOne({
      ip,
      country,
      date: new Date(),
    });

    return res.redirect("https://google.com");

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      ok: false,
      error: err.message,
    });
  }
}
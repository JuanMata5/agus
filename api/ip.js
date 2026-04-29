import clientPromise from "../lib/db";

export default async function handler(req, res) {
  try {
    const client = await clientPromise;
    const db = client.db("ipdb");

    let ip =
      req.headers["x-forwarded-for"] || req.socket?.remoteAddress;

    if (ip && ip.includes(",")) {
      ip = ip.split(",")[0].trim();
    }

    const country =
      req.headers["x-vercel-ip-country"] || "unknown";

    const data = {
      ip,
      country,
      date: new Date(),
    };

    await db.collection("ips").insertOne(data);

    res.status(200).json({
      ok: true,
      saved: data
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
}
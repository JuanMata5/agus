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

    await db.collection("ips").insertOne({
      ip,
      date: new Date(),
    });

    res.statusCode = 302;

    res.setHeader(
      "Location",
      "https://google.com"
    );

    return res.end();

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: err.message
    });
  }
}
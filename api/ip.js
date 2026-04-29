export default function handler(req, res) {
  let ip =
    req.headers["x-forwarded-for"] || req.socket.remoteAddress;

  if (ip && ip.includes(",")) {
    ip = ip.split(",")[0].trim();
  }

  res.status(200).send(`Tu IP es: ${ip}`);
}
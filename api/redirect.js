import clientPromise from "../lib/db.js";

export default async function handler(req, res) {
  try {
    const client = await clientPromise;
    const db = client.db("ipdb");

    // =====================================
    // OBTENER IP REAL
    // =====================================
    let ip =
      req.headers["cf-connecting-ip"] ||
      req.headers["x-real-ip"] ||
      req.headers["x-forwarded-for"] ||
      req.socket?.remoteAddress ||
      "";

    if (ip.includes(",")) {
      ip = ip.split(",")[0].trim();
    }

    // TEST LOCALHOST
    if (
      ip === "::1" ||
      ip === "127.0.0.1" ||
      ip.includes("192.168.")
    ) {
      ip = "186.157.76.46";
    }

    // =====================================
    // USER AGENT
    // =====================================
    const ua = req.headers["user-agent"] || "";

    // =====================================
    // API GEOLOCATION (IPREGISTRY)
    // =====================================
    const geoRes = await fetch(
      `https://api.ipregistry.co/${ip}?key=ira_lKL5Te9xbl3QWflSbYGrVvHw62q1gQ0cEoWf`
    );

    const geo = await geoRes.json();

    console.log(geo);

    // =====================================
    // DETECTAR DISPOSITIVO
    // =====================================
    let dispositivo = "Desconocido";

    if (/iPhone/i.test(ua)) dispositivo = "iPhone";
    else if (/Android/i.test(ua)) dispositivo = "Android";
    else if (/Windows/i.test(ua)) dispositivo = "PC Windows";
    else if (/Macintosh/i.test(ua)) dispositivo = "Mac";
    else if (/Linux/i.test(ua)) dispositivo = "Linux";

    // =====================================
    // DETECTAR NAVEGADOR
    // =====================================
    let navegador = "Desconocido";

    if (/Edg/i.test(ua)) navegador = "Edge";
    else if (/Chrome/i.test(ua)) navegador = "Chrome";
    else if (/Firefox/i.test(ua)) navegador = "Firefox";
    else if (/Safari/i.test(ua)) navegador = "Safari";

    // =====================================
    // FECHA
    // =====================================
    const fechaActual = new Date().toLocaleString("es-AR", {
      dateStyle: "full",
      timeStyle: "medium",
    });

    // =====================================
    // DATOS
    // =====================================
    const data = {
      ip: geo.ip || ip,

      city:
        geo.location?.city ||
        "Desconocido",

      region:
        geo.location?.region?.name ||
        "Desconocido",

      country:
        geo.location?.country?.name ||
        "Desconocido",

      continent:
        geo.location?.continent?.name ||
        "Desconocido",

      lat:
        geo.location?.latitude || 0,

      lon:
        geo.location?.longitude || 0,

      timezone:
        geo.time_zone?.id || "N/A",

      isp:
        geo.connection?.organization ||
        "Desconocido",

      asn:
        geo.connection?.asn ||
        "N/A",

      vpn:
        geo.security?.is_vpn || false,

      proxy:
        geo.security?.is_proxy || false,

      tor:
        geo.security?.is_tor || false,

      hosting:
        geo.security?.is_hosting || false,

      dispositivo,
      navegador,

      bandera:
        geo.location?.country?.flag?.emoji ||
        "🌍",

      fecha: fechaActual,
    };

    // =====================================
    // GUARDAR EN MONGODB
    // =====================================
    await db.collection("ips").insertOne({
      ...data,
      rawUA: ua,
      createdAt: new Date(),
    });

    // =====================================
    // RESPUESTA HTML
    // =====================================
    res.setHeader("Content-Type", "text/html");

    return res.status(200).send(`
<!DOCTYPE html>
<html lang="es">

<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<title>Acceso Registrado</title>

<style>

*{
margin:0;
padding:0;
box-sizing:border-box;
}

body{
background:#050816;
font-family:Inter,system-ui,sans-serif;
color:white;

display:flex;
justify-content:center;
align-items:center;

min-height:100vh;
padding:20px;
}

.card{
width:100%;
max-width:500px;

background:#0f172a;

border:1px solid #1e293b;

border-radius:24px;

padding:30px;

box-shadow:0 20px 60px rgba(0,0,0,.6);
}

.header{
text-align:center;
margin-bottom:25px;
}

.header h1{
font-size:30px;
color:#60a5fa;
margin-bottom:6px;
}

.header p{
color:#94a3b8;
font-size:14px;
}

.box{
background:#111827;
border:1px solid #1f2937;

padding:14px;

border-radius:14px;

margin-bottom:14px;
}

.label{
font-size:12px;
text-transform:uppercase;
letter-spacing:.08em;
color:#64748b;

margin-bottom:5px;
}

.value{
font-size:16px;
color:#f8fafc;
word-break:break-word;
}

.grid{
display:grid;
grid-template-columns:1fr 1fr;
gap:12px;
}

.badge{
display:inline-block;

padding:6px 10px;

border-radius:999px;

font-size:12px;
font-weight:700;
}

.green{
background:#052e16;
color:#bbf7d0;
}

.red{
background:#7f1d1d;
color:#fecaca;
}

.map{
display:block;

margin-top:18px;

width:100%;

padding:14px;

border-radius:14px;

background:#2563eb;

color:white;

text-align:center;

text-decoration:none;

font-weight:700;

transition:.2s;
}

.map:hover{
background:#3b82f6;
transform:translateY(-2px);
}

</style>
</head>

<body>

<div class="card">

<div class="header">
<h1>Acceso Registrado</h1>
<p>${data.fecha}</p>
</div>

<div class="box">
<div class="label">IP</div>
<div class="value">${data.ip}</div>
</div>

<div class="box">
<div class="label">Ubicación</div>
<div class="value">
${data.bandera} ${data.city}, ${data.region}, ${data.country}
</div>
</div>

<div class="grid">

<div class="box">
<div class="label">Latitud</div>
<div class="value">${data.lat}</div>
</div>

<div class="box">
<div class="label">Longitud</div>
<div class="value">${data.lon}</div>
</div>

</div>

<div class="box">
<div class="label">Continente</div>
<div class="value">${data.continent}</div>
</div>

<div class="box">
<div class="label">Zona Horaria</div>
<div class="value">${data.timezone}</div>
</div>

<div class="box">
<div class="label">Proveedor de Internet</div>
<div class="value">${data.isp}</div>
</div>

<div class="box">
<div class="label">ASN</div>
<div class="value">${data.asn}</div>
</div>

<div class="grid">

<div class="box">
<div class="label">Dispositivo</div>
<div class="value">📱 ${data.dispositivo}</div>
</div>

<div class="box">
<div class="label">Navegador</div>
<div class="value">🌐 ${data.navegador}</div>
</div>

</div>

<div class="grid">

<div class="box">
<div class="label">VPN</div>

<div class="value">
<span class="badge ${data.vpn ? "red" : "green"}">
${data.vpn ? "DETECTADA" : "NO"}
</span>
</div>
</div>

<div class="box">
<div class="label">Proxy</div>

<div class="value">
<span class="badge ${data.proxy ? "red" : "green"}">
${data.proxy ? "DETECTADO" : "NO"}
</span>
</div>
</div>

</div>

<div class="box">
<div class="label">TOR</div>

<div class="value">
<span class="badge ${data.tor ? "red" : "green"}">
${data.tor ? "DETECTADO" : "NO"}
</span>
</div>
</div>

<div class="box">
<div class="label">Hosting</div>

<div class="value">
<span class="badge ${data.hosting ? "red" : "green"}">
${data.hosting ? "SI" : "NO"}
</span>
</div>
</div>

<a
class="map"
target="_blank"
href="https://www.google.com/maps?q=${data.lat},${data.lon}"
>
Abrir ubicación en Google Maps
</a>

</div>

</body>
</html>
`);

  } catch (err) {
    console.error(err);

    return res.status(500).send("Internal Server Error");
  }
}
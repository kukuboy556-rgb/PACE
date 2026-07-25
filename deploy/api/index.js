const BACKEND = 'https://backend-three-zeta-62.vercel.app';

export default async (req, res) => {
  try {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const body = Buffer.concat(chunks);

    const url = BACKEND + req.url;
    const headers = {};
    for (const [k, v] of Object.entries(req.headers)) {
      if (!['host', 'connection', 'content-length', 'transfer-encoding'].includes(k)) {
        headers[k] = v;
      }
    }

    const backendRes = await fetch(url, {
      method: req.method,
      headers,
      body: body.length ? body : undefined,
      redirect: 'manual',
    });

    const resHeaders = {};
    backendRes.headers.forEach((value, key) => {
      if (key === 'set-cookie') {
        resHeaders[key] = value.replace(/; ?Secure/gi, '');
      } else if (!['connection', 'keep-alive', 'transfer-encoding'].includes(key)) {
        resHeaders[key] = value;
      }
    });

    res.statusCode = backendRes.status;
    res.writeHead(backendRes.status, resHeaders);
    res.end(await backendRes.text());
  } catch (err) {
    res.statusCode = 502;
    res.end('Bad Gateway: ' + err.message);
  }
};

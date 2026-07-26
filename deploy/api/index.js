const BACKEND = 'https://backend-three-zeta-62.vercel.app';

export default async (req, res) => {
  try {
    const url = BACKEND + req.url;
    const headers = Object.fromEntries(
      Object.entries(req.headers).filter(
        ([k]) => !['host', 'connection', 'transfer-encoding'].includes(k)
      )
    );

    const body = req.method === 'GET' || req.method === 'HEAD'
      ? undefined
      : await new Promise(r => { let d = ''; req.on('data', c => d += c); req.on('end', () => r(d || undefined)); });

    const backendRes = await fetch(url, { method: req.method, headers, body });

    const outHeaders = {};
    backendRes.headers.forEach((v, k) => {
      if (!['connection', 'keep-alive', 'transfer-encoding'].includes(k)) {
        outHeaders[k] = k === 'set-cookie' ? v.replace(/; ?Secure/gi, '') : v;
      }
    });

    res.writeHead(backendRes.status, outHeaders);
    res.end(await backendRes.text());
  } catch (err) {
    res.statusCode = 502;
    res.end('Bad Gateway: ' + err.message);
  }
};

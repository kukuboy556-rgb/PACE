import https from 'https';

const BACKEND = 'backend-three-zeta-62.vercel.app';

export default async (req, res) => {
  const opts = {
    hostname: BACKEND,
    path: req.url,
    method: req.method,
    headers: { host: BACKEND, 'content-type': req.headers['content-type'] || 'application/json' },
  };

  return new Promise((resolve) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
      const body = Buffer.concat(chunks);
      if (body.length > 0) opts.headers['content-length'] = body.length;

      const proxy = https.request(opts, (proxyRes) => {
        const resChunks = [];
        proxyRes.on('data', c => resChunks.push(c));
        proxyRes.on('end', () => {
          const resBody = Buffer.concat(resChunks);
          res.statusCode = proxyRes.statusCode;
          const headers = {};
          for (const [k, v] of Object.entries(proxyRes.headers)) {
            if (k === 'set-cookie') {
              headers[k] = Array.isArray(v) ? v.map(c => c.replace(/; Secure/gi, '')) : [v.replace(/; Secure/gi, '')];
            } else if (!['connection', 'keep-alive', 'transfer-encoding'].includes(k)) {
              headers[k] = v;
            }
          }
          res.writeHead(res.statusCode, headers);
          res.end(resBody);
          resolve();
        });
      });

      proxy.on('error', () => { res.statusCode = 502; res.end('Bad Gateway'); resolve(); });
      if (body.length > 0) proxy.write(body);
      proxy.end();
    });
  });
};

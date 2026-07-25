const http = require('http');
const https = require('https');

const BACKEND = 'backend-three-zeta-62.vercel.app';

module.exports = async (req, res) => {
  const path = req.url;
  const options = {
    hostname: BACKEND,
    path: '/api' + path,
    method: req.method,
    headers: { ...req.headers, host: BACKEND },
  };

  delete options.headers['x-forwarded-host'];
  delete options.headers['x-vercel-id'];
  delete options.headers['x-vercel-deployment-url'];
  delete options.headers['x-vercel-sc-headers'];

  return new Promise((resolve) => {
    const proxy = https.request(options, (proxyRes) => {
      const chunks = [];
      proxyRes.on('data', (c) => chunks.push(c));
      proxyRes.on('end', () => {
        const body = Buffer.concat(chunks);
        res.statusCode = proxyRes.statusCode;
        if (proxyRes.headers['set-cookie']) {
          const cookies = proxyRes.headers['set-cookie'].map(c => c.replace(/; Secure/gi, ''));
          res.setHeader('set-cookie', cookies);
        }
        res.setHeader('access-control-allow-origin', req.headers.origin || '*');
        res.setHeader('access-control-allow-credentials', 'true');
        for (const [k, v] of Object.entries(proxyRes.headers)) {
          if (!['set-cookie', 'connection', 'keep-alive', 'transfer-encoding'].includes(k)) {
            res.setHeader(k, v);
          }
        }
        res.end(body);
        resolve();
      });
    });
    proxy.on('error', () => { res.statusCode = 502; res.end('Bad Gateway'); resolve(); });
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      req.on('data', (c) => proxy.write(c));
    }
    req.on('end', () => proxy.end());
  });
};

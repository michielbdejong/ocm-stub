const https = require('https');
const fs = require('fs');
const httpProxy = require('http-proxy');

const proxy = httpProxy.createProxyServer({
  target: 'http://localhost'
});
const server = https.createServer({
	key: fs.readFileSync('/etc/letsencrypt/live/oc2.pdsinterop.net/privkey.pem'),
	cert: fs.readFileSync('/etc/letsencrypt/live/oc2.pdsinterop.net/cert.pem'),
	ca: fs.readFileSync('/etc/letsencrypt/live/oc2.pdsinterop.net/chain.pem')
}, (req, res) => {
  console.log(req.method, req.url, req.headers);
  proxy.web(req, res, {});
});
server.listen(443);


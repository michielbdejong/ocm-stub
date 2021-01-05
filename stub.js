const https = require('https');
const fs = require('fs');

const server = https.createServer({
	key: fs.readFileSync('/etc/letsencrypt/live/stub1.pdsinterop.net/privkey.pem'),
	cert: fs.readFileSync('/etc/letsencrypt/live/stub1.pdsinterop.net/cert.pem'),
	ca: fs.readFileSync('/etc/letsencrypt/live/stub1.pdsinterop.net/chain.pem')
}, (req, res) => {
	console.log(req.method, req.url, req.headers);
	req.on('data', (chunk) => {
		console.log('CHUNK', chunk.toString());
	});
	req.on('end', () => {
	  if (req.url === '/ocm-provider/') {
			console.log('yes /ocm-provider/');
			res.end(JSON.stringify({
	      enabled: true,
	      apiVersion: "1.0-proposal1",
		    "endPoint":"https://stub1.pdsinterop.net/ocm",
		    "resourceTypes":[{
			    "name":"file",
			    "shareTypes":["user","group"],
			    "protocols":{"webdav":"/public.php/webdav/"
			    }
		    }]
	    }));
		} else if (req.url === '/ocm/shares') {
			console.log('yes /ocm/shares');
	    res.writeHead(201);
	    res.end('Created');
		} else if (req.url.startsWith('/publicLink')) {
			console.log('yes publicLink');
			res.end('yes publicLink');
		} else if (req.url.startsWith('/shareWith')) {
			console.log('yes shareWith');
			res.end('yes shareWith');
		} else if (req.url.startsWith('/acceptShare')) {
			console.log('yes acceptShare');
			res.end('yes acceptShare');
		} else if (req.url.startsWith('/deleteAcceptedShare')) {
			console.log('yes deleteAcceptedShare');
			res.end('yes deleteAcceptedShare');
		} else {
			console.log('not recognized');
	    res.end('OK');
	  }
	});
});
server.listen(443);


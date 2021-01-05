const https = require('https');
const fs = require('fs');

function sendHTML(res, text) {
	res.end(`<!DOCTYPE html><html><head></head><body>${text}</body></html>`);
}

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
	    sendHTML(res, 'Created');
		} else if (req.url.startsWith('/publicLink')) {
			console.log('yes publicLink');
			sendHTML(res, 'yes publicLink');
		} else if (req.url.startsWith('/shareWith')) {
			console.log('yes shareWith');
			sendHTML(res, 'yes shareWith');
		} else if (req.url.startsWith('/acceptShare')) {
			console.log('yes acceptShare');
			sendHTML(res, 'yes acceptShare');
		} else if (req.url.startsWith('/deleteAcceptedShare')) {
			console.log('yes deleteAcceptedShare');
			sendHTML(res, 'yes deleteAcceptedShare');
		} else {
			console.log('not recognized');
	    sendHTML(res, 'OK');
	  }
	});
});
server.listen(443);


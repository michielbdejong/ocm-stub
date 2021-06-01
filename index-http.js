const http = require('http');

const server = http.createServer((req, res) => {
	console.log(req.method, req.url, req.headers);
	req.on('data', (chunk) => {
		console.log('CHUNK', chunk.toString());
	});
	req.on('end', () => {
	  if (req.url === '//ocs-provider/') {
            console.log('yes //ocs-provider/');
            res.end(JSON.stringify({
              version: 2,
              services: {
                FEDERATED_SHARING: {
                  version: 1,
                    endpoints: {
                      share: "/ocs/v2.php/cloud/shares",
                      webdav: "/public.php/webdav/"
                    }
                  },
                }
	    }));
          } else {
            console.log('not recognized');
	    res.end('OK');
	  }
	});
});
server.listen(3000);


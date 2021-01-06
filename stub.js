const https = require('https');
const fs = require('fs');
const fetch = require('node-fetch');

function sendHTML(res, text) {
	res.end(`<!DOCTYPE html><html><head></head><body>${text}</body></html>`);
}

// singleton global, naively assume only one share exists at a time:
let obj = {};

async function notifyProvider(notif) {
	let provider = obj.sharedBy.split('@')[1].replace('\/', '/');
	if (!provider.startsWith('https://')) {
		provider = `https://${provider}`;
	}
	if (!provider.endsWith('/')) {
		provider = `${provider}/`;
	}
	console.log('fetching', `${provider}ocm-provider/`);
	const configResult = await fetch(`${provider}ocm-provider/`);

	config = await configResult.json();
	const postRes = await fetch(`${config.endPoint}/notifications`, {
		method: 'POST',
		body: JSON.stringify(notif)
	});
	console.log('notification sent!', postRes.status, await postRes.text());
}

const server = https.createServer({
	key: fs.readFileSync('/etc/letsencrypt/live/stub1.pdsinterop.net/privkey.pem'),
	cert: fs.readFileSync('/etc/letsencrypt/live/stub1.pdsinterop.net/cert.pem'),
	ca: fs.readFileSync('/etc/letsencrypt/live/stub1.pdsinterop.net/chain.pem')
}, async (req, res) => {
	console.log(req.method, req.url, req.headers);
	let bodyIn = '';
	req.on('data', (chunk) => {
		console.log('CHUNK', chunk.toString());
		bodyIn += chunk.toString();
	});
	req.on('end', async () => {
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
			try {
				obj = JSON.parse(bodyIn);
			} catch (e) {
				res.writeHead(400);
				sendHTML(res, 'Cannot parse JSON');
			}
			// {
			// 	shareWith: "admin@https:\/\/stub1.pdsinterop.net",
			// 	shareType: "user",
			// 	name: "Reasons to use Nextcloud.pdf",
			// 	resourceType: "file",
			// 	description:"",
			// 	providerId:202,
			// 	owner: "alice@https:\/\/nc1.pdsinterop.net\/",
			// 	ownerDisplayName: "alice",
			// 	sharedBy: "alice@https:\/\/nc1.pdsinterop.net\/",
			// 	sharedByDisplayName":"alice",
			// 	"protocol":{
			// 		"name":"webdav",
			// 		"options":{
			// 			"sharedSecret":"lvns5N9ZXm1T1zx",
			// 			"permissions":"{http:\/\/open-cloud-mesh.org\/ns}share-permissions"
			// 		}
			// 	}
			// }
			// obj.id = obj.providerId;
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
			try {
				console.log('Creating notif to accept share, obj =', obj);
				const notif = {
					type: 'SHARE_ACCEPTED',
					resourceType: obj.resourceType,
					providerId: obj.providerId,
					notification: {
						sharedSecret: obj.protocol.options.sharedSecret,
						message: 'Recipient accepted the share'
					}
				};
				notifyProvider(notif);
			} catch (e) {
				console.error(e);
				sendHTML(res, `no acceptShare - fail`);
			}
			sendHTML(res, 'yes acceptShare');
		} else if (req.url.startsWith('/deleteAcceptedShare')) {
			console.log('yes deleteAcceptedShare');
			const notif = {
				type: 'SHARE_DECLINED',
				message: 'I don\'t want to use this share anymore.',
				id: obj.id,
				createdAt: new Date()
			};
			// When unshared from the provider side:
			// {
			// 	"notificationType":"SHARE_UNSHARED",
			// 	"resourceType":"file",
			// 	"providerId":"89",
			// 	"notification":{
			// 		"sharedSecret":"N7epqXHRKXWbg8f",
			// 		"message":"File was unshared"
			// 	}
			// }
			console.log('deleting share', obj);
			try {
				notifyProvider(notif);
			} catch (e) {
				sendHTML(res, `no deleteAcceptedShare - fail ${provider}ocm-provider/`);
			}
			sendHTML(res, 'yes deleteAcceptedShare');
		} else if (req.url == '/') {
			console.log('yes a/', obj);
			sendHTML(res, 'yes /' + JSON.stringify(obj, null, 2));
		} else {
			console.log('not recognized');
	    sendHTML(res, 'OK');
	  }
	});
});
server.listen(443);


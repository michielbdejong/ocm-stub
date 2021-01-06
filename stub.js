const https = require('https');
const fs = require('fs');
const fetch = require('node-fetch');

const SERVER_HOST = 'stub1.pdsinterop.net';
const SERVER_ROOT = `https://${SERVER_HOST}`;
const USER = `admin@${SERVER_ROOT}`;

function sendHTML(res, text) {
	res.end(`<!DOCTYPE html><html><head></head><body>${text}</body></html>`);
}

// singleton global, naively assume only one share exists at a time:
let mostRecentShareIn = {};

async function getServerConfig(otherUser) {
	let otherServer = otherUser.split('@')[1].replace('\/', '/');
	if (!otherServer.startsWith('https://')) {
		otherServer = `https://${otherServer}`;
	}
	if (!otherServer.endsWith('/')) {
		otherServer = `${otherServer}/`;
	}
	console.log('fetching', `${otherServer}ocm-provider/`);
	const configResult = await fetch(`${otherServer}ocm-provider/`);

	return configResult.json();
}

async function notifyProvider(obj, notif) {
	const config = await getServerConfig(obj.sharedBy || obj.sender || obj.owner);
	const postRes = await fetch(`${config.endPoint}/notifications`, {
		method: 'POST',
		body: JSON.stringify(notif)
	});
	console.log('notification sent!', postRes.status, await postRes.text());
}

async function createShare(consumer) {
	console.log('createShare', consumer);
	const config = await getServerConfig(consumer);
  console.log(config);
	const postRes = await fetch(`${config.endPoint}/shares`, {
		method: 'POST',
		body: JSON.stringify({
			shareWith: consumer,
			name: 'Test share from stub',
			providerId: 42,
			owner: USER,
			ownerDisplayName: 'admin',
			sender: USER,
			senderDisplayName: 'admin',
			shareType: 'user',
			resourceType: 'file',
			protocol: { name: 'webdav', options: { sharedSecret: 'shareMe' } }
		})
	});
	console.log('outgoing share created!', postRes.status, await postRes.text());
}
const server = https.createServer({
	key: fs.readFileSync(`/etc/letsencrypt/live/${SERVER_HOST}/privkey.pem`),
	cert: fs.readFileSync(`/etc/letsencrypt/live/${SERVER_HOST}/cert.pem`),
	ca: fs.readFileSync(`/etc/letsencrypt/live/${SERVER_HOST}/chain.pem`)
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
	      apiVersion: '1.0-proposal1',
		    endPoint: `${SERVER_ROOT}/ocm`,
		    resourceTypes: [
					{
			      name: 'file',
			      shareTypes: [ 'user', 'group' ],
			      protocols: { webdav: '/webdav/' }
			    }
		    ]
	    }));
		} else if (req.url === '/ocm/shares') {
			console.log('yes /ocm/shares');
			try {
				mostRecentShareIn = JSON.parse(bodyIn);
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
			const urlObj = new URL(req.url, SERVER_ROOT);
			createShare(decodeURIComponent(urlObj.search).substring(1));
			sendHTML(res, 'yes shareWith');
		} else if (req.url.startsWith('/acceptShare')) {
			console.log('yes acceptShare');
			try {
				console.log('Creating notif to accept share, obj =', mostRecentShareIn);
				const notif = {
					type: 'SHARE_ACCEPTED',
					resourceType: mostRecentShareIn.resourceType,
					providerId: mostRecentShareIn.providerId,
					notification: {
						sharedSecret: mostRecentShareIn.protocol.options.sharedSecret,
						message: 'Recipient accepted the share'
					}
				};
				notifyProvider(mostRecentShareIn, notif);
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
				id: mostRecentShareIn.id,
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
			console.log('deleting share', mostRecentShareIn);
			try {
				notifyProvider(mostRecentShareIn, notif);
			} catch (e) {
				sendHTML(res, `no deleteAcceptedShare - fail ${provider}ocm-provider/`);
			}
			sendHTML(res, 'yes deleteAcceptedShare');
		} else if (req.url == '/') {
			console.log('yes a/', mostRecentShareIn);
			sendHTML(res, 'yes /' + JSON.stringify(mostRecentShareIn, null, 2));
		} else {
			console.log('not recognized');
	    sendHTML(res, 'OK');
	  }
	});
});
server.listen(443);


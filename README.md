# ocm-stub
Stub server for testing Open Cloud Mesh (OCM) https://github.com/cs3org/OCM-API

Runs on https://stub1.pdsinterop.net to support https://github.com/michielbdejong/ocm-test-suite/actions

```sh
mkdir -p ../tls
openssl req -new -x509 -days 365 -nodes \
  -out ../tls/server.crt \
  -keyout ../tls/server.key \
  -subj "/C=RO/ST=Bucharest/L=Bucharest/O=IT/CN=www.example.ro"
node stub.js
```

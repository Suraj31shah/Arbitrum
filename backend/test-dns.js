const dns = require('dns');

dns.setServers(['8.8.8.8', '1.1.1.1']);

dns.resolveSrv('_mongodb._tcp.cluster0.nnk5ntz.mongodb.net', (err, addresses) => {
  if (err) {
    console.error("DNS Resolution failed:", err);
  } else {
    console.log("Resolved Addresses:", addresses);
  }
});

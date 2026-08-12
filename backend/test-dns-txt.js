const dns = require('dns');

dns.setServers(['8.8.8.8', '1.1.1.1']);

dns.resolveTxt('cluster0.nnk5ntz.mongodb.net', (err, records) => {
  if (err) {
    console.error("DNS Resolution failed:", err);
  } else {
    console.log("Resolved TXT:", records);
  }
});

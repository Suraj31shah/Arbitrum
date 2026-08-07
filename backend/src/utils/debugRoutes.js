const app = require('../app');

if (!app._router) {
  console.log('no router');
  process.exit(0);
}

const routes = app._router.stack
  .filter((layer) => layer.route)
  .map((layer) => ({
    path: layer.route.path,
    methods: layer.route.methods
  }));

console.log(JSON.stringify(routes, null, 2));

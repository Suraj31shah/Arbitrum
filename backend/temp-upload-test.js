const express = require('express');
const http = require('http');
const proofRoutes = require('./src/routes/proofRoutes');

const app = express();
app.use(express.json());
app.use('/', proofRoutes);

const server = app.listen(0, () => {
  const { port } = server.address();
  const boundary = 'boundary';
  const payload = `--${boundary}\r\nContent-Disposition: form-data; name="goalId"\r\n\r\nabc123\r\n--${boundary}\r\nContent-Disposition: form-data; name="description"\r\n\r\nTest upload\r\n--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="test.png"\r\nContent-Type: image/png\r\n\r\nabc\r\n--${boundary}--\r\n`;

  const req = http.request(
    {
      host: '127.0.0.1',
      port,
      path: '/api/proofs',
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      }
    },
    (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        console.log('STATUS=' + res.statusCode);
        console.log(data);
        server.close();
      });
    }
  );

  req.write(payload);
  req.end();
});

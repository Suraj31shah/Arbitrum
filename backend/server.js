const app = require('./src/app');

// Start the Express server on port 5000
const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

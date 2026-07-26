require('dotenv').config();
const app = require('./app');

process.on('unhandledRejection', (err) => {
  console.error('Unhandled promise rejection:', err);
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`PACE backend running on port ${PORT}`);
});

require('dotenv').config();
const app = require('./app');
const connectDB = require('./src/config/db');
const seedDatabase = require('./src/seed/seedData');
const { applyInactivityCheck } = require('./src/utils/inactivityHelper');

const PORT = process.env.PORT || 5000;

async function startServer() {
  await connectDB();
  await seedDatabase(false);
  await applyInactivityCheck();

  const server = app.listen(PORT, () => {
    console.log(`✅  AlumniConnect backend running on http://localhost:${PORT}`);
    console.log(`   → Connected to MongoDB. Database ready.`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌  Port ${PORT} is already in use by another process.`);
      console.error(`    Please terminate the other running backend instance first.`);
    } else {
      console.error('❌  Server error:', err.message);
    }
    process.exit(1);
  });
}

startServer().catch(err => {
  console.error('❌  Failed to start server:', err);
  process.exit(1);
});

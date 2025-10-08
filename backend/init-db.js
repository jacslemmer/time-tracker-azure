const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
  connectionString: 'postgresql://pgadmin:TimeTrack2025!Secure@time-tracker-app.eastus.azurecontainer.io:5432/timetracker'
});

async function initDatabase() {
  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL');

    const schemaSQL = fs.readFileSync(
      path.join(__dirname, '..', 'database', 'schema.sql'),
      'utf8'
    );

    await client.query(schemaSQL);
    console.log('✅ Schema created successfully');

    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

initDatabase();

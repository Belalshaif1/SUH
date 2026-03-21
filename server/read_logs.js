const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres.dnmqppyvqbmjdbqkohhn:Bilalshaif1@aws-1-ap-south-1.pooler.supabase.com:6543/postgres'
});

async function readLogs() {
  try {
    const res = await pool.query('SELECT * FROM error_logs ORDER BY created_at DESC LIMIT 20;');
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

readLogs();

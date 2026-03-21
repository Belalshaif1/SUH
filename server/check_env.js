const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
console.log('PORT:', process.env.PORT);
console.log('DATABASE_URL starts with:', process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 20) + '...' : 'UNDEFINED');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT 1').then(() => console.log('✅ Connection Test Success')).catch(err => console.error('❌ Connection Test Failed:', err.message)).finally(() => pool.end());

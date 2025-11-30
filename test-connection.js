import pool from './config/db.js';

/**
 * Test database connection
 */
async function testConnection() {
  try {
    console.log('🔄 Testing database connection...\n');
    
    const result = await pool.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('✅ Connection successful!');
    console.log('📅 Current time:', result.rows[0].current_time);
    console.log('🐘 PostgreSQL version:', result.rows[0].pg_version.split(' ')[0] + ' ' + result.rows[0].pg_version.split(' ')[1]);
    
    // Check if tables exist
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log(`\n📊 Found ${tablesResult.rows.length} tables:`);
    tablesResult.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.table_name}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('\n💡 Make sure:');
    console.error('   1. PostgreSQL is running (brew services start postgresql@14)');
    console.error('   2. Database "divyastrodb_dev" exists');
    console.error('   3. .env file has correct credentials');
    process.exit(1);
  }
}

testConnection();


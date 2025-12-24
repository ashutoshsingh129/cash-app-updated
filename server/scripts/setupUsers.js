const bcrypt = require("bcryptjs");
const { pool } = require("../config/database");
const { encryptPassword } = require("../utils/passwordEncryption");

const setupUsers = async () => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email 
      ON users(email)
    `);

    const users = [
      {
        email: "admin@example.com",
        password: "password123",
        name: "Admin User",
        role: "admin",
      },
    ];

    let createdCount = 0;
    let existingCount = 0;

    for (const userData of users) {
      const existingUser = await client.query(
        "SELECT id FROM users WHERE email = $1",
        [userData.email]
      );

      if (existingUser.rows.length === 0) {
        const encryptedPassword = encryptPassword(userData.password);
        const hashedPassword = await bcrypt.hash(encryptedPassword, 10);

        await client.query(
          "INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4)",
          [userData.email, hashedPassword, userData.name, userData.role]
        );

        console.log(`✅ User created: ${userData.email} (${userData.name})`);
        createdCount++;
      } else {
        // Update existing user password to use new deterministic encryption
        console.log(`🔄 Updating password for existing user: ${userData.email}`);
        const encryptedPassword = encryptPassword(userData.password);
        const hashedPassword = await bcrypt.hash(encryptedPassword, 10);
        
        await client.query(
          "UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE email = $2",
          [hashedPassword, userData.email]
        );
        
        console.log(`✅ Password updated: ${userData.email}`);
        existingCount++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   - Created: ${createdCount} users`);
    console.log(`   - Already existed: ${existingCount} users`);
    console.log(`\n🔑 Login credentials:`);
    console.log(`   - Admin: admin@example.com / password123`);

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error setting up users:", error);
    throw error;
  } finally {
    client.release();
  }
};

const runSetup = async () => {
  try {
    console.log("🚀 Setting up users table and demo users...");
    await setupUsers();
    console.log("✅ Setup completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Setup failed:", error);
    process.exit(1);
  }
};

if (require.main === module) {
  runSetup();
}

module.exports = { setupUsers };


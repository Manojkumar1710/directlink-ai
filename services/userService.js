const { randomUUID } = require("crypto");
const pool = require("../db");

async function findOrCreateUser(phone, role) {
  const existingUser = await pool.query(
    "SELECT id, phone_number, name, role FROM users WHERE phone_number = $1",
    [phone]
  );

  if (existingUser.rows.length > 0) {
    const user = existingUser.rows[0];

    if (user.role !== role) {
      throw new Error("Phone number is already registered with another role");
    }

    return user;
  }

  const userId = randomUUID();

  const result = await pool.query(
    `INSERT INTO users (id, phone_number, name, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, phone_number, name, role`,
    [userId, phone, `User ${phone}`, role]
  );

  return result.rows[0];
}

module.exports = {
  findOrCreateUser,
};
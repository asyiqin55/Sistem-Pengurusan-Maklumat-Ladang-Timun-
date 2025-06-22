import postgres from 'postgres';

let sql;

if (process.env.NODE_ENV === 'production') {
  sql = postgres(process.env.DATABASE_URL, {
    ssl: { rejectUnauthorized: false },
    max: 20,
    idle_timeout: 20,
    connect_timeout: 10,
  });
} else {
  if (!global.sql) {
    global.sql = postgres(process.env.DATABASE_URL, {
      ssl: { rejectUnauthorized: false },
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
    });
  }
  sql = global.sql;
}

export default sql;
export { sql };
import pg from 'pg';
const { Pool } = pg;

console.log('Connecting to PostgreSQL database');
// console.log(`Host: ${process.env.DB_HOST || 'localhost'}`);
// console.log(`Port: ${process.env.DB_PORT || '5432'}`);
// console.log(`Database: ${process.env.DB_NAME || 'banking_system'}`);
// console.log(`User: ${process.env.DB_USER || 'postgres'}`);

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

pool.on('connect', () => {
  console.log('Connected to the PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on PostgreSQL connection:', err.message);
  if (err.code === 'ECONNREFUSED') {
    console.error('Database connection was refused. Please check if PostgreSQL server is running.');
  } else if (err.code === '28P01') {
    console.error('Authentication failed. Please check database username and password.');
  } else if (err.code === '3D000') {
    console.error('Database does not exist. Please create the database first.');
  }
});

const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('Successfully connected to PostgreSQL database');
    client.release();
    return true;
  } catch (err) {
    console.error('Failed to connect to PostgreSQL database:', err.message);
    if (err.code === 'ECONNREFUSED') {
      console.error('Database connection was refused. Please check if PostgreSQL server is running.');
    } else if (err.code === '28P01') {
      console.error('Authentication failed. Please check database username and password.');
    } else if (err.code === '3D000') {
      console.error('Database does not exist. Please create the database first.');
    }
    return false;
  }
};

testConnection();

const db = {
  query: async (text, params) => {
    try {
      return await pool.query(text, params);
    } catch (err) {
      console.error('Database query error:', err.message);
      console.error('Query:', text);
      console.error('Params:', params);
      throw err; 
    }
  },
  getClient: async () => {
    const client = await pool.connect();
    const query = client.query;
    const release = client.release;

    const timeout = setTimeout(() => {
      console.error('A client has been checked out for more than 5 seconds!');
      console.error(`The last executed query on this client was: ${client.lastQuery}`);
    }, 5000);

    client.query = (...args) => {
      client.lastQuery = args;
      return query.apply(client, args);
    };

    client.release = () => {
      clearTimeout(timeout);
      client.query = query;
      client.release = release;
      return release.apply(client);
    };

    return client;
  },
  pool,
  testConnection,
};

export default db; 
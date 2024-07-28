import pg from 'pg'

const { Pool } = pg

export default new Pool({
  connectionString: process.env.PG_URI,
})

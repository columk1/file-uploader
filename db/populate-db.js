#! /usr/bin/env node

import { argv } from 'node:process'
import pg from 'pg'
const { Client } = pg

const SQL = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  username TEXT,
  password TEXT
);
`

async function main() {
  try {
    console.log('seeding...')
    const client = new Client({
      // connectionString: process.env.PG_URI,
      connectionString: argv[2],
    })
    await client.connect()
    await client.query(SQL)
    await client.end()
    console.log('done')
  } catch (err) {
    console.log(err)
  }
}

main()

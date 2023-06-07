const { Pool, Client } = require('pg')
const connectionString = 'postgressql://postgres:postgres@localhost:5432/santaferia'
const client = new Client({
	connectionString: connectionString
})
client.connect();

export default client;

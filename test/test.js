

const assert = require('assert');
// get the client
const mysql = require('mysql2');
const dbcompare = require('../models/dbcompare')

require('dotenv').config(); // loads environment variables from .env file (if available - eg dev env)

before('Run Before')

describe('Test Suite', function() {
  describe('Database()', function() {
    it('should connect to database', async function() {
      // create the connection to database
      const connection = await mysql.createConnection({
        // host: process.env.DB_COMPARE_1_HOST,
        // port: process.env.DB_COMPARE_1_PORT || 3306,
        // user: process.env.DB_COMPARE_1_USER,
        // password: process.env.DB_COMPARE_1_PASSWORD,
        database: process.env.DB_COMPARE_1_DATABASE,
        charset: 'utf8mb4',
      });
      // console.log(connection.stream.connecting);
      assert.equal(connection.stream.connecting, true);
      connection.close();
    });
    it('isEmpty should return true for empty object', async function() {
      const obj = {};
      const response = await dbcompare.isEmpty(obj);
      assert.equal(response, true);
    });
    it('isEmpty should return false for non-empty object', async function() {
      const obj = {name: "name"};
      const response = await dbcompare.isEmpty(obj);
      assert.equal(response, false);
    });
  });
});
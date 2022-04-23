module.exports = async () => {

  const dotenv = require('dotenv');
  const fs = require('fs');

  dotenv.config({
    path: process.env.NODE_ENV
      ? (fs.existsSync("./.env." + process.env.NODE_ENV) ? ("./.env." + process.env.NODE_ENV) : "./.env")
      : "./.env"
  });

}
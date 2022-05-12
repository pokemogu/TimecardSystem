module.exports = () => {

  const dotenv = require('dotenv');
  const fs = require('fs');
  const path = require('path');

  // MySQLの接続情報を読み込む
  dotenv.config({
    path: process.env.NODE_ENV
      ? (fs.existsSync(".env." + process.env.NODE_ENV) ? (".env." + process.env.NODE_ENV) : ".env")
      : ".env"
  });

  // MySQLのrootパスワードを読み込む
  if (fs.existsSync(path.join('mysql', '.env'))) {
    dotenv.config({ path: path.join('mysql', '.env') });
  }
}
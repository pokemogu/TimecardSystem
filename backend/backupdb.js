const path = require('path');
const readline = require('readline');
const fs = require('fs');
const childProcess = require('child_process');
const dotenv = require('dotenv');

function waitForInput() {
  return new Promise(function (resolve) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question('Enterキーを押して終了してください。', function (ans) {
      rl.close();
      resolve();
    });
  });
}

dotenv.config({
  path: process.env.NODE_ENV
    ? (fs.existsSync('.env.' + process.env.NODE_ENV) ? ('.env.' + process.env.NODE_ENV) : '.env')
    : '.env'
});

const backupPath = path.join(__dirname, 'dbbackup');
if (!fs.existsSync(backupPath)) {
  fs.mkdirSync(backupPath);
}

if (!process.env.DB_HOST || !process.env.DB_PORT || !process.env.DB_HOST || !process.env.DB_NAME || !process.env.DB_USER | !process.env.DB_PASSWORD) {
  console.error('データベース接続設定がされていません。');
  process.exitCode = 1;
}
else {
  const date = new Date();
  const dateStr =
    date.getFullYear().toString() +
    (date.getMonth() + 1).toString().padStart(2, '0') +
    date.getDate().toString().padStart(2, '0') +
    date.getHours().toString().padStart(2, '0') +
    date.getMinutes().toString().padStart(2, '0') +
    date.getSeconds().toString().padStart(2, '0');

  const backupFilePath = path.join(backupPath, `${process.env.DB_NAME}${dateStr}.sql`);
  const mysqldumpArgs = [
    '-y',
    '-u', process.env.DB_USER,
    `-p${process.env.DB_PASSWORD}`,
    '-h', process.env.DB_HOST,
    '-P', process.env.DB_PORT,
    process.env.DB_NAME,
    '-r', backupFilePath
  ];

  childProcess.execFileSync('mysqldump', mysqldumpArgs);

  console.info('データベースのバックアップが完了しました。');
  console.info(`バックアップされたファイルは ${backupFilePath} です。`);
}

if (process?.argv && process.argv?.length && process.argv.length >= 3) {
  if (process.argv[2] === 'wait') {
    (async function () {
      await waitForInput();
    })();
  }
}
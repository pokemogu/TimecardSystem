const path = require('path');
const fs = require('fs');
const os = require('os');
const mysql2 = require('mysql2/promise');
const { Toggle, Input, NumberPrompt, Password } = require('enquirer');

//const readlineSync = require('readline-sync');

/**
 * @param {string} dbHost
 * @param {number} dbPort
 * @param {string} dbUser
 * @param {string} dbPass
 * @param {string} dbName
 */
async function connectMySQL(dbHost, dbPort, dbUser, dbPass, dbName = undefined) {
  return await mysql2.createConnection({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPass,
    database: dbName
  });
}

/**
 * @param {mysql2.Connection} conn
 * @param {string} dbName
 * @param {string} dbUser
 * @param {string} dbPass
 */
async function createMySQLDatabase(conn, dbName, dbUser, dbPass) {
  await conn.execute(`CREATE DATABASE ${dbName} IF NOT EXISTS`);
  await conn.execute(`CREATE USER '${dbUser}'@'%' IF NOT EXISTS IDENTIFIED BY '${dbPass}'`);
  await conn.execute(`GRANT ALL PRIVILEGES ON ${dbName}.* TO '${dbUser}'@'%'`)
  await conn.execute(`FLUSH PRIVILEGES`);
}
const dotEnvBackendAppPath = path.join(__dirname, '.env');
const config = {};

if (fs.existsSync(dotEnvBackendAppPath)) {
  const dotEnvBackendApp = fs.readFileSync(dotEnvBackendAppPath, 'utf8');
  dotEnvBackendApp.split(/\r?\n/).forEach(line => {
    const keyValue = line.split('=', 2);
    if (keyValue.length === 2) {
      config[keyValue[0]] = keyValue[1];
    }
  });
}

// デフォルト値をセットする
if (!('NODE_HOST' in config)) {
  config['NODE_HOST'] = 'localhost';
}
if (!('NODE_PORT' in config)) {
  config['NODE_PORT'] = '3000';
}
if (!('NODE_BACKLOG' in config)) {
  config['NODE_BACKLOG'] = '20';
}
if (!('DB_HOST' in config)) {
  config['DB_HOST'] = 'localhost';
}
if (!('DB_PORT' in config)) {
  config['DB_PORT'] = 3306;
}
if (!('DB_NAME' in config)) {
  config['DB_NAME'] = 'timecard';
}
if (!('DB_USER' in config)) {
  config['DB_USER'] = 'timecard-app';
}
if (!('DB_PASSWORD' in config)) {
  config['DB_PASSWORD'] = 'P@ssw0rd';
}

(async function () {

  try {
    const connUser = await connectMySQL(
      config['DB_HOST'], parseInt(config['DB_PORT']), config['DB_USER'], config['DB_PASSWORD'], config['DB_NAME'] + '0'
    );
    console.info('データベースへの接続が確認できました。');
    connUser.end();
  }
  catch (error) {
    while (true) {
      if (await (new Toggle({ initial: true, enabled: 'はい', disabled: 'いいえ', message: 'データベースへの接続ができません。データベース接続の設定を行ないますか?' }).run())) {

        const dbHost = await (new Input({
          initial: config['DB_HOST'],
          message: 'データベースサーバーのホスト名あるいはIPアドレスを入力してエンターキーを押してください。'
        }).run());

        const dbPort = await (new NumberPrompt({
          initial: parseInt(config['DB_PORT']),
          message: 'データベースサーバーのポート番号を入力してエンターキーを押してください。'
        }).run());

        const dbRootUser = await (new Input({
          initial: 'root',
          message: 'データベースサーバーへの接続rootユーザー名を入力してエンターキーを押してください。'
        }).run());

        const dbRootPassword = await (new Password({
          initial: '',
          message: 'データベースサーバーへの接続rootパスワードを入力してエンターキーを押してください。'
        }).run());

        try {
          const connRoot = await connectMySQL(dbHost, dbPort, dbRootUser, dbRootPassword);
          if (await (new Toggle({ initial: true, enabled: 'はい', disabled: 'いいえ', message: 'データベースへのroot接続が確認できました。データベースを初期化しますか?' }).run())) {
          }
        }
        catch {
          continue;
        }
      }
      else {
        /** @type {string|undefined} */
        const code = error.code;
        if (code) {
          switch (code) {
            case 'ENOTFOUND':
              console.error('データベース接続用のIPアドレスもしくはホスト名の設定が間違っている可能性があります。');
              break;
            case 'ER_ACCESS_DENIED_ERROR':
              console.error('データベース接続用のユーザー名もしくはパスワードの設定が間違っている可能性があります。');
              break;
            case 'ER_DBACCESS_DENIED_ERROR':
              console.error('データベース接続用のデータベース名の設定が間違っている可能性があります。');
              break;
            case 'ECONNREFUSED':
              console.error('データベース接続用のポート番号の設定が間違っているか、ネットワークファイアウォールで接続が拒否されている可能性があります。');
              break;
          }
        }
        console.error(error.message);
      }
    }
  }
})();

/*
while (true) {

  if (!readlineSync.keyInYNStrict('アプリケーションサーバーの設定を行ないます。続けますか?')) {
    process.exit(0);
  }
  console.log('\n以下の質問に対して設定値を入力してエンターキーを押してください。何も入力せずにエンターキーを押すと()で囲まれた値に設定されます。\n');

  config['NODE_HOST'] = readlineSync.question(
    'アプリケーションサーバーが接続を受けるホスト名あるいはIPアドレスを入力してエンターキーを押してください($<defaultInput>): ',
    { defaultInput: config['NODE_HOST'] }
  );

  config['NODE_PORT'] = readlineSync.question(
    'アプリケーションサーバーが接続を受けるポート番号を入力してエンターキーを押してください($<defaultInput>): ',
    { defaultInput: config['NODE_PORT'] }
  );

  config['NODE_BACKLOG'] = readlineSync.question(
    'アプリケーションサーバーが許可する最大接続数を入力してエンターキーを押してください($<defaultInput>): ',
    { defaultInput: config['NODE_BACKLOG'] }
  );

  config['DB_HOST'] = readlineSync.question(
    'データベースサーバーのホスト名あるいはIPアドレスを入力してエンターキーを押してください($<defaultInput>): ',
    { defaultInput: config['DB_HOST'] }
  );

  config['DB_PORT'] = readlineSync.questionInt(
    'データベースサーバーのポート番号を入力してエンターキーを押してください($<defaultInput>): ',
    { defaultInput: config['DB_PORT'] }
  );

  config['DB_NAME'] = readlineSync.question(
    'データベース名を入力してエンターキーを押してください($<defaultInput>): ',
    { defaultInput: config['DB_NAME'] }
  );

  config['DB_ROOT_USER'] = readlineSync.question(
    'データベースサーバーへの接続rootユーザー名を入力してエンターキーを押してください($<defaultInput>): ',
    { defaultInput: config['DB_ROOT_USER'] }
  );

  config['DB_ROOT_PASSWORD'] = readlineSync.question(
    'データベースサーバーへの接続rootパスワードを入力してエンターキーを押してください(変更しない場合は何も入力しないでエンターキーを押してください): ',
    { defaultInput: config['DB_ROOT_PASSWORD'], hideEchoBack: true }
  );

  console.log('\n');
  if (readlineSync.keyInYNStrict('以上の設定を保存しますか?')) {
    let configStr = '';
    for (const key in config) {
      configStr += '' + key + '=' + config[key] + '\n';
    }
    fs.writeFileSync(dotEnvBackendAppPath, configStr);
    console.log('設定の保存が完了しました。');
  }
  console.log('\n');

  if (readlineSync.keyInYNStrict('サービスを再起動しますか?')) {
    const svc = require('./windows-service').svc;
    const startService = require('./windows-service').startService;
    const stopService = require('./windows-service').stopService;

    stopService(svc);
    startService(svc);
  }

  if (readlineSync.keyInYNStrict('設定を終了しますか?')) {
    process.exit(0);
  }

}
*/
const path = require('path');
const fs = require('fs');
const knexconfig = require('./knexfile');
const mysql2 = require('mysql2/promise');
const colors = require('ansi-colors');
const { Toggle, Input, NumberPrompt, Password, Select } = require('enquirer');

function saveEnv(configDict, savePath) {
  let configStr = '';
  for (const key in configDict) {
    configStr += '' + key + '=' + configDict[key] + '\n';
  }
  fs.writeFileSync(savePath, configStr);
}

/**
 * @param { string } dbHost
 * @param { number } dbPort
 * @param { string } dbUser
 * @param { string } dbPass
 * @param { string | undefined } dbName
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
 * @param { mysql2.Connection } conn
 * @param { string } dbName
 * @param { string } dbUser
 * @param { string } dbPass
 */
async function createMySQLDatabase(conn, dbName, dbUser, dbPass) {
  await conn.execute(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
  await conn.execute(`DROP USER IF EXISTS '${dbUser}'@'%'`);
  await conn.execute(`CREATE USER IF NOT EXISTS '${dbUser}'@'%' IDENTIFIED BY '${dbPass}'`);
  await conn.execute(`GRANT ALL PRIVILEGES ON ${dbName}.* TO '${dbUser}'@'%'`)
  await conn.execute(`FLUSH PRIVILEGES`);
}

/**
 * @param { mysql2.Connection } conn
 * @param { string } dbName
 * @param { string } dbUser
 */
async function dropMySQLDatabase(conn, dbName, dbUser) {
  await conn.execute(`DROP USER IF EXISTS '${dbUser}'@'%'`);
  await conn.execute(`DROP DATABASE IF EXISTS ${dbName}`);
}

/** @param {string|undefined} code */
function showErrorForMySQLConnectionFailure(code) {
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
}

const config = {};
// デフォルト値をセットする
if (!('NODE_ENV' in config)) {
  config['NODE_ENV'] = 'production';
}
if (!('NODE_PORT' in config)) {
  config['NODE_PORT'] = '3000';
}
if (!('NODE_AUDIT' in config)) {
  config['NODE_AUDIT'] = 'false';
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

const dotEnvBackendAppPath = path.join(__dirname, '.env');

// .envファイルが存在するなら読み込む
if (fs.existsSync(dotEnvBackendAppPath)) {
  const dotEnvBackendApp = fs.readFileSync(dotEnvBackendAppPath, 'utf8');
  dotEnvBackendApp.split(/\r?\n/).forEach(line => {
    const keyValue = line.split('=', 2);
    if (keyValue.length === 2) {
      config[keyValue[0]] = keyValue[1];
    }
  });
}
// .envファイルが存在しない場合はデフォルト値で作成する
else {
  saveEnv(config, dotEnvBackendAppPath);
}


(async function () {

  while (true) {
    let menuSelect = '';
    try {
      menuSelect = await (new Select({
        name: 'menu',
        message: '設定メニュー',
        choices: ['データベース接続設定', 'データベース作成', 'データベース削除', 'データベース接続テスト', 'データベーススキーマ構築', 'データベース初期データ設定', 'データベースロールバック', 'アプリケーションサーバー設定', '終了']
      }).run())
    }
    catch {
      return;
    }

    switch (menuSelect) {
      case 'データベース接続設定':

        config['DB_HOST'] = await (new Input({
          initial: config['DB_HOST'],
          message: 'データベースサーバーのホスト名あるいはIPアドレスを入力してエンターキーを押してください。'
        }).run());

        config['DB_PORT'] = await (new NumberPrompt({
          initial: parseInt(config['DB_PORT']),
          message: 'データベースサーバーのポート番号を入力してエンターキーを押してください。'
        }).run());

        config['DB_NAME'] = await (new Input({
          initial: config['DB_NAME'],
          message: 'データベースサーバーのデータベース名を入力してエンターキーを押してください。'
        }).run());

        config['DB_USER'] = await (new Input({
          initial: config['DB_USER'],
          message: 'データベースサーバーのユーザー名を入力してエンターキーを押してください。'
        }).run());

        config['DB_PASSWORD'] = await (new Input({
          initial: config['DB_PASSWORD'],
          message: 'データベースサーバーのパスワードを入力してエンターキーを押してください。'
        }).run());

        if (await (new Toggle({ initial: true, enabled: 'はい', disabled: 'いいえ', message: '設定を保存しますか?' }).run())) {
          saveEnv(config, dotEnvBackendAppPath);
        }
        break;

      case 'データベース作成':
        try {
          const dbRootUser = await (new Input({
            initial: 'root',
            message: 'データベースサーバーへの接続rootユーザー名を入力してエンターキーを押してください。'
          }).run());

          const dbRootPassword = await (new Password({
            initial: '',
            message: 'データベースサーバーへの接続rootパスワードを入力してエンターキーを押してください。'
          }).run());

          const connRoot = await connectMySQL(config['DB_HOST'], config['DB_PORT'], dbRootUser, dbRootPassword);
          if (await (new Toggle({ initial: true, enabled: 'はい', disabled: 'いいえ', message: 'データベースへのroot接続が確認できました。データベースを作成しますか?' }).run())) {
            await createMySQLDatabase(connRoot, config['DB_NAME'], config['DB_USER'], config['DB_PASSWORD']);
            console.info(colors.bgBlue.bold.white('データベースの作成が完了しました。'));
          }
          connRoot.end();
        }
        catch (error) {
          console.error(colors.bgRed.bold.white('データベースへのroot接続でエラーが発生しました。'));
          showErrorForMySQLConnectionFailure(error.code);
          console.error(error.message);
        }

        break;

      case 'データベース削除':
        try {
          const dbRootUser = await (new Input({
            initial: 'root',
            message: 'データベースサーバーへの接続rootユーザー名を入力してエンターキーを押してください。'
          }).run());

          const dbRootPassword = await (new Password({
            initial: '',
            message: 'データベースサーバーへの接続rootパスワードを入力してエンターキーを押してください。'
          }).run());

          const connRoot = await connectMySQL(config['DB_HOST'], config['DB_PORT'], dbRootUser, dbRootPassword);
          if (await (new Toggle({ initial: false, enabled: 'はい', disabled: 'いいえ', message: 'データベースへのroot接続が確認できました。データベースを削除しますか? この操作は元に戻せません。' }).run())) {
            await dropMySQLDatabase(connRoot, config['DB_NAME'], config['DB_USER']);
            console.info(colors.bgBlue.bold.white('データベースの削除が完了しました。'));
          }
          connRoot.end();
        }
        catch (error) {
          console.error(colors.bgRed.bold.white('データベースへのroot接続でエラーが発生しました。'));
          showErrorForMySQLConnectionFailure(error.code);
          console.error(error.message);
        }

        break;

      case 'データベーススキーマ構築':
        if (await (new Toggle({ initial: true, enabled: 'はい', disabled: 'いいえ', message: 'データベーススキーマ構築を実行しますか?' }).run())) {
          try {
            const knex = require('knex')(knexconfig.production);
            await knex.migrate.latest();
            await knex.destroy();
            console.info(colors.bgBlue.bold.white('データベーススキーマ構築が完了しました。'));
          }
          catch (error) {
            console.error(colors.bgRed.bold.white('データベーススキーマ構築が実行できませんでした。'));
            console.error(error.message);
          }
        }
        break;
      case 'データベース初期データ設定':
        if (await (new Toggle({ initial: true, enabled: 'はい', disabled: 'いいえ', message: 'データベース初期データ設定を実行しますか?' }).run())) {
          try {
            const knex = require('knex')(knexconfig.production);
            await knex.seed.run();
            await knex.destroy();
            console.info(colors.bgBlue.bold.white('データベース初期データ設定が完了しました。'));
          }
          catch (error) {
            console.error(colors.bgRed.bold.white('データベース初期データ設定が実行できませんでした。'));
            console.error(error.message);
          }
        }
        break;
      case 'データベースロールバック':
        if (await (new Toggle({ initial: false, enabled: 'はい', disabled: 'いいえ', message: 'データベースロールバックを実行しますか? データは全て削除されます。' }).run())) {
          const confirm = await (new Input({
            initial: '',
            message: '本当にデータベースロールバックを実行しますか? 実行する場合は delete と入力してエンターキーを押してください。'
          }).run());

          if (confirm === 'delete') {
            try {
              const knex = require('knex')(knexconfig.production);
              await knex.migrate.rollback(undefined, true);
              await knex.destroy();
              console.info(colors.bgBlue.bold.white('データベースロールバックが完了しました。'));
            }
            catch (error) {
              console.error(colors.bgRed.bold.white('データベースロールバックが実行できませんでした。'));
              console.error(error.message);
            }
          }
          else {
            console.info('データベースロールバックは実行しませんでした。');
          }
        }
        break;
      case 'アプリケーションサーバー設定':

        if (await (new Toggle({ initial: config['NODE_ENV'] === 'production', enabled: '本番モード', disabled: '開発モード', message: 'アプリケーションサーバーの動作モードを選択してエンターキーを押してください。' }).run())) {
          config['NODE_ENV'] = 'production';
        }
        else {
          config['NODE_ENV'] = 'development';
        }

        config['NODE_PORT'] = await (new NumberPrompt({
          initial: parseInt(config['NODE_PORT']),
          message: 'アプリケーションサーバーが接続を受けるポート番号を入力してエンターキーを押してください。'
        }).run());

        config['NODE_BACKLOG'] = await (new NumberPrompt({
          initial: parseInt(config['NODE_BACKLOG']),
          message: 'アプリケーションサーバーが許容する最大同時接続数を入力してエンターキーを押してください。'
        }).run());

        if (await (new Toggle({ initial: config['NODE_AUDIT'] === 'true' || config['NODE_AUDIT'] === '1', enabled: '有効', disabled: '無効', message: 'アプリケーションサーバーの監査モードを有効にするかどうか選択してエンターキーを押してください。' }).run())) {
          config['NODE_AUDIT'] = 'true';
        }
        else {
          config['NODE_AUDIT'] = 'false';
        }

        if (await (new Toggle({ initial: true, enabled: 'はい', disabled: 'いいえ', message: '設定を保存しますか?' }).run())) {
          saveEnv(config, dotEnvBackendAppPath);
        }

        break;
      case 'データベース接続テスト':

        try {
          const connUser = await connectMySQL(
            config['DB_HOST'], parseInt(config['DB_PORT']), config['DB_USER'], config['DB_PASSWORD'], config['DB_NAME']
          );
          connUser.end();
          console.info(colors.bgBlue.bold.white('データベースへの接続が確認できました。'));
        }
        catch (error) {
          console.error(colors.bgRed.bold.white('データベースへの接続ができません。'));
          showErrorForMySQLConnectionFailure(error.code);
          console.error(error.message);
        }
        break;

      case '終了':
        return;
    }
  }
})();

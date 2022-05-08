const path = require('path');
const fs = require('fs');
const os = require('os');

const readlineSync = require('readline-sync');
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
  config['DB_NAME'] = 'timecard_system';
}
if (!('DB_ROOT_USER' in config)) {
  config['DB_ROOT_USER'] = 'root';
}
if (!('DB_ROOT_PASSWORD' in config)) {
  config['DB_ROOT_PASSWORD'] = '';
}

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

const path = require('path');
const fs = require('fs');
const os = require('os');

const readlineSync = require('readline-sync');

const backendAppPath = path.join(__dirname, 'node_modules', 'timecard-app-backend');
if (!fs.existsSync(backendAppPath)) {
  readlineSync.question(
    'エラー: アプリケーションフォルダ ' + backendAppPath + ' が見つかりません。エンターキーを押して終了してください。',
    { hideEchoBack: true, mask: '' }
  );
  process.exit(1);
}

const dotEnvBackendAppPath = path.join(backendAppPath, '.env');
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
if (!('DATABASE_PASSWORD' in config)) {
  config['DB_ROOT_PASSWORD'] = '';
}

while (true) {

  if (!readlineSync.keyInYNStrict('アプリケーションが使用するデータベースサーバーの設定を行ないます。続けますか?')) {
    process.exit(0);
  }
  console.log('\n以下の質問に対して設定値を入力してエンターキーを押してください。何も入力せずにエンターキーを押すと()で囲まれた値に設定されます。\n');

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
    break;
  }
  console.log('\n');
}

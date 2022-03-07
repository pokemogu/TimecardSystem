const path = require('path');
const fs = require('fs');
const os = require('os');

const readlineSync = require('readline-sync');

const backendAppPath = path.join(__dirname, 'node_modules', 'timecard-app-backend');
if(!fs.existsSync(backendAppPath)){
  readlineSync.question(
    'エラー: アプリケーションフォルダ ' + backendAppPath + ' が見つかりません。エンターキーを押して終了してください。',
    { hideEchoBack: true, mask: '' }
  );
  process.exit(1);
}

const dotEnvBackendAppPath = path.join(backendAppPath, '.env');
const config = {};

if(fs.existsSync(dotEnvBackendAppPath)){
  const dotEnvBackendApp = fs.readFileSync(dotEnvBackendAppPath, 'utf8');
  dotEnvBackendApp.split(/\r?\n/).forEach(line => {
    const keyValue = line.split('=', 2);
    if(keyValue.length === 2){
      config[keyValue[0]] = keyValue[1];
    }
  });
}


// デフォルト値をセットする
if(!('DATABASE_HOST' in config)){
  config['DATABASE_HOST'] = 'localhost';
}
if(!('DATABASE_PORT' in config)){
  config['DATABASE_PORT'] = 3306;
}
if(!('DATABASE_NAME' in config)){
  config['DATABASE_NAME'] = 'timecard_system';
}
if(!('DATABASE_USER' in config)){
  config['DATABASE_USER'] = 'root';
}
if(!('DATABASE_PASSWORD' in config)){
  config['DATABASE_PASSWORD'] = '';
}

while(true){

  if(!readlineSync.keyInYNStrict('アプリケーションが使用するデータベースサーバーの設定を行ないます。続けますか?')){
    process.exit(0);
  }
  console.log('\n以下の質問に対して設定値を入力してエンターキーを押してください。何も入力せずにエンターキーを押すと()で囲まれた値に設定されます。\n');

  config['DATABASE_HOST'] = readlineSync.question(
    'データベースサーバーのホスト名あるいはIPアドレスを入力してエンターキーを押してください($<defaultInput>): ',
    { defaultInput: config['DATABASE_HOST'] }
  );

  config['DATABASE_PORT'] = readlineSync.questionInt(
    'データベースサーバーのポート番号を入力してエンターキーを押してください($<defaultInput>): ',
    { defaultInput: config['DATABASE_PORT'] }
  );

  config['DATABASE_NAME'] = readlineSync.question(
    'データベース名を入力してエンターキーを押してください($<defaultInput>): ',
    { defaultInput: config['DATABASE_NAME'] }
  );

  config['DATABASE_USER'] = readlineSync.question(
    'データベースサーバーへの接続ユーザー名を入力してエンターキーを押してください($<defaultInput>): ',
    { defaultInput: config['DATABASE_USER'] }
  );

  config['DATABASE_PASSWORD'] = readlineSync.question(
    'データベースサーバーへの接続パスワードを入力してエンターキーを押してください(変更しない場合は何も入力しないでエンターキーを押してください): ',
    { defaultInput: config['DATABASE_PASSWORD'], hideEchoBack: true }
  );

  console.log('\n');
  if(readlineSync.keyInYNStrict('以上の設定を保存しますか?')){
    let configStr = '';
    for(const key in config){
      configStr += '' + key + '=' + config[key] + '\n';
    }
    fs.writeFileSync(dotEnvBackendAppPath, configStr);
    break;
  }
  console.log('\n');
}

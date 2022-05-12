const path = require('path');
const readline = require('readline');
const Service = require('node-windows').Service;

function waitForInput() {
  return new Promise(function (resolve) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question('Enterキーを押して終了してください。', function (ans) {
      rl.close();
      resolve();
    });
  });
}

function installService(svc, startAfterInstall = false) {
  //svc.logOnAs.domain = 'NT AUTHORITY';
  //svc.logOnAs.account = 'LocalService';
  return new Promise(function (resolve, reject) {

    svc.on('install', function () {
      console.log('サービスのインストールが完了しました。');
      if (startAfterInstall) {
        svc.start();
      }
      resolve();
    });
    svc.on('alreadyinstalled', function () {
      console.warn('サービスは既にインストールされています。');
      process.exitCode = 1;
      resolve();
    });
    svc.on('error', function () {
      console.error('サービスのインストールに失敗しました。');
      process.exitCode = 255;
      reject(new Error());
    });
    svc.install();

  });
}
exports.installService = installService;

function uninstallService(svc) {
  return new Promise(function (resolve, reject) {

    svc.on('uninstall', function () {
      if (svc.exists === false) {
        console.log('サービスのアンインストールが完了しました。');
        resolve();
      }
      else {
        console.error('サービスのアンインストール後にサービスが残存しています。');
        process.exitCode = 255;
        reject(new Error());
      }
    });
    svc.on('alreadyuninstalled', function () {
      console.error('サービスがインストールされていないか、既にアンインストールされています。');
      process.exitCode = 1;
      resolve();
    });
    svc.on('error', function () {
      console.error('サービスのアンインストールに失敗しました。');
      process.exitCode = 255;
      reject(new Error());
    });
    svc.uninstall();

  });
}
exports.uninstallService = uninstallService;

function startService(svc) {
  return new Promise(function (resolve, reject) {

    svc.on('start', function () {
      console.log('サービスを開始しました。');
      resolve();
    });
    svc.on('error', function () {
      console.error('サービスの開始に失敗しました。');
      process.exitCode = 255;
      reject(new Error());
    });
    svc.start();

  });
}
exports.startService = startService;

function stopService(svc) {
  return new Promise(function (resolve, reject) {

    svc.on('stop', function () {
      console.log('サービスを停止しました。');
      resolve();
    });
    svc.on('error', function () {
      console.error('サービスの停止に失敗しました。');
      process.exitCode = 255;
      reject(new Error());
    });
    svc.stop();

  });
}
exports.stopService = stopService;

function showUsage() {
  const nodeCommand = path.basename(process.execPath);
  const scriptName = path.basename(__filename);
  console.error('サービスのインストール: ' + nodeCommand + ' ' + scriptName + ' install');
  console.error('サービスのアンインストール: ' + nodeCommand + ' ' + scriptName + ' uninstall');
  console.error('サービスの開始: ' + nodeCommand + ' ' + scriptName + ' start');
  console.error('サービスの停止: ' + nodeCommand + ' ' + scriptName + ' stop');
}

const svc = new Service({
  name: 'Timecard System Application Server (timecard-app-backend)',
  workingDirectory: __dirname,
  script: path.join(__dirname, 'dist', 'index.js'),
  //  logpath: path.join(__dirname, 'log')
});
exports.svc = svc;

// このモジュールを node で直接起動した場合のみ実行される
if (require.main === module) {
  (async function () {

    if (process?.argv && process.argv?.length && process.argv.length >= 3) {
      const command = process.argv[2];
      const waitForEnterToExit = (process.argv.length >= 4) && (process.argv[3] === 'wait')

      console.clear();

      try {
        switch (command) {
          case 'install':
            await installService(svc);
            break;
          case 'uninstall':
            await uninstallService(svc);
            break;
          case 'start':
            await startService(svc);
            break;
          case 'stop':
            await stopService(svc);
            break;
          default:
            console.error('指定されたオプション ' + command + ' が正しくありません');
            showUsage();
            process.exitCode = 1;
            break;
        }
      }
      catch (error) { }

      if (waitForEnterToExit) {
        await waitForInput();
      }

    }
    else {
      showUsage();
      process.exitCode = 1;
    }

  })();
}

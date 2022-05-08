const path = require('path');
const Service = require('node-windows').Service;

function installService(svc, startAfterInstall = false) {
  //svc.logOnAs.domain = 'NT AUTHORITY';
  //svc.logOnAs.account = 'LocalService';
  svc.on('install', function () {
    console.log('サービスのインストールが完了しました。');
    if (startAfterInstall) {
      svc.start();
    }
  });
  svc.on('alreadyinstalled', function () {
    console.warn('サービスは既にインストールされています。');
    process.exitCode = 1;
  });
  svc.on('error', function () {
    console.error('サービスのインストールに失敗しました。');
    process.exitCode = 255;
  });
  svc.install();
}
exports.installService = installService;

function uninstallService(svc) {
  svc.on('uninstall', function () {
    if (svc.exists === false) {
      console.log('サービスのアンインストールが完了しました。');
    }
    else {
      console.error('サービスのアンインストール後にサービスが残存しています。');
      process.exitCode = 255;
    }
  });
  svc.on('alreadyuninstalled', function () {
    console.error('サービスがインストールされていないか、既にアンインストールされています。');
    process.exitCode = 1;
  });
  svc.on('error', function () {
    console.error('サービスのアンインストールに失敗しました。');
    process.exitCode = 255;
  });
  svc.uninstall();
}
exports.uninstallService = uninstallService;

function startService(svc) {
  svc.on('start', function () {
    console.log('サービスを開始しました。');
  });
  svc.on('error', function () {
    console.error('サービスの開始に失敗しました。');
    process.exitCode = 255;
  });
  svc.start();
}
exports.startService = startService;

function stopService(svc) {
  svc.on('stop', function () {
    console.log('サービスを停止しました。');
  });
  svc.on('error', function () {
    console.error('サービスの停止に失敗しました。');
    process.exitCode = 255;
  });
  svc.stop();
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

if (require.main === module) {
  // このモジュールを node で直接起動した場合のみ実行される
  if (process?.argv && process.argv?.length && process.argv.length >= 3) {
    const command = process.argv[2];

    switch (command) {
      case 'install':
        installService(svc);
        break;
      case 'uninstall':
        uninstallService(svc);
        break;
      case 'start':
        startService(svc);
        break;
      case 'stop':
        stopService(svc);
        break;
      default:
        console.error('指定されたオプション ' + command + ' が正しくありません');
        showUsage();
        process.exitCode = 1;
        break;
    }
  }
  else {
    showUsage();
    process.exitCode = 1;
  }
}

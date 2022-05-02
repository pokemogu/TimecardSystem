const path = require('path');
const fs = require('fs');
const os = require('os');
const Service = require('node-windows').Service;

const npmCliPath = path.join(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js');
if(!fs.existsSync(npmCliPath)){
  console.error('Cannot find npm script "' + npmCliPath + '"');
  process.exitCode = 255;
  return;
}

// Windows 10以降のみ対応
//const localServiceTempPath = path.join(process.env.SystemRoot, 'ServiceProfiles', 'LocalService', 'AppData', 'Local', 'Temp');

const svc = new Service({
  name: 'Timecard System Application Server (timecard-app-backend)',
  workingDirectory: __dirname,
  script: npmCliPath,
  scriptOptions: 'run --workspace=backend production',
//  logpath: fs.existsSync(localServiceTempPath) ? localServiceTempPath : null
});
//svc.logOnAs.domain = 'NT AUTHORITY';
//svc.logOnAs.account = 'LocalService';

svc.on('install', function(){
  console.log('サービスのインストールが完了しました。');
  svc.start();
});
svc.on('alreadyinstalled', function(){
  console.warn('サービスは既にインストールされています。');
  process.exitCode = 1;
});
svc.on('error', function(){
  console.error('サービスのインストールに失敗しました。');
  process.exitCode = 255;
});

svc.install();

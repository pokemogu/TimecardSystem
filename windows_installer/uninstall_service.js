const path = require('path');
const fs = require('fs');
const Service = require('node-windows').Service;

const npmCliPath = path.join(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js');
if(!fs.existsSync(npmCliPath)){
  console.error('Cannot find npm script "' + npmCliPath + '"');
  process.exitCode = 255;
  return;
}

const svc = new Service({
  name: 'Timecard System Application Server (timecard-app-backend)',
  workingDirectory: __dirname,
  script: npmCliPath,
  scriptOptions: 'run --workspace=backend production'
});
svc.on('uninstall', function(){
  if(svc.exists === false){
    console.log('サービスのアンインストールが完了しました。');
  }
  else{
    console.error('サービスのアンインストール後にサービスが残存しています。');
    process.exitCode = 255;
  }
});
svc.on('alreadyuninstalled', function(){
  console.error('サービスがインストールされていないか、既にアンインストールされています。');
  process.exitCode = 1;
});
svc.on('error', function(){
  console.error('サービスのアンインストールに失敗しました。');
  process.exitCode = 255;
});
svc.uninstall();

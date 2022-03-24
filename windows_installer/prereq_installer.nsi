SetCompress off
Unicode True

# 日本語UI
LoadLanguageFile "${NSISDIR}\Contrib\Language files\Japanese.nlf"
# アプリケーション名
Name "MySQL/Apache/Node.js"
# 作成されるインストーラ
OutFile "SetupMySQLApacheNodeJS.exe"
# インストールされるディレクトリ
InstallDir "$TEMP"

# ページ
#Page directory
#Page custom nsDialogsPage
#Page instfiles "" "" LaunchConfig

# デフォルト セクション
Section

  SetAutoClose true

  # 出力先を指定します。
  SetOutPath "$INSTDIR"

  # インストールされるファイル
  File "VC_redist.x64.exe"
  File "mysql-installer-community-8.0.28.0.msi"
  File "node-v16.14.2-x64.msi"
  File "httpd-2.4.53-o111n-x64-vs16.zip"
  File "genselfcert.bat"
  File "node-windows-1.0.0-beta.6.tgz"
  File "readline-sync-1.4.10.tgz"
  File "httpd-ahssl.conf"

  ExecWait '"$INSTDIR\VC_redist.x64.exe /install /quiet /norestart"'
  ExecWait 'msiexec /i "$INSTDIR\mysql-installer-community-8.0.28.0.msi" /qn /norestart'
  ExecWait '"$PROGRAMFILES\MySQL\MySQL Installer for Windows\MySQLInstallerConsole.exe" community install server;8.0.28;x64:*:type=config;openfirewall=true;generallog=true;binlog=true;serverid=3306;enable_tcpip=true;port=3306;rootpasswd=ievae6io1puaf9io6oof1ephoh9AhahW; -silent'
  ExecWait 'msiexec /i "$INSTDIR\node-v16.14.2-x64.msi" /qn /norestart'

  # Apacheのインストール
  ReadEnvStr $0 SYSTEMDRIVE
  InitPluginsDir
  nsisunz::UnzipToLog "$INSTDIR\httpd-2.4.53-o111n-x64-vs16.zip" "$0"
  #Rename '$INSTDIR\node-v16.14.0-win-x64' '$INSTDIR\node'
  ExecWait "$INSTDIR\genselfcert.bat"
  Rename "C:\Apache24\conf\extra\httpd-ahssl.conf" "C:\Apache24\conf\extra\httpd-ahssl.conf.orig"
  Rename "$INSTDIR\httpd-ahssl.conf" "C:\Apache24\conf\extra\httpd-ahssl.conf"

  # Node.jsの動作確認
  #ExecWait '"$INSTDIR\node\node.exe" -e "setTimeout(()=>{},5000)"'

  # 共通パッケージのインストール
  ExecWait '"$PROGRAMFILES64\nodejs\npm.cmd" install -g "$INSTDIR\readline-sync-1.4.10.tgz"'
  ExecWait '"$PROGRAMFILES64\nodejs\npm.cmd" install -g "$INSTDIR\node-windows-1.0.0-beta.6.tgz"'

  # サービスとしてインストール
  #SetOutPath "$INSTDIR\node_modules\timecard-app-backend"
  #ExecShellWait '' "$INSTDIR\node\npm.cmd" 'link node-windows' SW_HIDE
  ExecWait '"$0\Apache24\bin\httpd" -k install'
  ExecWait '"$0\Apache24\bin\httpd" -k start'

  # 作業用ファイルの削除
  Delete "$INSTDIR\VC_redist.x64.exe"
  Delete "$INSTDIR\mysql-installer-community-8.0.28.0.msi"
  Delete "$INSTDIR\node-v16.14.2-x64.msi"
  Delete "$INSTDIR\httpd-2.4.53-o111n-x64-vs16.zip"
  Delete "$INSTDIR\genselfcert.bat"
  Delete "$INSTDIR\node-windows-1.0.0-beta.6.tgz"
  Delete "$INSTDIR\readline-sync-1.4.10.tgz"
SectionEnd

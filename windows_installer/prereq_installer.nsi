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
Page components
Page instfiles
#Page directory
#Page custom nsDialogsPage
#Page instfiles "" "" LaunchConfig

# デフォルト セクション
Section
  # SetAutoClose true

  # 出力先を指定します。
  SetOutPath "$INSTDIR"

  # インストールされるファイル
  File "VC_redist.x64.exe"
  ExecWait '"$INSTDIR\VC_redist.x64.exe /install /quiet /norestart"'
SectionEnd

Section "MySQL"

  # 出力先を指定します。
  SetOutPath "$INSTDIR"

  File "mysql-installer-community-8.0.28.0.msi"
  ExecWait 'msiexec /i "$INSTDIR\mysql-installer-community-8.0.28.0.msi" /qn /norestart'
  ExecWait '"$PROGRAMFILES\MySQL\MySQL Installer for Windows\MySQLInstallerConsole.exe" community install server;8.0.28;x64:*:type=config;openfirewall=true;generallog=true;binlog=true;serverid=3306;enable_tcpip=true;port=3306;rootpasswd=ievae6io1puaf9io6oof1ephoh9AhahW; -silent'

SectionEnd

Section "Apache"

  File "httpd-2.4.53-o111n-x64-vs16.exe"

  # 出力先を指定します。
  SetOutPath "$INSTDIR"
  ExecWait '"$INSTDIR\httpd-2.4.53-o111n-x64-vs16.exe" /S'

SectionEnd

Section "Node.js"

  File "node-v16.14.2-x64.msi"
  File "node-windows-1.0.0-beta.6.tgz"
  File "readline-sync-1.4.10.tgz"

  # 出力先を指定します。
  SetOutPath "$INSTDIR"
  ExecWait 'msiexec /i "$INSTDIR\node-v16.14.2-x64.msi" /qn /norestart'

  # 共通パッケージのインストール
  ExecWait '"$PROGRAMFILES64\nodejs\npm.cmd" install -g "$INSTDIR\readline-sync-1.4.10.tgz"'
  ExecWait '"$PROGRAMFILES64\nodejs\npm.cmd" install -g "$INSTDIR\node-windows-1.0.0-beta.6.tgz"'

SectionEnd

Section "-cleanup"

  # 作業用ファイルの削除
  Delete "$INSTDIR\VC_redist.x64.exe"
  Delete "$INSTDIR\mysql-installer-community-8.0.28.0.msi"
  Delete "$INSTDIR\node-v16.14.2-x64.msi"
  Delete "$INSTDIR\node-windows-1.0.0-beta.6.tgz"
  Delete "$INSTDIR\readline-sync-1.4.10.tgz"
  Delete "$INSTDIR\httpd-2.4.53-o111n-x64-vs16.exe"

SectionEnd

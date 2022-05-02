SetCompress off
Unicode True

# 日本語UI
LoadLanguageFile "${NSISDIR}\Contrib\Language files\Japanese.nlf"

Var MySQLPassword

# アプリケーション名
Name "MySQL/Apache/Node.js"
# 作成されるインストーラ
OutFile "SetupMySQLApacheNodeJS.exe"
# インストールされるディレクトリ
InstallDir "$TEMP"

# ページ
Page components
Page custom nsDialogsPage nsDialogsPageLeave
Page instfiles
#Page directory
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

Section "MySQL" MySQLSectionID

  # 出力先を指定します。
  SetOutPath "$INSTDIR"

  File "mysql-installer-community-8.0.28.0.msi"
  ExecWait 'msiexec /i "$INSTDIR\mysql-installer-community-8.0.28.0.msi" /qn /norestart'
  #ExecWait '"$PROGRAMFILES\MySQL\MySQL Installer for Windows\MySQLInstallerConsole.exe" community install server;8.0.28;x64:*:type=config;openfirewall=true;generallog=true;binlog=true;serverid=3306;enable_tcpip=true;port=3306;rootpasswd=ievae6io1puaf9io6oof1ephoh9AhahW; -silent'
  ExecWait '"$PROGRAMFILES\MySQL\MySQL Installer for Windows\MySQLInstallerConsole.exe" community install server;8.0.28;x64:*:type=config;openfirewall=true;generallog=true;binlog=true;serverid=3306;enable_tcpip=true;port=3306;rootpasswd=$MySQLPassword; -silent'

SectionEnd

Section "Apache"

  File "httpd-2.4.53-o111n-x64-vs16.exe"

  # 出力先を指定します。
  SetOutPath "$INSTDIR"
  ExecWait '"$INSTDIR\httpd-2.4.53-o111n-x64-vs16.exe" /S'

SectionEnd

Section "Node.js"

  File "node-v16.14.2-x64.msi"

  # 出力先を指定します。
  SetOutPath "$INSTDIR"
  ExecWait 'msiexec /i "$INSTDIR\node-v16.14.2-x64.msi" /qn /norestart'

SectionEnd

Section "-cleanup"

  # 作業用ファイルの削除
  Delete "$INSTDIR\VC_redist.x64.exe"
  Delete "$INSTDIR\mysql-installer-community-8.0.28.0.msi"
  Delete "$INSTDIR\node-v16.14.2-x64.msi"
  Delete "$INSTDIR\httpd-2.4.53-o111n-x64-vs16.exe"

SectionEnd

!include LogicLib.nsh
!include nsDialogs.nsh
!include Sections.nsh
Var Dialog
Var LabelControl
Var PasswordControl1
Var PasswordControl2

# 入力フォーム
Function nsDialogsPage

  nsDialogs::Create 1018
  Pop $Dialog

  ${If} $Dialog == error
    Abort
  ${EndIf}

  SectionGetFlags ${MySQLSectionID} $R0
  IntOp $R0 $R0 & ${SF_SELECTED}
  IntCmp $R0 ${SF_SELECTED} showMySQLPasswordDialog
 
  Return

showMySQLPasswordDialog:

  ${NSD_CreateLabel} 0 0 100% 26u "MySQLのrootユーザーのパスワードを決めて入力してください。入力したパスワードは必ず控えを取って紛失しないようにしてください。"
  Pop $LabelControl

  ${NSD_CreatePassword} 0 26u 50% 13u ""
  Pop $PasswordControl1

  ${NSD_CreateLabel} 0 39u 100% 13u "確認の為にもう一度同じパスワードを入力してください。"
  Pop $LabelControl

  ${NSD_CreatePassword} 0 52u 50% 13u ""
  Pop $PasswordControl2

  nsDialogs::Show

FunctionEnd

Function nsDialogsPageLeave

  ${NSD_GetText} $PasswordControl1 $0
  StrCpy $MySQLPassword $0
  ${NSD_GetText} $PasswordControl2 $1

  StrCmpS $0 $1 noErrorPassword

  MessageBox MB_OK|MB_ICONEXCLAMATION "入力されたパスワードが一致しません。もう一度入力し直してください。"
  Abort

noErrorPassword:

  StrCmpS $MySQLPassword "" ErrorEmptyPassword

  #MessageBox MB_OK|MB_ICONINFORMATION "入力されたパスワードは「$MySQLPassword」です。"
  Return

ErrorEmptyPassword:

  MessageBox MB_OK|MB_ICONEXCLAMATION "パスワードが空です。パスワードを決めて入力してください。"
  Abort
FunctionEnd

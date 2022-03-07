Unicode True

#####################################################################
!include LogicLib.nsh
!ifndef IPersistFile
!define IPersistFile {0000010b-0000-0000-c000-000000000046}
!endif
!ifndef CLSID_ShellLink
!define CLSID_ShellLink {00021401-0000-0000-C000-000000000046}
!define IID_IShellLinkA {000214EE-0000-0000-C000-000000000046}
!define IID_IShellLinkW {000214F9-0000-0000-C000-000000000046}
!define IShellLinkDataList {45e2b4ae-b1c3-11d0-b92f-00a0c90312e1}
	!ifdef NSIS_UNICODE
	!define IID_IShellLink ${IID_IShellLinkW}
	!else
	!define IID_IShellLink ${IID_IShellLinkA}
	!endif
!endif
 
 
 
Function ShellLinkSetRunAs
System::Store S
pop $9
System::Call "ole32::CoCreateInstance(g'${CLSID_ShellLink}',i0,i1,g'${IID_IShellLink}',*i.r1)i.r0"
${If} $0 = 0
	System::Call "$1->0(g'${IPersistFile}',*i.r2)i.r0" ;QI
	${If} $0 = 0
		System::Call "$2->5(w '$9',i 0)i.r0" ;Load
		${If} $0 = 0
			System::Call "$1->0(g'${IShellLinkDataList}',*i.r3)i.r0" ;QI
			${If} $0 = 0
				System::Call "$3->6(*i.r4)i.r0" ;GetFlags
				${If} $0 = 0
					System::Call "$3->7(i $4|0x2000)i.r0" ;SetFlags ;SLDF_RUNAS_USER
					${If} $0 = 0
						System::Call "$2->6(w '$9',i1)i.r0" ;Save
					${EndIf}
				${EndIf}
				System::Call "$3->2()" ;Release
			${EndIf}
		System::Call "$2->2()" ;Release
		${EndIf}
	${EndIf}
	System::Call "$1->2()" ;Release
${EndIf}
push $0
System::Store L
FunctionEnd
#####################################################################

Function LaunchConfig
    ExecShell "" "$INSTDIR\configure.bat"
FunctionEnd

# 日本語UI
LoadLanguageFile "${NSISDIR}\Contrib\Language files\Japanese.nlf"
# アプリケーション名
Name "Timecard System Server"
# 作成されるインストーラ
OutFile "SetupTimecardSystemServer.exe"
# インストールされるディレクトリ
InstallDir "$PROGRAMFILES64\Timecard System Server"

!include nsDialogs.nsh
Var Dialog
Var Label
Var Text

# ページ
Page directory
#Page custom nsDialogsPage
Page instfiles "" "" LaunchConfig
UninstPage uninstConfirm
UninstPage instfiles

Function nsDialogsPage

  nsDialogs::Create 1018
  Pop $Dialog

  ${If} $Dialog == error
    Abort
  ${EndIf}

  ${NSD_CreateLabel} 0 0 100% 12u "Hello, welcome to nsDialogs!"
  Pop $Label

  ${NSD_CreateText} 0 13u 100% -13u "Type something here ほげほげ..."
  Pop $Text
  nsDialogs::Show

FunctionEnd

# デフォルト セクション
Section

  SetAutoClose true

  # 出力先を指定します。
  SetOutPath "$INSTDIR"

  # インストールされるファイル
  #File /x *.ini /x *.pdb "bin\Release\*"
  File "node-v16.14.0-win-x64.zip"
  File "node-windows-1.0.0-beta.6.tgz"
  File "readline-sync-1.4.10.tgz"
  File "node-forge-1.2.1.tgz"
  File "selfsigned-2.0.0.tgz"
  File "timecard-app-backend-1.0.0.tgz"
  File "configure.js"
  File "configure.bat"

  # Node.jsのインストール
  InitPluginsDir
  nsisunz::UnzipToLog "$INSTDIR\node-v16.14.0-win-x64.zip" "$INSTDIR"
  Rename '$INSTDIR\node-v16.14.0-win-x64' '$INSTDIR\node'

  # Node.jsの動作確認
  #ExecWait '"$INSTDIR\node\node.exe" -e "setTimeout(()=>{},5000)"'

  # 共通パッケージのインストール
  ExecShellWait '' "$INSTDIR\node\npm.cmd" 'install -g "$INSTDIR\readline-sync-1.4.10.tgz"' SW_HIDE
  ExecShellWait '' "$INSTDIR\node\npm.cmd" 'install -g "$INSTDIR\node-windows-1.0.0-beta.6.tgz"' SW_HIDE
  ExecShellWait '' "$INSTDIR\node\npm.cmd" 'install -g "$INSTDIR\node-forge-1.2.1.tgz"' SW_HIDE
  ExecShellWait '' "$INSTDIR\node\npm.cmd" 'install -g "$INSTDIR\selfsigned-2.0.0.tgz"' SW_HIDE

  # アプリのインストール
  #CreateDirectory "$INSTDIR\timecard-app-backend"
  ExecShellWait '' "$INSTDIR\node\npm.cmd" 'install "$INSTDIR\timecard-app-backend-1.0.0.tgz"' SW_HIDE

  # サービスとしてインストール
  SetOutPath "$INSTDIR\node_modules\timecard-app-backend"
  ExecShellWait '' "$INSTDIR\node\npm.cmd" 'link node-windows' SW_HIDE

  Var /GLOBAL INSTALL_SERVICE_JS
  StrCpy $INSTALL_SERVICE_JS "\
    const args = process.argv.slice(1);\
    const Service = require('node-windows').Service;\
    const svc = new Service({\
      name: 'Timecard System Server (timecard-app-backend)',\
      script: args[0].replace(/\\/g,'\\\\') + '\\node_modules\\timecard-app-backend\\index.js'\
    });\
    svc.on('install', function(){\
    });\
    svc.install();\
  "
  ExecShellWait '' "$INSTDIR\node\node.exe" '-e "$INSTALL_SERVICE_JS" "$INSTDIR"' SW_HIDE
  SetOutPath "$INSTDIR"

  #Rename '$INSTDIR\node_modules' '$INSTDIR\apps'

  # 作業用ファイルの削除
  Delete "$INSTDIR\node-v16.14.0-win-x64.zip"
  Delete "$INSTDIR\node-windows-1.0.0-beta.6.tgz"
  Delete "$INSTDIR\readline-sync-1.4.10.tgz"
  Delete "$INSTDIR\node-forge-1.2.1.tgz"
  Delete "$INSTDIR\selfsigned-2.0.0.tgz"
  Delete "$INSTDIR\timecard-app-backend-1.0.0.tgz"

  # アンインストーラを出力
  WriteUninstaller "$INSTDIR\Uninstall.exe"

  # スタート メニューにショートカットを登録
  CreateDirectory "$SMPROGRAMS\Timecard System Server"
  #SetOutPath "$INSTDIR"

  CreateShortcut "$SMPROGRAMS\Timecard System Server\設定.lnk" "$INSTDIR\configure.bat" ""
  Push "$SMPROGRAMS\Timecard System Server\設定.lnk"
  Call ShellLinkSetRunAs
  Pop $0

  #CreateShortcut "$SMPROGRAMS\MailToStarPRNT\印刷アプリケーションの停止.lnk" "$INSTDIR\stop-service.bat" ""
  #Push "$SMPROGRAMS\MailToStarPRNT\印刷アプリケーションの停止.lnk"
  #Call ShellLinkSetRunAs
  #Pop $0

  #CreateShortcut "$SMPROGRAMS\MailToStarPRNT\設定.lnk" "$INSTDIR\Configure.exe" ""
  #Push "$SMPROGRAMS\MailToStarPRNT\設定.lnk"
  #Call ShellLinkSetRunAs
  #Pop $0

  #CreateShortcut "$SMPROGRAMS\MailToStarPRNT\ログ表示.lnk" "$SYSDIR\eventvwr.exe" '/v:"$INSTDIR\MailToStarPRNT_EventLog.xml"'
  CreateShortcut "$SMPROGRAMS\Timecard System Server\アンインストール.lnk" "$INSTDIR\Uninstall.exe" ""

  # レジストリに登録
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Timecard System Server" "DisplayName" "Timecard System Server"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Timecard System Server" "UninstallString" '"$INSTDIR\Uninstall.exe"'
SectionEnd

# アンインストーラ
Section "Uninstall"

  SetAutoClose false

  Var /GLOBAL UNINSTALL_SERVICE_JS
  StrCpy $UNINSTALL_SERVICE_JS "\
    const args = process.argv.slice(1);\
    const Service = require('node-windows').Service;\
    const svc = new Service({\
      name: 'Timecard System Server (timecard-app-backend)',\
      script: args[0].replace(/\\/g,'\\\\') + '\\node_modules\\timecard-app-backend\\index.js'\
    });\
    svc.on('uninstall', function(){\
      console.log('The service exists: ',svc.exists);\
    });\
    svc.uninstall();\
  "
  Push $OUTDIR

  # サービスのアンインストール
  SetOutPath "$INSTDIR\node_modules\timecard-app-backend"
  ExecShellWait '' "$INSTDIR\node\node.exe" '-e "$UNINSTALL_SERVICE_JS" "$INSTDIR"' SW_HIDE

  # アプリのアンインストール
  SetOutPath "$INSTDIR"
  ExecShellWait '' "$INSTDIR\node\npm.cmd" 'uninstall timecard-app-backend' SW_HIDE

  Pop $OUTDIR
  SetOutPath "$OUTDIR"

  # nodeのアンインストール
  ExecShellWait '' "$INSTDIR\node\npm.cmd" 'uninstall -g node-windows' SW_HIDE
  ExecShellWait '' "$INSTDIR\node\npm.cmd" 'uninstall -g readline-sync' SW_HIDE
  ExecShellWait '' "$INSTDIR\node\npm.cmd" 'uninstall -g node-forge' SW_HIDE
  ExecShellWait '' "$INSTDIR\node\npm.cmd" 'uninstall -g selfsigned' SW_HIDE

  # ファイルを削除
  #Delete "$INSTDIR\*.exe*"
  #Delete "$INSTDIR\*.exe.config"
  #Delete "$INSTDIR\*.bat"
  #Delete "$INSTDIR\*.dll"
  #Delete "$INSTDIR\*.xml"

  # ディレクトリを削除
  RMDir /r "$INSTDIR\node"
  RMDir /r "$INSTDIR\node_modules"

  # ファイルを削除
  Delete "$INSTDIR\package.json"
  Delete "$INSTDIR\package-lock.json"
  Delete "$INSTDIR\configure.js"
  Delete "$INSTDIR\configure.bat"

  # アンインストーラを削除
  Delete "$INSTDIR\Uninstall.exe"

  # アプリケーションディレクトリを削除
  RMDir "$INSTDIR"

  Delete "$SMPROGRAMS\Timecard System Server\設定.lnk"
  #Delete "$SMPROGRAMS\MailToStarPRNT\印刷アプリケーションの停止.lnk"
  #Delete "$SMPROGRAMS\MailToStarPRNT\設定.lnk"
  #Delete "$SMPROGRAMS\MailToStarPRNT\ログ表示.lnk"
  Delete "$SMPROGRAMS\Timecard System Server\アンインストール.lnk"
  RMDir /r "$SMPROGRAMS\Timecard System Server"

  # レジストリ キーを削除
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Timecard System Server"
SectionEnd

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

!include "FileFunc.nsh"

Function LaunchConfig
  Exec "$INSTDIR\configure.bat"
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
Page instfiles "" "" LaunchConfig
UninstPage uninstConfirm
UninstPage instfiles

# デフォルト セクション
Section

  SetAutoClose false

  # 出力先を指定します。
  SetOutPath "$INSTDIR"

  # Node.jsの動作確認
  ClearErrors
  ExecWait "node -e 'setTimeout(()=>{},500)'"
  IfErrors 0 noError_Node
  MessageBox MB_OK|MB_ICONSTOP "Node.jsがインストールされていません。Node.jsをインストールしてからこのインストーラーを実行してください。"
  Abort "Node.jsがインストールされていません。Node.jsをインストールしてからこのインストーラーを実行してください。"

noError_Node:

  # Apache Hausのインストールフォルダ確認
  Var /GLOBAL ApacheHausUninstallerPath
  Var /GLOBAL ApacheHausPath

  ReadRegStr $ApacheHausUninstallerPath HKLM "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\Apache HTTP Server 2.4.53 (Apache Haus)" "UninstallString"
  ${GetParent} $ApacheHausUninstallerPath $ApacheHausPath
  StrCmp $ApacheHausPath "" 0 noError_Apache

  ReadRegStr $ApacheHausUninstallerPath HKLM "SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\Apache HTTP Server 2.4.53 (Apache Haus)" "UninstallString"
  ${GetParent} $ApacheHausUninstallerPath $ApacheHausPath
  StrCmp $ApacheHausPath "" 0 noError_Apache

  MessageBox MB_OK|MB_ICONSTOP "Apache by Apache Hausがインストールされていません。Apache by Apache Hausをインストールしてからこのインストーラーを実行してください。"
  Abort "Apache by Apache Hausがインストールされていません。Apache by Apache Hausをインストールしてからこのインストーラーを実行してください。"

noError_Apache:

  DetailPrint "Apache Hausは $ApacheHausPath にインストールされています。"

  Var /GLOBAL ApacheHausExtraConfPath
  StrCpy $ApacheHausExtraConfPath "$ApacheHausPath\conf\extra\httpd-ahssl-sites"

  IfFileExists "$ApacheHausExtraConfPath\*.*" 0 noError_ApacheConf
  MessageBox MB_OK|MB_ICONSTOP "Apache by Apache Hausの設定ファイルフォルダ $ApacheHausExtraConfPath がみつかりません。Apache by Apache Hausを再インストールしてください。"
  Abort "Apache by Apache Hausの設定ファイルフォルダ $ApacheHausExtraConfPath がみつかりません。Apache by Apache Hausを再インストールしてください。"

noError_ApacheConf:

  DetailPrint "Apache Hausの設定ファイルフォルダ $ApacheHausExtraConfPath を確認しました。"

  # インストールされるファイル
  File "node-windows-1.0.0-beta.6.tgz"
  File "readline-sync-1.4.10.tgz"
  File /r "C:\Users\pokemogu\Documents\timecard\*"
  File "configure.js"
  File "configure.bat"
  File "install_service.js"
  File "install_service.bat"
  File "uninstall_service.js"
  File "uninstall_service.bat"

  # 共通パッケージのインストール
  ExecWait '"$PROGRAMFILES64\nodejs\npm.cmd" install -g "$INSTDIR\readline-sync-1.4.10.tgz"'
  ExecWait '"$PROGRAMFILES64\nodejs\npm.cmd" install -g "$INSTDIR\node-windows-1.0.0-beta.6.tgz"'
  ExecWait "npm.cmd link node-windows readline-sync"

  # サービスとしてインストール
  ExecWait "$INSTDIR\install_service.bat"

  # フロントエンド用Apache Haus設定作成
  FileOpen $1 '$ApacheHausExtraConfPath\timecard-app-frontend.conf' w
  FileWrite $1 'DocumentRoot "$INSTDIR\frontend\dist"$\r$\n'
  FileWrite $1 '<Directory "$INSTDIR\frontend\dist">$\r$\n'
  FileWrite $1 '  Options Indexes Includes FollowSymLinks$\r$\n'
  FileWrite $1 '  AllowOverride AuthConfig Limit FileInfo$\r$\n'
  FileWrite $1 '  Require all granted$\r$\n'
  FileWrite $1 '</Directory>$\r$\n'
  FileClose $1

  # Apacheの再起動
  ExecWait 'net stop Apache2.4'
  ExecWait 'net start Apache2.4'


  # 作業用ファイルの削除
  Delete "$INSTDIR\readline-sync-1.4.10.tgz"
  Delete "$INSTDIR\node-windows-1.0.0-beta.6.tgz"

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

  # サービスのアンインストール
  ExecWait "$INSTDIR\uninstall_service.bat"

  SetOutPath "$INSTDIR\node_modules\timecard-app-backend"
  ExecWait "node -e '$UNINSTALL_SERVICE_JS' '$INSTDIR'"

  # アプリのアンインストール
  #SetOutPath "$INSTDIR"
  #ExecWait "npm.cmd uninstall timecard-app-backend"
  # npm uninstallを実行するとnpm linkでリンクしたnode-windowsまで削除されてしまうので、実行しないこと！！

  #Pop $OUTDIR
  #SetOutPath "$OUTDIR"

  # ディレクトリを削除
  RMDir /r "$INSTDIR\frontend"
  RMDir /r "$INSTDIR\backend"
  RMDir /r "$INSTDIR\node_modules"

  # ファイルを削除
  Delete "$INSTDIR\package.json"
  Delete "$INSTDIR\package-lock.json"
  Delete "$INSTDIR\configure.js"
  Delete "$INSTDIR\configure.bat"
  Delete "install_service.js"
  Delete "install_service.bat"
  Delete "uninstall_service.js"
  Delete "uninstall_service.bat"

  # アンインストーラを削除
  Delete "$INSTDIR\Uninstall.exe"

  # アプリケーションディレクトリを削除
  RMDir "$INSTDIR"

  Delete "$SMPROGRAMS\Timecard System Server\設定.lnk"
  RMDir /r "$SMPROGRAMS\Timecard System Server"

  # 共通パッケージのアンインストール
  ExecWait '"$PROGRAMFILES64\nodejs\npm.cmd" uninstall -g "$INSTDIR\readline-sync-1.4.10.tgz"'
  ExecWait '"$PROGRAMFILES64\nodejs\npm.cmd" uninstall -g "$INSTDIR\node-windows-1.0.0-beta.6.tgz"'

  # レジストリ キーを削除
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Timecard System Server"
SectionEnd

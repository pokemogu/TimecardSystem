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
!include "StrFunc.nsh"
${StrRep}

Function LaunchConfig
#  Exec 'npm.cmd run configure-service'
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

  # 前バージョンがインストールされている場合はエラー終了
  ReadRegStr $0 HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Timecard System Server" "UninstallString"
  StrCmp $0 "" noError_AppOldVersion

  MessageBox MB_OK|MB_ICONSTOP "旧バージョンがインストールされています。旧バージョンをアンインストールしてからこのインストーラーを実行してください。"
  Abort "旧バージョンがインストールされています。旧バージョンをアンインストールしてからこのインストーラーを実行してください。"

noError_AppOldVersion:

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

  ReadRegStr $0 HKLM "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\Apache HTTP Server 2.4.53 (Apache Haus)" "UninstallString"
  ${StrRep} $1 $0 '"' ''
  StrCpy $ApacheHausUninstallerPath $1
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

  IfFileExists "$ApacheHausExtraConfPath\*.*" noError_ApacheConf
  MessageBox MB_OK|MB_ICONSTOP "Apache by Apache Hausの設定ファイルフォルダ $ApacheHausExtraConfPath がみつかりません。Apache by Apache Hausを再インストールしてください。"
  Abort "Apache by Apache Hausの設定ファイルフォルダ $ApacheHausExtraConfPath がみつかりません。Apache by Apache Hausを再インストールしてください。"

noError_ApacheConf:

  DetailPrint "Apache Hausの設定ファイルフォルダ $ApacheHausExtraConfPath を確認しました。"

  # フロントエンドのインストール
  CreateDirectory "$INSTDIR\frontend"
  SetOutPath "$INSTDIR\frontend"
  File /r '..\frontend\dist\*'
  SetOutPath $INSTDIR

  # インストールされるファイル
  File 'node-windows-1.0.0-beta.6.tgz'

  # バックエンドのインストール
  !define TEMPDIR
  !searchreplace TEMPDIR "${__DATE__}${__TIME__}" "/" ""
  !searchreplace TEMPDIR "${TEMPDIR}" ":" ""

  !if "$%TEMP%" != "${U+24}%TEMP%"
    !define TEMPPATH "$%TEMP%\backend_${TEMPDIR}"
    !system 'robocopy "${__FILEDIR__}\..\backend" "${TEMPPATH}" /xd src mysql dbbackup /xf esbuild.js jest.setup.js fakeNames.js development-init.js tsconfig.json .env* docker-compose.yml Dockerfile /s /mir'
    !cd '${TEMPPATH}'
    !system 'npm.cmd install --production'
    File /r '${TEMPPATH}\*'
    !cd ${__FILEDIR__}
    !system 'rmdir "${TEMPPATH}" /s /q'
  !else
    !define SCRIPTDIR $%PWD%
    !define TEMPPATH "/tmp/backend_${TEMPDIR}"
    !system 'cp -pr "${__FILEDIR__}/../backend" "${TEMPPATH}"'
    !cd '${TEMPPATH}'
    !system 'npm install --production'
    File /r '${TEMPPATH}\*'
    !cd ${SCRIPTDIR}
    !system 'rm -fr "${TEMPPATH}"'
  !endif

  # mysqldumpのインストール
  File 'mysqldump.exe'
  File 'libcrypto-1_1-x64.dll'
  File 'libssl-1_1-x64.dll'

  # 共通パッケージのインストール
  ExecWait 'npm.cmd install --audit=false --prefer-offline=true -g "$INSTDIR\node-windows-1.0.0-beta.6.tgz"'
  ExecWait "npm.cmd run link-node-windows"

  # サービスとしてインストール
  ExecWait "npm.cmd run install-windows-service"

  # Apache Haus設定ディレクトリへのジャンクション(リンク)を作成する
  #ExecWait 'MKLINK /J "$INSTDIR\apacheconf" "$ApacheHausExtraConfPath"'
  ExecWait `powershell -Command "New-Item -ItemType Junction -Path '$INSTDIR\apacheconf' -Target '$ApacheHausExtraConfPath'"`

  # フロントエンド用Apache Haus設定作成
  FileOpen $1 $INSTDIR\apacheconf\timecard-app-frontend.conf w
  FileWrite $1 'DocumentRoot "$INSTDIR\frontend"$\r$\n'
  FileWrite $1 '<Directory "$INSTDIR\frontend">$\r$\n'
  FileWrite $1 '  Options Indexes Includes FollowSymLinks$\r$\n'
  FileWrite $1 '  AllowOverride AuthConfig Limit FileInfo$\r$\n'
  FileWrite $1 '  Require all granted$\r$\n'
  FileWrite $1 '</Directory>$\r$\n'
  FileClose $1

  # バックエンド用Apache Haus設定作成
  FileOpen $1 $INSTDIR\apacheconf\timecard-app-backend.conf w
  FileWrite $1 'ProxyRequests Off$\r$\n'
  FileWrite $1 '<Proxy *>$\r$\n'
  FileWrite $1 'Require all granted$\r$\n'
  FileWrite $1 '</Proxy>$\r$\n'
  FileWrite $1 'ProxyPass /api http://localhost:3000/api$\r$\n'
  FileWrite $1 'ProxyPassReverse /api http://localhost:3000/api$\r$\n'
  FileClose $1

  # Apacheの再起動
  ExecWait 'net stop Apache2.4'
  ExecWait 'net start Apache2.4'


  # 作業用ファイルの削除
  Delete "$INSTDIR\node-windows-1.0.0-beta.6.tgz"

  # アンインストーラを出力
  WriteUninstaller "$INSTDIR\Uninstall.exe"

  # スタート メニューにショートカットを登録
  CreateDirectory "$SMPROGRAMS\Timecard System Server"
  SetOutPath "$INSTDIR"

  CreateShortcut "$SMPROGRAMS\Timecard System Server\設定.lnk" "node" "configure.js"
  Push "$SMPROGRAMS\Timecard System Server\設定.lnk"
  Call ShellLinkSetRunAs
  Pop $0

  CreateShortcut "$SMPROGRAMS\Timecard System Server\サービスの開始.lnk" "node" "windows-service.js start wait"
  Push "$SMPROGRAMS\Timecard System Server\サービスの開始.lnk"
  Call ShellLinkSetRunAs
  Pop $0

  CreateShortcut "$SMPROGRAMS\Timecard System Server\サービスの停止.lnk" "node" "windows-service.js stop wait"
  Push "$SMPROGRAMS\Timecard System Server\サービスの停止.lnk"
  Call ShellLinkSetRunAs
  Pop $0

  CreateShortcut "$SMPROGRAMS\Timecard System Server\データベースのバックアップ.lnk" "node" "backupdb.js wait"
  Push "$SMPROGRAMS\Timecard System Server\データベースのバックアップ.lnk"
  Call ShellLinkSetRunAs
  Pop $0

  File TimecardSystem_EventLog.xml
  CreateShortcut "$SMPROGRAMS\Timecard System Server\ログ表示.lnk" "$SYSDIR\eventvwr.exe" '/v:"$INSTDIR\TimecardSystem_EventLog.xml"'
  CreateShortcut "$SMPROGRAMS\Timecard System Server\アンインストール.lnk" "$INSTDIR\Uninstall.exe" ""

  # レジストリに登録
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Timecard System Server" "DisplayName" "Timecard System Server"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Timecard System Server" "UninstallString" '"$INSTDIR\Uninstall.exe"'
SectionEnd

# アンインストーラ
Section "Uninstall"

  SetAutoClose false

  # サービスのアンインストール
  SetOutPath "$INSTDIR"
  ExecWait 'npm.cmd run uninstall-windows-service'

  # アプリのアンインストール
  #SetOutPath "$INSTDIR"
  #ExecWait "npm.cmd uninstall timecard-app-backend"
  # npm uninstallを実行するとnpm linkでリンクしたnode-windowsまで削除されてしまうので、実行しないこと！！

  #Pop $OUTDIR
  #SetOutPath "$OUTDIR"

  # ファイルを削除
  Delete "$INSTDIR\TimecardSystem_EventLog.xml"
  Delete "$INSTDIR\package.json"
  Delete "$INSTDIR\package-lock.json"
  Delete "$INSTDIR\windows-service.js"
  Delete "$INSTDIR\configure.js"
  Delete "$INSTDIR\knexfile.js"
  Delete "$INSTDIR\backupdb.js"
  #Delete "$INSTDIR\.env"
  Delete "$INSTDIR\.npmrc"
  Delete "$INSTDIR\migrations\*_initial_master.js"
  Delete "$INSTDIR\seeds\production-init.js"
  Delete "$INSTDIR\apacheconf\timecard-app-frontend.conf"
  Delete "$INSTDIR\apacheconf\timecard-app-backend.conf"
  Delete "$INSTDIR\mysqldump.exe"
  Delete "$INSTDIR\libcrypto-1_1-x64.dll"
  Delete "$INSTDIR\libssl-1_1-x64.dll"

  # ディレクトリを削除
  RMDir "$INSTDIR\migrations"
  RMDir "$INSTDIR\seeds"
  RMDir "$INSTDIR\apacheconf"
  RMDir /r "$INSTDIR\frontend"
  RMDir /r "$INSTDIR\dist"
  RMDir /r "$INSTDIR\node_modules"

  # Apacheの再起動
  ExecWait 'net stop Apache2.4'
  ExecWait 'net start Apache2.4'

  # アンインストーラを削除
  Delete "$INSTDIR\Uninstall.exe"

  # アプリケーションディレクトリを削除
  RMDir "$INSTDIR"

  Delete "$SMPROGRAMS\Timecard System Server\設定.lnk"
  Delete "$SMPROGRAMS\Timecard System Server\サービスの開始.lnk"
  Delete "$SMPROGRAMS\Timecard System Server\サービスの停止.lnk"
  Delete "$SMPROGRAMS\Timecard System Server\データベースのバックアップ.lnk"
  Delete "$SMPROGRAMS\Timecard System Server\ログ表示.lnk"
  Delete "$SMPROGRAMS\Timecard System Server\アンインストール.lnk"
  RMDir "$SMPROGRAMS\Timecard System Server"

  # 共通パッケージのアンインストール
  ExecWait 'npm.cmd uninstall -g node-windows'

  # レジストリ キーを削除
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Timecard System Server"
SectionEnd

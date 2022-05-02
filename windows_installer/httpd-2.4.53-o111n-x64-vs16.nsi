!include "StrFunc.nsh"

SetCompress auto
Unicode True

# 日本語UI
LoadLanguageFile "${NSISDIR}\Contrib\Language files\Japanese.nlf"

# アプリケーション名
Name "Apache HTTP Server 2.4.53 x64 by Apache Haus"

# 作成されるインストーラ
OutFile "httpd-2.4.53-o111n-x64-vs16.exe"

# デフォルトインストールフォルダ
InstallDir "$PROGRAMFILES64\Apache24"

${StrRep}

# ページ
Page directory
Page instfiles

# デフォルト セクション
Section

  SetAutoClose false

  # 出力先を指定します。
  SetOutPath "$INSTDIR"

  File /r "httpd-2.4.53-o111n-x64-vs16\*"
  File genselfcert.bat
  File httpd-ahssl.conf

  ExecWait "$INSTDIR\genselfcert.bat"
  #Rename "$INSTDIR\conf\httpd.conf" "$INSTDIR\conf\httpd.conf.orig"
  ${StrRep} "$0" "$INSTDIR" '\' '/'
  ExecWait `powershell -Command "(gc '$INSTDIR\conf\httpd.conf') -replace '/Apache24','$0' -replace '#LoadModule proxy_module modules/mod_proxy.so','LoadModule proxy_module modules/mod_proxy.so' -replace '#LoadModule proxy_http_module modules/mod_proxy_http.so','LoadModule proxy_http_module modules/mod_proxy_http.so' | Out-File -encoding ASCII '$INSTDIR\conf\httpd.conf'"`
  #Rename "$INSTDIR\conf\extra\httpd-ahssl.conf" "$INSTDIR\conf\extra\httpd-ahssl.conf.orig"
  #Rename "$INSTDIR\httpd-ahssl.conf" "$INSTDIR\conf\extra\httpd-ahssl.conf"

  # サービスとしてインストール
  ExecWait '"$INSTDIR\bin\httpd.exe" -k install'

  # アンインストーラを出力
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Apache HTTP Server 2.4.53 (Apache Haus)" "DisplayName" "Apache HTTP Server 2.4.53 (Apache Haus)"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Apache HTTP Server 2.4.53 (Apache Haus)" "UninstallString" '"$INSTDIR\Uninstall.exe"'

SectionEnd

Section "-cleanup"

  # 作業用ファイルの削除
  Delete "$INSTDIR\genselfcert.bat"
  Delete "$INSTDIR\httpd-ahssl.conf"

  # サービスの開始
  ExecWait '"$INSTDIR\bin\httpd" -k start'

SectionEnd

# アンインストーラ
Section "Uninstall"

  SetAutoClose false
  SetOutPath "$INSTDIR"

  # サービスの停止
  ExecWait '"$INSTDIR\bin\httpd.exe" -k stop'

  # サービスの削除
  ExecWait '"$INSTDIR\bin\httpd.exe" -k uninstall'

  # ファイルを削除
  !include ".\httpd-2.4.53-o111n-x64-vs16_unList.nsi"

  # アンインストーラを削除
  Delete "$INSTDIR\Uninstall.exe"

  # アプリケーションディレクトリを削除
  RMDir "$INSTDIR"

  # レジストリ キーを削除
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Apache HTTP Server 2.4.53 (Apache Haus)"
SectionEnd

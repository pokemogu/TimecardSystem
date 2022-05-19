@echo off
for /f "delims=[] tokens=2" %%a in ('ping -4 -n 1 %ComputerName% ^| findstr [') do set NetworkIP=%%a
echo Network IP Address: %NetworkIP%

echo [ req ] > "%TEMP%\openssl.conf"
echo default_bits       = 4096 >> "%TEMP%\openssl.conf"
echo distinguished_name = req_distinguished_name >> "%TEMP%\openssl.conf"
echo req_extensions     = req_ext >> "%TEMP%\openssl.conf"
echo prompt             = no >> "%TEMP%\openssl.conf"

echo [ req_distinguished_name ] >> "%TEMP%\openssl.conf"
echo commonName                  = %NetworkIP% >> "%TEMP%\openssl.conf"

echo [ req_ext ] >> "%TEMP%\openssl.conf"
echo subjectAltName = IP:%NetworkIP% >> "%TEMP%\openssl.conf"

"C:\Apache24\bin\openssl" req -config "%TEMP%\openssl.conf" -x509 -nodes -newkey rsa:4096 -keyout "C:\Apache24\conf\ssl\server.key" -out "C:\Apache24\conf\ssl\server.crt" -extensions req_ext -sha256 -days 3650
rem C:\Apache24\bin\openssl rsa -in "%TEMP%\key.pem" -out C:\Apache24\conf\ssl\server.key
del "%TEMP%\openssl.conf"

@echo off
pushd

cd /D %~dp0

if '%1'=='' ( 
	Set Mode=Release
) else (
	Set Mode=%1
)

set doPause=1
if not "%2" == "" set doPause=0
call grunt
@if ERRORLEVEL 1 goto fail

set doPause=1
if not "%2" == "" set doPause=0
%systemroot%\Microsoft.NET\Framework\v4.0.30319\MSBuild.exe ".\build\src\Eventy.sln" /t:Build /p:Configuration=%Mode% /p:OutDir=..\package
@if ERRORLEVEL 1 goto fail

goto end

:fail
if "%doPause%" == "1" pause
popd
exit /b 1

:end
popd
if "%doPause%" == "1" pause
exit /b 0
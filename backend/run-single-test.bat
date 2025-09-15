@echo off
echo Running AuthServiceTest...
mvn test -Dtest=AuthServiceTest -q
echo.
echo Test completed!
pause

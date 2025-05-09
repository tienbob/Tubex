@echo off
REM Set execute permissions for script files in Linux containers
echo Setting execute permissions for migration scripts...

docker run --rm -v %CD%:/app alpine sh -c "chmod +x /app/scripts/*.sh"

echo Done!

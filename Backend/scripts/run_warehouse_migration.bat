@echo off
REM Script to run database migrations for warehouse enhancement
echo Running database migrations for enhancing Warehouse service...

REM Navigate to the backend directory
cd ..\Backend

REM Make sure dependencies are installed
echo Installing dependencies...
call npm install

REM Run the migration
echo Running migration...
call npm run migration:run

echo Migration completed successfully!
echo The warehouse table has been updated with the new fields.
echo   - capacity: decimal (storage capacity)
echo   - contact_info: jsonb (contact person details)
echo   - type: varchar (warehouse type)
echo   - notes: text (additional information)

echo Ready to use the enhanced Warehouse service!
pause

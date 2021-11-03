DECLARE @DBVersion AS nvarchar(10), @ExpectedDBVersion AS nvarchar(10), @NextDBVersion AS nvarchar(10), @NextAppVersion as nvarchar(10);
SET @ExpectedDBVersion = {{CURRENT_DB_VERSION}};
SET @NextDBVersion = {{NEXT_DB_VERSION}};
SET @NextAppVersion = {{NEXT_APP_VERSION}};
PRINT '+--------------------------------------------------------------+';
PRINT '| current database version: ' + @DBVersion + '                            |';
PRINT '+--------------------------------------------------------------+';
PRINT '';
PRINT '########  ########'
PRINT '';
SET @NextAppVersion = {{NEXT_APP_VERSION}};
SET @ExpectedDBVersion = {{CURRENT_DB_VERSION}};
SET @NextDBVersion = {{NEXT_DB_VERSION}};
PRINT '';
PRINT '########  ########'
PRINT '';
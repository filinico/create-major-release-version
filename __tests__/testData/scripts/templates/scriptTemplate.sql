DECLARE @DBVersion AS nvarchar(10), @ExpectedDBVersion AS nvarchar(10), @NextDBVersion AS nvarchar(10);
SET @ExpectedDBVersion = {{CURRENT_DB_VERSION}};
SET @NextDBVersion = {{NEXT_DB_VERSION}};
PRINT '+--------------------------------------------------------------+';
PRINT '| current database version: ' + @DBVersion + '                            |';
PRINT '+--------------------------------------------------------------+';
PRINT '';
PRINT '########  ########'
PRINT '';
SET @ExpectedDBVersion = {{CURRENT_DB_VERSION}};
SET @NextDBVersion = {{NEXT_DB_VERSION}};
PRINT '';
PRINT '########  ########'
PRINT '';
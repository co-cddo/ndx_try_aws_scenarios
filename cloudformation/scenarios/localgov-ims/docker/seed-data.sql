-- =============================================================================
-- LocalGov IMS -- Custom Seed Data (runs AFTER EF6 DemoData.sql)
-- =============================================================================

:setvar GOVUKPAY_API_KEY "NOT_SET"

SET NOCOUNT ON;
SET XACT_ABORT ON;
BEGIN TRANSACTION;

PRINT '=== LocalGov IMS Custom Seed Data ==='

-- 1. GOV.UK Pay API key for all enabled funds
PRINT '=== Setting GOV.UK Pay API keys ==='

DECLARE @govPayKeyId INT;
SELECT @govPayKeyId = Id FROM MetadataKeys WHERE [Name] = 'GovUkPay.Api.Key';
IF @govPayKeyId IS NULL
BEGIN
    INSERT INTO MetadataKeys ([Name], [Description], SystemType, EntityType)
    VALUES ('GovUkPay.Api.Key', 'GOV.UK Pay API key for this fund', 0, 2);
    SET @govPayKeyId = SCOPE_IDENTITY();
END

INSERT INTO FundMetadata (MetadataKeyId, Value, FundCode)
SELECT @govPayKeyId, '$(GOVUKPAY_API_KEY)', f.FundCode
FROM Funds f
WHERE f.Disabled = 0
  AND NOT EXISTS (SELECT 1 FROM FundMetadata fm WHERE fm.FundCode = f.FundCode AND fm.MetadataKeyId = @govPayKeyId);
PRINT '  GOV.UK Pay API keys set'

-- 2. Account holders -- use actual fund codes from the database
PRINT '=== Seeding account holders ==='

DECLARE @sysUser INT = 0;
DECLARE @now DATETIME = GETDATE();

-- Get the first fund code that exists in the database
DECLARE @firstFund VARCHAR(5);
SELECT TOP 1 @firstFund = FundCode FROM Funds WHERE Disabled = 0 ORDER BY FundCode;
PRINT '  Using fund code: ' + ISNULL(@firstFund, 'NONE');

IF @firstFund IS NOT NULL AND NOT EXISTS (SELECT 1 FROM AccountHolders WHERE AccountReference LIKE 'AH%')
BEGIN
    DECLARE @j INT = 1;
    DECLARE @names TABLE (Idx INT IDENTITY, Title VARCHAR(10), Forename VARCHAR(50), Surname VARCHAR(50), Addr1 VARCHAR(60), Postcode VARCHAR(10));
    INSERT INTO @names VALUES
    ('Mr','James','Thompson','12 High Street','OX1 1AA'),('Mrs','Sarah','Williams','34 Church Lane','CT1 2BB'),
    ('Ms','Emma','Johnson','56 Oak Road','GU1 3CC'),('Mr','David','Brown','78 Mill Lane','SO1 4DD'),
    ('Mrs','Lisa','Davies','90 Station Road','CM1 5EE'),('Mr','Robert','Wilson','11 Park Avenue','RG1 6FF'),
    ('Ms','Helen','Taylor','23 King Street','EX1 7GG'),('Mr','Michael','Anderson','45 Queens Road','NR1 8HH'),
    ('Mrs','Claire','Thomas','67 Bridge Street','IP1 9JJ'),('Mr','Andrew','Jackson','89 Market Place','DT1 1KK'),
    ('Ms','Rachel','White','10 Victoria Road','SN1 2LL'),('Mr','Peter','Harris','22 Albert Street','BA1 3MM'),
    ('Mrs','Karen','Martin','44 George Lane','SY1 4NN'),('Mr','Steven','Clark','66 William Road','NG1 5PP'),
    ('Ms','Angela','Lewis','88 Elizabeth Way','LE1 6QQ'),('Mr','Mark','Walker','15 Edward Close','CV1 7RR'),
    ('Mrs','Julie','Hall','27 Charles Ave','GL1 8SS'),('Mr','Paul','Allen','39 Henry Lane','ST1 9TT'),
    ('Ms','Nicola','Young','51 Mary Street','CB1 1UU'),('Mr','Simon','King','63 Anne Road','LN1 2VV');

    DECLARE @nCount INT;
    SELECT @nCount = COUNT(*) FROM @names;

    -- Create account holders using actual fund codes from the database
    DECLARE @funds TABLE (Idx INT IDENTITY, FundCode VARCHAR(5));
    INSERT INTO @funds (FundCode) SELECT TOP 10 FundCode FROM Funds WHERE Disabled = 0 ORDER BY FundCode;
    DECLARE @fTotal INT;
    SELECT @fTotal = COUNT(*) FROM @funds;

    WHILE @j <= 40
    BEGIN
        DECLARE @ref VARCHAR(30) = 'AH' + RIGHT('000000' + CAST(@j AS VARCHAR), 6);
        DECLARE @fIdx INT = (@j % @fTotal) + 1;
        DECLARE @nIdx INT = (@j % @nCount) + 1;
        DECLARE @fund VARCHAR(5);
        SELECT @fund = FundCode FROM @funds WHERE Idx = @fIdx;

        DECLARE @t VARCHAR(10), @fn VARCHAR(50), @sn VARCHAR(50), @a1 VARCHAR(60), @pc VARCHAR(10);
        SELECT @t=Title, @fn=Forename, @sn=Surname, @a1=Addr1, @pc=Postcode FROM @names WHERE Idx = @nIdx;

        INSERT INTO AccountHolders (AccountReference, FundCode, Title, Forename, Surname, AddressLine1, Postcode, CurrentBalance, PeriodDebit, PeriodCredit, RecordType, CreatedAt, CreatedByUserId)
        VALUES (@ref, @fund, @t, @fn, @sn, @a1, @pc, CAST(100 + (@j * 37 % 1700) AS DECIMAL(18,2)), 0, 0, 'D', @now, @sysUser);

        SET @j = @j + 1;
    END
    PRINT '  Inserted 40 account holders'
END
ELSE IF @firstFund IS NULL
BEGIN
    PRINT '  WARNING: No funds found in database, skipping account holders'
END
ELSE
BEGIN
    PRINT '  Account holders already exist, skipping'
END

-- 3. Processed transactions (simple loop)
PRINT '=== Seeding processed transactions ==='

IF (SELECT COUNT(*) FROM ProcessedTransactions) < 50
BEGIN
    DECLARE @i INT = 1;
    DECLARE @fundCodes TABLE (Idx INT IDENTITY, FundCode VARCHAR(5));
    INSERT INTO @fundCodes (FundCode) SELECT TOP 10 FundCode FROM Funds WHERE Disabled = 0 ORDER BY FundCode;
    DECLARE @fCount INT;
    SELECT @fCount = COUNT(*) FROM @fundCodes;

    DECLARE @mopCodes TABLE (Idx INT IDENTITY, MopCode VARCHAR(5));
    INSERT INTO @mopCodes (MopCode) SELECT TOP 5 MopCode FROM Mops WHERE Disabled = 0 ORDER BY MopCode;
    DECLARE @mCount INT;
    SELECT @mCount = COUNT(*) FROM @mopCodes;

    WHILE @i <= 500
    BEGIN
        DECLARE @fc VARCHAR(5), @mc VARCHAR(5);
        SELECT @fc = FundCode FROM @fundCodes WHERE Idx = (@i % @fCount) + 1;
        SELECT @mc = MopCode FROM @mopCodes WHERE Idx = (@i % @mCount) + 1;

        INSERT INTO ProcessedTransactions (
            TransactionReference, InternalReference, OfficeCode, EntryDate, TransactionDate,
            AccountReference, UserCode, FundCode, MopCode, Amount, VatAmount, VatCode,
            Narrative, VatRate, ReceiptIssued)
        VALUES (
            LOWER(NEWID()), LOWER(NEWID()), 'S',
            DATEADD(MINUTE, -@i * 250, GETDATE()),
            DATEADD(MINUTE, -@i * 250, GETDATE()),
            ISNULL((SELECT TOP 1 AccountReference FROM AccountHolders WHERE FundCode = @fc), 'AH000001'),
            1, @fc, @mc,
            CAST(10 + (@i * 7 % 190) AS DECIMAL(18,2)),
            0, ISNULL((SELECT TOP 1 VatCode FROM Vat WHERE Disabled = 0), 'E0'),
            'Payment received', 0, 0);

        SET @i = @i + 1;
    END
    PRINT '  Inserted 500 transactions'
END
ELSE
BEGIN
    PRINT '  Transactions already exist, skipping'
END

-- 4. Additional staff users
PRINT '=== Seeding staff users ==='

DECLARE @newUid INT;

IF NOT EXISTS (SELECT 1 FROM Users WHERE UserName = 'finance.officer')
BEGIN
    INSERT INTO Users (UserName, DisplayName, Disabled, ExpiryDays, CreatedAt, OfficeCode)
    VALUES ('finance.officer', 'Finance Officer', 0, 365, GETDATE(), 'S');
    SET @newUid = SCOPE_IDENTITY();
    INSERT INTO AspNetUsers (Id, Email, EmailConfirmed, PasswordHash, SecurityStamp, PhoneNumberConfirmed, TwoFactorEnabled, LockoutEnabled, AccessFailedCount, UserName)
    VALUES (LOWER(NEWID()), 'finance@demo.local', 1, '', NEWID(), 0, 0, 0, 0, 'finance.officer');
    INSERT INTO UserRoles (UserId, RoleId) SELECT @newUid, RoleId FROM Roles WHERE [Name] IN ('Transaction.List','Transaction.Details','Transaction.Create','Transfer');
    PRINT '  Created finance.officer'
END

IF NOT EXISTS (SELECT 1 FROM Users WHERE UserName = 'cashier')
BEGIN
    INSERT INTO Users (UserName, DisplayName, Disabled, ExpiryDays, CreatedAt, OfficeCode)
    VALUES ('cashier', 'Cashier', 0, 365, GETDATE(), 'S');
    SET @newUid = SCOPE_IDENTITY();
    INSERT INTO AspNetUsers (Id, Email, EmailConfirmed, PasswordHash, SecurityStamp, PhoneNumberConfirmed, TwoFactorEnabled, LockoutEnabled, AccessFailedCount, UserName)
    VALUES (LOWER(NEWID()), 'cashier@demo.local', 1, '', NEWID(), 0, 0, 0, 0, 'cashier');
    INSERT INTO UserRoles (UserId, RoleId) SELECT @newUid, RoleId FROM Roles WHERE [Name] IN ('Transaction.List','Transaction.Details','Transaction.Create');
    PRINT '  Created cashier'
END

IF NOT EXISTS (SELECT 1 FROM Users WHERE UserName = 'auditor')
BEGIN
    INSERT INTO Users (UserName, DisplayName, Disabled, ExpiryDays, CreatedAt, OfficeCode)
    VALUES ('auditor', 'Read-Only Auditor', 0, 365, GETDATE(), 'S');
    SET @newUid = SCOPE_IDENTITY();
    INSERT INTO AspNetUsers (Id, Email, EmailConfirmed, PasswordHash, SecurityStamp, PhoneNumberConfirmed, TwoFactorEnabled, LockoutEnabled, AccessFailedCount, UserName)
    VALUES (LOWER(NEWID()), 'auditor@demo.local', 1, '', NEWID(), 0, 0, 0, 0, 'auditor');
    INSERT INTO UserRoles (UserId, RoleId) SELECT @newUid, RoleId FROM Roles WHERE [Name] IN ('Transaction.List','Transaction.Details');
    PRINT '  Created auditor'
END

-- 5. Fund group
PRINT '=== Seeding fund groups ==='
IF NOT EXISTS (SELECT 1 FROM FundGroups WHERE [Name] = 'All Revenue')
BEGIN
    INSERT INTO FundGroups ([Name]) VALUES ('All Revenue');
    DECLARE @fgId INT = SCOPE_IDENTITY();
    INSERT INTO FundGroupFunds (FundGroupId, FundCode)
    SELECT @fgId, FundCode FROM Funds WHERE Disabled = 0;
    PRINT '  Created All Revenue fund group'
END

-- Summary
PRINT '=== Seed data complete ==='
DECLARE @cnt INT;
SELECT @cnt = COUNT(*) FROM Funds WHERE Disabled = 0; PRINT '  Funds: ' + CAST(@cnt AS VARCHAR);
SELECT @cnt = COUNT(*) FROM Mops WHERE Disabled = 0; PRINT '  MOPs: ' + CAST(@cnt AS VARCHAR);
SELECT @cnt = COUNT(*) FROM AccountHolders; PRINT '  Account Holders: ' + CAST(@cnt AS VARCHAR);
SELECT @cnt = COUNT(*) FROM ProcessedTransactions; PRINT '  Transactions: ' + CAST(@cnt AS VARCHAR);
SELECT @cnt = COUNT(*) FROM Suspenses; PRINT '  Suspense Items: ' + CAST(@cnt AS VARCHAR);
SELECT @cnt = COUNT(*) FROM Users WHERE UserId > 0; PRINT '  Users: ' + CAST(@cnt AS VARCHAR);

COMMIT TRANSACTION;
PRINT '=== Transaction committed ==='

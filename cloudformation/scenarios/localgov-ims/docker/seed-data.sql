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

-- 2. Account holders (simple INSERT, no CTEs)
PRINT '=== Seeding account holders ==='

DECLARE @sysUser INT = 0;
DECLARE @now DATETIME = GETDATE();

IF NOT EXISTS (SELECT 1 FROM AccountHolders WHERE AccountReference = 'CT000001')
BEGIN
    INSERT INTO AccountHolders (AccountReference, FundCode, Title, Forename, Surname, AddressLine1, AddressLine2, AddressLine3, Postcode, CurrentBalance, PeriodDebit, PeriodCredit, RecordType, CreatedAt, CreatedByUserId) VALUES
    ('CT000001','01','Mr','James','Thompson','12 High Street','','Anytown','OX1 1AA',1250.00,0,0,'D',@now,@sysUser),
    ('CT000002','01','Mrs','Sarah','Williams','34 Church Lane','Flat 2','Riverdale','CT1 2BB',875.50,0,0,'D',@now,@sysUser),
    ('CT000003','01','Ms','Emma','Johnson','56 Oak Road','','Hillview','GU1 3CC',1680.00,0,0,'D',@now,@sysUser),
    ('CT000004','01','Mr','David','Brown','78 Mill Lane','Unit 4','Lakeside','SO1 4DD',450.25,0,0,'D',@now,@sysUser),
    ('CT000005','01','Mrs','Lisa','Davies','90 Station Road','','Greenfield','CM1 5EE',1100.00,0,0,'D',@now,@sysUser),
    ('CT000006','01','Mr','Robert','Wilson','11 Park Avenue','Apt 3','Woodlands','RG1 6FF',925.75,0,0,'D',@now,@sysUser),
    ('CT000007','01','Ms','Helen','Taylor','23 King Street','','Meadowbank','EX1 7GG',1450.00,0,0,'D',@now,@sysUser),
    ('CT000008','01','Mr','Michael','Anderson','45 Queens Road','Floor 2','Fairview','NR1 8HH',780.00,0,0,'D',@now,@sysUser),
    ('CT000009','01','Mrs','Claire','Thomas','67 Bridge Street','','Westfield','IP1 9JJ',1320.50,0,0,'D',@now,@sysUser),
    ('CT000010','01','Mr','Andrew','Jackson','89 Market Place','Suite 1','Eastgate','DT1 1KK',560.00,0,0,'D',@now,@sysUser),
    ('CT000011','01','Ms','Rachel','White','10 Victoria Road','','Northway','SN1 2LL',1750.00,0,0,'D',@now,@sysUser),
    ('CT000012','01','Mr','Peter','Harris','22 Albert Street','Flat 5','Southend','BA1 3MM',890.25,0,0,'D',@now,@sysUser),
    ('CT000013','01','Mrs','Karen','Martin','44 George Lane','','Oldtown','SY1 4NN',1100.50,0,0,'D',@now,@sysUser),
    ('CT000014','01','Mr','Steven','Clark','66 William Road','Block B','Newbury','NG1 5PP',675.00,0,0,'D',@now,@sysUser),
    ('CT000015','01','Ms','Angela','Lewis','88 Elizabeth Way','','Crossroads','LE1 6QQ',1500.00,0,0,'D',@now,@sysUser),
    ('CT000016','01','Mr','Mark','Walker','15 Edward Close','Flat 1','Springvale','CV1 7RR',430.75,0,0,'D',@now,@sysUser),
    ('CT000017','01','Mrs','Julie','Hall','27 Charles Ave','','Riverside','GL1 8SS',1200.00,0,0,'D',@now,@sysUser),
    ('CT000018','01','Mr','Paul','Allen','39 Henry Lane','Unit 7','Bayview','ST1 9TT',965.50,0,0,'D',@now,@sysUser),
    ('CT000019','01','Ms','Nicola','Young','51 Mary Street','','Clearwater','CB1 1UU',1380.00,0,0,'D',@now,@sysUser),
    ('CT000020','01','Mr','Simon','King','63 Anne Road','Flat 9','Stonegate','LN1 2VV',720.25,0,0,'D',@now,@sysUser);
    -- Business Rates
    INSERT INTO AccountHolders (AccountReference, FundCode, Title, Forename, Surname, AddressLine1, AddressLine2, AddressLine3, Postcode, CurrentBalance, PeriodDebit, PeriodCredit, RecordType, CreatedAt, CreatedByUserId) VALUES
    ('BR000001','02','Mr','Richard','Evans','1 Commerce Way','','Business Park','BS1 1AA',4500.00,0,0,'D',@now,@sysUser),
    ('BR000002','02','Mrs','Patricia','Roberts','2 Trade Street','Unit 12','Industrial Estate','LS1 2BB',3200.00,0,0,'D',@now,@sysUser),
    ('BR000003','02','Mr','Christopher','Turner','3 Enterprise Road','','Retail Park','M1 3CC',8750.00,0,0,'D',@now,@sysUser),
    ('BR000004','02','Ms','Margaret','Phillips','4 Market Way','Floor 3','Town Centre','L1 4DD',2100.00,0,0,'D',@now,@sysUser),
    ('BR000005','02','Mr','Thomas','Campbell','5 Factory Lane','','Industrial Zone','S1 5EE',5600.00,0,0,'D',@now,@sysUser);
    -- Housing Rents
    INSERT INTO AccountHolders (AccountReference, FundCode, Title, Forename, Surname, AddressLine1, AddressLine2, AddressLine3, Postcode, CurrentBalance, PeriodDebit, PeriodCredit, RecordType, CreatedAt, CreatedByUserId) VALUES
    ('HR000001','03','Mr','William','Scott','1 Council Estate','','Oakfield','B1 1AA',520.00,0,0,'D',@now,@sysUser),
    ('HR000002','03','Mrs','Dorothy','Green','2 Tower Block','Flat 14','Riverside','E1 2BB',480.50,0,0,'D',@now,@sysUser),
    ('HR000003','03','Mr','George','Baker','3 Sheltered Close','','Hillside','N1 3CC',395.00,0,0,'D',@now,@sysUser),
    ('HR000004','03','Ms','Susan','Adams','4 Maisonette Row','Ground Floor','Lakewood','W1 4DD',610.00,0,0,'D',@now,@sysUser),
    ('HR000005','03','Mr','Edward','Nelson','5 Terrace Walk','','Meadows','SE1 5EE',445.75,0,0,'D',@now,@sysUser);
    -- Parking
    INSERT INTO AccountHolders (AccountReference, FundCode, Title, Forename, Surname, AddressLine1, AddressLine2, AddressLine3, Postcode, CurrentBalance, PeriodDebit, PeriodCredit, RecordType, CreatedAt, CreatedByUserId) VALUES
    ('PK000001','04','Mr','Daniel','Mitchell','10 Elm Street','','Parkside','SW1 1AA',35.00,0,0,'D',@now,@sysUser),
    ('PK000002','04','Ms','Jennifer','Carter','20 Birch Lane','','Woodside','WC1 2BB',70.00,0,0,'D',@now,@sysUser),
    ('PK000003','04','Mr','Matthew','Morris','30 Pine Avenue','','Hillcrest','EC1 3CC',35.00,0,0,'D',@now,@sysUser),
    ('PK000004','04','Mrs','Laura','Rogers','40 Cedar Close','','Valleyview','NW1 4DD',105.00,0,0,'D',@now,@sysUser),
    ('PK000005','04','Mr','Joseph','Reed','50 Willow Way','','Brookside','N1 5EE',70.00,0,0,'D',@now,@sysUser);
    PRINT '  Inserted 35 account holders'
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
            'CT000001', 1, @fc, @mc,
            CAST(10 + (@i * 7 % 190) AS DECIMAL(18,2)),
            0, 'E0', 'Payment received', 0, 0);

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

DECLARE @maxUid INT;
SELECT @maxUid = ISNULL(MAX(UserId), 2) FROM Users WHERE UserId > 0;

IF NOT EXISTS (SELECT 1 FROM Users WHERE UserName = 'finance.officer')
BEGIN
    SET @maxUid = @maxUid + 1;
    INSERT INTO Users (UserId, UserName, DisplayName, Disabled, ExpiryDays, CreatedAt, OfficeCode)
    VALUES (@maxUid, 'finance.officer', 'Finance Officer', 0, 365, GETDATE(), 'S');
    INSERT INTO AspNetUsers (Id, Email, EmailConfirmed, PasswordHash, SecurityStamp, PhoneNumberConfirmed, TwoFactorEnabled, LockoutEnabled, AccessFailedCount, UserName)
    VALUES (LOWER(NEWID()), 'finance@demo.local', 1, '', NEWID(), 0, 0, 0, 0, 'finance.officer');
    INSERT INTO UserRoles (UserId, RoleId) SELECT @maxUid, RoleId FROM Roles WHERE [Name] IN ('Transaction.List','Transaction.Details','Transaction.Create','Transfer');
    PRINT '  Created finance.officer'
END

IF NOT EXISTS (SELECT 1 FROM Users WHERE UserName = 'cashier')
BEGIN
    SET @maxUid = @maxUid + 1;
    INSERT INTO Users (UserId, UserName, DisplayName, Disabled, ExpiryDays, CreatedAt, OfficeCode)
    VALUES (@maxUid, 'cashier', 'Cashier', 0, 365, GETDATE(), 'S');
    INSERT INTO AspNetUsers (Id, Email, EmailConfirmed, PasswordHash, SecurityStamp, PhoneNumberConfirmed, TwoFactorEnabled, LockoutEnabled, AccessFailedCount, UserName)
    VALUES (LOWER(NEWID()), 'cashier@demo.local', 1, '', NEWID(), 0, 0, 0, 0, 'cashier');
    INSERT INTO UserRoles (UserId, RoleId) SELECT @maxUid, RoleId FROM Roles WHERE [Name] IN ('Transaction.List','Transaction.Details','Transaction.Create');
    PRINT '  Created cashier'
END

IF NOT EXISTS (SELECT 1 FROM Users WHERE UserName = 'auditor')
BEGIN
    SET @maxUid = @maxUid + 1;
    INSERT INTO Users (UserId, UserName, DisplayName, Disabled, ExpiryDays, CreatedAt, OfficeCode)
    VALUES (@maxUid, 'auditor', 'Read-Only Auditor', 0, 365, GETDATE(), 'S');
    INSERT INTO AspNetUsers (Id, Email, EmailConfirmed, PasswordHash, SecurityStamp, PhoneNumberConfirmed, TwoFactorEnabled, LockoutEnabled, AccessFailedCount, UserName)
    VALUES (LOWER(NEWID()), 'auditor@demo.local', 1, '', NEWID(), 0, 0, 0, 0, 'auditor');
    INSERT INTO UserRoles (UserId, RoleId) SELECT @maxUid, RoleId FROM Roles WHERE [Name] IN ('Transaction.List','Transaction.Details');
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

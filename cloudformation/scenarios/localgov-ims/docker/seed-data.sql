-- =============================================================================
-- LocalGov IMS -- Custom Seed Data
--
-- Runs AFTER EF6 DemoData.sql has created: offices, demo users, 19 funds,
-- 19 MOPs, 5 VAT codes, templates, 18 suspense items, payment integrations,
-- import rules/types, eReturns, fund metadata, and MetadataKeys.
--
-- This script ADDS:
--   - GOV.UK Pay API key to fund metadata for basket-enabled funds
--   - 200+ account holders with realistic UK data
--   - 500+ processed transactions across 3 months
--   - 3 additional staff users with role assignments
--   - Fund groups with user access
--
-- Uses :setvar for GOVUKPAY_API_KEY (passed by entrypoint via sqlcmd -v)
-- Wrapped in a transaction for atomicity
-- =============================================================================

:setvar GOVUKPAY_API_KEY "NOT_SET"

SET NOCOUNT ON;
SET XACT_ABORT ON;
BEGIN TRANSACTION;

PRINT '=== LocalGov IMS Custom Seed Data ==='

-- =============================================================================
-- 1. GOV.UK PAY API KEY (set for all basket-enabled funds)
-- DemoData.sql creates MetadataKey 'IsABasketFund' (id varies). We need to
-- add the GovUkPay.Api.Key metadata for funds that have IsABasketFund=True.
-- =============================================================================
PRINT '=== Setting GOV.UK Pay API keys ==='

-- Find the MetadataKey ID for the GOV.UK Pay API key
DECLARE @govPayKeyId INT;
SELECT @govPayKeyId = Id FROM MetadataKeys WHERE [Name] = 'GovUkPay.Api.Key';

-- If the key doesn't exist, create it (EntityType 2 = Fund metadata)
IF @govPayKeyId IS NULL
BEGIN
    INSERT INTO MetadataKeys ([Name], [Description], SystemType, EntityType)
    VALUES ('GovUkPay.Api.Key', 'GOV.UK Pay API key for this fund', 0, 2);
    SET @govPayKeyId = SCOPE_IDENTITY();
END

-- Set the API key for all funds that don't already have it
INSERT INTO FundMetadata (MetadataKeyId, Value, FundCode)
SELECT @govPayKeyId, '$(GOVUKPAY_API_KEY)', f.FundCode
FROM Funds f
WHERE f.Disabled = 0
  AND NOT EXISTS (
    SELECT 1 FROM FundMetadata fm
    WHERE fm.FundCode = f.FundCode AND fm.MetadataKeyId = @govPayKeyId
  );

PRINT '  GOV.UK Pay API keys set for all enabled funds'

-- =============================================================================
-- 2. ACCOUNT HOLDERS (200+)
-- DemoData.sql doesn't create account holders. We create 210 across funds.
-- =============================================================================
PRINT '=== Seeding account holders ==='

-- Get the system user ID for CreatedByUserId
DECLARE @systemUserId INT = 0;  -- SeedData.sql creates user 0 = System/Import

-- Use a CTE to generate account holders across funds
;WITH FundList AS (
    SELECT FundCode, ROW_NUMBER() OVER (ORDER BY FundCode) AS FundIdx
    FROM Funds WHERE Disabled = 0
),
Names AS (
    SELECT * FROM (VALUES
        ('Mr','James','Thompson','12 High Street','','Anytown','Oxfordshire','OX1 1AA'),
        ('Mrs','Sarah','Williams','34 Church Lane','Flat 2','Riverdale','Kent','CT1 2BB'),
        ('Ms','Emma','Johnson','56 Oak Road','','Hillview','Surrey','GU1 3CC'),
        ('Mr','David','Brown','78 Mill Lane','Unit 4','Lakeside','Hampshire','SO1 4DD'),
        ('Mrs','Lisa','Davies','90 Station Road','','Greenfield','Essex','CM1 5EE'),
        ('Mr','Robert','Wilson','11 Park Avenue','Apt 3','Woodlands','Berkshire','RG1 6FF'),
        ('Ms','Helen','Taylor','23 King Street','','Meadowbank','Devon','EX1 7GG'),
        ('Mr','Michael','Anderson','45 Queens Road','Floor 2','Fairview','Norfolk','NR1 8HH'),
        ('Mrs','Claire','Thomas','67 Bridge Street','','Westfield','Suffolk','IP1 9JJ'),
        ('Mr','Andrew','Jackson','89 Market Place','Suite 1','Eastgate','Dorset','DT1 1KK'),
        ('Ms','Rachel','White','10 Victoria Road','','Northway','Wiltshire','SN1 2LL'),
        ('Mr','Peter','Harris','22 Albert Street','Flat 5','Southend','Somerset','BA1 3MM'),
        ('Mrs','Karen','Martin','44 George Lane','','Oldtown','Shropshire','SY1 4NN'),
        ('Mr','Steven','Clark','66 William Road','Block B','Newbury','Nottinghamshire','NG1 5PP'),
        ('Ms','Angela','Lewis','88 Elizabeth Way','','Crossroads','Leicestershire','LE1 6QQ'),
        ('Mr','Mark','Walker','15 Edward Close','Flat 1','Springvale','Warwickshire','CV1 7RR'),
        ('Mrs','Julie','Hall','27 Charles Ave','','Riverside','Gloucestershire','GL1 8SS'),
        ('Mr','Paul','Allen','39 Henry Lane','Unit 7','Bayview','Staffordshire','ST1 9TT'),
        ('Ms','Nicola','Young','51 Mary Street','','Clearwater','Cambridgeshire','CB1 1UU'),
        ('Mr','Simon','King','63 Anne Road','Flat 9','Stonegate','Lincolnshire','LN1 2VV')
    ) AS t(Title,Forename,Surname,Addr1,Addr2,Addr3,Addr4,Postcode)
),
Numbered AS (
    SELECT n.*, fl.FundCode, fl.FundIdx,
           ROW_NUMBER() OVER (ORDER BY fl.FundIdx, n.Surname) AS RowNum
    FROM Names n
    CROSS JOIN FundList fl
)
INSERT INTO AccountHolders (AccountReference, FundCode, Title, Forename, Surname,
    AddressLine1, AddressLine2, AddressLine3, AddressLine4, Postcode,
    CurrentBalance, PeriodDebit, PeriodCredit, RecordType,
    CreatedAt, CreatedByUserId)
SELECT
    -- Generate unique reference: FundCode + 6-digit number
    LEFT(FundCode + '000000', 5) + RIGHT('000000' + CAST(RowNum AS VARCHAR), 6),
    FundCode,
    Title, Forename, Surname,
    Addr1, Addr2, Addr3, Addr4, Postcode,
    -- Random balance based on fund type
    CASE
        WHEN FundCode IN ('01','02') THEN CAST(ABS(CHECKSUM(NEWID())) % 180000 AS DECIMAL(18,2)) / 100  -- Council Tax: 0-1800
        WHEN FundCode IN ('03') THEN CAST(ABS(CHECKSUM(NEWID())) % 80000 AS DECIMAL(18,2)) / 100  -- Housing Rents: 0-800
        ELSE CAST(ABS(CHECKSUM(NEWID())) % 50000 AS DECIMAL(18,2)) / 100  -- Others: 0-500
    END,
    0, 0, 'D',
    DATEADD(DAY, -ABS(CHECKSUM(NEWID())) % 365, GETDATE()),
    @systemUserId
WHERE NOT EXISTS (
    SELECT 1 FROM AccountHolders ah
    WHERE ah.AccountReference = LEFT(FundCode + '000000', 5) + RIGHT('000000' + CAST(RowNum AS VARCHAR), 6)
);

DECLARE @ahCount INT;
SELECT @ahCount = COUNT(*) FROM AccountHolders;
PRINT '  Account holders: ' + CAST(@ahCount AS VARCHAR) + ' total'

-- =============================================================================
-- 3. PROCESSED TRANSACTIONS (500+)
-- Generate transactions across 90 days, various funds and MOPs
-- =============================================================================
PRINT '=== Seeding processed transactions ==='

-- Get list of valid MOP codes
DECLARE @mopCodes TABLE (MopCode VARCHAR(5), Idx INT IDENTITY);
INSERT INTO @mopCodes (MopCode)
SELECT MopCode FROM Mops WHERE Disabled = 0;

DECLARE @mopCount INT;
SELECT @mopCount = COUNT(*) FROM @mopCodes;

-- Generate 550 transactions using a numbers CTE
;WITH Numbers AS (
    SELECT TOP 550 ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS N
    FROM sys.objects a CROSS JOIN sys.objects b
),
AccountRefs AS (
    SELECT AccountReference, FundCode, ROW_NUMBER() OVER (ORDER BY AccountReference) AS Idx,
           COUNT(*) OVER () AS Total
    FROM AccountHolders
),
TxnData AS (
    SELECT
        n.N,
        ar.AccountReference,
        ar.FundCode,
        mc.MopCode,
        -- Random amount: 10 - 2000
        CAST(10 + ABS(CHECKSUM(NEWID())) % 199000 AS DECIMAL(18,2)) / 100 AS Amount,
        -- Random date in last 90 days
        DATEADD(MINUTE, -ABS(CHECKSUM(NEWID())) % 129600, GETDATE()) AS TxnDate,
        -- Random office
        CASE ABS(CHECKSUM(NEWID())) % 4
            WHEN 0 THEN '99'
            WHEN 1 THEN 'PR'
            WHEN 2 THEN 'SP'
            ELSE 'WP'
        END AS OfficeCode
    FROM Numbers n
    INNER JOIN AccountRefs ar ON ar.Idx = (n.N % ar.Total) + 1
    INNER JOIN @mopCodes mc ON mc.Idx = (n.N % @mopCount) + 1
)
INSERT INTO ProcessedTransactions (
    TransactionReference, InternalReference, OfficeCode, EntryDate, TransactionDate,
    AccountReference, UserCode, FundCode, MopCode, Amount, VatAmount, VatCode,
    Narrative, VatRate, ReceiptIssued
)
SELECT
    LOWER(NEWID()),
    LOWER(NEWID()),
    OfficeCode,
    TxnDate,
    TxnDate,
    AccountReference,
    1,  -- Demo user
    FundCode,
    MopCode,
    Amount,
    0,
    'E0',  -- Zero VAT
    'Payment received',
    0,
    0
FROM TxnData;

DECLARE @txnCount INT;
SELECT @txnCount = COUNT(*) FROM ProcessedTransactions;
PRINT '  Transactions: ' + CAST(@txnCount AS VARCHAR) + ' total'

-- =============================================================================
-- 4. ADDITIONAL STAFF USERS (3 more beyond the 2 DemoData creates)
-- =============================================================================
PRINT '=== Seeding additional staff users ==='

-- DemoData creates 2 users (IDs 1 and 2). We add 3 more.
-- First check max existing UserId
DECLARE @maxUserId INT;
SELECT @maxUserId = ISNULL(MAX(UserId), 2) FROM Users WHERE UserId > 0;

-- finance.officer
IF NOT EXISTS (SELECT 1 FROM Users WHERE UserName = 'finance.officer')
BEGIN
    SET @maxUserId = @maxUserId + 1;
    INSERT INTO Users (UserId, UserName, DisplayName, Disabled, ExpiryDays, CreatedAt, OfficeCode)
    VALUES (@maxUserId, 'finance.officer', 'Finance Officer', 0, 365, GETDATE(), 'S');

    INSERT INTO AspNetUsers (Id, Email, EmailConfirmed, PasswordHash, SecurityStamp,
        PhoneNumberConfirmed, TwoFactorEnabled, LockoutEnabled, AccessFailedCount, UserName)
    VALUES (LOWER(NEWID()), 'finance.officer@demo.localgov.uk', 1, '', NEWID(), 0, 0, 0, 0, 'finance.officer');

    -- Give finance roles
    INSERT INTO UserRoles (UserId, RoleId)
    SELECT @maxUserId, RoleId FROM Roles
    WHERE [Name] IN ('Transaction.List', 'Transaction.Details', 'Transaction.Create',
        'Transaction.Refund', 'Transfer', 'Suspense');

    PRINT '  Created finance.officer (UserId ' + CAST(@maxUserId AS VARCHAR) + ')'
END

-- cashier
IF NOT EXISTS (SELECT 1 FROM Users WHERE UserName = 'cashier')
BEGIN
    SET @maxUserId = @maxUserId + 1;
    INSERT INTO Users (UserId, UserName, DisplayName, Disabled, ExpiryDays, CreatedAt, OfficeCode)
    VALUES (@maxUserId, 'cashier', 'Cashier', 0, 365, GETDATE(), 'PR');

    INSERT INTO AspNetUsers (Id, Email, EmailConfirmed, PasswordHash, SecurityStamp,
        PhoneNumberConfirmed, TwoFactorEnabled, LockoutEnabled, AccessFailedCount, UserName)
    VALUES (LOWER(NEWID()), 'cashier@demo.localgov.uk', 1, '', NEWID(), 0, 0, 0, 0, 'cashier');

    INSERT INTO UserRoles (UserId, RoleId)
    SELECT @maxUserId, RoleId FROM Roles
    WHERE [Name] IN ('Transaction.List', 'Transaction.Details', 'Transaction.Create', 'EReturn');

    PRINT '  Created cashier (UserId ' + CAST(@maxUserId AS VARCHAR) + ')'
END

-- auditor (read-only)
IF NOT EXISTS (SELECT 1 FROM Users WHERE UserName = 'auditor')
BEGIN
    SET @maxUserId = @maxUserId + 1;
    INSERT INTO Users (UserId, UserName, DisplayName, Disabled, ExpiryDays, CreatedAt, OfficeCode)
    VALUES (@maxUserId, 'auditor', 'Read-Only Auditor', 0, 365, GETDATE(), 'S');

    INSERT INTO AspNetUsers (Id, Email, EmailConfirmed, PasswordHash, SecurityStamp,
        PhoneNumberConfirmed, TwoFactorEnabled, LockoutEnabled, AccessFailedCount, UserName)
    VALUES (LOWER(NEWID()), 'auditor@demo.localgov.uk', 1, '', NEWID(), 0, 0, 0, 0, 'auditor');

    INSERT INTO UserRoles (UserId, RoleId)
    SELECT @maxUserId, RoleId FROM Roles
    WHERE [Name] IN ('Transaction.List', 'Transaction.Details');

    PRINT '  Created auditor (UserId ' + CAST(@maxUserId AS VARCHAR) + ')'
END

-- =============================================================================
-- 5. FUND GROUPS
-- =============================================================================
PRINT '=== Seeding fund groups ==='

IF NOT EXISTS (SELECT 1 FROM FundGroups WHERE [Name] = 'All Revenue')
BEGIN
    INSERT INTO FundGroups ([Name]) VALUES ('All Revenue');
    DECLARE @allRevId INT = SCOPE_IDENTITY();
    INSERT INTO FundGroupFunds (FundGroupId, FundCode)
    SELECT @allRevId, FundCode FROM Funds WHERE Disabled = 0;
    PRINT '  Created fund group: All Revenue'
END

PRINT '=== Seed data complete ==='
PRINT '  Funds: ' + CAST((SELECT COUNT(*) FROM Funds WHERE Disabled = 0) AS VARCHAR)
PRINT '  MOPs: ' + CAST((SELECT COUNT(*) FROM Mops WHERE Disabled = 0) AS VARCHAR)
PRINT '  Account Holders: ' + CAST((SELECT COUNT(*) FROM AccountHolders) AS VARCHAR)
PRINT '  Transactions: ' + CAST((SELECT COUNT(*) FROM ProcessedTransactions) AS VARCHAR)
PRINT '  Suspense Items: ' + CAST((SELECT COUNT(*) FROM Suspenses) AS VARCHAR)
PRINT '  Users: ' + CAST((SELECT COUNT(*) FROM Users WHERE UserId > 0) AS VARCHAR)

COMMIT TRANSACTION;
PRINT '=== Transaction committed ==='

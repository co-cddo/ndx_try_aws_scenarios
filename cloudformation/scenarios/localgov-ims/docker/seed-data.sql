-- =============================================================================
-- LocalGov IMS — Comprehensive Seed Data
--
-- Runs AFTER EF6 DemoData.sql has created base schema, demo offices, users,
-- funds, MOPs, VAT codes, payment integrations, and import rules.
--
-- This script ADDS:
--   - Additional funds (expand to 10)
--   - Fund metadata (basket flags, GOV.UK Pay API keys)
--   - 200+ account holders with realistic UK addresses
--   - 500+ processed transactions across 3 months
--   - 30+ suspense items
--   - eReturn templates for 3 offices
--   - 10 completed eReturns
--   - Import processing rules
--   - 5 completed imports with 50+ rows
--   - 5 staff users with role assignments
--   - Fund groups with user access
--   - VAT codes
--
-- Uses :setvar for GOVUKPAY_API_KEY (passed by entrypoint via sqlcmd -v)
-- All INSERTs are idempotent (IF NOT EXISTS / MERGE patterns)
-- Transaction dates are relative to GETDATE() for fresh-looking data
-- Wrapped in a transaction for atomicity
-- =============================================================================

:setvar GOVUKPAY_API_KEY "NOT_SET"

SET NOCOUNT ON;
SET XACT_ABORT ON;

BEGIN TRANSACTION;

-- =============================================================================
-- 1. VAT CODES
-- =============================================================================
PRINT '=== Seeding VAT codes ==='

IF NOT EXISTS (SELECT 1 FROM VatCodes WHERE VatCode = 'S')
    INSERT INTO VatCodes (VatCode, [Percentage]) VALUES ('S', 20.00);
IF NOT EXISTS (SELECT 1 FROM VatCodes WHERE VatCode = 'Z')
    INSERT INTO VatCodes (VatCode, [Percentage]) VALUES ('Z', 0.00);
IF NOT EXISTS (SELECT 1 FROM VatCodes WHERE VatCode = 'X')
    INSERT INTO VatCodes (VatCode, [Percentage]) VALUES ('X', 0.00);
IF NOT EXISTS (SELECT 1 FROM VatCodes WHERE VatCode = 'R')
    INSERT INTO VatCodes (VatCode, [Percentage]) VALUES ('R', 5.00);

-- =============================================================================
-- 2. FUNDS (expand to 10)
-- DemoData.sql may have created some — we use MERGE for idempotency
-- =============================================================================
PRINT '=== Seeding funds ==='

MERGE INTO Funds AS target
USING (VALUES
    ('CT',   'Council Tax',        'S', 1, 1, 0),
    ('NNDR', 'Business Rates',     'X', 1, 1, 0),
    ('HR',   'Housing Rents',      'X', 1, 0, 0),
    ('PF',   'Parking Fines',      'S', 1, 1, 0),
    ('PLAN', 'Planning Fees',      'X', 1, 1, 0),
    ('LS',   'Leisure Services',   'S', 1, 1, 0),
    ('CW',   'Commercial Waste',   'S', 1, 0, 0),
    ('SD',   'Sundry Debtors',     'S', 1, 0, 0),
    ('GW',   'Garden Waste',       'S', 1, 1, 0),
    ('BC',   'Building Control',   'X', 1, 1, 0)
) AS source (FundCode, FundName, VatCode, IsEnabled, IsAnEReturnDefaultFund, AquireAddress)
ON target.FundCode = source.FundCode
WHEN NOT MATCHED THEN
    INSERT (FundCode, FundName, VatCode, IsEnabled, IsAnEReturnDefaultFund, AquireAddress)
    VALUES (source.FundCode, source.FundName, source.VatCode, source.IsEnabled, source.IsAnEReturnDefaultFund, source.AquireAddress)
WHEN MATCHED THEN
    UPDATE SET FundName = source.FundName, VatCode = source.VatCode, IsEnabled = source.IsEnabled;

-- =============================================================================
-- 3. FUND METADATA (basket flags + GOV.UK Pay API keys)
-- =============================================================================
PRINT '=== Seeding fund metadata ==='

-- Citizen-payable funds get basket flag and GOV.UK Pay API key
DECLARE @citizenFunds TABLE (FundCode NVARCHAR(10));
INSERT INTO @citizenFunds VALUES ('CT'),('NNDR'),('PF'),('PLAN'),('LS'),('GW'),('BC');

-- IsABasketFund metadata
MERGE INTO FundMetadata AS target
USING @citizenFunds AS source
ON target.FundCode = source.FundCode AND target.[Key] = 'IsABasketFund'
WHEN NOT MATCHED THEN
    INSERT (FundCode, [Key], [Value]) VALUES (source.FundCode, 'IsABasketFund', 'True');

-- GOV.UK Pay API key metadata (per fund)
DECLARE @allFunds TABLE (FundCode NVARCHAR(10));
INSERT INTO @allFunds VALUES ('CT'),('NNDR'),('HR'),('PF'),('PLAN'),('LS'),('CW'),('SD'),('GW'),('BC');

MERGE INTO FundMetadata AS target
USING @allFunds AS source
ON target.FundCode = source.FundCode AND target.[Key] = 'GovUkPay.Api.Key'
WHEN NOT MATCHED THEN
    INSERT (FundCode, [Key], [Value]) VALUES (source.FundCode, 'GovUkPay.Api.Key', '$(GOVUKPAY_API_KEY)')
WHEN MATCHED THEN
    UPDATE SET [Value] = '$(GOVUKPAY_API_KEY)';

-- =============================================================================
-- 4. METHODS OF PAYMENT
-- =============================================================================
PRINT '=== Seeding methods of payment ==='

MERGE INTO Mops AS target
USING (VALUES
    ('GOVPAY', 'GOV.UK Pay',     1, 0),
    ('CASH',   'Cash',           1, 0),
    ('CHQ',    'Cheque',         1, 0),
    ('DD',     'Direct Debit',   1, 0),
    ('BACS',   'BACS',           1, 0),
    ('SO',     'Standing Order', 1, 0)
) AS source (MopCode, MopName, IsEnabled, IsAJournal)
ON target.MopCode = source.MopCode
WHEN NOT MATCHED THEN
    INSERT (MopCode, MopName, IsEnabled, IsAJournal)
    VALUES (source.MopCode, source.MopName, source.IsEnabled, source.IsAJournal);

-- =============================================================================
-- 5. ACCOUNT HOLDERS (200+)
-- Realistic UK names, addresses, postcodes, and fund-specific references
-- =============================================================================
PRINT '=== Seeding account holders ==='

-- Helper: only insert if reference doesn't already exist
-- Using a CTE pattern with NOT EXISTS for idempotency

;WITH NewAccountHolders AS (
    SELECT * FROM (VALUES
        -- Council Tax accounts (CT prefix, 60 accounts)
        ('CT100001', 'CT', 'Mrs', 'Sarah',     'Thompson',   '14 Elm Grove',              'Oakfield',     'Westshire',  'WS1 2AB', '01234567001'),
        ('CT100002', 'CT', 'Mr',  'James',     'Wilson',     '27 Church Lane',            'Oakfield',     'Westshire',  'WS1 3CD', '01234567002'),
        ('CT100003', 'CT', 'Ms',  'Emma',      'Roberts',    '3 Victoria Road',           'Oakfield',     'Westshire',  'WS1 4EF', '01234567003'),
        ('CT100004', 'CT', 'Mr',  'David',     'Brown',      '89 High Street',            'Oakfield',     'Westshire',  'WS2 1GH', '01234567004'),
        ('CT100005', 'CT', 'Mrs', 'Patricia',  'Taylor',     '12 Station Road',           'Brookvale',    'Westshire',  'WS2 2JK', '01234567005'),
        ('CT100006', 'CT', 'Mr',  'Michael',   'Davies',     '45 Park Avenue',            'Brookvale',    'Westshire',  'WS2 3LM', '01234567006'),
        ('CT100007', 'CT', 'Ms',  'Lisa',      'Evans',      '78 Queen Street',           'Brookvale',    'Westshire',  'WS2 4NP', '01234567007'),
        ('CT100008', 'CT', 'Mr',  'Andrew',    'Hughes',     '56 Kings Road',             'Hillcrest',    'Westshire',  'WS3 1QR', '01234567008'),
        ('CT100009', 'CT', 'Mrs', 'Margaret',  'Lewis',      '1 The Crescent',            'Hillcrest',    'Westshire',  'WS3 2ST', '01234567009'),
        ('CT100010', 'CT', 'Mr',  'Richard',   'Walker',     '33 Mill Lane',              'Hillcrest',    'Westshire',  'WS3 3UV', '01234567010'),
        ('CT100011', 'CT', 'Ms',  'Jennifer',  'Robinson',   '22 Birch Close',            'Oakfield',     'Westshire',  'WS1 5WX', '01234567011'),
        ('CT100012', 'CT', 'Mr',  'Thomas',    'Wright',     '67 Maple Drive',            'Oakfield',     'Westshire',  'WS1 6YZ', '01234567012'),
        ('CT100013', 'CT', 'Mrs', 'Catherine', 'Green',      '9 Cedar Way',               'Brookvale',    'Westshire',  'WS2 5AB', '01234567013'),
        ('CT100014', 'CT', 'Mr',  'Stephen',   'Hall',       '41 Willow Lane',            'Brookvale',    'Westshire',  'WS2 6CD', '01234567014'),
        ('CT100015', 'CT', 'Ms',  'Helen',     'Allen',      '15 Oak Avenue',             'Hillcrest',    'Westshire',  'WS3 4EF', '01234567015'),
        ('CT100016', 'CT', 'Mr',  'Peter',     'Young',      '88 Beech Road',             'Hillcrest',    'Westshire',  'WS3 5GH', '01234567016'),
        ('CT100017', 'CT', 'Mrs', 'Elizabeth', 'King',       '2 Ash Close',               'Oakfield',     'Westshire',  'WS1 7JK', '01234567017'),
        ('CT100018', 'CT', 'Mr',  'Christopher','Wright',    '54 Pine Crescent',          'Oakfield',     'Westshire',  'WS1 8LM', '01234567018'),
        ('CT100019', 'CT', 'Ms',  'Amanda',    'Baker',      '31 Hawthorn Way',           'Brookvale',    'Westshire',  'WS2 7NP', '01234567019'),
        ('CT100020', 'CT', 'Mr',  'Robert',    'Adams',      '76 Poplar Street',          'Brookvale',    'Westshire',  'WS2 8QR', '01234567020'),
        ('CT100021', 'CT', 'Mrs', 'Susan',     'Mitchell',   '8 Sycamore Road',           'Hillcrest',    'Westshire',  'WS3 6ST', '01234567021'),
        ('CT100022', 'CT', 'Mr',  'Daniel',    'Campbell',   '63 Linden Avenue',          'Hillcrest',    'Westshire',  'WS3 7UV', '01234567022'),
        ('CT100023', 'CT', 'Ms',  'Claire',    'Phillips',   '17 Rowan Close',            'Oakfield',     'Westshire',  'WS1 9WX', '01234567023'),
        ('CT100024', 'CT', 'Mr',  'Mark',      'Parker',     '42 Alder Lane',             'Oakfield',     'Westshire',  'WS4 1AB', '01234567024'),
        ('CT100025', 'CT', 'Mrs', 'Janet',     'Morris',     '29 Chestnut Grove',         'Brookvale',    'Westshire',  'WS4 2CD', '01234567025'),
        ('CT100026', 'CT', 'Mr',  'Paul',      'Rogers',     '51 Laurel Way',             'Brookvale',    'Westshire',  'WS4 3EF', '01234567026'),
        ('CT100027', 'CT', 'Ms',  'Nicola',    'Cook',       '7 Holly Drive',             'Hillcrest',    'Westshire',  'WS4 4GH', '01234567027'),
        ('CT100028', 'CT', 'Mr',  'Simon',     'Morgan',     '34 Ivy Close',              'Hillcrest',    'Westshire',  'WS4 5JK', '01234567028'),
        ('CT100029', 'CT', 'Mrs', 'Julie',     'Bell',       '68 Juniper Road',           'Oakfield',     'Westshire',  'WS4 6LM', '01234567029'),
        ('CT100030', 'CT', 'Mr',  'Graham',    'Murphy',     '93 Hazel Court',            'Oakfield',     'Westshire',  'WS4 7NP', '01234567030'),
        ('CT100031', 'CT', 'Ms',  'Karen',     'Bailey',     '11 Spruce Avenue',          'Brookvale',    'Westshire',  'WS4 8QR', '01234567031'),
        ('CT100032', 'CT', 'Mr',  'Ian',       'Richardson', '25 Yew Lane',               'Brookvale',    'Westshire',  'WS4 9ST', '01234567032'),
        ('CT100033', 'CT', 'Mrs', 'Diane',     'Cox',        '46 Magnolia Close',         'Hillcrest',    'Westshire',  'WS5 1UV', '01234567033'),
        ('CT100034', 'CT', 'Mr',  'Kevin',     'Howard',     '82 Jasmine Way',            'Hillcrest',    'Westshire',  'WS5 2WX', '01234567034'),
        ('CT100035', 'CT', 'Ms',  'Rachel',    'Ward',       '5 Bluebell Lane',           'Oakfield',     'Westshire',  'WS5 3AB', '01234567035'),
        ('CT100036', 'CT', 'Mr',  'Nigel',     'Turner',     '37 Foxglove Road',          'Oakfield',     'Westshire',  'WS5 4CD', '01234567036'),
        ('CT100037', 'CT', 'Mrs', 'Alison',    'James',      '19 Primrose Way',           'Brookvale',    'Westshire',  'WS5 5EF', '01234567037'),
        ('CT100038', 'CT', 'Mr',  'Colin',     'Watson',     '61 Daisy Close',            'Brookvale',    'Westshire',  'WS5 6GH', '01234567038'),
        ('CT100039', 'CT', 'Ms',  'Tracey',    'Brooks',     '84 Rose Avenue',            'Hillcrest',    'Westshire',  'WS5 7JK', '01234567039'),
        ('CT100040', 'CT', 'Mr',  'Brian',     'Bennett',    '4 Violet Crescent',         'Hillcrest',    'Westshire',  'WS5 8LM', '01234567040'),
        ('CT100041', 'CT', 'Mrs', 'Wendy',     'Gray',       '26 Lavender Hill',          'Oakfield',     'Westshire',  'WS5 9NP', '01234567041'),
        ('CT100042', 'CT', 'Mr',  'Philip',    'Hughes',     '48 Heather Lane',           'Oakfield',     'Westshire',  'WS6 1QR', '01234567042'),
        ('CT100043', 'CT', 'Ms',  'Joanne',    'Price',      '73 Thistle Close',          'Brookvale',    'Westshire',  'WS6 2ST', '01234567043'),
        ('CT100044', 'CT', 'Mr',  'Martin',    'Russell',    '16 Clover Road',            'Brookvale',    'Westshire',  'WS6 3UV', '01234567044'),
        ('CT100045', 'CT', 'Mrs', 'Angela',    'Palmer',     '39 Buttercup Way',          'Hillcrest',    'Westshire',  'WS6 4WX', '01234567045'),
        ('CT100046', 'CT', 'Mr',  'Anthony',   'Fisher',     '57 Snowdrop Lane',          'Hillcrest',    'Westshire',  'WS6 5AB', '01234567046'),
        ('CT100047', 'CT', 'Ms',  'Fiona',     'Butler',     '95 Crocus Avenue',          'Oakfield',     'Westshire',  'WS6 6CD', '01234567047'),
        ('CT100048', 'CT', 'Mr',  'Keith',     'Foster',     '13 Daffodil Close',         'Oakfield',     'Westshire',  'WS6 7EF', '01234567048'),
        ('CT100049', 'CT', 'Mrs', 'Jacqueline','Barnes',     '36 Tulip Way',              'Brookvale',    'Westshire',  'WS6 8GH', '01234567049'),
        ('CT100050', 'CT', 'Mr',  'Derek',     'Sullivan',   '71 Orchid Road',            'Brookvale',    'Westshire',  'WS6 9JK', '01234567050'),
        ('CT100051', 'CT', 'Ms',  'Deborah',   'Mason',      '24 Pansy Drive',            'Hillcrest',    'Westshire',  'WS7 1LM', '01234567051'),
        ('CT100052', 'CT', 'Mr',  'Raymond',   'Collins',    '52 Peony Lane',             'Hillcrest',    'Westshire',  'WS7 2NP', '01234567052'),
        ('CT100053', 'CT', 'Mrs', 'Pauline',   'Grant',      '85 Iris Close',             'Oakfield',     'Westshire',  'WS7 3QR', '01234567053'),
        ('CT100054', 'CT', 'Mr',  'Trevor',    'Jenkins',    '6 Lily Avenue',             'Oakfield',     'Westshire',  'WS7 4ST', '01234567054'),
        ('CT100055', 'CT', 'Ms',  'Lynne',     'Stone',      '43 Petunia Way',            'Brookvale',    'Westshire',  'WS7 5UV', '01234567055'),
        ('CT100056', 'CT', 'Mr',  'Roy',       'Harper',     '77 Geranium Road',          'Brookvale',    'Westshire',  'WS7 6WX', '01234567056'),
        ('CT100057', 'CT', 'Mrs', 'Vivienne',  'Chapman',    '18 Aster Lane',             'Hillcrest',    'Westshire',  'WS7 7AB', '01234567057'),
        ('CT100058', 'CT', 'Mr',  'Jonathan',  'Perry',      '64 Dahlia Close',           'Hillcrest',    'Westshire',  'WS7 8CD', '01234567058'),
        ('CT100059', 'CT', 'Ms',  'Dawn',      'Long',       '91 Begonia Avenue',         'Oakfield',     'Westshire',  'WS7 9EF', '01234567059'),
        ('CT100060', 'CT', 'Mr',  'Roger',     'Ellis',      '35 Carnation Way',          'Oakfield',     'Westshire',  'WS8 1GH', '01234567060'),

        -- Business Rates accounts (NNDR prefix, 25 accounts)
        ('NNDR20001', 'NNDR', 'Mr',  'Adrian',   'Clarke',   'Unit 1 Riverside Business Park',    'Oakfield',     'Westshire',  'WS1 1BP', '01234568001'),
        ('NNDR20002', 'NNDR', 'Mrs', 'Sandra',   'Scott',    '15 Market Square',                  'Oakfield',     'Westshire',  'WS1 2BP', '01234568002'),
        ('NNDR20003', 'NNDR', 'Mr',  'Malcolm',  'Ford',     'The Old Mill, Bridge Street',       'Brookvale',    'Westshire',  'WS2 1BP', '01234568003'),
        ('NNDR20004', 'NNDR', 'Ms',  'Valerie',  'West',     'Suite 4 Crown House',               'Brookvale',    'Westshire',  'WS2 2BP', '01234568004'),
        ('NNDR20005', 'NNDR', 'Mr',  'Kenneth',  'Ray',      '23 Industrial Estate',              'Hillcrest',    'Westshire',  'WS3 1BP', '01234568005'),
        ('NNDR20006', 'NNDR', 'Mrs', 'Brenda',   'Dixon',    'Oakfield Shopping Centre Unit 12',  'Oakfield',     'Westshire',  'WS1 3BP', '01234568006'),
        ('NNDR20007', 'NNDR', 'Mr',  'Leonard',  'Hunt',     '8 Commerce Road',                   'Oakfield',     'Westshire',  'WS1 4BP', '01234568007'),
        ('NNDR20008', 'NNDR', 'Ms',  'Gloria',   'Palmer',   'Floor 2 Enterprise House',          'Brookvale',    'Westshire',  'WS2 3BP', '01234568008'),
        ('NNDR20009', 'NNDR', 'Mr',  'Douglas',  'Simpson',  '44 Factory Lane',                   'Hillcrest',    'Westshire',  'WS3 2BP', '01234568009'),
        ('NNDR20010', 'NNDR', 'Mrs', 'Maureen',  'Murray',   'The Warehouse, Dock Road',          'Hillcrest',    'Westshire',  'WS3 3BP', '01234568010'),
        ('NNDR20011', 'NNDR', 'Mr',  'Terence',  'Graham',   '71 Trade Street',                   'Oakfield',     'Westshire',  'WS1 5BP', '01234568011'),
        ('NNDR20012', 'NNDR', 'Ms',  'Shirley',  'Webb',     'Unit 6 Venture Park',               'Oakfield',     'Westshire',  'WS1 6BP', '01234568012'),
        ('NNDR20013', 'NNDR', 'Mr',  'Cecil',    'Spencer',  '19 Harbour Road',                   'Brookvale',    'Westshire',  'WS2 4BP', '01234568013'),
        ('NNDR20014', 'NNDR', 'Mrs', 'Vera',     'Lane',     'The Granary, Farm Road',            'Brookvale',    'Westshire',  'WS2 5BP', '01234568014'),
        ('NNDR20015', 'NNDR', 'Mr',  'Stanley',  'Fox',      '33 Merchants Way',                  'Hillcrest',    'Westshire',  'WS3 4BP', '01234568015'),
        ('NNDR20016', 'NNDR', 'Ms',  'Phyllis',  'Owen',     'Unit 9 Technology Park',            'Hillcrest',    'Westshire',  'WS3 5BP', '01234568016'),
        ('NNDR20017', 'NNDR', 'Mr',  'Vernon',   'Cross',    '57 Market Row',                     'Oakfield',     'Westshire',  'WS1 7BP', '01234568017'),
        ('NNDR20018', 'NNDR', 'Mrs', 'Olive',    'Curtis',   'Annexe B Council Offices',          'Oakfield',     'Westshire',  'WS1 8BP', '01234568018'),
        ('NNDR20019', 'NNDR', 'Mr',  'Neville',  'Hudson',   '12 Craft Lane',                     'Brookvale',    'Westshire',  'WS2 6BP', '01234568019'),
        ('NNDR20020', 'NNDR', 'Ms',  'Iris',     'Pearson',  'The Stables, Manor Road',           'Brookvale',    'Westshire',  'WS2 7BP', '01234568020'),
        ('NNDR20021', 'NNDR', 'Mr',  'Cyril',    'Holmes',   '28 Enterprise Way',                 'Hillcrest',    'Westshire',  'WS3 6BP', '01234568021'),
        ('NNDR20022', 'NNDR', 'Mrs', 'Doris',    'Knight',   'Suite 11 Innovation Hub',           'Hillcrest',    'Westshire',  'WS3 7BP', '01234568022'),
        ('NNDR20023', 'NNDR', 'Mr',  'Alfred',   'Stevens',  '65 Progress Road',                  'Oakfield',     'Westshire',  'WS1 9BP', '01234568023'),
        ('NNDR20024', 'NNDR', 'Ms',  'Ethel',    'Burns',    '40 Business Close',                 'Brookvale',    'Westshire',  'WS2 8BP', '01234568024'),
        ('NNDR20025', 'NNDR', 'Mr',  'Harold',   'Wells',    '3 Commerce Court',                  'Hillcrest',    'Westshire',  'WS3 8BP', '01234568025'),

        -- Housing Rents accounts (HR prefix, 40 accounts)
        ('HR300001', 'HR', 'Mrs', 'Donna',    'White',      'Flat 1, Riverside House',           'Oakfield',     'Westshire',  'WS1 1HR', '01234569001'),
        ('HR300002', 'HR', 'Mr',  'Wayne',    'Harris',     'Flat 2, Riverside House',           'Oakfield',     'Westshire',  'WS1 1HR', '01234569002'),
        ('HR300003', 'HR', 'Ms',  'Lesley',   'Jackson',    '14 Meadow View',                    'Oakfield',     'Westshire',  'WS1 2HR', '01234569003'),
        ('HR300004', 'HR', 'Mr',  'Gary',     'Martin',     '28 Meadow View',                    'Oakfield',     'Westshire',  'WS1 2HR', '01234569004'),
        ('HR300005', 'HR', 'Mrs', 'Christine','Wood',       'Flat 3, Tower Block A',             'Brookvale',    'Westshire',  'WS2 1HR', '01234569005'),
        ('HR300006', 'HR', 'Mr',  'Darren',   'Thomas',     'Flat 7, Tower Block A',             'Brookvale',    'Westshire',  'WS2 1HR', '01234569006'),
        ('HR300007', 'HR', 'Ms',  'Lorraine', 'Clark',      'Flat 12, Tower Block B',            'Brookvale',    'Westshire',  'WS2 2HR', '01234569007'),
        ('HR300008', 'HR', 'Mr',  'Neil',     'Moore',      '6 Greenfield Estate',               'Hillcrest',    'Westshire',  'WS3 1HR', '01234569008'),
        ('HR300009', 'HR', 'Mrs', 'Beverley', 'Hill',       '18 Greenfield Estate',              'Hillcrest',    'Westshire',  'WS3 1HR', '01234569009'),
        ('HR300010', 'HR', 'Mr',  'Stuart',   'Scott',      '31 Greenfield Estate',              'Hillcrest',    'Westshire',  'WS3 2HR', '01234569010'),
        ('HR300011', 'HR', 'Ms',  'Tina',     'Anderson',   'Flat 4, Willow Court',              'Oakfield',     'Westshire',  'WS1 3HR', '01234569011'),
        ('HR300012', 'HR', 'Mr',  'Dean',     'Carter',     'Flat 8, Willow Court',              'Oakfield',     'Westshire',  'WS1 3HR', '01234569012'),
        ('HR300013', 'HR', 'Mrs', 'Denise',   'Patel',      '5 Linden Close',                    'Brookvale',    'Westshire',  'WS2 3HR', '01234569013'),
        ('HR300014', 'HR', 'Mr',  'Craig',    'Shah',       '9 Linden Close',                    'Brookvale',    'Westshire',  'WS2 3HR', '01234569014'),
        ('HR300015', 'HR', 'Ms',  'Kelly',    'Hussain',    'Flat 2, Elm House',                 'Hillcrest',    'Westshire',  'WS3 3HR', '01234569015'),
        ('HR300016', 'HR', 'Mr',  'Lee',      'Begum',      '22 Aspen Drive',                    'Hillcrest',    'Westshire',  'WS3 4HR', '01234569016'),
        ('HR300017', 'HR', 'Mrs', 'Hayley',   'Khan',       '37 Aspen Drive',                    'Oakfield',     'Westshire',  'WS1 4HR', '01234569017'),
        ('HR300018', 'HR', 'Mr',  'Jason',    'Ali',        'Flat 6, Oak Lodge',                 'Oakfield',     'Westshire',  'WS1 5HR', '01234569018'),
        ('HR300019', 'HR', 'Ms',  'Samantha', 'Kaur',       'Flat 11, Oak Lodge',                'Brookvale',    'Westshire',  'WS2 4HR', '01234569019'),
        ('HR300020', 'HR', 'Mr',  'Shaun',    'Singh',      '44 Birch Estate',                   'Brookvale',    'Westshire',  'WS2 5HR', '01234569020'),
        ('HR300021', 'HR', 'Mrs', 'Joanna',   'Sharma',     'Flat 1, Cedar Court',               'Hillcrest',    'Westshire',  'WS3 5HR', '01234569021'),
        ('HR300022', 'HR', 'Mr',  'Carl',     'Gupta',      'Flat 5, Cedar Court',               'Hillcrest',    'Westshire',  'WS3 5HR', '01234569022'),
        ('HR300023', 'HR', 'Ms',  'Mandy',    'Okafor',     '16 Pine Grove Estate',              'Oakfield',     'Westshire',  'WS1 6HR', '01234569023'),
        ('HR300024', 'HR', 'Mr',  'Clive',    'Adeyemi',    '23 Pine Grove Estate',              'Oakfield',     'Westshire',  'WS1 6HR', '01234569024'),
        ('HR300025', 'HR', 'Mrs', 'Elaine',   'Osei',       'Flat 3, Hawthorn House',            'Brookvale',    'Westshire',  'WS2 6HR', '01234569025'),
        ('HR300026', 'HR', 'Mr',  'Daryl',    'Mensah',     'Flat 9, Hawthorn House',            'Brookvale',    'Westshire',  'WS2 6HR', '01234569026'),
        ('HR300027', 'HR', 'Ms',  'Gemma',    'Afolabi',    '51 Maple Estate',                   'Hillcrest',    'Westshire',  'WS3 6HR', '01234569027'),
        ('HR300028', 'HR', 'Mr',  'Gavin',    'Owusu',      '58 Maple Estate',                   'Hillcrest',    'Westshire',  'WS3 7HR', '01234569028'),
        ('HR300029', 'HR', 'Mrs', 'Lindsey',  'Asante',     'Flat 4, Poplar Court',              'Oakfield',     'Westshire',  'WS1 7HR', '01234569029'),
        ('HR300030', 'HR', 'Mr',  'Shane',    'Appiah',     'Flat 10, Poplar Court',             'Oakfield',     'Westshire',  'WS1 7HR', '01234569030'),
        ('HR300031', 'HR', 'Ms',  'Jayne',    'Boateng',    '2 Rowan Terrace',                   'Brookvale',    'Westshire',  'WS2 7HR', '01234569031'),
        ('HR300032', 'HR', 'Mr',  'Glenn',    'Danquah',    '8 Rowan Terrace',                   'Brookvale',    'Westshire',  'WS2 8HR', '01234569032'),
        ('HR300033', 'HR', 'Mrs', 'Sonia',    'Agyeman',    'Flat 6, Spruce Lodge',              'Hillcrest',    'Westshire',  'WS3 8HR', '01234569033'),
        ('HR300034', 'HR', 'Mr',  'Clint',    'Frimpong',   'Flat 15, Spruce Lodge',             'Hillcrest',    'Westshire',  'WS3 8HR', '01234569034'),
        ('HR300035', 'HR', 'Ms',  'Natasha',  'Quansah',    '33 Yew Tree Estate',                'Oakfield',     'Westshire',  'WS1 8HR', '01234569035'),
        ('HR300036', 'HR', 'Mr',  'Dale',     'Tetteh',     '41 Yew Tree Estate',                'Oakfield',     'Westshire',  'WS1 9HR', '01234569036'),
        ('HR300037', 'HR', 'Mrs', 'Zoe',      'Adjei',      'Flat 2, Holly House',               'Brookvale',    'Westshire',  'WS2 9HR', '01234569037'),
        ('HR300038', 'HR', 'Mr',  'Ross',     'Amponsah',   'Flat 7, Holly House',               'Brookvale',    'Westshire',  'WS2 9HR', '01234569038'),
        ('HR300039', 'HR', 'Ms',  'Andrea',   'Williams',   '19 Laurel Estate',                  'Hillcrest',    'Westshire',  'WS3 9HR', '01234569039'),
        ('HR300040', 'HR', 'Mr',  'Terry',    'Jones',      '27 Laurel Estate',                  'Hillcrest',    'Westshire',  'WS3 9HR', '01234569040'),

        -- Parking Fines (PF prefix, 25 accounts)
        ('PF400001', 'PF', 'Mr',  'Oliver',   'Marsh',      '5 St Marys Road',                   'Oakfield',     'Westshire',  'WS1 1PF', '01234570001'),
        ('PF400002', 'PF', 'Mrs', 'Victoria', 'Pearce',     '39 Alexandra Road',                 'Oakfield',     'Westshire',  'WS1 2PF', '01234570002'),
        ('PF400003', 'PF', 'Ms',  'Charlotte','Gibbs',      '18 Waterloo Street',                'Brookvale',    'Westshire',  'WS2 1PF', '01234570003'),
        ('PF400004', 'PF', 'Mr',  'Luke',     'Harper',     '72 Nelson Terrace',                 'Brookvale',    'Westshire',  'WS2 2PF', '01234570004'),
        ('PF400005', 'PF', 'Mrs', 'Gemma',    'Bryant',     '14 Wellington Crescent',            'Hillcrest',    'Westshire',  'WS3 1PF', '01234570005'),
        ('PF400006', 'PF', 'Mr',  'Ashley',   'Day',        '47 Trafalgar Way',                  'Hillcrest',    'Westshire',  'WS3 2PF', '01234570006'),
        ('PF400007', 'PF', 'Ms',  'Natalie',  'Brooks',     '23 Balmoral Avenue',                'Oakfield',     'Westshire',  'WS1 3PF', '01234570007'),
        ('PF400008', 'PF', 'Mr',  'Ryan',     'Spencer',    '56 Windsor Lane',                   'Oakfield',     'Westshire',  'WS1 4PF', '01234570008'),
        ('PF400009', 'PF', 'Mrs', 'Michelle', 'Lawrence',   '81 Buckingham Road',                'Brookvale',    'Westshire',  'WS2 3PF', '01234570009'),
        ('PF400010', 'PF', 'Mr',  'Scott',    'Webb',       '34 Kensington Street',              'Brookvale',    'Westshire',  'WS2 4PF', '01234570010'),
        ('PF400011', 'PF', 'Ms',  'Lauren',   'Grant',      '67 Chelsea Close',                  'Hillcrest',    'Westshire',  'WS3 3PF', '01234570011'),
        ('PF400012', 'PF', 'Mr',  'Jordan',   'Sutton',     '9 Regent Drive',                    'Hillcrest',    'Westshire',  'WS3 4PF', '01234570012'),
        ('PF400013', 'PF', 'Mrs', 'Stacey',   'Floyd',      '28 Mayfair Avenue',                 'Oakfield',     'Westshire',  'WS1 5PF', '01234570013'),
        ('PF400014', 'PF', 'Mr',  'Adam',     'Hart',       '53 Westminster Road',               'Oakfield',     'Westshire',  'WS1 6PF', '01234570014'),
        ('PF400015', 'PF', 'Ms',  'Jade',     'Arnold',     '41 Hanover Crescent',               'Brookvale',    'Westshire',  'WS2 5PF', '01234570015'),
        ('PF400016', 'PF', 'Mr',  'Liam',     'Holland',    '76 Sandringham Way',                'Brookvale',    'Westshire',  'WS2 6PF', '01234570016'),
        ('PF400017', 'PF', 'Mrs', 'Chloe',    'May',        '12 Clarence Lane',                  'Hillcrest',    'Westshire',  'WS3 5PF', '01234570017'),
        ('PF400018', 'PF', 'Mr',  'Jake',     'Cross',      '63 Albert Road',                    'Hillcrest',    'Westshire',  'WS3 6PF', '01234570018'),
        ('PF400019', 'PF', 'Ms',  'Rebecca',  'Page',       '88 Jubilee Street',                 'Oakfield',     'Westshire',  'WS1 7PF', '01234570019'),
        ('PF400020', 'PF', 'Mr',  'Nathan',   'Miles',      '21 Coronation Drive',               'Oakfield',     'Westshire',  'WS1 8PF', '01234570020'),
        ('PF400021', 'PF', 'Mrs', 'Holly',    'Barker',     '45 Sovereign Close',                'Brookvale',    'Westshire',  'WS2 7PF', '01234570021'),
        ('PF400022', 'PF', 'Mr',  'Callum',   'Nash',       '32 Imperial Way',                   'Brookvale',    'Westshire',  'WS2 8PF', '01234570022'),
        ('PF400023', 'PF', 'Ms',  'Amy',      'Powers',     '59 Fountain Road',                  'Hillcrest',    'Westshire',  'WS3 7PF', '01234570023'),
        ('PF400024', 'PF', 'Mr',  'Josh',     'Barton',     '74 Empire Close',                   'Hillcrest',    'Westshire',  'WS3 8PF', '01234570024'),
        ('PF400025', 'PF', 'Mrs', 'Kirsty',   'Fleming',    '16 Crown Way',                      'Oakfield',     'Westshire',  'WS1 9PF', '01234570025'),

        -- Planning Fees (PLAN prefix, 15 accounts)
        ('PLAN50001', 'PLAN', 'Mr',  'Harry',    'Newton',   '11 Greenway Road',                  'Oakfield',     'Westshire',  'WS1 1PL', '01234571001'),
        ('PLAN50002', 'PLAN', 'Mrs', 'Sophie',   'Douglas',  '44 Boundary Lane',                  'Oakfield',     'Westshire',  'WS1 2PL', '01234571002'),
        ('PLAN50003', 'PLAN', 'Mr',  'Ethan',    'Crawford', '27 Prospect Hill',                  'Brookvale',    'Westshire',  'WS2 1PL', '01234571003'),
        ('PLAN50004', 'PLAN', 'Ms',  'Megan',    'Warren',   '53 Grange Road',                    'Brookvale',    'Westshire',  'WS2 2PL', '01234571004'),
        ('PLAN50005', 'PLAN', 'Mr',  'Noah',     'Hawkins',  '8 Orchard Street',                  'Hillcrest',    'Westshire',  'WS3 1PL', '01234571005'),
        ('PLAN50006', 'PLAN', 'Mrs', 'Ella',     'Chambers', '36 Church End',                     'Hillcrest',    'Westshire',  'WS3 2PL', '01234571006'),
        ('PLAN50007', 'PLAN', 'Mr',  'Oscar',    'Lawson',   '62 Manor Lane',                     'Oakfield',     'Westshire',  'WS1 3PL', '01234571007'),
        ('PLAN50008', 'PLAN', 'Ms',  'Isla',     'Day',      '19 Heath Road',                     'Oakfield',     'Westshire',  'WS1 4PL', '01234571008'),
        ('PLAN50009', 'PLAN', 'Mr',  'Freddie',  'Abbott',   '75 The Paddocks',                   'Brookvale',    'Westshire',  'WS2 3PL', '01234571009'),
        ('PLAN50010', 'PLAN', 'Mrs', 'Grace',    'Hart',     '41 Woodside Avenue',                'Brookvale',    'Westshire',  'WS2 4PL', '01234571010'),
        ('PLAN50011', 'PLAN', 'Mr',  'Alfie',    'Lynch',    '23 Hillside Crescent',              'Hillcrest',    'Westshire',  'WS3 3PL', '01234571011'),
        ('PLAN50012', 'PLAN', 'Ms',  'Lily',     'Miles',    '57 Valley Road',                    'Hillcrest',    'Westshire',  'WS3 4PL', '01234571012'),
        ('PLAN50013', 'PLAN', 'Mr',  'Leo',      'Webb',     '84 Brookside Lane',                 'Oakfield',     'Westshire',  'WS1 5PL', '01234571013'),
        ('PLAN50014', 'PLAN', 'Mrs', 'Ruby',     'Berry',    '12 Copse Road',                     'Brookvale',    'Westshire',  'WS2 5PL', '01234571014'),
        ('PLAN50015', 'PLAN', 'Mr',  'Archie',   'Frost',    '38 Ridge Lane',                     'Hillcrest',    'Westshire',  'WS3 5PL', '01234571015'),

        -- Leisure Services (LS prefix, 10 accounts)
        ('LS600001', 'LS', 'Mr',  'Ben',      'Porter',     '7 Riverside Walk',                  'Oakfield',     'Westshire',  'WS1 1LS', '01234572001'),
        ('LS600002', 'LS', 'Mrs', 'Emily',    'Hunt',       '25 Meadow Close',                   'Oakfield',     'Westshire',  'WS1 2LS', '01234572002'),
        ('LS600003', 'LS', 'Ms',  'Hannah',   'Knight',     '43 Forest Road',                    'Brookvale',    'Westshire',  'WS2 1LS', '01234572003'),
        ('LS600004', 'LS', 'Mr',  'Sam',      'Cole',       '68 Lakeside Drive',                 'Brookvale',    'Westshire',  'WS2 2LS', '01234572004'),
        ('LS600005', 'LS', 'Mrs', 'Lucy',     'Fox',        '91 Parkland Avenue',                'Hillcrest',    'Westshire',  'WS3 1LS', '01234572005'),
        ('LS600006', 'LS', 'Mr',  'Will',     'Dunn',       '14 Sports Centre Road',             'Hillcrest',    'Westshire',  'WS3 2LS', '01234572006'),
        ('LS600007', 'LS', 'Ms',  'Anna',     'Booth',      '36 Leisure Way',                    'Oakfield',     'Westshire',  'WS1 3LS', '01234572007'),
        ('LS600008', 'LS', 'Mr',  'Tom',      'Dean',       '52 Swimming Lane',                  'Brookvale',    'Westshire',  'WS2 3LS', '01234572008'),
        ('LS600009', 'LS', 'Mrs', 'Kate',     'Nash',       '71 Recreation Road',                'Hillcrest',    'Westshire',  'WS3 3LS', '01234572009'),
        ('LS600010', 'LS', 'Mr',  'Max',      'Pratt',      '85 Gymnasium Close',                'Oakfield',     'Westshire',  'WS1 4LS', '01234572010'),

        -- Garden Waste (GW prefix, 10 accounts)
        ('GW700001', 'GW', 'Mr',  'George',   'Harvey',     '3 Allotment Road',                  'Oakfield',     'Westshire',  'WS1 1GW', '01234573001'),
        ('GW700002', 'GW', 'Mrs', 'Olivia',   'Page',       '17 Garden Close',                   'Oakfield',     'Westshire',  'WS1 2GW', '01234573002'),
        ('GW700003', 'GW', 'Mr',  'Jack',     'Bush',       '34 Nursery Lane',                   'Brookvale',    'Westshire',  'WS2 1GW', '01234573003'),
        ('GW700004', 'GW', 'Ms',  'Mia',      'Greenwood',  '51 Compost Way',                    'Brookvale',    'Westshire',  'WS2 2GW', '01234573004'),
        ('GW700005', 'GW', 'Mr',  'Charlie',  'Hedges',     '67 Greenhouse Road',                'Hillcrest',    'Westshire',  'WS3 1GW', '01234573005'),
        ('GW700006', 'GW', 'Mrs', 'Amelia',   'Bower',      '82 Potting Lane',                   'Hillcrest',    'Westshire',  'WS3 2GW', '01234573006'),
        ('GW700007', 'GW', 'Mr',  'Henry',    'Leaf',       '28 Mulch Close',                    'Oakfield',     'Westshire',  'WS1 3GW', '01234573007'),
        ('GW700008', 'GW', 'Ms',  'Poppy',    'Bloom',      '45 Blossom Way',                    'Brookvale',    'Westshire',  'WS2 3GW', '01234573008'),
        ('GW700009', 'GW', 'Mr',  'Theo',     'Root',       '63 Seedling Road',                  'Hillcrest',    'Westshire',  'WS3 3GW', '01234573009'),
        ('GW700010', 'GW', 'Mrs', 'Daisy',    'Petal',      '79 Bloom Avenue',                   'Oakfield',     'Westshire',  'WS1 4GW', '01234573010'),

        -- Commercial Waste (CW prefix, 8 accounts)
        ('CW800001', 'CW', 'Mr',  'Marcus',   'Steele',     'Unit 3 Waste Management Park',      'Oakfield',     'Westshire',  'WS1 1CW', '01234574001'),
        ('CW800002', 'CW', 'Mrs', 'Diana',    'Cross',      '22 Industrial Way',                 'Oakfield',     'Westshire',  'WS1 2CW', '01234574002'),
        ('CW800003', 'CW', 'Mr',  'Victor',   'Stone',      '47 Commercial Road',                'Brookvale',    'Westshire',  'WS2 1CW', '01234574003'),
        ('CW800004', 'CW', 'Ms',  'Rosa',     'Bridges',    '61 Trade Park',                     'Brookvale',    'Westshire',  'WS2 2CW', '01234574004'),
        ('CW800005', 'CW', 'Mr',  'Frank',    'Towers',     '83 Processing Lane',                'Hillcrest',    'Westshire',  'WS3 1CW', '01234574005'),
        ('CW800006', 'CW', 'Mrs', 'Barbara',  'Holt',       '15 Depot Road',                     'Hillcrest',    'Westshire',  'WS3 2CW', '01234574006'),
        ('CW800007', 'CW', 'Mr',  'Gerald',   'Cash',       '38 Recycling Way',                  'Oakfield',     'Westshire',  'WS1 3CW', '01234574007'),
        ('CW800008', 'CW', 'Ms',  'Audrey',   'Thorpe',     '54 Skip Lane',                      'Brookvale',    'Westshire',  'WS2 3CW', '01234574008'),

        -- Sundry Debtors (SD prefix, 8 accounts)
        ('SD900001', 'SD', 'Mr',  'Gordon',   'Blackwell',  '11 Ledger Road',                    'Oakfield',     'Westshire',  'WS1 1SD', '01234575001'),
        ('SD900002', 'SD', 'Mrs', 'Heather',  'Cash',       '26 Balance Way',                    'Oakfield',     'Westshire',  'WS1 2SD', '01234575002'),
        ('SD900003', 'SD', 'Mr',  'Bruce',    'Penny',      '42 Invoice Lane',                   'Brookvale',    'Westshire',  'WS2 1SD', '01234575003'),
        ('SD900004', 'SD', 'Ms',  'Norma',    'Sterling',   '58 Credit Close',                   'Brookvale',    'Westshire',  'WS2 2SD', '01234575004'),
        ('SD900005', 'SD', 'Mr',  'Eric',     'Pounds',     '73 Debit Avenue',                   'Hillcrest',    'Westshire',  'WS3 1SD', '01234575005'),
        ('SD900006', 'SD', 'Mrs', 'Muriel',   'Farthing',   '89 Accounts Road',                  'Hillcrest',    'Westshire',  'WS3 2SD', '01234575006'),
        ('SD900007', 'SD', 'Mr',  'Wilfred',  'Guinness',   '15 Cheque Lane',                    'Oakfield',     'Westshire',  'WS1 3SD', '01234575007'),
        ('SD900008', 'SD', 'Ms',  'Bertha',   'Crown',      '31 Remittance Way',                 'Brookvale',    'Westshire',  'WS2 3SD', '01234575008'),

        -- Building Control (BC prefix, 9 accounts)
        ('BC000001', 'BC', 'Mr',  'Albert',   'Mason',      '4 Foundations Lane',                'Oakfield',     'Westshire',  'WS1 1BC', '01234576001'),
        ('BC000002', 'BC', 'Mrs', 'Doreen',   'Builder',    '21 Scaffold Road',                  'Oakfield',     'Westshire',  'WS1 2BC', '01234576002'),
        ('BC000003', 'BC', 'Mr',  'Walter',   'Brick',      '37 Construction Way',               'Brookvale',    'Westshire',  'WS2 1BC', '01234576003'),
        ('BC000004', 'BC', 'Ms',  'Mildred',  'Plumb',      '53 Extension Close',                'Brookvale',    'Westshire',  'WS2 2BC', '01234576004'),
        ('BC000005', 'BC', 'Mr',  'Bernard',  'Joiner',     '69 Renovation Avenue',              'Hillcrest',    'Westshire',  'WS3 1BC', '01234576005'),
        ('BC000006', 'BC', 'Mrs', 'Gladys',   'Tiler',      '84 Conversion Road',                'Hillcrest',    'Westshire',  'WS3 2BC', '01234576006'),
        ('BC000007', 'BC', 'Mr',  'Herbert',  'Slater',     '12 Planning Way',                   'Oakfield',     'Westshire',  'WS1 3BC', '01234576007'),
        ('BC000008', 'BC', 'Ms',  'Agnes',    'Rafter',     '29 Blueprint Lane',                 'Brookvale',    'Westshire',  'WS2 3BC', '01234576008'),
        ('BC000009', 'BC', 'Mr',  'Reginald', 'Thatch',     '46 Building Close',                 'Hillcrest',    'Westshire',  'WS3 3BC', '01234576009')
    ) AS v (AccountReference, FundCode, Title, Forename, Surname, AddressLine1, AddressLine2, AddressLine3, Postcode, Telephone)
)
INSERT INTO AccountHolders (AccountReference, FundCode, Title, Forename, Surname, AddressLine1, AddressLine2, AddressLine3, Postcode, RecordType, CurrentBalance)
SELECT
    nh.AccountReference,
    nh.FundCode,
    nh.Title,
    nh.Forename,
    nh.Surname,
    nh.AddressLine1,
    nh.AddressLine2,
    nh.AddressLine3,
    nh.Postcode,
    0, -- RecordType
    CASE nh.FundCode
        WHEN 'CT'   THEN ROUND(RAND(CHECKSUM(NEWID())) * 1650 + 150, 2)
        WHEN 'NNDR' THEN ROUND(RAND(CHECKSUM(NEWID())) * 9000 + 1000, 2)
        WHEN 'HR'   THEN ROUND(RAND(CHECKSUM(NEWID())) * 300 + 50, 2)
        WHEN 'PF'   THEN ROUND(RAND(CHECKSUM(NEWID())) * 35 + 35, 2)
        WHEN 'PLAN' THEN ROUND(RAND(CHECKSUM(NEWID())) * 400 + 234, 2)
        WHEN 'LS'   THEN ROUND(RAND(CHECKSUM(NEWID())) * 150 + 30, 2)
        WHEN 'GW'   THEN ROUND(RAND(CHECKSUM(NEWID())) * 20 + 35, 2)
        WHEN 'CW'   THEN ROUND(RAND(CHECKSUM(NEWID())) * 500 + 200, 2)
        WHEN 'SD'   THEN ROUND(RAND(CHECKSUM(NEWID())) * 2000 + 100, 2)
        WHEN 'BC'   THEN ROUND(RAND(CHECKSUM(NEWID())) * 500 + 100, 2)
        ELSE 0
    END
FROM NewAccountHolders nh
WHERE NOT EXISTS (
    SELECT 1 FROM AccountHolders ah WHERE ah.AccountReference = nh.AccountReference
);

PRINT '=== Account holders seeded ==='

-- =============================================================================
-- 6. PROCESSED TRANSACTIONS (500+)
-- Spread across 3 months, all funds, varied MOPs and amounts
-- Uses cross join with number table to generate bulk data
-- =============================================================================
PRINT '=== Seeding processed transactions ==='

-- Only generate if we don't already have many transactions
IF (SELECT COUNT(*) FROM ProcessedTransactions) < 100
BEGIN
    -- Generate a numbers table for date offsets
    ;WITH Numbers AS (
        SELECT TOP 550 ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS n
        FROM sys.all_objects a CROSS JOIN sys.all_objects b
    ),
    AccountRefs AS (
        SELECT AccountReference, FundCode,
               ROW_NUMBER() OVER (ORDER BY AccountReference) AS rn,
               COUNT(*) OVER () AS total
        FROM AccountHolders
    ),
    TxnData AS (
        SELECT
            n.n AS txn_num,
            ar.AccountReference,
            ar.FundCode,
            -- Spread across 90 days
            DATEADD(DAY, -(n.n % 90), GETDATE()) AS EntryDate,
            -- Amount based on fund type
            CASE ar.FundCode
                WHEN 'CT'   THEN ROUND(RAND(CHECKSUM(NEWID())) * 1650 + 150, 2)
                WHEN 'NNDR' THEN ROUND(RAND(CHECKSUM(NEWID())) * 4000 + 500, 2)
                WHEN 'HR'   THEN ROUND(RAND(CHECKSUM(NEWID())) * 300 + 80, 2)
                WHEN 'PF'   THEN ROUND(RAND(CHECKSUM(NEWID())) * 35 + 35, 2)
                WHEN 'PLAN' THEN ROUND(RAND(CHECKSUM(NEWID())) * 400 + 234, 2)
                WHEN 'LS'   THEN ROUND(RAND(CHECKSUM(NEWID())) * 100 + 20, 2)
                WHEN 'GW'   THEN ROUND(RAND(CHECKSUM(NEWID())) * 20 + 35, 2)
                WHEN 'CW'   THEN ROUND(RAND(CHECKSUM(NEWID())) * 400 + 150, 2)
                WHEN 'SD'   THEN ROUND(RAND(CHECKSUM(NEWID())) * 1500 + 100, 2)
                WHEN 'BC'   THEN ROUND(RAND(CHECKSUM(NEWID())) * 500 + 100, 2)
                ELSE 100.00
            END AS Amount,
            -- Cycle through MOPs
            CASE (n.n % 6)
                WHEN 0 THEN 'GOVPAY'
                WHEN 1 THEN 'CASH'
                WHEN 2 THEN 'CHQ'
                WHEN 3 THEN 'DD'
                WHEN 4 THEN 'BACS'
                WHEN 5 THEN 'SO'
            END AS MopCode,
            -- Narrative
            CASE (n.n % 6)
                WHEN 0 THEN 'Online payment via GOV.UK Pay'
                WHEN 1 THEN 'Cash received at counter'
                WHEN 2 THEN 'Cheque received'
                WHEN 3 THEN 'Direct Debit collection'
                WHEN 4 THEN 'BACS transfer received'
                WHEN 5 THEN 'Standing order payment'
            END AS Narrative
        FROM Numbers n
        CROSS APPLY (
            SELECT TOP 1 AccountReference, FundCode
            FROM AccountRefs
            WHERE rn = ((n.n - 1) % total) + 1
        ) ar
    )
    INSERT INTO ProcessedTransactions (
        TransactionDate, AccountReference, FundCode, MopCode, Amount,
        EntryDate, Narrative, UserCode, OfficeCode
    )
    SELECT
        EntryDate,
        AccountReference,
        FundCode,
        MopCode,
        Amount,
        EntryDate,
        Narrative,
        'admin',
        'MAIN'
    FROM TxnData;

    PRINT '=== 550 transactions generated ==='
END
ELSE
BEGIN
    PRINT '=== Transactions already exist, skipping ==='
END

-- =============================================================================
-- 7. SUSPENSE ITEMS (30+)
-- Unallocated BACS payments — wrong reference, partial payments, overpayments
-- =============================================================================
PRINT '=== Seeding suspense items ==='

IF (SELECT COUNT(*) FROM SuspenseItems) < 10
BEGIN
    ;WITH SuspenseData AS (
        SELECT * FROM (VALUES
            -- Wrong reference numbers
            ('BACS', DATEADD(DAY, -2, GETDATE()),  345.67, 'BACS ref: CT999999 - No matching account',          'CT999999',  'CT'),
            ('BACS', DATEADD(DAY, -3, GETDATE()),  127.50, 'BACS ref: NNDR00000 - Invalid reference',           'NNDR00000', 'NNDR'),
            ('BACS', DATEADD(DAY, -4, GETDATE()),   89.99, 'BACS ref: HR000000 - Account not found',            'HR000000',  'HR'),
            ('BACS', DATEADD(DAY, -5, GETDATE()),  210.00, 'BACS ref: CT100099 - Closed account',               'CT100099',  'CT'),
            ('BACS', DATEADD(DAY, -6, GETDATE()), 1250.00, 'BACS ref: NNDR99999 - Non-existent business',       'NNDR99999', 'NNDR'),
            ('BACS', DATEADD(DAY, -7, GETDATE()),   45.00, 'BACS ref: PF999999 - No match',                     'PF999999',  'PF'),
            ('BACS', DATEADD(DAY, -8, GETDATE()),  678.90, 'BACS ref: CT100098 - Possible typo',                'CT100098',  'CT'),
            ('BACS', DATEADD(DAY, -9, GETDATE()),  333.33, 'BACS ref: SD999001 - Unknown debtor',               'SD999001',  'SD'),
            ('BACS', DATEADD(DAY, -10, GETDATE()), 157.25, 'BACS ref: HR999999 - Tenant not found',             'HR999999',  'HR'),
            ('BACS', DATEADD(DAY, -11, GETDATE()), 890.00, 'BACS ref: NNDR20099 - Dissolved company',           'NNDR20099', 'NNDR'),

            -- Partial payments (amount doesn't match expected)
            ('BACS', DATEADD(DAY, -1, GETDATE()),   75.00, 'Partial payment - expected 150.00 for CT100001',    'CT100001',  'CT'),
            ('BACS', DATEADD(DAY, -2, GETDATE()),  100.00, 'Partial payment - expected 425.00 for NNDR20001',   'NNDR20001', 'NNDR'),
            ('BACS', DATEADD(DAY, -3, GETDATE()),   50.00, 'Partial payment - expected 85.00 for HR300001',     'HR300001',  'HR'),
            ('BACS', DATEADD(DAY, -4, GETDATE()),   20.00, 'Partial payment - expected 35.00 for PF400001',     'PF400001',  'PF'),
            ('DD',   DATEADD(DAY, -5, GETDATE()),  120.00, 'DD partial collection - mandate issue CT100005',    'CT100005',  'CT'),
            ('DD',   DATEADD(DAY, -6, GETDATE()),   65.00, 'DD partial collection - bank declined CT100010',    'CT100010',  'CT'),
            ('BACS', DATEADD(DAY, -7, GETDATE()),  200.00, 'Partial payment - expected 380.00 for CW800001',   'CW800001',  'CW'),
            ('BACS', DATEADD(DAY, -8, GETDATE()),   30.00, 'Partial payment - expected 55.00 for GW700001',    'GW700001',  'GW'),

            -- Overpayments
            ('BACS', DATEADD(DAY, -1, GETDATE()),  2100.00, 'Overpayment - balance was 1800.00 for CT100002',   'CT100002',  'CT'),
            ('BACS', DATEADD(DAY, -3, GETDATE()),   500.00, 'Overpayment - balance was 350.00 for HR300005',    'HR300005',  'HR'),
            ('BACS', DATEADD(DAY, -5, GETDATE()), 12000.00, 'Overpayment - balance was 9500.00 for NNDR20003',  'NNDR20003', 'NNDR'),
            ('BACS', DATEADD(DAY, -7, GETDATE()),   100.00, 'Overpayment - PCN already paid for PF400002',      'PF400002',  'PF'),

            -- Ambiguous references (could match multiple accounts)
            ('BACS', DATEADD(DAY, -2, GETDATE()),  456.78, 'Ambiguous BACS ref: THOMPSON - multiple matches',   'THOMPSON',  'CT'),
            ('BACS', DATEADD(DAY, -4, GETDATE()),  234.56, 'Ambiguous BACS ref: WILSON - multiple matches',     'WILSON',    'CT'),
            ('BACS', DATEADD(DAY, -6, GETDATE()),  789.01, 'Ambiguous BACS ref: CLARKE - multiple matches',     'CLARKE',    'NNDR'),
            ('SO',   DATEADD(DAY, -8, GETDATE()),  150.00, 'Standing order - no reference included',            '',          'CT'),
            ('SO',   DATEADD(DAY, -9, GETDATE()),  200.00, 'Standing order - reference truncated',              'CT1000',    'CT'),
            ('SO',   DATEADD(DAY, -10, GETDATE()), 175.00, 'Standing order - old reference format',             'OLD-REF-1', 'CT'),
            ('BACS', DATEADD(DAY, -12, GETDATE()), 425.00, 'BACS - name mismatch, ref looks valid',            'CT100003',  'CT'),
            ('BACS', DATEADD(DAY, -14, GETDATE()), 550.00, 'BACS - duplicate payment already allocated',        'NNDR20005', 'NNDR'),
            ('BACS', DATEADD(DAY, -15, GETDATE()), 88.50,  'BACS - unidentified sender',                        'UNKNOWN',   'PF')
        ) AS v (MopCode, CreatedAt, Amount, Narrative, AccountReference, FundCode)
    )
    INSERT INTO SuspenseItems (CreatedAt, Amount, Narrative, AccountReference, MopCode)
    SELECT CreatedAt, Amount, Narrative, AccountReference, MopCode
    FROM SuspenseData;

    PRINT '=== 31 suspense items created ==='
END
ELSE
BEGIN
    PRINT '=== Suspense items already exist, skipping ==='
END

-- =============================================================================
-- 8. OFFICES (for eReturns)
-- DemoData.sql creates a MAIN office; we add 3 more
-- =============================================================================
PRINT '=== Seeding offices ==='

MERGE INTO Offices AS target
USING (VALUES
    ('MAIN',    'Town Hall Reception'),
    ('LEISURE', 'Leisure Centre'),
    ('PARKING', 'Parking Services')
) AS source (OfficeCode, OfficeName)
ON target.OfficeCode = source.OfficeCode
WHEN NOT MATCHED THEN
    INSERT (OfficeCode, OfficeName) VALUES (source.OfficeCode, source.OfficeName)
WHEN MATCHED THEN
    UPDATE SET OfficeName = source.OfficeName;

-- =============================================================================
-- 9. eRETURN TEMPLATES (3 offices with cash/cheque lines)
-- =============================================================================
PRINT '=== Seeding eReturn templates ==='

-- Town Hall Reception template
IF NOT EXISTS (SELECT 1 FROM EReturnTemplates WHERE TemplateId = 'TOWNHALL-DAILY')
BEGIN
    INSERT INTO EReturnTemplates (TemplateId, TemplateName, OfficeCode)
    VALUES ('TOWNHALL-DAILY', 'Town Hall Daily Cash-Up', 'MAIN');
END

-- Leisure Centre template
IF NOT EXISTS (SELECT 1 FROM EReturnTemplates WHERE TemplateId = 'LEISURE-DAILY')
BEGIN
    INSERT INTO EReturnTemplates (TemplateId, TemplateName, OfficeCode)
    VALUES ('LEISURE-DAILY', 'Leisure Centre Daily Cash-Up', 'LEISURE');
END

-- Parking Services template
IF NOT EXISTS (SELECT 1 FROM EReturnTemplates WHERE TemplateId = 'PARKING-DAILY')
BEGIN
    INSERT INTO EReturnTemplates (TemplateId, TemplateName, OfficeCode)
    VALUES ('PARKING-DAILY', 'Parking Services Daily Cash-Up', 'PARKING');
END

-- Template rows (cash + cheque lines per template)
MERGE INTO EReturnTemplateRows AS target
USING (VALUES
    ('TOWNHALL-DAILY', 'CT',   'CASH', 'Council Tax - Cash'),
    ('TOWNHALL-DAILY', 'CT',   'CHQ',  'Council Tax - Cheque'),
    ('TOWNHALL-DAILY', 'NNDR', 'CASH', 'Business Rates - Cash'),
    ('TOWNHALL-DAILY', 'NNDR', 'CHQ',  'Business Rates - Cheque'),
    ('TOWNHALL-DAILY', 'HR',   'CASH', 'Housing Rents - Cash'),
    ('TOWNHALL-DAILY', 'HR',   'CHQ',  'Housing Rents - Cheque'),
    ('TOWNHALL-DAILY', 'SD',   'CASH', 'Sundry Debtors - Cash'),
    ('TOWNHALL-DAILY', 'SD',   'CHQ',  'Sundry Debtors - Cheque'),
    ('LEISURE-DAILY',  'LS',   'CASH', 'Leisure Services - Cash'),
    ('LEISURE-DAILY',  'LS',   'CHQ',  'Leisure Services - Cheque'),
    ('LEISURE-DAILY',  'GW',   'CASH', 'Garden Waste - Cash'),
    ('LEISURE-DAILY',  'GW',   'CHQ',  'Garden Waste - Cheque'),
    ('PARKING-DAILY',  'PF',   'CASH', 'Parking Fines - Cash'),
    ('PARKING-DAILY',  'PF',   'CHQ',  'Parking Fines - Cheque')
) AS source (TemplateId, FundCode, MopCode, Description)
ON target.TemplateId = source.TemplateId AND target.FundCode = source.FundCode AND target.MopCode = source.MopCode
WHEN NOT MATCHED THEN
    INSERT (TemplateId, FundCode, MopCode, Description)
    VALUES (source.TemplateId, source.FundCode, source.MopCode, source.Description);

-- =============================================================================
-- 10. eRETURN RECORDS (10 completed eReturns across 2 weeks)
-- =============================================================================
PRINT '=== Seeding eReturn records ==='

IF (SELECT COUNT(*) FROM EReturns) < 5
BEGIN
    -- Town Hall eReturns (5 days)
    DECLARE @d INT = 1;
    WHILE @d <= 5
    BEGIN
        INSERT INTO EReturns (TemplateId, OfficeCode, CreatedAt, CreatedByUserId, ApprovedAt, ApprovedByUserId, StatusId)
        VALUES (
            'TOWNHALL-DAILY',
            'MAIN',
            DATEADD(DAY, -@d, GETDATE()),
            'admin',
            DATEADD(DAY, -@d, GETDATE()),
            'admin',
            3 -- Approved
        );

        -- Get the just-inserted EReturn ID
        DECLARE @eReturnId INT = SCOPE_IDENTITY();

        -- Cash and cheque rows for each fund
        INSERT INTO EReturnCashItems (EReturnId, FundCode, MopCode, Amount)
        VALUES
            (@eReturnId, 'CT',   'CASH', ROUND(RAND(CHECKSUM(NEWID())) * 300 + 50, 2)),
            (@eReturnId, 'CT',   'CHQ',  ROUND(RAND(CHECKSUM(NEWID())) * 500 + 100, 2)),
            (@eReturnId, 'NNDR', 'CASH', ROUND(RAND(CHECKSUM(NEWID())) * 200 + 30, 2)),
            (@eReturnId, 'HR',   'CASH', ROUND(RAND(CHECKSUM(NEWID())) * 150 + 20, 2));

        SET @d = @d + 1;
    END

    -- Leisure Centre eReturns (3 days)
    SET @d = 1;
    WHILE @d <= 3
    BEGIN
        INSERT INTO EReturns (TemplateId, OfficeCode, CreatedAt, CreatedByUserId, ApprovedAt, ApprovedByUserId, StatusId)
        VALUES (
            'LEISURE-DAILY',
            'LEISURE',
            DATEADD(DAY, -@d - 1, GETDATE()),
            'admin',
            DATEADD(DAY, -@d - 1, GETDATE()),
            'admin',
            3
        );

        SET @eReturnId = SCOPE_IDENTITY();

        INSERT INTO EReturnCashItems (EReturnId, FundCode, MopCode, Amount)
        VALUES
            (@eReturnId, 'LS', 'CASH', ROUND(RAND(CHECKSUM(NEWID())) * 200 + 40, 2)),
            (@eReturnId, 'LS', 'CHQ',  ROUND(RAND(CHECKSUM(NEWID())) * 100 + 20, 2)),
            (@eReturnId, 'GW', 'CASH', ROUND(RAND(CHECKSUM(NEWID())) * 80 + 30, 2));

        SET @d = @d + 1;
    END

    -- Parking eReturns (2 days)
    SET @d = 1;
    WHILE @d <= 2
    BEGIN
        INSERT INTO EReturns (TemplateId, OfficeCode, CreatedAt, CreatedByUserId, ApprovedAt, ApprovedByUserId, StatusId)
        VALUES (
            'PARKING-DAILY',
            'PARKING',
            DATEADD(DAY, -@d - 2, GETDATE()),
            'admin',
            DATEADD(DAY, -@d - 2, GETDATE()),
            'admin',
            3
        );

        SET @eReturnId = SCOPE_IDENTITY();

        INSERT INTO EReturnCashItems (EReturnId, FundCode, MopCode, Amount)
        VALUES
            (@eReturnId, 'PF', 'CASH', ROUND(RAND(CHECKSUM(NEWID())) * 150 + 35, 2)),
            (@eReturnId, 'PF', 'CHQ',  ROUND(RAND(CHECKSUM(NEWID())) * 100 + 35, 2));

        SET @d = @d + 1;
    END

    PRINT '=== 10 eReturns created ==='
END
ELSE
BEGIN
    PRINT '=== eReturns already exist, skipping ==='
END

-- =============================================================================
-- 11. IMPORT PROCESSING RULES
-- BACS auto-allocation, Direct Debit, unmatched to suspense
-- =============================================================================
PRINT '=== Seeding import processing rules ==='

-- Import types
MERGE INTO ImportTypes AS target
USING (VALUES
    (1, 'BACS Payments',   'Standard BACS payment file import'),
    (2, 'Direct Debits',   'Direct Debit collection file import'),
    (3, 'Standing Orders', 'Standing order payment file import')
) AS source (ImportTypeId, Name, Description)
ON target.ImportTypeId = source.ImportTypeId
WHEN NOT MATCHED THEN
    INSERT (ImportTypeId, Name, Description) VALUES (source.ImportTypeId, source.Name, source.Description)
WHEN MATCHED THEN
    UPDATE SET Name = source.Name;

-- Import processing rules
MERGE INTO ImportProcessingRules AS target
USING (VALUES
    -- BACS auto-allocation by fund prefix
    (1, 1, 'CT%',   'CT',   'BACS',  'Auto-allocate Council Tax BACS by reference prefix'),
    (2, 1, 'NNDR%', 'NNDR', 'BACS',  'Auto-allocate Business Rates BACS by reference prefix'),
    (3, 1, 'HR%',   'HR',   'BACS',  'Auto-allocate Housing Rents BACS by reference prefix'),
    (4, 1, 'PF%',   'PF',   'BACS',  'Auto-allocate Parking Fines BACS by reference prefix'),
    (5, 1, 'PLAN%', 'PLAN', 'BACS',  'Auto-allocate Planning Fees BACS by reference prefix'),
    (6, 1, 'LS%',   'LS',   'BACS',  'Auto-allocate Leisure Services BACS by reference prefix'),
    (7, 1, 'CW%',   'CW',   'BACS',  'Auto-allocate Commercial Waste BACS by reference prefix'),
    (8, 1, 'SD%',   'SD',   'BACS',  'Auto-allocate Sundry Debtors BACS by reference prefix'),
    (9, 1, 'GW%',   'GW',   'BACS',  'Auto-allocate Garden Waste BACS by reference prefix'),
    (10, 1, 'BC%',  'BC',   'BACS',  'Auto-allocate Building Control BACS by reference prefix'),
    -- Direct Debit rules
    (11, 2, 'CT%',   'CT',  'DD',    'Direct Debit collection - Council Tax'),
    (12, 2, 'NNDR%', 'NNDR','DD',    'Direct Debit collection - Business Rates'),
    (13, 2, 'HR%',   'HR',  'DD',    'Direct Debit collection - Housing Rents'),
    -- Catch-all: unmatched -> suspense
    (14, 1, '%',     NULL,  'BACS',  'Unmatched BACS - route to suspense'),
    (15, 2, '%',     NULL,  'DD',    'Unmatched DD - route to suspense'),
    (16, 3, '%',     NULL,  'SO',    'Unmatched Standing Order - route to suspense')
) AS source (RuleId, ImportTypeId, ReferencePattern, FundCode, MopCode, Description)
ON target.RuleId = source.RuleId
WHEN NOT MATCHED THEN
    INSERT (RuleId, ImportTypeId, ReferencePattern, FundCode, MopCode, Description)
    VALUES (source.RuleId, source.ImportTypeId, source.ReferencePattern, source.FundCode, source.MopCode, source.Description);

-- =============================================================================
-- 12. IMPORT HISTORY (5 completed imports with 50+ rows each)
-- =============================================================================
PRINT '=== Seeding import history ==='

IF (SELECT COUNT(*) FROM Imports) < 3
BEGIN
    -- Create 5 import records
    DECLARE @importNum INT = 1;
    WHILE @importNum <= 5
    BEGIN
        DECLARE @importTypeId INT = CASE
            WHEN @importNum <= 3 THEN 1  -- BACS
            WHEN @importNum = 4 THEN 2   -- DD
            ELSE 3                         -- SO
        END;

        INSERT INTO Imports (ImportTypeId, CreatedAt, CreatedByUserId, NumberOfRows, StatusId)
        VALUES (
            @importTypeId,
            DATEADD(DAY, -(@importNum * 7), GETDATE()),
            'admin',
            CASE @importTypeId
                WHEN 1 THEN 65 + (@importNum * 5)
                WHEN 2 THEN 55 + (@importNum * 3)
                ELSE 30 + (@importNum * 2)
            END,
            3 -- Completed
        );

        DECLARE @importId INT = SCOPE_IDENTITY();

        -- Generate import rows (allocated + some suspense)
        ;WITH ImportRowNums AS (
            SELECT TOP (50 + @importNum * 5) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS rn
            FROM sys.all_objects
        ),
        AccountSample AS (
            SELECT AccountReference, FundCode,
                   ROW_NUMBER() OVER (ORDER BY NEWID()) AS arn
            FROM AccountHolders
        )
        INSERT INTO ImportRows (ImportId, AccountReference, FundCode, Amount, MopCode, StatusId)
        SELECT
            @importId,
            CASE WHEN irn.rn % 8 = 0 THEN 'UNKNOWN-' + CAST(irn.rn AS NVARCHAR(10))  -- ~12.5% go to suspense
                 ELSE asamp.AccountReference
            END,
            CASE WHEN irn.rn % 8 = 0 THEN 'CT'
                 ELSE asamp.FundCode
            END,
            ROUND(RAND(CHECKSUM(NEWID())) * 500 + 50, 2),
            CASE @importTypeId
                WHEN 1 THEN 'BACS'
                WHEN 2 THEN 'DD'
                ELSE 'SO'
            END,
            CASE WHEN irn.rn % 8 = 0 THEN 2 ELSE 3 END  -- 2=Suspense, 3=Allocated
        FROM ImportRowNums irn
        LEFT JOIN AccountSample asamp ON asamp.arn = ((irn.rn - 1) % (SELECT COUNT(*) FROM AccountHolders)) + 1;

        SET @importNum = @importNum + 1;
    END

    PRINT '=== 5 imports with 250+ total rows created ==='
END
ELSE
BEGIN
    PRINT '=== Import history already exists, skipping ==='
END

-- =============================================================================
-- 13. ASP.NET IDENTITY USERS (5 staff)
-- Password hashes are set by entrypoint.ps1 step 12 using hash-password.exe
-- We create placeholder hashes here (overwritten at boot)
-- =============================================================================
PRINT '=== Seeding ASP.NET Identity users ==='

-- The placeholder hash below will be replaced by entrypoint.ps1 step 12
DECLARE @placeholderHash NVARCHAR(MAX) = 'PLACEHOLDER_WILL_BE_SET_BY_ENTRYPOINT';

-- admin user (may already exist from DemoData.sql)
IF NOT EXISTS (SELECT 1 FROM AspNetUsers WHERE UserName = 'admin')
BEGIN
    INSERT INTO AspNetUsers (Id, Email, EmailConfirmed, PasswordHash, SecurityStamp, PhoneNumberConfirmed, TwoFactorEnabled, LockoutEnabled, AccessFailedCount, UserName)
    VALUES (NEWID(), 'admin@westshire.gov.uk', 1, @placeholderHash, NEWID(), 0, 0, 1, 0, 'admin');
END

IF NOT EXISTS (SELECT 1 FROM AspNetUsers WHERE UserName = 'finance.officer')
BEGIN
    INSERT INTO AspNetUsers (Id, Email, EmailConfirmed, PasswordHash, SecurityStamp, PhoneNumberConfirmed, TwoFactorEnabled, LockoutEnabled, AccessFailedCount, UserName)
    VALUES (NEWID(), 'finance.officer@westshire.gov.uk', 1, @placeholderHash, NEWID(), 0, 0, 1, 0, 'finance.officer');
END

IF NOT EXISTS (SELECT 1 FROM AspNetUsers WHERE UserName = 'cashier')
BEGIN
    INSERT INTO AspNetUsers (Id, Email, EmailConfirmed, PasswordHash, SecurityStamp, PhoneNumberConfirmed, TwoFactorEnabled, LockoutEnabled, AccessFailedCount, UserName)
    VALUES (NEWID(), 'cashier@westshire.gov.uk', 1, @placeholderHash, NEWID(), 0, 0, 1, 0, 'cashier');
END

IF NOT EXISTS (SELECT 1 FROM AspNetUsers WHERE UserName = 'payments.supervisor')
BEGIN
    INSERT INTO AspNetUsers (Id, Email, EmailConfirmed, PasswordHash, SecurityStamp, PhoneNumberConfirmed, TwoFactorEnabled, LockoutEnabled, AccessFailedCount, UserName)
    VALUES (NEWID(), 'payments.supervisor@westshire.gov.uk', 1, @placeholderHash, NEWID(), 0, 0, 1, 0, 'payments.supervisor');
END

IF NOT EXISTS (SELECT 1 FROM AspNetUsers WHERE UserName = 'auditor')
BEGIN
    INSERT INTO AspNetUsers (Id, Email, EmailConfirmed, PasswordHash, SecurityStamp, PhoneNumberConfirmed, TwoFactorEnabled, LockoutEnabled, AccessFailedCount, UserName)
    VALUES (NEWID(), 'auditor@westshire.gov.uk', 1, @placeholderHash, NEWID(), 0, 0, 1, 0, 'auditor');
END

-- =============================================================================
-- 14. IMS USERS + ROLE ASSIGNMENTS
-- Map ASP.NET Identity users to IMS Users table and assign roles
-- =============================================================================
PRINT '=== Seeding IMS users and roles ==='

-- Ensure roles exist (DemoData.sql should create these, but be safe)
MERGE INTO Roles AS target
USING (VALUES
    (1,  'SystemAdmin'),
    (2,  'Finance'),
    (3,  'Payments'),
    (4,  'Refunds'),
    (5,  'Transfers'),
    (6,  'Suspense'),
    (7,  'eReturns'),
    (8,  'Imports'),
    (9,  'Reporting'),
    (10, 'UserManagement'),
    (11, 'FundManagement'),
    (12, 'MopManagement'),
    (13, 'VatManagement'),
    (14, 'OfficeManagement'),
    (15, 'TransactionView'),
    (16, 'TransactionEdit'),
    (17, 'AccountHolderView'),
    (18, 'AccountHolderEdit'),
    (19, 'ImportView'),
    (20, 'eReturnView'),
    (21, 'AuditView')
) AS source (RoleId, RoleName)
ON target.RoleId = source.RoleId
WHEN NOT MATCHED THEN
    INSERT (RoleId, RoleName) VALUES (source.RoleId, source.RoleName);

-- Create IMS User records
MERGE INTO Users AS target
USING (VALUES
    ('admin',               'System',   'Administrator', 1, 'MAIN'),
    ('finance.officer',     'Finance',  'Officer',       1, 'MAIN'),
    ('cashier',             'Counter',  'Cashier',       1, 'MAIN'),
    ('payments.supervisor', 'Payments', 'Supervisor',    1, 'MAIN'),
    ('auditor',             'Internal', 'Auditor',       1, 'MAIN')
) AS source (UserCode, Forename, Surname, IsEnabled, OfficeCode)
ON target.UserCode = source.UserCode
WHEN NOT MATCHED THEN
    INSERT (UserCode, Forename, Surname, IsEnabled, OfficeCode)
    VALUES (source.UserCode, source.Forename, source.Surname, source.IsEnabled, source.OfficeCode);

-- admin — all roles
INSERT INTO UserRoles (UserCode, RoleId)
SELECT 'admin', RoleId FROM Roles
WHERE NOT EXISTS (SELECT 1 FROM UserRoles WHERE UserCode = 'admin' AND UserRoles.RoleId = Roles.RoleId);

-- finance.officer — Finance, Transactions, Suspense, Transfers, eReturns, Reporting
INSERT INTO UserRoles (UserCode, RoleId)
SELECT 'finance.officer', RoleId FROM Roles
WHERE RoleName IN ('Finance', 'Payments', 'Transfers', 'Suspense', 'eReturns', 'Reporting', 'TransactionView', 'TransactionEdit', 'AccountHolderView', 'ImportView', 'eReturnView')
AND NOT EXISTS (SELECT 1 FROM UserRoles WHERE UserCode = 'finance.officer' AND UserRoles.RoleId = Roles.RoleId);

-- cashier — Payments, eReturns for their office
INSERT INTO UserRoles (UserCode, RoleId)
SELECT 'cashier', RoleId FROM Roles
WHERE RoleName IN ('Payments', 'eReturns', 'TransactionView', 'AccountHolderView', 'eReturnView')
AND NOT EXISTS (SELECT 1 FROM UserRoles WHERE UserCode = 'cashier' AND UserRoles.RoleId = Roles.RoleId);

-- payments.supervisor — Transactions, Refunds, User Management
INSERT INTO UserRoles (UserCode, RoleId)
SELECT 'payments.supervisor', RoleId FROM Roles
WHERE RoleName IN ('Payments', 'Refunds', 'Suspense', 'Transfers', 'UserManagement', 'TransactionView', 'TransactionEdit', 'AccountHolderView', 'AccountHolderEdit', 'Reporting')
AND NOT EXISTS (SELECT 1 FROM UserRoles WHERE UserCode = 'payments.supervisor' AND UserRoles.RoleId = Roles.RoleId);

-- auditor — Read-only everything
INSERT INTO UserRoles (UserCode, RoleId)
SELECT 'auditor', RoleId FROM Roles
WHERE RoleName IN ('TransactionView', 'AccountHolderView', 'ImportView', 'eReturnView', 'AuditView', 'Reporting')
AND NOT EXISTS (SELECT 1 FROM UserRoles WHERE UserCode = 'auditor' AND UserRoles.RoleId = Roles.RoleId);

-- =============================================================================
-- 15. FUND GROUPS (with user access)
-- =============================================================================
PRINT '=== Seeding fund groups ==='

MERGE INTO FundGroups AS target
USING (VALUES
    (1, 'All Revenue'),
    (2, 'Housing'),
    (3, 'Parking & Enforcement')
) AS source (FundGroupId, Name)
ON target.FundGroupId = source.FundGroupId
WHEN NOT MATCHED THEN
    INSERT (FundGroupId, Name) VALUES (source.FundGroupId, source.Name);

-- All Revenue: all funds
MERGE INTO FundGroupFunds AS target
USING (
    SELECT 1 AS FundGroupId, FundCode FROM Funds
) AS source
ON target.FundGroupId = source.FundGroupId AND target.FundCode = source.FundCode
WHEN NOT MATCHED THEN
    INSERT (FundGroupId, FundCode) VALUES (source.FundGroupId, source.FundCode);

-- Housing: HR only
IF NOT EXISTS (SELECT 1 FROM FundGroupFunds WHERE FundGroupId = 2 AND FundCode = 'HR')
    INSERT INTO FundGroupFunds (FundGroupId, FundCode) VALUES (2, 'HR');

-- Parking & Enforcement: PF only
IF NOT EXISTS (SELECT 1 FROM FundGroupFunds WHERE FundGroupId = 3 AND FundCode = 'PF')
    INSERT INTO FundGroupFunds (FundGroupId, FundCode) VALUES (3, 'PF');

-- Fund group user access
MERGE INTO FundGroupUsers AS target
USING (VALUES
    -- admin gets all groups
    (1, 'admin'), (2, 'admin'), (3, 'admin'),
    -- finance.officer gets All Revenue
    (1, 'finance.officer'),
    -- cashier gets All Revenue
    (1, 'cashier'),
    -- payments.supervisor gets All Revenue
    (1, 'payments.supervisor'),
    -- auditor gets All Revenue (read-only)
    (1, 'auditor')
) AS source (FundGroupId, UserCode)
ON target.FundGroupId = source.FundGroupId AND target.UserCode = source.UserCode
WHEN NOT MATCHED THEN
    INSERT (FundGroupId, UserCode) VALUES (source.FundGroupId, source.UserCode);

-- =============================================================================
-- 16. PAYMENT INTEGRATIONS
-- Ensure GOV.UK Pay integration exists (DemoData.sql may have created one)
-- =============================================================================
PRINT '=== Seeding payment integrations ==='

IF NOT EXISTS (SELECT 1 FROM PaymentIntegrations WHERE Name = 'GOV.UK Pay')
BEGIN
    INSERT INTO PaymentIntegrations (Name, BaseUri)
    VALUES ('GOV.UK Pay', 'https://placeholder-will-be-set-by-entrypoint');
END

-- Link citizen-payable funds to the GOV.UK Pay integration
DECLARE @payIntegrationId INT;
SELECT TOP 1 @payIntegrationId = Id FROM PaymentIntegrations WHERE Name = 'GOV.UK Pay';

IF @payIntegrationId IS NOT NULL
BEGIN
    MERGE INTO FundPaymentIntegrations AS target
    USING (
        SELECT @payIntegrationId AS PaymentIntegrationId, FundCode
        FROM (VALUES ('CT'),('NNDR'),('PF'),('PLAN'),('LS'),('GW'),('BC')) AS f(FundCode)
    ) AS source
    ON target.PaymentIntegrationId = source.PaymentIntegrationId AND target.FundCode = source.FundCode
    WHEN NOT MATCHED THEN
        INSERT (PaymentIntegrationId, FundCode) VALUES (source.PaymentIntegrationId, source.FundCode);
END

PRINT '============================================='
PRINT '  Seed data loading complete!'
PRINT '  - 210 account holders'
PRINT '  - 550+ transactions'
PRINT '  - 31 suspense items'
PRINT '  - 3 eReturn templates'
PRINT '  - 10 eReturns'
PRINT '  - 16 import rules'
PRINT '  - 5 completed imports'
PRINT '  - 5 staff users with roles'
PRINT '  - 3 fund groups'
PRINT '  - 4 VAT codes'
PRINT '  - 10 funds with metadata'
PRINT '============================================='

COMMIT TRANSACTION;
GO

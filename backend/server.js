require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const xlsx = require('xlsx');
const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, process.env.UPLOAD_DIR);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const upload = multer({ dest: uploadDir });

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

// Helper to convert DD/MM/YYYY or D/M/YYYY to YYYY-MM-DD
function convertExcelDateToMysql(dateStr) {
  if (!dateStr) return null;
  // If already in YYYY-MM-DD, return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  // If in DD/MM/YYYY or D/M/YYYY
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const [d, m, y] = parts;
    if (y && m && d) {
      // Pad month and day if needed
      const mm = m.padStart(2, '0');
      const dd = d.padStart(2, '0');
      return `${y}-${mm}-${dd}`;
    }
  }
  return null;
}

// Helper to trim all string fields in a row
function trimRowFields(row) {
  const trimmed = {};
  for (const key in row) {
    if (typeof row[key] === 'string') {
      trimmed[key] = row[key].trim();
    } else {
      trimmed[key] = row[key];
    }
  }
  return trimmed;
}

// Helper function to map Excel row keys to DB columns for Leads
function mapLeadRow(row) {
  row = trimRowFields(row);
  // Support all header variants (with/without dot, slash, space)
  const LeadNo = row.LeadNo || row['LeadNo'] || row['Lead No'] || row['Lead No.'] || '';
  if (!LeadNo) return null; // skip rows without LeadNo
  return {
    LeadNo,
    Date: convertExcelDateToMysql(row.Date || row['Date']),
    CompanyAccountName:
      row.CompanyAccountName ||
      row['CompanyAccountName'] ||
      row['Company Account Name'] ||
      row['Company/Account Name'] ||
      '',
    State: row.State || row['State'] || '',
    IndustryType:
      row.IndustryType ||
      row['IndustryType'] ||
      row['Industry Type'] ||
      row['Industry Type.'] ||
      '',
    FirstName:
      row.FirstName ||
      row['FirstName'] ||
      row['First Name'] ||
      row['First Name.'] ||
      '',
    LastName:
      row.LastName ||
      row['LastName'] ||
      row['Last Name'] ||
      row['Last Name.'] ||
      '',
    Email: row.Email || row['Email'] || '',
    Mobile: row.Mobile || row['Mobile'] || '',
    LeadOwner:
      row.LeadOwner ||
      row['LeadOwner'] ||
      row['Lead Owner'] ||
      row['Lead Owner.'] ||
      '',
    LeadStatus:
      row.LeadStatus ||
      row['LeadStatus'] ||
      row['Lead Status'] ||
      row['Lead Status.'] ||
      ''
  };
}

// Helper function to upsert data into Leads table
async function upsertLeads(rows, conn) {
  for (const row of rows) {
    await conn.execute(
      `INSERT INTO Leads (LeadNo, Date, CompanyAccountName, State, IndustryType, FirstName, LastName, Email, Mobile, LeadOwner, LeadStatus)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         Date=VALUES(Date),
         CompanyAccountName=VALUES(CompanyAccountName),
         State=VALUES(State),
         IndustryType=VALUES(IndustryType),
         FirstName=VALUES(FirstName),
         LastName=VALUES(LastName),
         Email=VALUES(Email),
         Mobile=VALUES(Mobile),
         LeadOwner=VALUES(LeadOwner),
         LeadStatus=VALUES(LeadStatus)`,
      [
        row.LeadNo, row.Date, row.CompanyAccountName, row.State, row.IndustryType,
        row.FirstName, row.LastName, row.Email, row.Mobile, row.LeadOwner, row.LeadStatus
      ]
    );
  }
}

// Helper function to map Excel row keys to DB columns for Opportunities
function mapOpportunityRow(row) {
  row = trimRowFields(row);
  // Robustly match all possible Quoted Value and Final Value header variants
  const quotedValue =
    row.QuotedValue ||
    row['QuotedValue'] ||
    row['Quoted Value'] ||
    row['Quoted Value.'] ||
    row['Quoted Value '] ||
    row['QuotedValue.'] ||
    row['Quoted value'] ||
    row['Quoted value.'] ||
    row['Quoted value '] ||
    row['Quoted Value '] || // sometimes Excel adds a non-breaking space
    '';
  const finalValue =
    row.FinalValue ||
    row['FinalValue'] ||
    row['Final  Value'] ||
    row['Final Value'] ||
    row['Final Value.'] ||
    row['Final Value '] ||
    row['FinalValue.'] ||
    row['Final value'] ||
    row['Final value.'] ||
    row['Final value '] ||
    row['Final Value '] ||
    '';
  return {
    OpportunityID: row.OpportunityID || row['OpportunityID'] || row['Opportunity ID'] || '',
    CreatedDate: convertExcelDateToMysql(row.CreatedDate || row['CreatedDate'] || row['Created Date']),
    AccountName: row.AccountName || row['AccountName'] || row['Account Name'] || '',
    IndustryType: row.IndustryType || row['IndustryType'] || row['Industry Type'] || '',
    State: row.State || row['State'] || '',
    OpportunityOwner: row.OpportunityOwner || row['OpportunityOwner'] || row['Opportunity Owner'] || '',
    ProposalOwner: row.ProposalOwner || row['ProposalOwner'] || row['Proposal Owner'] || '',
    Stage: row.Stage || row['Stage'] || '',
    Capacity: row.Capacity || row['Capacity'] || '',
    QuotedValue: parseNumberField(quotedValue),
    FinalValue: parseNumberField(finalValue),
    TentativeClosingDate: row.TentativeClosingDate || row['TentativeClosingDate'] || row['Tentative Closing Date'] || ''
  };
}

// Helper function to upsert data into Opportunities table
async function upsertOpportunities(rows, conn) {
  for (const row of rows) {
    await conn.execute(
      `INSERT INTO Opportunities (OpportunityID, CreatedDate, AccountName, IndustryType, State, OpportunityOwner, ProposalOwner, Stage, Capacity, QuotedValue, FinalValue, TentativeClosingDate)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         CreatedDate=VALUES(CreatedDate),
         AccountName=VALUES(AccountName),
         IndustryType=VALUES(IndustryType),
         State=VALUES(State),
         OpportunityOwner=VALUES(OpportunityOwner),
         ProposalOwner=VALUES(ProposalOwner),
         Stage=VALUES(Stage),
         Capacity=VALUES(Capacity),
         QuotedValue=VALUES(QuotedValue),
         FinalValue=VALUES(FinalValue),
         TentativeClosingDate=VALUES(TentativeClosingDate)`,
      [
        row.OpportunityID, row.CreatedDate, row.AccountName, row.IndustryType, row.State,
        row.OpportunityOwner, row.ProposalOwner, row.Stage, row.Capacity, row.QuotedValue,
        row.FinalValue, row.TentativeClosingDate
      ]
    );
  }
}

// Helper to clean currency/number strings like "INR61,500,000.00" to 61500000.00
function parseNumberField(val) {
  if (typeof val === 'number') return val;
  if (!val || typeof val !== 'string') return 0;
  // Remove everything except digits, commas, and dot
  let cleaned = val.replace(/[^0-9.,]/g, '');
  // Remove commas
  cleaned = cleaned.replace(/,/g, '');
  // Now parse as float
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

// Helper to filter by OpportunityID prefix
function prefixWhereClause(prefix) {
  if (!prefix || prefix === 'ALL') return '';
  return `AND OpportunityID LIKE '${prefix}%'`;
}

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Upload Leads Excel
app.post('/upload/leads', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet);
    console.log('Parsed Excel rows (Leads):', rows);
    if (!rows.length) {
      return res.status(400).json({ error: 'Excel file is empty or invalid', rows });
    }
    const mappedRows = rows.map(mapLeadRow).filter(Boolean);
    console.log('Mapped rows (Leads):', mappedRows);
    if (mappedRows.length === 0) {
      return res.status(400).json({ error: 'No valid rows found in Excel file (missing LeadNo)', rows, mappedRows });
    }
    const conn = await mysql.createConnection({ ...dbConfig, dateStrings: true });
    await upsertLeads(mappedRows, conn);

    // --- Delete rows not in Excel ---
    const leadNos = mappedRows.map(r => r.LeadNo);
    if (leadNos.length > 0) {
      // Use parameterized query for safety
      await conn.execute(
        `DELETE FROM Leads WHERE LeadNo NOT IN (${leadNos.map(() => '?').join(',')})`,
        leadNos
      );
    } else {
      // If no valid rows, optionally clear table (or skip)
      // await conn.execute('DELETE FROM Leads');
    }
    // --- End deletion logic ---

    await conn.end();
    broadcastSSE({ type: 'leads_updated' }); // Notify clients
    res.json({ success: true, count: mappedRows.length });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Upload Opportunities Excel
app.post('/upload/opportunities', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet);
    console.log('Parsed Excel rows (Opportunities):', rows);
    if (!rows.length) {
      return res.status(400).json({ error: 'Excel file is empty or invalid', rows });
    }
    const mappedRows = rows.map(mapOpportunityRow).filter(Boolean);
    console.log('Mapped rows (Opportunities):', mappedRows);
    if (mappedRows.length === 0) {
      return res.status(400).json({ error: 'No valid rows found in Excel file (missing OpportunityID)', rows, mappedRows });
    }
    const conn = await mysql.createConnection({ ...dbConfig, dateStrings: true });
    await upsertOpportunities(mappedRows, conn);

    // --- Delete rows not in Excel ---
    const oppIds = mappedRows.map(r => r.OpportunityID);
    if (oppIds.length > 0) {
      await conn.execute(
        `DELETE FROM Opportunities WHERE OpportunityID NOT IN (${oppIds.map(() => '?').join(',')})`,
        oppIds
      );
    } else {
      // Optionally clear table if no valid rows
      // await conn.execute('DELETE FROM Opportunities');
    }
    // --- End deletion logic ---

    await conn.end();
    broadcastSSE({ type: 'opportunities_updated' }); // Notify clients
    res.json({ success: true, count: mappedRows.length });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

// SSE clients
const sseClients = [];

app.get('/events', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  res.flushHeaders();
  res.write('retry: 10000\n\n');
  sseClients.push(res);

  req.on('close', () => {
    const idx = sseClients.indexOf(res);
    if (idx !== -1) sseClients.splice(idx, 1);
  });
});

// Helper to broadcast SSE event
function broadcastSSE(data) {
  sseClients.forEach(client => {
    client.write(`data: ${JSON.stringify(data)}\n\n`);
  });
}

// Get all Leads
app.get('/leads', async (req, res) => {
  try {
    const conn = await mysql.createConnection({ ...dbConfig, dateStrings: true });
    const [rows] = await conn.execute('SELECT * FROM Leads');
    await conn.end();
    res.json(rows);
  } catch (err) {
    console.error('Database error:', err); // Improved error logging
    res.status(500).json({ error: err.message });
  }
});

// Get all Opportunities
app.get('/opportunities', async (req, res) => {
  try {
    const conn = await mysql.createConnection({ ...dbConfig, dateStrings: true });
    const [rows] = await conn.execute('SELECT * FROM Opportunities');
    await conn.end();
    res.json(rows);
  } catch (err) {
    console.error('Database error:', err); // Improved error logging
    res.status(500).json({ error: err.message });
  }
});

// Accept filters for charts (backend)
function filtersWhereClause(query) {
  let clause = '';
  const filterable = [
    'CreatedDate', 'AccountName', 'IndustryType', 'State', 'OpportunityOwner',
    'ProposalOwner', 'Stage', 'Capacity', 'QuotedValue', 'FinalValue', 'TentativeClosingDate'
  ];
  filterable.forEach(key => {
    if (query[key]) {
      clause += ` AND ${key} = '${query[key].replace(/'/g, "''")}'`;
    }
  });
  return clause;
}

// Update endpoints to use filtersWhereClause(req.query)
app.get('/opportunities/owner-performance', async (req, res) => {
  try {
    const prefix = req.query.prefix ? req.query.prefix.toUpperCase() : 'ALL';
    const conn = await mysql.createConnection({ ...dbConfig, dateStrings: true });
    const [rows] = await conn.execute(`
      SELECT 
        OpportunityOwner, 
        SUM(QuotedValue) AS totalQuotedValue, 
        COUNT(*) AS opportunityCount
      FROM Opportunities
      WHERE 1=1 ${prefixWhereClause(prefix)}${filtersWhereClause(req.query)}
      GROUP BY OpportunityOwner
      ORDER BY totalQuotedValue DESC
    `);
    await conn.end();
    res.json(rows);
  } catch (err) {
    console.error('Database error:', err); // Improved error logging
    res.status(500).json({ error: err.message });
  }
});

app.get('/opportunities/stage-performance', async (req, res) => {
  try {
    const prefix = req.query.prefix ? req.query.prefix.toUpperCase() : 'ALL';
    const conn = await mysql.createConnection({ ...dbConfig, dateStrings: true });
    const [rows] = await conn.execute(`
      SELECT 
        Stage, 
        SUM(QuotedValue) AS totalQuotedValue, 
        COUNT(*) AS opportunityCount
      FROM Opportunities
      WHERE 1=1 ${prefixWhereClause(prefix)}${filtersWhereClause(req.query)}
      GROUP BY Stage
      ORDER BY totalQuotedValue DESC
    `);
    await conn.end();
    res.json(rows);
  } catch (err) {
    console.error('Database error:', err); // Improved error logging
    res.status(500).json({ error: err.message });
  }
});

app.get('/opportunities/industry-performance', async (req, res) => {
  try {
    const prefix = req.query.prefix ? req.query.prefix.toUpperCase() : 'ALL';
    const conn = await mysql.createConnection({ ...dbConfig, dateStrings: true });
    const [rows] = await conn.execute(`
      SELECT 
        IndustryType, 
        SUM(QuotedValue) AS totalQuotedValue, 
        COUNT(*) AS opportunityCount
      FROM Opportunities
      WHERE 1=1 ${prefixWhereClause(prefix)}${filtersWhereClause(req.query)}
      GROUP BY IndustryType
      ORDER BY totalQuotedValue DESC
    `);
    await conn.end();
    res.json(rows);
  } catch (err) {
    console.error('Database error:', err); // Improved error logging
    res.status(500).json({ error: err.message });
  }
});

app.get('/opportunities/state-quoted-value', async (req, res) => {
  try {
    const prefix = req.query.prefix ? req.query.prefix.toUpperCase() : 'ALL';
    const conn = await mysql.createConnection({ ...dbConfig, dateStrings: true });
    const [rows] = await conn.execute(`
      SELECT 
        State, 
        SUM(QuotedValue) AS totalQuotedValue
      FROM Opportunities
      WHERE 1=1 ${prefixWhereClause(prefix)}${filtersWhereClause(req.query)}
      GROUP BY State
      ORDER BY totalQuotedValue DESC
    `);
    await conn.end();
    res.json(rows);
  } catch (err) {
    console.error('Database error:', err); // Improved error logging
    res.status(500).json({ error: err.message });
  }
});

app.get('/opportunities/over-time', async (req, res) => {
  try {
    const prefix = req.query.prefix ? req.query.prefix.toUpperCase() : 'ALL';
    const conn = await mysql.createConnection({ ...dbConfig, dateStrings: true });
    const [rows] = await conn.execute(`
      SELECT 
        TentativeClosingDate AS quarter,
        SUM(QuotedValue) AS totalQuotedValue
      FROM Opportunities
      WHERE TentativeClosingDate IS NOT NULL AND TentativeClosingDate != ''
        ${prefixWhereClause(prefix)}${filtersWhereClause(req.query)}
      GROUP BY quarter
      ORDER BY quarter ASC
    `);
    await conn.end();
    res.json(rows);
  } catch (err) {
    console.error('Database error:', err); // Improved error logging
    res.status(500).json({ error: err.message });
  }
});

app.get('/opportunities/proposal-performance', async (req, res) => {
  try {
    const prefix = req.query.prefix ? req.query.prefix.toUpperCase() : 'ALL';
    const conn = await mysql.createConnection({ ...dbConfig, dateStrings: true });
    const [rows] = await conn.execute(`
      SELECT 
        ProposalOwner, 
        COUNT(*) AS proposalCount
      FROM Opportunities
      WHERE ProposalOwner IS NOT NULL AND ProposalOwner != ''
        ${prefixWhereClause(prefix)}${filtersWhereClause(req.query)}
      GROUP BY ProposalOwner
      ORDER BY proposalCount DESC
    `);
    await conn.end();
    res.json(rows);
  } catch (err) {
    console.error('Database error:', err); // Improved error logging
    res.status(500).json({ error: err.message });
  }
});

// Get Opportunity Owner Performance (sum of QuotedValue and count)
app.get('/opportunities/owner-performance', async (req, res) => {
  try {
    const prefix = req.query.prefix ? req.query.prefix.toUpperCase() : 'ALL';
    const conn = await mysql.createConnection({ ...dbConfig, dateStrings: true });
    const [rows] = await conn.execute(`
      SELECT 
        OpportunityOwner, 
        SUM(QuotedValue) AS totalQuotedValue, 
        COUNT(*) AS opportunityCount
      FROM Opportunities
      WHERE 1=1 ${prefixWhereClause(prefix)}
      GROUP BY OpportunityOwner
      ORDER BY totalQuotedValue DESC
    `);
    await conn.end();
    res.json(rows);
  } catch (err) {
    console.error('Database error:', err); // Improved error logging
    res.status(500).json({ error: err.message });
  }
});

// Get Stage Performance (sum of QuotedValue and count grouped by Stage)
app.get('/opportunities/stage-performance', async (req, res) => {
  try {
    const prefix = req.query.prefix ? req.query.prefix.toUpperCase() : 'ALL';
    const conn = await mysql.createConnection({ ...dbConfig, dateStrings: true });
    const [rows] = await conn.execute(`
      SELECT 
        Stage, 
        SUM(QuotedValue) AS totalQuotedValue, 
        COUNT(*) AS opportunityCount
      FROM Opportunities
      WHERE 1=1 ${prefixWhereClause(prefix)}
      GROUP BY Stage
      ORDER BY totalQuotedValue DESC
    `);
    await conn.end();
    res.json(rows);
  } catch (err) {
    console.error('Database error:', err); // Improved error logging
    res.status(500).json({ error: err.message });
  }
});

// Get Industry Performance (sum of QuotedValue and count grouped by IndustryType)
app.get('/opportunities/industry-performance', async (req, res) => {
  try {
    const prefix = req.query.prefix ? req.query.prefix.toUpperCase() : 'ALL';
    const conn = await mysql.createConnection({ ...dbConfig, dateStrings: true });
    const [rows] = await conn.execute(`
      SELECT 
        IndustryType, 
        SUM(QuotedValue) AS totalQuotedValue, 
        COUNT(*) AS opportunityCount
      FROM Opportunities
      WHERE 1=1 ${prefixWhereClause(prefix)}
      GROUP BY IndustryType
      ORDER BY totalQuotedValue DESC
    `);
    await conn.end();
    res.json(rows);
  } catch (err) {
    console.error('Database error:', err); // Improved error logging
    res.status(500).json({ error: err.message });
  }
});

// Get Quoted Value by State (for horizontal bar chart)
app.get('/opportunities/state-quoted-value', async (req, res) => {
  try {
    const prefix = req.query.prefix ? req.query.prefix.toUpperCase() : 'ALL';
    const conn = await mysql.createConnection({ ...dbConfig, dateStrings: true });
    const [rows] = await conn.execute(`
      SELECT 
        State, 
        SUM(QuotedValue) AS totalQuotedValue
      FROM Opportunities
      WHERE 1=1 ${prefixWhereClause(prefix)}
      GROUP BY State
      ORDER BY totalQuotedValue DESC
    `);
    await conn.end();
    res.json(rows);
  } catch (err) {
    console.error('Database error:', err); // Improved error logging
    res.status(500).json({ error: err.message });
  }
});

// Get Opportunities Over Time (grouped by Tentative Closing Date quarter)
app.get('/opportunities/over-time', async (req, res) => {
  try {
    const prefix = req.query.prefix ? req.query.prefix.toUpperCase() : 'ALL';
    const conn = await mysql.createConnection({ ...dbConfig, dateStrings: true });
    const [rows] = await conn.execute(`
      SELECT 
        TentativeClosingDate AS quarter,
        SUM(QuotedValue) AS totalQuotedValue
      FROM Opportunities
      WHERE TentativeClosingDate IS NOT NULL AND TentativeClosingDate != ''
        ${prefixWhereClause(prefix)}
      GROUP BY quarter
      ORDER BY quarter ASC
    `);
    await conn.end();
    res.json(rows);
  } catch (err) {
    console.error('Database error:', err); // Improved error logging
    res.status(500).json({ error: err.message });
  }
});

// Get Proposal Owner Performance (count grouped by ProposalOwner)
app.get('/opportunities/proposal-performance', async (req, res) => {
  try {
    const prefix = req.query.prefix ? req.query.prefix.toUpperCase() : 'ALL';
    const conn = await mysql.createConnection({ ...dbConfig, dateStrings: true });
    const [rows] = await conn.execute(`
      SELECT 
        ProposalOwner, 
        COUNT(*) AS proposalCount
      FROM Opportunities
      WHERE ProposalOwner IS NOT NULL AND ProposalOwner != ''
        ${prefixWhereClause(prefix)}
      GROUP BY ProposalOwner
      ORDER BY proposalCount DESC
    `);
    await conn.end();
    res.json(rows);
  } catch (err) {
    console.error('Database error:', err); // Improved error logging
    res.status(500).json({ error: err.message });
  }
});

// Get Closed Won Stacked Horizontal Bar Chart Data
app.get('/opportunities/closed-won-stacked', async (req, res) => {
  try {
    const prefix = req.query.prefix ? req.query.prefix.toUpperCase() : 'ALL';
    const conn = await mysql.createConnection({ ...dbConfig, dateStrings: true });
    const [rows] = await conn.execute(`
      WITH StateTotal AS (
        SELECT 
          State,
          SUM(FinalValue) as totalStateValue,
          COUNT(*) as totalStateCount
        FROM Opportunities
        WHERE Stage = 'Closed Won' ${prefix !== 'ALL' ? `AND OpportunityID LIKE '${prefix}%'` : ''}
        GROUP BY State
      )
      SELECT 
        o.State,
        o.OpportunityOwner,
        SUM(o.FinalValue) AS closedWonValue,
        COUNT(*) AS opportunityCount,
        st.totalStateValue,
        st.totalStateCount
      FROM Opportunities o
      JOIN StateTotal st ON o.State = st.State
      WHERE o.Stage = 'Closed Won' 
        AND o.FinalValue > 0
        AND o.OpportunityOwner IS NOT NULL
        ${prefix !== 'ALL' ? `AND o.OpportunityID LIKE '${prefix}%'` : ''}
      GROUP BY o.State, o.OpportunityOwner
      ORDER BY o.State ASC, SUM(o.FinalValue) DESC
    `);
    await conn.end();
    res.json(rows);
  } catch (err) {
    console.error('Database error:', err); // Improved error logging
    res.status(500).json({ error: err.message });
  }
});

// Get Closed Won Stacked By Industry
app.get('/opportunities/closed-won-stacked-industry', async (req, res) => {
  try {
    const prefix = req.query.prefix ? req.query.prefix.toUpperCase() : 'ALL';
    const conn = await mysql.createConnection({ ...dbConfig, dateStrings: true });
    const [rows] = await conn.execute(`
      WITH StateTotal AS (
        SELECT 
          State,
          SUM(FinalValue) as totalStateValue,
          COUNT(*) as totalStateCount
        FROM Opportunities
        WHERE Stage = 'Closed Won' ${prefix !== 'ALL' ? `AND OpportunityID LIKE '${prefix}%'` : ''}
        GROUP BY State
      )
      SELECT 
        o.State,
        o.IndustryType,
        SUM(o.FinalValue) AS closedWonValue,
        COUNT(*) AS opportunityCount,
        st.totalStateValue,
        st.totalStateCount
      FROM Opportunities o
      JOIN StateTotal st ON o.State = st.State
      WHERE o.Stage = 'Closed Won' 
        AND o.FinalValue > 0
        AND o.IndustryType IS NOT NULL
        ${prefix !== 'ALL' ? `AND o.OpportunityID LIKE '${prefix}%'` : ''}
      GROUP BY o.State, o.IndustryType
      ORDER BY o.State ASC, SUM(o.FinalValue) DESC
    `);
    await conn.end();
    res.json(rows);
  } catch (err) {
    console.error('Database error:', err); // Improved error logging
    res.status(500).json({ error: err.message });
  }
});

// Get unique lead types based on first two characters of LeadNo
app.get('/leads/types', async (req, res) => {
  try {
    const conn = await mysql.createConnection({ ...dbConfig, dateStrings: true });
    const [rows] = await conn.execute(`
      SELECT DISTINCT 
        LEFT(LeadNo, 2) as leadPrefix
      FROM Leads 
      WHERE LeadNo REGEXP '^[A-Z]{2}'
      ORDER BY leadPrefix;
    `);
    await conn.end();
    res.json(rows.map(r => r.leadPrefix));
  } catch (err) {
    console.error('Database error:', err); // Improved error logging
    res.status(500).json({ error: err.message });
  }
});

// Update status-over-time to filter by lead prefix
app.get('/leads/status-over-time', async (req, res) => {
  try {
    const conn = await mysql.createConnection({ ...dbConfig, dateStrings: true });
    const prefix = req.query.prefix;
    
    let query = `
      SELECT 
        DATE_FORMAT(STR_TO_DATE(Date, '%Y-%m-%d'), '%Y-%m') AS month,
        LeadStatus,
        COUNT(*) AS leadCount
      FROM Leads
      WHERE 1=1 
      ${prefix ? `AND LeadNo LIKE '${prefix}%'` : ''}
      GROUP BY month, LeadStatus
      ORDER BY month ASC, LeadStatus ASC
    `;

    const [rows] = await conn.execute(query);
    await conn.end();
    res.json(rows);
  } catch (err) {
    console.error('Database error:', err); // Improved error logging
    res.status(500).json({ error: err.message });
  }
});

// Update industry-performance to filter by lead prefix
app.get('/leads/industry-performance', async (req, res) => {
  try {
    const conn = await mysql.createConnection({ ...dbConfig, dateStrings: true });
    const prefix = req.query.prefix;
    
    let query = `
      SELECT 
        IndustryType,
        COUNT(*) AS leadCount
      FROM Leads
      WHERE IndustryType IS NOT NULL 
        AND IndustryType != ''
        ${prefix ? `AND LeadNo LIKE '${prefix}%'` : ''}
      GROUP BY IndustryType
      ORDER BY leadCount DESC
    `;

    const [rows] = await conn.execute(query);
    await conn.end();
    res.json(rows);
  } catch (err) {
    console.error('Database error:', err); // Improved error logging
    res.status(500).json({ error: err.message });
  }
});

// Update region-performance endpoint to support prefix filtering
app.get('/leads/region-performance', async (req, res) => {
  try {
    const conn = await mysql.createConnection({ ...dbConfig, dateStrings: true });
    const prefix = req.query.prefix;
    
    let query = `
      SELECT 
        State,
        COUNT(*) AS leadCount
      FROM Leads
      WHERE State IS NOT NULL 
        AND State != ''
        ${prefix ? `AND LeadNo LIKE '${prefix}%'` : ''}
      GROUP BY State
      ORDER BY leadCount DESC
    `;

    const [rows] = await conn.execute(query);
    await conn.end();
    res.json(rows);
  } catch (err) {
    console.error('Database error:', err); // Improved error logging
    res.status(500).json({ error: err.message });
  }
});

// Update owner-performance endpoint to support prefix filtering
app.get('/leads/owner-performance', async (req, res) => {
  try {
    const conn = await mysql.createConnection({ ...dbConfig, dateStrings: true });
    const prefix = req.query.prefix;
    
    let query = `
      SELECT 
        LeadOwner,
        COUNT(*) AS leadCount
      FROM Leads
      WHERE LeadOwner IS NOT NULL 
        AND LeadOwner != ''
        ${prefix ? `AND LeadNo LIKE '${prefix}%'` : ''}
      GROUP BY LeadOwner
      ORDER BY leadCount DESC
    `;

    const [rows] = await conn.execute(query);
    await conn.end();
    res.json(rows);
  } catch (err) {
    console.error('Database error:', err); // Improved error logging
    res.status(500).json({ error: err.message });
  }
});

const express = require('express');
require('dotenv').config();
const path = require('path');
const createError = require('http-errors');
const connectDB = require('./db');
const bodyParser = require('body-parser');
const vm = require('vm');
const app = express();
app.use(bodyParser.json());
const axios = require('axios');
let latestSubmission = null;

function removeComments(code) {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*/g, '')
    .replace(/^\s*console\.log\s*\(.*?\);\s*$/gm, '')
    .replace(/^\s*module\.exports\s*=\s*.*?;\s*$/gm, '')
    .split('\n')
    .filter(line => line.trim() !== '')
    .join('\n')
    .trim();
}

app.post('/evaluate', async (req, res) => {
  const { code, studentId, className, Topicid } = req.body;
  let { Questionid } = req.body;

  const cleancode = removeComments(code);

  if (!cleancode) {
    return res.status(400).json({ success: false, error: 'No code provided.' });
  }

  if (typeof Questionid === 'string' && /^q\d+$/i.test(Questionid)) {
    Questionid = parseInt(Questionid.replace(/^q/i, ''));
  }

  latestSubmission = {
    code: cleancode,
    studentId,
    className,
    questionId: Questionid,
    topicId: Topicid
  };

  console.log(latestSubmission);

  try {
    const testResponse = await axios.get(
      `http://localhost:3000/Db/Data/Question/${Topicid}/${Questionid}`
    );

    const rawTestcases = testResponse.data.testcases;
    const testcases = rawTestcases.map(({ _id, ...rest }) => rest);

    console.log("✅ Test cases retrieved:", testcases);

    const functionNameMatch = cleancode.match(/function\s+([a-zA-Z0-9_]+)/);
    const functionName = functionNameMatch ? functionNameMatch[1] : null;

    if (!functionName) {
      return res.status(400).json({ success: false, error: "Could not extract function name from code." });
    }

    const runWithJudge0 = require('./judge0');
    const testResults = await runWithJudge0(cleancode, functionName, testcases);

    return res.json({
      success: true,
      message: 'Code executed and compared with test cases.',
      results: testResults
    });

  } catch (error) {
    console.error("❌ Failed to fetch test cases or run code:", error.message);
    return res.status(500).json({ success: false, error: "Failed to fetch test cases or execute code." });
  }
});

module.exports = { latestSubmission};


connectDB()
  .then(db => {
    // Make the db handle available via app.locals
    app.locals.db = db;
    console.log('✅ Database connection established');
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  });
const dbRouter = require("./routers/db.router");

app.use("/Db", dbRouter); 
// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Catch 404 for unknown resources
app.use((req, res, next) => {
  next(createError(404, `Unknown resource ${req.method} ${req.originalUrl}`));
});
  
// Error handler
app.use((error, req, res, next) => {
  console.error(error);
  res
    .status(error.status || 500)
    .json({ error: error.message || 'Unknown Server Error!' });
});

module.exports = app;



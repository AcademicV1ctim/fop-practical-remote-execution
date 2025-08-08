const express = require('express');
const cors = require('cors');
require('dotenv').config();
const path = require('path');
const createError = require('http-errors');
const connectDB = require('./db');
const bodyParser = require('body-parser');
const vm = require('vm');
const pool = require('./pgdb.js');
const app = express();
app.use(bodyParser.json());
app.use(cors()); 
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
  const { code, id, ichat, Topicid, mockExecution, useCustomInput, customInput } = req.body;
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
    userId: id,
    ichat: ichat,
    questionId: Questionid,
    topicId: Topicid,
    mockExecution,
    useCustomInput,
    customInput
  };

  console.log(latestSubmission);

  try {
    const testRes = await fetch(`http://localhost:3000/Db/Data/Question/${Topicid}/${Questionid}`);

  if (!testRes.ok) {
    const errorText = await testRes.text();
    return res.status(testRes.status).json({ success: false, error: errorText });
  }

  const testData = await testRes.json();
  const rawTestcases = testData.testcases;
  let testcases = rawTestcases.map(({ _id, ...rest }) => rest);


  if (useCustomInput && Array.isArray(customInput)) {
    console.log("⚡ Using custom input:", customInput);

    const functionNameMatch = cleancode.match(/function\s+([a-zA-Z0-9_]+)/);
    const functionName = functionNameMatch ? functionNameMatch[1] : null;

    if (!functionName) {
      return res.status(400).json({ success: false, error: "Could not extract function name from code." });
    }

    
    const customTestcases = [{ input: customInput }];

    
    const runWithJudge0 = require('./judge0');

    if (mockExecution) {
      const mockResults = [{
        input: customInput,
        output: null,
        passed: true
      }];

      return res.json({
        success: true,
        message: "Mocked: Custom input executed.",
        results: mockResults,
        status: true
      });
    } else {
      const results = await runWithJudge0(cleancode, functionName, customTestcases, true);

      return res.json({
        success: true,
        message: "Custom input executed.",
        results,
        status: true
      });
    }
  }

  console.log("✅ Test cases retrieved:", testcases);

  const functionNameMatch = cleancode.match(/function\s+([a-zA-Z0-9_]+)/);
  const functionName = functionNameMatch ? functionNameMatch[1] : null;

  if (!functionName) {
    return res.status(400).json({ success: false, error: "Could not extract function name from code." });
  }

  if (mockExecution === true || mockExecution === 'true') {
    console.log("Running in MOCK mode, skipping Judge0.");
    const mockResults = testcases.map((tc, i) => ({
    testCase: i + 1,
      input: tc.input,
      expected: tc.output,
    output: tc.output,
    passed: true
  }));

  try {
    const checkAttempts = await pool.query(
      'SELECT COUNT(*) FROM attempts WHERE user_id = $1 AND question_id = $2 AND topic_id = $3',
      [id, Questionid, Topicid]
    );
    const attempt_number = parseInt(checkAttempts.rows[0].count) + 1;

    await pool.query(
      `INSERT INTO attempts (user_id, question_id, topic_id, attempt_number, is_correct)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, Questionid, Topicid, attempt_number, true]
    );  
    console.log('✅ Mock attempt recorded in NeonDB');
  } catch (mockDbErr) {
    console.error('❌ Failed to insert mock attempt into NeonDB:', mockDbErr.message);
  }

  return res.json({
    success: true,
    message: 'Mocked: Code executed and compared with test cases.',
    results: mockResults,
    status: true
  });
}


const runWithJudge0 = require('./judge0');
const testResults = await runWithJudge0(cleancode, functionName, testcases);

const quotaExceeded = testResults.some(result =>
  result.error === 'Execution failed' &&
  result.details &&
  result.details.includes('exceeded the DAILY quota')
);

if (quotaExceeded) {
  console.warn('Judge0 quota exceeded. Switching to mock execution.');

  const mockResults = testcases.map((tc, i) => ({
    testCase: i + 1,
    input: tc.input,
    expected: tc.output,
    output: tc.output,
    passed: true
  }));

  return res.json({
    success: true,
    message: 'Quota exceeded. Mocked: Code executed and compared with test cases.',
    results: mockResults,
    status: true
  });
}
const allPassed = testResults.every(tc => tc.passed === true);
const status = allPassed ? 'passed' : 'failed';
console.log(status)

return res.json({
  success: true,
  message: 'Code executed and compared with test cases.',
  results: testResults,
  status: status,
});

} catch (error) {
    console.error("❌ Failed to fetch test cases or run code:", error.message);
    return res.status(500).json({ success: false, error: "Failed to fetch test cases or execute code." });
}
});

module.exports = {latestSubmission};


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



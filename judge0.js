
const axios = require('axios');

const JUDGE0_API = 'https://judge0-ce.p.rapidapi.com';
const JUDGE0_HEADERS = {
  'Content-Type': 'application/json',
  'X-RapidAPI-Key': 'e28cc91427mshbaa36ca4221a894p12a3c5jsn90adbdb7c87a',
  'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
};

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
/**
 * Executes the given code against test cases using Judge0
 * @param {string} cleancode - The function code to run
 * @param {string} functionName - The name of the function to call
 * @param {Array} testcases - Array of test cases with { input, expected_output }
 * @returns {Promise<Array>} - Returns array of test result objects
 */
async function runWithJudge0(cleancode, functionName, testcases) {
  const testResults = [];

  for (const test of testcases) {
    await delay(1500);
    const source_code = `${cleancode}console.log(${functionName}(${test.input.map(i => JSON.stringify(i)).join(', ')}));
    `.trim();

    try {
      const submissionRes = await axios.post(`${JUDGE0_API}/submissions?base64_encoded=false&wait=true`, {
        source_code,
        language_id: 63, 
        stdin: ''
      }, { headers: JUDGE0_HEADERS });

      const actual_output = submissionRes.data.stdout?.trim();
      const expected_output = String(test.expected_output).trim();

      testResults.push({
        input: test.input,
        expected_output,
        actual_output,
        passed: actual_output === expected_output
      });
    } catch (err) {
      testResults.push({
        input: test.input,
        error: 'Execution failed',
        details: err.message
      });
    }
  }

  return testResults;
}

module.exports = runWithJudge0;

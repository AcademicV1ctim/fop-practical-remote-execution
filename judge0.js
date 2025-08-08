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
 * @param {boolean} isCustomInput - True if running only one custom test case
 * @returns {Promise<Array>} - Returns array of test result objects
 */
async function runWithJudge0(cleancode, functionName, testcases, isCustomInput = false) {
  const testCodeLines = [];
  testCodeLines.push('const results = [];');

  
  for (const test of testcases) {
    const args = Array.isArray(test.input)
      ? test.input.map(i => JSON.stringify(i)).join(', ')
      : JSON.stringify(test.input);

    testCodeLines.push(`try { results.push(${functionName}(${args})); } catch (e) { results.push("Error"); }`);
  }

  testCodeLines.push('console.log(JSON.stringify(results));');

  const source_code = `${cleancode}\n${testCodeLines.join('\n')}`;

  console.log('Submitting to Judge0:', {
    source_code,
    totalTestCases: testcases.length
  });

  try {
    const res = await fetch(`${JUDGE0_API}/submissions?base64_encoded=false&wait=true`, {
      method: 'POST',
      headers: {
        ...JUDGE0_HEADERS,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        source_code,
        language_id: 63,
        stdin: ''
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText);
    }

    const data = await res.json();
    const raw_output = data.stdout?.trim();

    let outputArray;
    try {
      outputArray = JSON.parse(raw_output);
    } catch (e) {
      throw new Error(`Invalid output format from Judge0: ${raw_output}`);
    }

    const testResults = testcases.map((test, i) => {
      let actual_output_raw = outputArray[i];
    
      let actual_output;
      try {
        actual_output = typeof actual_output_raw === "string"
          ? JSON.parse(actual_output_raw)
          : actual_output_raw;
      } catch {
        actual_output = actual_output_raw;
      }
    
      if (isCustomInput) {
        return {
          input: test.input,
          output: actual_output,
          passed: true
        };
      }
    
      const expected_output_raw = test.expected ?? test.expected_output;
      let expected_output;
      try {
        expected_output = typeof expected_output_raw === "string"
          ? JSON.parse(expected_output_raw)
          : expected_output_raw;
      } catch {
        expected_output = expected_output_raw;
      }
    
      const passed = JSON.stringify(actual_output) === JSON.stringify(expected_output);
    
      return {
        input: test.input,
        expected_output,
        actual_output,
        passed
      };
    });
    

    return testResults;

  } catch (err) {
    return [{
      error: 'Execution failed',
      details: err.message
    }];
  }
}

module.exports = runWithJudge0;

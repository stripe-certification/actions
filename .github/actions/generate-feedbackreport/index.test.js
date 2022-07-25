const process = require('process');
const cp = require('child_process');
const path = require('path');

// these tests can be used to check how the action would perform given a set of inputs
// future scope - can build out a few test cases to check how the action handles good and bad inputs

/**
 * This test runs the action on the below inputs:
 * 1. Rubric File - './rubric.json'
 * 2. Test Results - './test-results.json'
 * 3. Current Learner Status - './learner_challenge_test_details.json
 * 4. Skip Tests Label which is set to 'false'
 * 
 * It produces the following outputs - learner-next-section, learner-status, is-challenge-complete, can-auto-merge and pr-comments
 */
test('Run feedback builder action for standard inputs', () => {
  try 
  {
    process.env['INPUT_RUBRICFILE'] = './rubrix.json';
    process.env['INPUT_TESTRESULTFILE'] = './test-results.json';
    process.env['INPUT_CURRENTLEARNERCHALLENGESTATUSDETAILS'] = './learner_challenge_test_details.json';
    const ip = path.join(__dirname, 'index.js');
    const result = cp.execSync(`node ${ip}`, {env: process.env}).toString();
    console.log(result);
  } 
  catch (error) 
  {
    console.log(error.message);
    console.log("error", error.stdout.toString());
  }
});

const core = require('@actions/core');
const fs = require('fs').promises;

// this section takes inputs provided to the action in github workflow, validates its presence, calls the function to process these inputs and returns the output of the action
// when the action is invoked in the github workflow, this block of code is executed and it is the first point of entry
(async () => {
  try {
    const rubricFile = core.getInput('rubricfile', { required: true });
    const testResultFile = core.getInput('testresultfile', { required: true });
    const currentDetails = core.getInput('currentlearnerchallengestatusdetails', { required: true });
    const skipTestLabelApplied = core.getInput('skiptestlabelapplied', { required: true });
    if (!rubricFile) {
      core.error('This action expects a rubric file at `test/cypress/results/rubric.json`.  Please verify that the file is present and hasn\'t been modified from its original correct state.');
    }
    if (!currentDetails) {
      core.error('This action needs the learner details JSON file to run. Please ensure that thisfile is present.');
    }
    if (!testResultFile && skipTestLabelApplied != 'true') {
      core.error('We could not find a test result file to build feedback. This file was generated successfully in the original application. Please revert your changes until you have restored the successful feedback loop, then re-apply them one-by-one to determine what caused the test suite to fail.');
    }
    let { learnerNextSection, learnerChallengeStatus, isChallengeComplete, canAutoMergePR, prComment } = await generateFeedback(testResultFile, rubricFile, currentDetails, skipTestLabelApplied);
    core.setOutput('learner-next-section', learnerNextSection);
    core.setOutput('learner-status', learnerChallengeStatus);
    core.setOutput('is-challenge-complete', isChallengeComplete);
    core.setOutput('can-auto-merge', canAutoMergePR);
    core.setOutput('pr-comments', prComment);
  } catch (error) {
    core.setFailed(error.message);
  }
})();

// this is a control function that takes the inputs from the action, calls functions internally to process the inputs and returns the outputs
async function generateFeedback(testResultFile, rubricFile, currentDetails, skipTestLabelApplied) {
  const currentTime = new Date();
  
  // variables for building the learner challnege status output JSON
  let listOfSpecs = [];
  let currentSectionStats = {};
  let learnerNextSection = '';
  let isChallengeComplete = false;

  // variables to store couple of action outputs
  let prComment = '';
  let canAutoMergePR = false;

  // read the rubric File
  const rubricJsonString = await fs.readFile(rubricFile, 'utf8');
  const rubric = JSON.parse(rubricJsonString);

  // read the learner challenge status data and get the learner's current section
  const learnerChallengeStatusString = await fs.readFile(currentDetails, 'utf8');
  const learnerChallengeStatus = JSON.parse(learnerChallengeStatusString);
  const learnerCurrentSection = learnerChallengeStatus.currentSection;

  // setting the next section for the learner as current section initially 
  // if the test results show no failures or if tests are skipped, it will be updated accordingly
  learnerNextSection = learnerCurrentSection;

  // todo: remove skip test label
  // read test Result file only if learner has not requested for the tests to be skipped and the test result file exists
  // adding a check here as well to ensure nothing slips through the cracks - if no further issues of status JSON corruption are reported, this additional check can be removed and tested
  if (skipTestLabelApplied != 'true' && testResultFile) 
  {
    // variables used in the core logic of the action     
    let passedTestComments = '';
    let failedTestComments = '';
    
    const testResultJsonString = await fs.readFile(testResultFile, 'utf8');
    const testResults = JSON.parse(testResultJsonString);
    
    // fetching the variables to build the section stats of current section
    // the section stats will be added on top of the existing ones in the learner challenge status JSON file
    let { passedTests, passedRubridIds, failedTests, failedRubricIds, specsExecuted, totalDuration } = generateSectionStats(testResults, rubric);
    listOfSpecs = specsExecuted;

    currentSectionStats = {
      'specs': listOfSpecs,
      'skipTestsRequested': false,
      'numTests': testResults.config._testGroupsCount,
      'numPassed': passedTests.length,
      'numFailed': failedTests.length,
      'rubricPassed': passedRubridIds,
      'rubricFailed': failedRubricIds,
      'totalDuration': totalDuration
    };

    // the sorting here needs to be done so that the prompts and help texts are displayed in the order of the test cases executed
    passedTests.sort(SortByRowId);
    failedTests.sort(SortByRowId);

    // appending the propmts and helptexts to the comments string for passed and failed items to build out the bigger pr comments string
    passedTests.forEach(item => {
      passedTestComments += `\n * ${item.prompt}`;
    });

    failedTests.forEach(item => {
      failedTestComments += `\n * ${item.prompt} \n Hint: *${item.hint}*`;
    });

    // building out the PR comment string using the passed and the failed comments
    if (passedTestComments !== '')
    { 
      prComment = `### Following test passed. ${passedTestComments} \n`;
    }

    if (failedTestComments !== '')
    { 
      prComment += `### Following test did not pass. ${failedTestComments}`;
    } 
    else 
    {
      // now we know that there are no failures so we need to update the state variables that determine what the learner's next state is
      canAutoMergePR = true;
      learnerNextSection = getNextSection(learnerCurrentSection, rubric.sequences);
      isChallengeComplete = getChallengeCompletion(learnerCurrentSection, rubric.sequences);
    }
  } 
  else 
  {
    // building the test run stats and the vars that determine the learner's next state - given that the learner has requested for tests to be skipped
    prComment = '* We detected a skip-tests label, so you are allowed to merge this branch even though it hasn\'t passed all of the tests.';
    listOfSpecs.push(learnerCurrentSection);
    currentSectionStats = {
      'specs': listOfSpecs,
      'skipTestsRequested': true,
      'numTests': null,
      'numPassed': null,
      'numFailed': null,
      'rubricPassed': null,
      'rubricFailed': null,
      'totalDuration': null
    }
    learnerNextSection = getNextSection(learnerCurrentSection, rubric.sequences);   
    if (learnerCurrentSection != learnerNextSection ) // this ensures that if the learner cannot skip the last section
    {
      canAutoMergePR = true;
    }
  }

  // add logic to update learner status JSON
  learnerChallengeStatus.sectionStats.unshift(currentSectionStats);
  learnerChallengeStatus.currentSection = learnerNextSection;  
  learnerChallengeStatus.lastUpdatedDate = currentTime.toISOString();

  // check challenge completion and update status JSON if complete
  if (isChallengeComplete) {
    learnerChallengeStatus.isChallengeComplete = true;
    learnerChallengeStatus.challengeCompletedDate = currentTime.toISOString();
  }

  return { learnerNextSection, learnerChallengeStatus, isChallengeComplete, canAutoMergePR, prComment };
}

// function to process the rubric file and the test result file and generate the section stats for it
const generateSectionStats = (testResults, rubric) => {
  // some vars for pushing test data
  let nodeItem = ''
  let rubricItem = {};
  let totalDuration = 0;
  let passedTests = [];
  let failedTests = [];
  let passedRubridIds = [];
  let failedRubricIds = [];
  let listOfSpecs = [];

  testResults.suites.forEach(spec => {
    listOfSpecs.push(spec.title);
    spec.suites.forEach(describe => {
      describe.specs.forEach(testGroup => {
        nodeItem = testGroup.title.split(":").pop();
        rubricItem = rubric.items[nodeItem];
        totalDuration += testGroup.tests[0].results[0].duration;

        if (testGroup.tests[0].results[0].status == 'passed') {
          passedTests.push({
            "id" : nodeItem,
            "rowId": rubricItem.rowId,
            "prompt": rubricItem.learner_prompt
          });
          passedRubridIds.push(nodeItem);
        } else {
          failedTests.push({
            "id" : nodeItem,
            "rowId": rubricItem.rowId,
            "prompt": rubricItem.learner_prompt,
            "hint": rubricItem.helptext
          });
          failedRubricIds.push(nodeItem);
        }
      });
    });
  });

  return { passedTests, passedRubridIds, failedTests, failedRubricIds, listOfSpecs, totalDuration };
};


// get next section
const getNextSection = (learnerCurrentSection, sequences) => {
  const lastIndexInSequences = sequences.length - 1;
  let currentIndex = sequences.indexOf(learnerCurrentSection);
  // index of last element in sections list must be greater than current index in order to return valid next section
  if (lastIndexInSequences > currentIndex) {
    return sequences[currentIndex + 1];
  }
  return learnerCurrentSection;
};

// Function to check if challenge is complete or not
const getChallengeCompletion = (learnerCurrentSection, sequences) => {
  if (learnerCurrentSection === sequences[sequences.length - 1]) {
    return true;
  }
  return false;
};

//sort by ascending id
const SortByRowId = (x,y) => {
  return x.rowId - y.rowId; 
};
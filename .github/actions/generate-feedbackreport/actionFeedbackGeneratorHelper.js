import {promises as fs} from 'fs';

/**
 * Takes in the below inputs and generates the feedback to be used as the output for the action.
 * @param {string} testResultFile - The path for the test result file generated by the test cases run on the learner's implementation
 * @param {string} rubricFile - The path to the rubric file which has the data for providing feedback to the learner based on the test results
 * @param {string} currentDetails - The path to the file containing the current status of the leaner w.r.t the milestones
 */
export const generateFeedback = async (testResultFile, rubricFile, currentDetails) => {
    const currentTime = new Date();
    
    // variables for building the learner challenge status output JSON
    let currentSectionStats = {},
        learnerNextSection = '',
        isChallengeComplete = false;
  
    // read the rubric File
    const rubric = await parseJsonFromFile(rubricFile);
  
    // read the learner challenge status data and get the learner's current section
    const learnerChallengeStatus = await parseJsonFromFile(currentDetails);
    const learnerCurrentSection = learnerChallengeStatus.currentSection;
    
    // read the test resultfile to generate the section stats and the list of passed and failed test cases
    const testResults = await parseJsonFromFile(testResultFile);
    
    // fetching the variables to build the section stats of current section
    // the section stats will be added on top of the existing ones in the learner challenge status JSON file
    const {
        passedTests, 
        passedRubridIds, 
        failedTests, 
        failedRubricIds, 
        listOfSpecs, 
        totalDuration
    } = generateSectionStats(testResults, rubric);

    const {
        prComments, 
        isMilestoneComplete
    } = generatePrComments(passedTests, failedTests);

    currentSectionStats = {
      'specs': listOfSpecs,
      'numTests': testResults.config._testGroupsCount,
      'numPassed': passedTests.length,
      'numFailed': failedTests.length,
      'rubricPassed': passedRubridIds,
      'rubricFailed': failedRubricIds,
      'totalDuration': totalDuration
    };

    // if there are no failures, we need to update the state variables that determine what the learner's next state is
    // calling the helper methods to determine the next section and if the challnges is complete
    // canautoMerge flag is set to true to allow learner to work on a fresh PR after completing the current milestone
    learnerNextSection = getNextSection(learnerCurrentSection, rubric.sequences, isMilestoneComplete);
    isChallengeComplete = getChallengeCompletionStatus(learnerNextSection, rubric.sequences);
  
    // updating the learner status JSON with new section stats
    learnerChallengeStatus.sectionStats.unshift(currentSectionStats);
    learnerChallengeStatus.currentSection = learnerNextSection;
    learnerChallengeStatus.lastUpdatedDate = currentTime.toISOString();
  
    // check challenge completion and update learner status JSON if complete
    if (isChallengeComplete) {
      learnerChallengeStatus.isChallengeComplete = true;
      learnerChallengeStatus.challengeCompletedDate = currentTime.toISOString();
    }
  
    // TODO: reduce the number of outputs once the challengetest.yml workflow has been updated
    return {
        learnerNextSection, 
        learnerChallengeStatus, 
        isChallengeComplete, 
        isMilestoneComplete, 
        prComments
    };
}

/**
 * Generates a PR comment string based on the below inputs. The other outputs for the action are returned as null for string type and false for boolean type.
 * @param {boolean} isRubricPresent
 * @param {boolean} isLearnerStatusPresent
 * @param {boolean} isTestResultPresent
 */
export const generateFilesMissingFeedback = (isRubricPresent, isLearnerStatusPresent, isTestResultPresent) => {
    let learnerNextSection = null, 
        learnerChallengeStatus = null, 
        isChallengeComplete = false, 
        isMilestoneComplete = false, 
        prComments = '';

    if (!isRubricPresent)
    {
        prComments = prComments.concat('This action expects a rubric file at `test/cypress/results/rubric.json`.  Please verify that the file is present and hasn\'t been modified from its original correct state.');
    }

    if (!isLearnerStatusPresent)
    {
        prComments = prComments.concat('This action needs the learner details JSON file to run. Please ensure that this file is present.');
    }

    if (!isTestResultPresent)
    {
        prComments = prComments.concat('We could not find a test result file to build feedback. This file was generated successfully in the original application. \n Please revert your changes until you have restored the successful feedback loop, then re-apply them one-by-one to determine what caused the test suite to fail.');
    }
    
    return {
        learnerNextSection, 
        learnerChallengeStatus, 
        isChallengeComplete, 
        isMilestoneComplete, 
        prComments
    };
}
  
/**
 * Generates and returns the section stats using the below inputs
 * @param {Object} testResults - Test results of the current run
 * @param {Object} rubric - Rubric file 
 */
const generateSectionStats = (testResults, rubric) => {
    // some vars for pushing test data
    let nodeItem = '',
        rubricItem = {},
        totalDuration = 0,
        passedTests = [],
        failedTests = [],
        passedRubridIds = [],
        failedRubricIds = [],
        listOfSpecs = [];

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

/**
 * Returns the PR Comments string and a flag set to true if the milestone is complete and false otherwise, based on the list of passed and failed test cases
 * @param {Array<Object>} passedTestCases 
 * @param {Array<Object>} failedTestCases 
 */
const generatePrComments = (passedTestCases, failedTestCases) => {
    // PR comment string builder variables
    const newLine = '\n';
    const asterisk = '*';
    const prCommentHeader = '### The following tests'
    let prComments = '', 
        isMilestoneComplete = false, 
        passedTestComments = '',
        failedTestComments = '';

    // the sorting here needs to be done so that the prompts and help texts are displayed in the order of the test cases executed
    passedTestCases.sort(sortByItemId);
    failedTestCases.sort(sortByItemId);
  
    // appending the prompts and helptexts to the comments string for passed and failed items to build out the bigger PR comments string
    passedTestCases.map(testCase => {
        passedTestComments = passedTestComments.concat(`${newLine} ${asterisk} ${testCase.prompt}`);
    });

    failedTestCases.map(testCase => {
        failedTestComments = failedTestComments.concat(`${newLine} ${asterisk} ${testCase.prompt} ${newLine} Hint: ${asterisk}${testCase.hint}${asterisk}`);
    });
  
    // building out the PR comment string using the passed and the failed comments
    if (passedTestComments !== '')
    { 
        prComments = prComments.concat(`${prCommentHeader} passed: ${passedTestComments} ${newLine}`);
    }
  
    if (failedTestComments !== '')
    { 
        prComments = prComments.concat(`${prCommentHeader} did not pass: ${failedTestComments}`);
    }

    // if all test cases have passed, setting the isMilestoneComplete flag to true
    if (passedTestComments !== '' && failedTestComments === '') 
    {
        isMilestoneComplete = true;
    }

    return { prComments, isMilestoneComplete };
};

/**
 * Returns the next section of the learner using the below inputs
 * @param {string} learnerCurrentSection - The current section of the learner
 * @param {Array<string>} milestoneSequences - The list of milestones for the current challnge
 */
const getNextSection = (learnerCurrentSection, milestoneSequences, isMilestoneComplete) => {
    if (isMilestoneComplete) 
    {
        const lastIndexInSequences = milestoneSequences.length - 1;
        let currentIndex = milestoneSequences.indexOf(learnerCurrentSection);
        if (lastIndexInSequences > currentIndex) 
        {
            return milestoneSequences[currentIndex + 1];
        }
        return learnerCurrentSection;
    }    
    return learnerCurrentSection;
};

/**
 * Retruns a boolean indicating whether the learner has completed the challenge or not using the below inputs
 * @param {string} learnerCurrentSection - The current section of the learner
 * @param {Array<string>} sequences - The list of sections/milestones for the current challnge
 */
const getChallengeCompletionStatus = (learnerCurrentSection, sequences) => {
    if (learnerCurrentSection === sequences[sequences.length - 1]) {
        return true;
    }
    return false;
};

/**
 * Helper method to read a JSON file from file system and return its JSON object. Assumes the encoding of the file is utf-8.
 * @param {string} pathToFile - path of the file to read and parse, path must include the filename 
 */
const  parseJsonFromFile = async (pathToFile) => {
    const fileString = await fs.readFile(pathToFile, 'utf-8');
    return JSON.parse(fileString); 
}

/**
 * Helper method to check if a file exists or not.
 * @param {string} pathToFile - path of the file to check, path must include the filename
 */
export const checkIfFileExists = async (pathToFile) => {
    try 
    {        
        await fs.access(pathToFile);
        return true;
    }
    catch
    {
        return false;
    }
}

/**
 * Helper method to sort by item ID
 * @param {Object} x 
 * @param {Object} y 
 * @returns 
 */
const sortByItemId = (x,y) => {
    return x.id - y.id; 
};
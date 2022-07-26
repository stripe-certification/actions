import core from '@actions/core';

import {
  generateFeedback, 
  checkIfFileExists, 
  generateFilesMissingFeedback
} from './actionFeedbackGeneratorHelper.js';

// this section takes inputs provided to the action in github workflow, validates its presence, calls the function to process these inputs and returns the output of the action
// when the action is invoked in the github workflow, this block of code is executed and it is the first point of entry
(async () => {
  try 
  {
    // read input file paths
    const rubricFile = core.getInput('rubricfile', { required: true });
    const testResultFile = core.getInput('testresultfile', { required: true });
    const currentDetails = core.getInput('currentlearnerchallengestatusdetails', { required: true });

    // outputs of individual file checks
    const isRubricPresent = await checkIfFileExists(rubricFile);
    const isLearnerStatusPresent = await checkIfFileExists(currentDetails);
    const isTestResultPresent = await checkIfFileExists(testResultFile);

    // vars for storing the action output
    let learnerNextSection, 
        learnerChallengeStatus, 
        isChallengeComplete, 
        isMilestoneComplete, 
        prComments,
        // this variable is an output of the action and will be used in the challenge test workflow to stop processing the next steps and fail the action
        areFilesMissing = false;

    // if there is even one file missing, the generateFilesMissingFeedback is called which generates the PR comments based on the file(s) that is/are missing
    // the generateFeedback function is called ONLY if all files are present and this method is responsible for generating all the action outputs 
    if (!isRubricPresent || !isLearnerStatusPresent || !isTestResultPresent)
    {
      // setting this to true will enable the workflow failing mechanism to add a PR comment and stop all other steps from execution
      areFilesMissing = true;
      ({
        learnerNextSection, 
        learnerChallengeStatus, 
        isChallengeComplete, 
        isMilestoneComplete, 
        prComments
      } = generateFilesMissingFeedback(
        isRubricPresent,
        isLearnerStatusPresent,
        isTestResultPresent        
      ))
    }
    else 
    {
      ({
        learnerNextSection, 
        learnerChallengeStatus, 
        isChallengeComplete, 
        isMilestoneComplete, 
        prComments
      } = await generateFeedback(
        testResultFile, 
        rubricFile, 
        currentDetails
      ));
    }    

    core.setOutput('learner-next-section', learnerNextSection);
    core.setOutput('learner-status', learnerChallengeStatus);
    core.setOutput('is-challenge-complete', isChallengeComplete);
    core.setOutput('can-auto-merge', isMilestoneComplete);
    core.setOutput('pr-comments', prComments);
    core.setOutput('are-files-missing', areFilesMissing);
  } 
  catch (error) 
  {
    core.setFailed(error.message);
  }
})();
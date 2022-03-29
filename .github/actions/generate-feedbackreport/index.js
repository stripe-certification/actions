const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs').promises;

(async () => {
  try {
    const rubricfile = core.getInput('rubricfile', { required: true });
    const testresultfile = core.getInput('testresultfile', { required: true });
    const outputfolder = core.getInput('outputfolder', { required: true });
    const currentdetails = core.getInput('currentlearnerchallengestatusdetails', { required: true });
    const skiptestlabelapplied = core.getInput('skiptestlabelapplied', { required: true });
    if (!rubricfile) {
      core.error('rubricfile was not set');
    }
    if (!currentdetails) {
      core.error('currentdetails was not set');
    }
    let { passtestitems, failedtestitems, learnerNextSection, updatedLearnerDetailsJson, isChallengeComplete, canAutoMergePR, prComment } = await updateTestResultsInrubricfile(testresultfile, rubricfile, currentdetails, outputfolder, skiptestlabelapplied);
    core.setOutput('passtestitems', passtestitems);
    core.setOutput('failedtestitems', failedtestitems);
    core.setOutput('learnerchallengestatus', learnerNextSection);
    core.setOutput('learnerchallengestatusdetails', updatedLearnerDetailsJson);
    core.setOutput('challengecomplete', isChallengeComplete);
    core.setOutput('canautomerge', canAutoMergePR);
    core.setOutput('comment', prComment);
  } catch (error) {
    core.setFailed(error.message);
  }
})();

async function updateTestResultsInrubricfile(testresultfile, rubricfile, currentdetails, outputfolder, skiptestlabelapplied) {
  let passtestitems = '';
  let passList = [];
  let failedtestitems = '';
  let failList = [];
  let sourceData;
  let sourceJson;
  let canAutoMergePR = false;
  let prComment = '';
  
  //Read Test Result file
  if (skiptestlabelapplied != 'true') {
    sourceData = await fs.readFile(testresultfile);
    sourceJson = JSON.parse(sourceData);
  }

  //Read Rubric File
  let destinationData = await fs.readFile(rubricfile);
  let destinationJson = JSON.parse(destinationData);

  //Read the Learner Details
  let learnerDetailsData = await fs.readFile(currentdetails);
  let learnerDetailsJson = JSON.parse(learnerDetailsData);
  let learnerCurrentSection = learnerDetailsJson.currentSection;
  let learnerNextSection = learnerCurrentSection;
  let isChallengeComplete = false;

  let sourceSection = [];
  let currentTime = Date.now();

  destinationJson.created = currentTime;

  if (skiptestlabelapplied != 'true') {
    sourceJson.results.forEach(fileresult => {
      sourceSection.push(fileresult.fullFile.split("/").pop());
      fileresult.suites.forEach(suite => {
        suite.tests.forEach(element => {
          var nodeItem = element.title.split(":").pop(); 
          var rubricItem = destinationJson.items[nodeItem];
          if (typeof rubricItem !== "undefined") {
            rubricItem.graded_assertion = element.pass;
            rubricItem.err = element.err;
            rubricItem.Status = element.state;
          }
          if (element.pass) {
            passList.push({"id" : nodeItem, "rowId": rubricItem.rowId, "requirement": rubricItem.learner_prompt});
          } else {
            failList.push({"id" : nodeItem, "rowId": rubricItem.rowId, "requirement": rubricItem.learner_prompt, "hint": rubricItem.helptext});
          }
          if (passList.length > 0) {
            passList = passList.filter((obj, pos, arr) => {
              return arr
                .map(mapObj => mapObj.requirement)
                .indexOf(obj.requirement) == pos;
            });
          }
          if (failList.length > 0) {
            passList = passList.filter((obj, pos, arr) => {
              return arr
                .map(mapObj => mapObj.requirement)
                .indexOf(obj.requirement) == pos;
            });
          }
        });
      });
    });
    
    passList.sort(SortByRowId);
    failList.sort(SortByRowId);

    passList.forEach(item => {
      passtestitems += `* ${item.requirement} \n`;
    });

    failList.forEach(item => {
      failedtestitems += `* ${item.requirement} \nHint: *${item.hint}*\n`;
    });

    if (passtestitems !== ""){ 
      prComment = '### Following test passed.\n' + passtestitems;
    }

    if (failedtestitems !== ""){ 
      prComment = prComment + '### Following test did not pass.\n' + failedtestitems;
    }

    if (failedtestitems === ""){
      sourceSection.push(learnerCurrentSection);
      canAutoMergePR = true;
      learnerNextSection = getNextSection(learnerCurrentSection, destinationJson);
      // check if challenge is complete only if there are no faiures
      isChallengeComplete = getChallengeCompletion(learnerCurrentSection, destinationJson);
    }

  } else {
    // learner skipped tests
    sourceSection.push(learnerCurrentSection);
    learnerNextSection = getNextSection(learnerCurrentSection, destinationJson);
    if (learnerCurrentSection != learnerNextSection ) {
      canAutoMergePR = true;
    }
    isChallengeComplete = false;
    prComment = '* We detected a skip-tests label, so you are allowed to merge this branch even though it hasn\'t passed all of the tests.';
  }
  let updatedLearnerDetailsJson = JSON.stringify(updateLearnerDetailsFile(learnerDetailsJson, sourceSection, sourceJson, learnerNextSection, isChallengeComplete, skiptestlabelapplied));
  let destinationFileName = outputfolder + '/feedbackReport_' + currentTime + '.json';
  //write to destination file
  await fs.writeFile(destinationFileName, JSON.stringify(destinationJson, null, 5));
  return { passtestitems, failedtestitems, learnerNextSection, updatedLearnerDetailsJson, isChallengeComplete, canAutoMergePR, prComment };
}

//get next section
const getNextSection = (currentSection, destinationJson) => {
  let nextSection = currentSection;
  let curIndex = destinationJson.sequences.findIndex(i => i === currentSection);
  if (destinationJson.sequences.length-1 >= curIndex+1) {
    nextSection = destinationJson.sequences[curIndex+1];
  }
  return nextSection;
};

//Update Learner Details JSON

const updateLearnerDetailsFile = (learnerDetailsJson, sourceSection, sourceJson, learnerNextSection, isChallengeComplete, skiptestlabelapplied) => {
  let sectionStats = learnerDetailsJson.sectionStats;
  let newSectionStats = {};
  newSectionStats.sectionName = sourceSection;
  if (skiptestlabelapplied != 'true') {
    for (var key in sourceJson.stats) {
      if (sourceJson.stats.hasOwnProperty(key)) {
        newSectionStats[key] = sourceJson.stats[key];
      }
    }
  } else {
    newSectionStats.hasSkipped = true;
    newSectionStats.skipped = 100;
  }
  sectionStats.unshift(newSectionStats);
  learnerDetailsJson.sectionStats = sectionStats;
  learnerDetailsJson.currentSection = learnerNextSection;
  const currentTime = new Date();
  learnerDetailsJson.lastUpdatedDate = currentTime.toISOString();

  // check challenge completion and update status JSON if complete
  if (isChallengeComplete) {
    learnerDetailsJson.isChallengeComplete = true;
    learnerDetailsJson.challengeCompletedDate = currentTime.toISOString();
  }

  return learnerDetailsJson;
};

//sort by ascending id
const SortByRowId = (x,y) => {
  return x.rowId - y.rowId; 
};

const findItemById = (id, items) => {
  const key = Object.keys(items).find(item => items[item].id === id);
  return items[key];
};

// Function to check if challenge is complete or not

const getChallengeCompletion = (learnerCurrentSection, destinationJson) => {
  if (learnerCurrentSection != "" && destinationJson.sequences.indexOf(learnerCurrentSection) == (destinationJson.sequences.length - 1)) {
    return true;
  }
  return false;
};

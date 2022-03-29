# `@stripe-certification/stripe-feedbackbuilder-action`

> FeedbackBuilder: Structured logger, parser, and string builder built on rubricca to provide human-written feedback at machine-readable speeds

## Usage

<p align="center">
  <a href="https://github.com/actions/checkout"><img alt="GitHub Actions status" src="https://github.com/actions/checkout/workflows/test-local/badge.svg"></a>
</p>

# FeedbackBuilder v1.5

This action builds the structured feedback report for the learner based on rubric and test result json file.

# Usage

<!-- start usage -->
```yaml
- uses: stripe-certification/stripe-feedbackbuilder-action@v0.1.0-beta
  with:
    # The location of the rubric file that will be used to generate the output.
    # Default: 'rubric.json'
    rubricfile: ''

    # The location of the test result file in mochawesome report in json format that will be used to generate the output.
    # Default: 'stripetestresult.json'
    testresultfile: ''

    # The location of the final output file.
    # Default: '.'
    outputfolder: ''

    # Input of the current learner challenge status details. JSON Structure.
    currentlearnerchallengestatusdetails: ''

    #Input to indicate if skip-tests label is applied.
    skiptestlabelapplied: false

```
<!-- end usage -->
# Action generates following Outputs
```yaml
    # The String containg marked up list of tests that passed.
    # Default: 'rubric.json'
    passtestitems: ''

    # The String containg marked up list of tests that did not passed.
    failedtestitems: ''
    
    #Learner Challenge Status indicates the test file name that needs to be executed.
    learnerchallengestatus:

    #Learner Challenge Status details. JSON structure with all tests runs and currenct status with timestamp.
    learnerchallengestatusdetails:
    
    #Boolean Indicator if the Challenge is complete.
    challengecomplete:

    #Boolean Indicator if PR can be auto-merged.
    canAutoMergePR:
    
    #User friendly comment
    comment:
```
# License

The scripts and documentation in this project are released under the [MIT License](LICENSE)

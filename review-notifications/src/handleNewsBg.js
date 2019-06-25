/*global chrome*/
const handleDataBg = require('./handleDataBg.js');
const mainBg = require('./mainBg.js');

async function checkForDifferences() {
  await handleDataBg.getPullRequests();
  chrome.storage.local.get(
    ['createdPR', 'assignedPR', 'mentionedPR', 'reviewedPR', 'followedPR'],
    function(result) {
      checkDataFromChromeStorage(result.createdPR, 'createdPR');
      checkDataFromChromeStorage(result.assignedPR, 'assignedPR');
      checkDataFromChromeStorage(result.mentionedPR, 'mentionedPR');
      checkDataFromChromeStorage(result.reviewedPR, 'reviewedPR');
      checkDataFromChromeStorage(result.followedPR, 'followedPR');
      updateStateInStorage();
    }.bind(this)
  );
}
function checkDataFromChromeStorage(listOfPRs, stateName) {
  if (listOfPRs && listOfPRs.length > 0)
    mainBg.state[stateName].map(currPR => {
      const pr = listOfPRs.find(resPr => resPr && resPr.link === currPR.link);
      if (pr) currPR.hasNewComment = pr.hasNewComment;
      if (pr && currPR.updated !== pr.updated)
        checkForNewComments(currPR, pr.updated);
      else if (!pr) {
        //new pr
        sendNotification(
          'New pull request!',
          `There is a new pull request named ${currPR.title}.`,
          currPR.link //link as notification id
        );
      }
      let wasRequestedBefore = false;
      if (pr) {
        wasRequestedBefore = pr.requestedReviewers.find(
          reviewer => reviewer.login === mainBg.state.user
        );
      }
      const isRequestedNow = currPR.requestedReviewers.find(
        reviewer => reviewer.login === mainBg.state.user
      );
      if (!wasRequestedBefore && isRequestedNow)
        sendNotification(
          'New review request!',
          `You are requested to review a pull request ${currPR.title}.`,
          currPR.link //link as notification id
        );
    });
}

function checkForNewComments(newPR, oldPRLastUpdate) {
  newPR.commentsData.forEach(commentInfo => {
    if (commentInfo.updated_at > oldPRLastUpdate) {
      newPR.hasNewComment = true;
      const message = `${commentInfo.user.login} wrote: ${commentInfo.body}`;
      sendNotification(
        `${newPR.title} has new comment!`,
        message,
        commentInfo.html_url
      );
    }
  });
}

function sendNotification(title, message, id) {
  const opt = {
    type: 'basic',
    title: title,
    message: message,
    iconUrl: 'git-icon.png',
  };
  chrome.notifications.create(id.toString(), opt, function(id) {
    setTimeout(function() {
      chrome.notifications.clear(id.toString(), function() {});
    }, 10000);
  });
}

function updateStateInStorage(callback) {
  chrome.storage.local.set(
    {
      createdPR: mainBg.state.createdPR,
      assignedPR: mainBg.state.assignedPR,
      mentionedPR: mainBg.state.mentionedPR,
      reviewedPR: mainBg.state.reviewedPR,
      followedPR: mainBg.state.followedPR,
    },
    async () => {
      if (callback) {
        callback();
      }
    }
  );
}

exports.checkForDifferences = checkForDifferences;
exports.updateStateInStorage = updateStateInStorage;

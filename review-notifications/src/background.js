/*global chrome*/

var axios = require('axios');

const options = {
  CREATED: 'Created',
  ASSIGNED: 'Assigned',
  MENTIONED: 'Mentioned',
  REVIEW: 'Review request',
  FOLLOWED: 'From followed repositories',
};

let state = {
  haveData: false,
  user: '',
  auth: false,
  token: '',
  prOptions: [
    { id: 1, value: 'Created', isChecked: false },
    { id: 2, value: 'Assigned', isChecked: false },
    { id: 3, value: 'Mentioned', isChecked: false },
    { id: 4, value: 'Review request', isChecked: false },
    { id: 5, value: 'From followed repositories', isChecked: false },
  ],
  followedRepos: [],
  createdPR: [],
  assignedPR: [],
  mentionedPR: [],
  reviewedPR: [],
  followedPR: [],
};

chrome.runtime.onInstalled.addListener(function() {
  chrome.notifications.onClicked.addListener(function(htmlUrl) {
    chrome.tabs.create({ url: htmlUrl });
  });
  onStart();
});

chrome.runtime.onMessage.addListener(async request => {
  if (request.message === 'Changed options') {
    processOptionsChanges();
  }
});

chrome.runtime.onMessage.addListener(async request => {
  if (request.message === 'Changed followed repositories') {
    processFollowedChanges();
  }
});

function onStart() {
  chrome.storage.local.get(
    ['username', 'auth', 'token', 'prTypes', 'followedRepos'],
    function(result) {
      state.user = result.username ? result.username : state.user;
      state.auth = result.auth ? result.auth : state.auth;
      state.token = result.token ? result.token : state.token;
      state.prOptions = result.prTypes ? result.prTypes : state.prOptions;
      state.followedRepos = result.followedRepos
        ? result.followedRepos
        : state.followedRepos;

      startTimer();
    }
  );
}

function startTimer() {
  setTimeout(async function run() {
    getPRFromFollowedRepos();
    await checkForDifferences();
    setTimeout(run, 6000);
  }, 6000);
}

function processOptionsChanges() {
  chrome.runtime.sendMessage({
    message: 'Fetching pull requests',
  });
  chrome.storage.local.set(
    {
      fetchingPullRequests: true,
    },
    async function() {
      const prevFollowedChecked = state.prOptions.find(
        option => option.value === options.FOLLOWED
      ).isChecked;
      chrome.storage.local.get(
        ['username', 'auth', 'token', 'prTypes'],
        function(result) {
          state.user = result.username ? result.username : state.user;
          state.auth = result.auth ? result.auth : state.auth;
          state.token = result.token ? result.token : state.token;
          state.prOptions = result.prTypes ? result.prTypes : state.prOptions;
          const currentFollowedChecked = state.prOptions.find(
            option => option.value === options.FOLLOWED
          ).isChecked;
          if (prevFollowedChecked !== currentFollowedChecked) {
            processFollowedChanges();
          }
        }
      );
      await getPullRequests();
      updateStateInStorage(() => {
        chrome.runtime.sendMessage({
          message: 'Pull requests fetched',
        });
        chrome.storage.local.set({
          fetchingPullRequests: false,
        });
      });
    }
  );
}

function processFollowedChanges() {
  chrome.runtime.sendMessage({
    message: 'Fetching followed repos',
  });
  chrome.storage.local.set(
    {
      fetchingFollowedRepos: true,
    },
    async function() {
      await chrome.storage.local.get(['followedRepos'], async function(result) {
        state.followedRepos = result.followedRepos
          ? result.followedRepos
          : state.followedRepos;
        await getPRFromFollowedRepos();

        updateStateInStorage(() => {
          chrome.runtime.sendMessage({
            message: 'Followed repos fetched',
          });
          chrome.storage.local.set({
            fetchingFollowedRepos: false,
          });
        });
      });
    }
  );
}

function addPRToList(prList, newPR) {
  prList.push({
    link: newPR.link,
    title: newPR.title,
    updated: newPR.updated,
    commentsData: newPR.commentsData,
    requestedReviewers: newPR.requestedReviewers,
    hasNewComment: newPR.hasNewComment,
  });
}

async function extractPullRequests(prLinksList) {
  try {
    const pullRequests = await axios.all(
      prLinksList.map(prLink =>
        axios.get(`${prLink}?access_token=${state.token}`)
      )
    );
    const prData = await Promise.all(
      pullRequests.map(
        async prList =>
          await Promise.all(
            prList.data.map(
              async pullRequest => await extractDataFromPR(pullRequest)
            )
          )
      )
    );
    return prData;
  } catch (error) {
    console.log(error);
  }
}

async function findMentioned(commentsUrl) {
  try {
    const response = await axios.get(
      `${commentsUrl}?access_token=${state.token}`
    );
    const mentionedLists = response.data.map(comment =>
      comment.body.match(/@[a-zA-Z]*/g)
    );
    const mentionedUsers = [];
    mentionedLists.forEach(list =>
      mentionedUsers.push(
        ...(list !== null ? list.map(user => user.replace('@', '')) : [])
      )
    );
    return [].concat.apply([], mentionedUsers);
  } catch (error) {
    console.log(error);
  }
}

async function extractDataFromPR(prObject) {
  try {
    const mentionedUsers = await findMentioned(prObject.comments_url);
    const reviewComments = await extractComments(prObject.review_comments_url);
    const prComments = await extractComments(prObject.comments_url);
    const comments = [...reviewComments.data.flat(), ...prComments.data.flat()];
    comments.sort(function(a, b) {
      return new Date(a.updated_at) - new Date(b.updated_at);
    });
    return {
      link: prObject.html_url,
      id: prObject.id,
      title: prObject.title,
      updated: prObject.updated_at,
      creator: prObject.user.login,
      assignees: prObject.assignees.map(assigner => assigner.login),
      reviewers: prObject.requested_reviewers.map(rev => rev.login),
      mentioned: mentionedUsers ? mentionedUsers : [],
      commentsData: comments ? comments : [],
      requestedReviewers: prObject.requested_reviewers,
      hasNewComment: false, //default false
    };
  } catch (error) {
    console.log(error);
  }
}

function filterPullRequests(prData) {
  const createdPR = [];
  const assignedPR = [];
  const mentionedPR = [];
  const reviewedPR = [];
  [].concat.apply([], prData).forEach(prObject => {
    if (prObject.creator === state.user) {
      addPRToList(createdPR, prObject);
    }
    prObject.assignees.forEach(assigner => {
      if (assigner === state.user) addPRToList(assignedPR, prObject);
    });
    prObject.mentioned.forEach(mentionedUser => {
      if (mentionedUser === state.user) addPRToList(mentionedPR, prObject);
    });
    prObject.reviewers.forEach(reviewer => {
      if (reviewer === state.user) addPRToList(reviewedPR, prObject);
    });
  });
  state.createdPR = createdPR;
  state.assignedPR = assignedPR;
  state.mentionedPR = mentionedPR;
  state.reviewedPR = reviewedPR;
}

async function checkForDifferences() {
  await getPullRequests();
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
    state[stateName].map(currPR => {
      const pr = listOfPRs.find(resPr => resPr.link === currPR.link);
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
          reviewer => reviewer.login === state.user
        );
      }
      const isRequestedNow = currPR.requestedReviewers.find(
        reviewer => reviewer.login === state.user
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

async function getPullRequests() {
  let query = '';
  if (state.user !== '')
    query = `https://api.github.com/users/${state.user}/repos`;
  if (state.token !== '' && state.auth) {
    query = `https://api.github.com/user/repos?access_token=${state.token}`;
  }
  if (query) {
    let prLinksList = [];
    try {
      const response = await axios.get(query);
      prLinksList = response.data.map(repo =>
        repo.pulls_url.replace('{/number}', '')
      );
    } catch (error) {
      console.log(error);
    }
    try {
      const prData = await extractPullRequests(prLinksList);
      filterPullRequests(prData);
      state.haveData = true;
    } catch (error) {
      console.log(error);
    }
  }
}

function updateStateInStorage(callback) {
  chrome.storage.local.set(
    {
      createdPR: state.createdPR,
      assignedPR: state.assignedPR,
      mentionedPR: state.mentionedPR,
      reviewedPR: state.reviewedPR,
      followedPR: state.followedPR,
    },
    async () => {
      if (callback) {
        callback();
      }
    }
  );
}

async function extractComments(url) {
  try {
    return await axios.get(`${url}?access_token=${state.token}`);
  } catch (error) {
    console.log(error);
  }
}

async function getPRFromFollowedRepos() {
  const fromFollowedRepoOpt = state.prOptions.find(
    option => option.value === options.FOLLOWED && option.isChecked === true
  );
  if (fromFollowedRepoOpt) {
    try {
      const prData = await extractPullRequests(
        state.followedRepos.map(pr => pr.prLink)
      );
      state.followedPR = [].concat.apply([], prData);
    } catch (error) {
      console.log(error);
    }
  }
}

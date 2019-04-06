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
  onStart();
});

chrome.runtime.onMessage.addListener(request => {
  if (request.message === 'Changed followed repositories') {
    chrome.storage.local.get(['followedRepos'], function(result) {
      state.followedRepos = result.followedRepos
        ? result.followedRepos
        : state.followedRepos;
      getPRFromFollowedRepos();
    });
  }
});

chrome.runtime.onMessage.addListener(request => {
  if (request.message === 'Changed options') {
    chrome.storage.local.get(['username', 'auth', 'token', 'prTypes'], function(
      result
    ) {
      state.user = result.username ? result.username : state.user;
      state.auth = result.auth ? result.auth : state.auth;
      state.token = result.token ? result.token : state.token;
      state.prOptions = result.prTypes ? result.prTypes : state.prOptions;
    });
    getPullRequests();
    updateStateInStorage();
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
  setInterval(() => {
    getPRFromFollowedRepos();
    checkForDiffrences();
  }, 10000);
}

function addPRToList(prList, newPR) {
  prList.push({
    link: newPR.link,
    title: newPR.title,
    updated: newPR.updated,
    commentsData: newPR.commentsData,
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
    const comments = await extractComments(prObject);
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

function checkForDiffrences() {
  chrome.storage.local.get(
    ['createdPR'],
    function(result) {
      if (state !== undefined && result.createdPR.length > 0)
        state.createdPR.map(currCreatedPR => {
          const pr = result.createdPR.filter(
            resPr => resPr.link === currCreatedPR.link
          );
          if (currCreatedPR.updated !== pr[0].updated)
            findChanges(currCreatedPR, pr[0]);
        });
    }.bind(this)
  );
  updateStateInStorage();
  getPullRequests();
}

function findChanges(newPR) {
  const opt = {
    type: 'basic',
    title: 'Notification',
    message: `${newPR.title} has changed!`,
    iconUrl: 'git-icon.png',
  };

  chrome.notifications.create(opt);
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

function updateStateInStorage() {
  chrome.storage.local.set({
    createdPR: state.createdPR,
    assignedPR: state.assignedPR,
    mentionedPR: state.mentionedPR,
    reviewedPR: state.reviewedPR,
    followedPR: state.followedPR,
  });
}

async function extractComments(prObject) {
  try {
    let commentsList = await axios.get(
      `${prObject.review_comments_url}?access_token=${state.token}`
    );
    return commentsList;
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

/*global chrome*/
const handleDataBg = require('./handleDataBg.js');
const handleNewsBg = require('./handleNewsBg.js');
const handleChangesBg = require('./handleChangesBg.js');

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
    { id: 1, value: options.CREATED, isChecked: false },
    { id: 2, value: options.ASSIGNED, isChecked: false },
    { id: 3, value: options.MENTIONED, isChecked: false },
    { id: 4, value: options.REVIEW, isChecked: false },
    { id: 5, value: options.FOLLOWED, isChecked: false },
  ],
  followedRepos: [],
  createdPR: [],
  assignedPR: [],
  mentionedPR: [],
  reviewedPR: [],
  followedPR: [],
};

exports.state = state;
exports.options = options;

chrome.runtime.onInstalled.addListener(function() {
  onStart();
});

chrome.runtime.onMessage.addListener(async request => {
  if (request.message === 'Changed options') {
    handleChangesBg.processOptionsChanges();
  }
});

chrome.runtime.onMessage.addListener(async request => {
  if (request.message === 'Changed followed repositories') {
    handleChangesBg.processFollowedChanges();
  }
});

chrome.runtime.onRestartRequired.addListener(onStart());

function onStart() {
  chrome.notifications.onClicked.addListener(function(htmlUrl) {
    chrome.tabs.create({ url: htmlUrl });
  });
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
    handleDataBg.getPRFromFollowedRepos();
    await handleNewsBg.checkForDifferences();
    setTimeout(run, 6000);
  }, 6000);
}

/*global chrome*/
const handleDataBg = require('./handleDataBg.js');
const handleNewsBg = require('./handleNewsBg.js');
const mainBg = require('./mainBg.js');

function processOptionsChanges() {
  chrome.runtime.sendMessage({
    message: 'Fetching pull requests',
  });
  chrome.storage.local.set(
    {
      fetchingPullRequests: true,
    },
    async function() {
      const prevFollowedChecked = mainBg.state.prOptions.find(
        option => option.value === mainBg.options.FOLLOWED
      ).isChecked;
      chrome.storage.local.get(
        ['username', 'auth', 'token', 'prTypes'],
        function(result) {
          mainBg.state.user = result.username
            ? result.username
            : mainBg.state.user;
          mainBg.state.auth = result.auth ? result.auth : mainBg.state.auth;
          mainBg.state.token = result.token ? result.token : mainBg.state.token;
          mainBg.state.prOptions = result.prTypes
            ? result.prTypes
            : mainBg.state.prOptions;
          const currentFollowedChecked = mainBg.state.prOptions.find(
            option => option.value === mainBg.options.FOLLOWED
          ).isChecked;
          if (prevFollowedChecked !== currentFollowedChecked) {
            processFollowedChanges();
          }
        }
      );
      await handleDataBg.getPullRequests();
      handleNewsBg.updateStateInStorage(() => {
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
        mainBg.state.followedRepos = result.followedRepos
          ? result.followedRepos
          : mainBg.state.followedRepos;
        await handleDataBg.getPRFromFollowedRepos();

        handleNewsBg.updateStateInStorage(() => {
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

exports.processOptionsChanges = processOptionsChanges;

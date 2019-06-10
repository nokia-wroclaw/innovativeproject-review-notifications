var axios = require('axios');
const mainBg = require('./mainBg.js');

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
        axios.get(`${prLink}?access_token=${mainBg.state.token}`)
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
      `${commentsUrl}?access_token=${mainBg.state.token}`
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
    if (prObject.creator === mainBg.state.user) {
      addPRToList(createdPR, prObject);
    }
    prObject.assignees.forEach(assigner => {
      if (assigner === mainBg.state.user) addPRToList(assignedPR, prObject);
    });
    prObject.mentioned.forEach(mentionedUser => {
      if (mentionedUser === mainBg.state.user)
        addPRToList(mentionedPR, prObject);
    });
    prObject.reviewers.forEach(reviewer => {
      if (reviewer === mainBg.state.user) addPRToList(reviewedPR, prObject);
    });
  });
  mainBg.state.createdPR = createdPR;
  mainBg.state.assignedPR = assignedPR;
  mainBg.state.mentionedPR = mentionedPR;
  mainBg.state.reviewedPR = reviewedPR;
}

async function getPullRequests() {
  let query = '';
  if (mainBg.state.user !== '')
    query = `https://api.github.com/users/${mainBg.state.user}/repos`;
  if (mainBg.state.token !== '' && mainBg.state.auth) {
    query = `https://api.github.com/user/repos?access_token=${
      mainBg.state.token
    }`;
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
      mainBg.state.haveData = true;
    } catch (error) {
      console.log(error);
    }
  }
}

async function extractComments(url) {
  try {
    return await axios.get(`${url}?access_token=${mainBg.state.token}`);
  } catch (error) {
    console.log(error);
  }
}

async function getPRFromFollowedRepos() {
  const fromFollowedRepoOpt = mainBg.state.prOptions.find(
    option =>
      option.value === mainBg.options.FOLLOWED && option.isChecked === true
  );
  if (fromFollowedRepoOpt) {
    try {
      const prData = await extractPullRequests(
        mainBg.state.followedRepos.map(pr => pr.prLink)
      );
      mainBg.state.followedPR = [].concat.apply([], prData);
    } catch (error) {
      console.log(error);
    }
  }
}

exports.getPullRequests = getPullRequests;
exports.getPRFromFollowedRepos = getPRFromFollowedRepos;

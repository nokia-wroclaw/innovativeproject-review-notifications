/*global chrome*/

import React, { Component } from 'react';
import axios from 'axios';
import { initialState } from './Options';

class Github extends Component {
  constructor(props) {
    super(props);
    this.state = {
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
    this.getPullRequests = this.getPullRequests.bind(this);
    this.getPRFromFollowedRepos = this.getPRFromFollowedRepos.bind(this);
  }

  componentDidMount() {
    chrome.storage.local.get(
      ['username', 'auth', 'token', 'prTypes', 'followedRepos'],
      function(result) {
        this.setState(
          {
            user: result.username ? result.username : initialState.user,
            auth: result.auth ? result.auth : initialState.auth,
            token: result.token ? result.token : initialState.token,
            prOptions: result.prTypes ? result.prTypes : initialState.prTypes,
            followedRepos: result.followedRepos
              ? result.followedRepos
              : initialState.followedRepos,
          },
          () => {
            this.getPRFromFollowedRepos();
            this.getPullRequests();
            this.startTimer();

            // this.rememberState();
            // this.startTimer();
            // this.checkForDiffrences();
          }
        );
      }.bind(this)
    );
  }

  componentWillUnmount() {
    clearInterval(this.timer);
  }

  startTimer() {
    this.timer = setInterval(() => {
      this.checkForDiffrences();
      this.getPRFromFollowedRepos();
    }, 2000);
  }

  addPRToList(prList, newPR) {
    prList.push({
      link: newPR.link,
      title: newPR.title,
      updated: newPR.updated,
      comments: newPR.comments_data,
    });
  }

  async extractPullRequests(prLinksList) {
    try {
      const pullRequests = await axios.all(
        prLinksList.map(prLink =>
          axios.get(`${prLink}?access_token=${this.state.token}`)
        )
      );
      const prData = await Promise.all(
        pullRequests.map(
          async prList =>
            await Promise.all(
              prList.data.map(
                async pullRequest => await this.extractDataFromPR(pullRequest)
              )
            )
        )
      );
      return prData;
    } catch (error) {
      console.log(error);
    }
  }

  async findMentioned(commentsUrl) {
    try {
      const response = await axios.get(
        `${commentsUrl}?access_token=${this.state.token}`
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

  async extractDataFromPR(prObject) {
    try {
      const mentionedUsers = await this.findMentioned(prObject.comments_url);
      const comments = await this.extractComments(prObject);
      console.log(comments);
      return {
        link: prObject.html_url,
        id: prObject.id,
        title: prObject.title,
        updated: prObject.updated_at,
        creator: prObject.user.login,
        assignees: prObject.assignees.map(assigner => assigner.login),
        reviewers: prObject.requested_reviewers.map(rev => rev.login),
        mentioned: mentionedUsers ? mentionedUsers : [],
        comments_data: comments ? comments : [],
      };
    } catch (error) {
      console.log(error);
    }
  }

  filterPullRequests(prData) {
    const createdPR = [];
    const assignedPR = [];
    const mentionedPR = [];
    const reviewedPR = [];
    [].concat.apply([], prData).forEach(prObject => {
      if (prObject.creator === this.state.user) {
        this.addPRToList(createdPR, prObject);
      }
      prObject.assignees.forEach(assigner => {
        if (assigner === this.state.user)
          this.addPRToList(assignedPR, prObject);
      });
      prObject.mentioned.forEach(mentionedUser => {
        if (mentionedUser === this.state.user)
          this.addPRToList(mentionedPR, prObject);
      });
      prObject.reviewers.forEach(reviewer => {
        if (reviewer === this.state.user)
          this.addPRToList(reviewedPR, prObject);
      });
    });
    this.setState({
      createdPR: createdPR,
      assignedPR: assignedPR,
      mentionedPR: mentionedPR,
      reviewedPR: reviewedPR,
    });
  }

  checkForDiffrences() {
    const state = this.state;
    chrome.storage.local.get(
      ['createdPR'],
      function(result) {
        if (typeof state !== 'undefined' && result.createdPR.length > 0)
          state.createdPR.map(currCreatedPR => {
            const pr = result.createdPR.filter(
              resPr => resPr.link == currCreatedPR.link
            );
            if (currCreatedPR.updated != pr[0].updated)
              this.findChanges(currCreatedPR, pr[0]);
          });
      }.bind(this)
    );
    this.rememberState();
    this.getPullRequests();
  }

  findChanges(newPR, oldPR) {
    var opt = {
      type: 'basic',
      title: 'Notification',
      message: `${newPR.title} has changed!`,
      iconUrl: 'git-icon.png',
    };

    chrome.notifications.create(opt);
  }

  async getPullRequests() {
    let query = `https://api.github.com/users/${this.state.user}/repos`;
    if (this.state.token !== '' && this.state.auth) {
      query = `https://api.github.com/user/repos?access_token=${
        this.state.token
      }`;
    }
    let prLinksList = [];
    try {
      const response = await axios.get(query);
      prLinksList = response.data.map(repo =>
        repo.pulls_url.replace('{/number}', '')
      );
    } catch (error) {
      console.log(error);
    }

    const prData = await this.extractPullRequests(prLinksList);
    this.filterPullRequests(prData);
    this.setState({ haveData: true });
  }

  rememberState() {
    chrome.storage.local.set({
      createdPR: this.state.createdPR,
      assignedPR: this.state.assignedPR,
      mentionedPR: this.state.mentionedPR,
      reviewedPR: this.state.reviewedPR,
    });
  }

  async extractComments(prObject) {
    try {
      let comments_list = await axios.get(
        `${prObject.review_comments_url}?access_token=${this.state.token}`
      );
      return comments_list;
    } catch (error) {
      console.log(error);
    }
  }

  async getPRFromFollowedRepos() {
    const fromFollowedRepoOpt = this.state.prOptions.find(
      option =>
        option.value === 'From followed repositories' &&
        option.isChecked === true
    );
    if (fromFollowedRepoOpt) {
      try {
        const prData = await this.extractPullRequests(
          this.state.followedRepos.map(pr => pr.prLink)
        );
        this.setState({ followedPR: [].concat.apply([], prData) });
      } catch (error) {
        console.log(error);
      }
    }
  }

  listOfPullRequests() {
    let list = [];
    this.state.prOptions.forEach(option => {
      if (option.isChecked)
        switch (option.value) {
          case 'Created':
            list.push(...this.state.createdPR);
            break;
          case 'Assigned':
            list.push(...this.state.assignedPR);
            break;
          case 'Mentioned':
            list.push(...this.state.mentionedPR);
            break;
          case 'Review request':
            list.push(...this.state.reviewedPR);
            break;
          case 'From followed repositories':
            break;
          default:
            throw new Error('Value do not match any option.');
        }
    });
    return (
      <>
        <p>User related pull requests:</p>
        <ul>
          {[...new Set(list)].map(pr => (
            <li key={pr.id}>
              <a href={pr.link} target="_blank" rel="noopener noreferrer">
                {pr.title}
              </a>
              <p>last update: {pr.updated}</p>
              <p> {this.listComments(pr)} </p>
            </li>
          ))}
        </ul>
      </>
    );
  }

  listComments(prObject) {
    if (prObject.comments.data.length > 0) {
      return prObject.comments.data[0].body;
    } else return 'There is no comments';
  }

  listOfFollowedPullRequests() {
    return (
      <>
        <p>Pull requests from followed repositories:</p>
        <ul>
          {this.state.followedPR.map(pr => (
            <li key={pr.id}>
              <a href={pr.link} target="_blank" rel="noopener noreferrer">
                {pr.title}
              </a>
              <p>last update: {pr.updated}</p>
            </li>
          ))}
        </ul>
      </>
    );
  }

  render() {
    let communicate;
    if (!this.state.haveData) {
      communicate = <p>Loading...</p>;
    } else if (this.state.token == '' || !this.state.auth) {
      communicate = <p>Add token to display more pull requests</p>;
    } else {
      communicate = <p />;
    }
    return (
      <div>
        <p>{communicate}</p>
        {this.listOfPullRequests()}
        {this.listOfFollowedPullRequests()}
      </div>
    );
  }
}

export { Github };

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
      ],
      createdPR: [],
      assignedPR: [],
      mentionedPR: [],
      reviewedPR: [],
    };
    this.getPullRequests = this.getPullRequests.bind(this);
  }

  componentDidMount() {
    chrome.storage.local.get(
      ['username', 'auth', 'token', 'prTypes', 'reposLinks'],
      function(result) {
        this.setState(
          {
            user: result.username ? result.username : initialState.user,
            auth: result.auth ? result.auth : initialState.auth,
            token: result.token ? result.token : initialState.token,
            prOptions: result.prTypes ? result.prTypes : initialState.prTypes,
          },
          () => {
            this.getPullRequests();
            this.startTimer();
          }
        );
      }.bind(this)
    );
  }

  componentWillUnmount() {
    clearInterval(this.timer);
  }

  startTimer() {
    this.timer = setInterval(() => this.getPullRequests(), 60000);
  }

  addPRToList(prList, newPR) {
    prList.push({
      link: newPR.link,
      title: newPR.title,
      updated: newPR.updated,
    });
  }

  async findMentioned(commentsUrl) {
    let response;
    try {
      response = await axios.get(
        `${commentsUrl}?access_token=${this.state.token}`
      );
      let mentionedLists = response.data.map(comment =>
        comment.body.match(/@[a-zA-Z]*/g)
      );
      let mentionedUsers = [];
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
    let mentionedUsers;
    try {
      mentionedUsers = await this.findMentioned(prObject.comments_url);
      return {
        link: prObject.html_url,
        id: prObject.id,
        title: prObject.title,
        updated: prObject.updated_at,
        creator: prObject.user.login,
        assignees: prObject.assignees.map(assigner => assigner.login),
        reviewers: prObject.requested_reviewers.map(rev => rev.login),
        mentioned: mentionedUsers ? mentionedUsers : [],
      };
    } catch (error) {
      console.log(error);
    }
  }

  filterPullRequests(prData) {
    let createdPR = [];
    let assignedPR = [];
    let mentionedPR = [];
    let reviewedPR = [];
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
      this.filterPullRequests(prData);
      this.setState({ haveData: true });
    } catch (error) {
      console.log(error);
    }
  }

  listOfPullRequest() {
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
        }
    });
    return (
      <ul>
        {[...new Set(list)].map(pr => (
          <li key={pr.id}>
            <a href={pr.link} target="_blank" rel="noopener noreferrer">
              {pr.title}
            </a>
            <p>last update: {pr.updated}</p>
          </li>
        ))}
      </ul>
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
        {this.listOfPullRequest()}
      </div>
    );
  }
}

export { Github };

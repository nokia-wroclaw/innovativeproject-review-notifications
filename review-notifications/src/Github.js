/*global chrome*/

import React, { Component } from 'react';
import axios from 'axios';

class Github extends Component {
  constructor(props) {
    super(props);
    this.state = {
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
      repoPulls: [],
      pulls: [],
    };
    this.getPullRequests = this.getPullRequests.bind(this);
  }

  componentDidMount() {
    chrome.storage.local.get(
      ['username', 'auth', 'token', 'prTypes', 'reposLinks'],
      function(result) {
        this.setState(
          {
            user: result.username,
            auth: result.auth,
            token: result.token,
            prOptions: result.prTypes,
          },
          () => {
            if (this.state.token !== '' && this.state.auth) {
              this.getPullRequests();
              this.startTimer();
            } else {
              this.error = 'Token not provided';
            }
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

  extractDataFromPR(prObject) {
    return {
      link: prObject.html_url,
      id: prObject.id,
      title: prObject.title,
      updated: prObject.updated_at,
      creator: prObject.user.login,
      assignees: prObject.assignees.map(assigner => assigner.login),
      reviewers: prObject.requested_reviewers.map(rev => rev.login),
    };
  }

  filterPullRequests(prData) {
    let createdPR = [];
    let assignedPR = [];
    let reviewedPR = [];
    [].concat.apply([], prData).forEach(prObject => {
      if (prObject.creator === this.state.user) {
        this.addPRToList(createdPR, prObject);
      }
      prObject.assignees.forEach(assigner => {
        if (assigner === this.state.user)
          this.addPRToList(assignedPR, prObject);
      });
      prObject.reviewers.forEach(reviewer => {
        if (reviewer === this.state.user)
          this.addPRToList(reviewedPR, prObject);
      });
    });
    this.setState({
      createdPR: createdPR,
      assignedPR: assignedPR,
      reviewedPR: reviewedPR,
    });
  }

  async getPullRequests() {
    const query = `https://api.github.com/user/repos?access_token=${
      this.state.token
    }`;
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
      const prData = pullRequests.map(prList =>
        prList.data.map(pullRequest => this.extractDataFromPR(pullRequest))
      );
      this.filterPullRequests(prData);
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
    return (
      <div>
        <div>{this.listOfPullRequest()}</div>
      </div>
    );
  }
}

export { Github };

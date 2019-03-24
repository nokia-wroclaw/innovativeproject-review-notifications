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

  getPullRequests() {
    const query = `https://api.github.com/user/repos?access_token=${
      this.state.token
    }`;
    axios
      .get(query)
      .then(response => {
        return response.data.map(repo =>
          repo.pulls_url.replace('{/number}', '')
        );
      })
      .catch(error => {
        console.log(error);
      })
      .then(prLinksList => {
        axios
          .all(
            prLinksList.map(prLink =>
              axios.get(`${prLink}?access_token=${this.state.token}`)
            )
          )
          .then(results => {
            return results.map(prList =>
              prList.data.map(pullRequest => ({
                link: pullRequest.html_url,
                id: pullRequest.id,
                title: pullRequest.title,
                updated: pullRequest.updated_at,
                creator: pullRequest.user.login,
                assignees: pullRequest.assignees.map(
                  assigner => assigner.login
                ),
                reviewers: pullRequest.requested_reviewers.map(
                  rev => rev.login
                ),
              }))
            );
          })
          .then(results => {
            let createdPR = [];
            let assignedPR = [];
            let reviewedPR = [];
            [].concat.apply([], results).forEach(prObject => {
              if (prObject.creator === this.state.user) {
                createdPR.push({
                  link: prObject.link,
                  title: prObject.title,
                  updated: prObject.updated,
                });
              }
              prObject.assignees.forEach(assigner => {
                if (assigner === this.state.user)
                  assignedPR.push({
                    link: prObject.link,
                    title: prObject.title,
                    updated: prObject.updated,
                  });
              });
              prObject.reviewers.forEach(reviewer => {
                if (reviewer === this.state.user)
                  reviewedPR.push({
                    link: prObject.link,
                    title: prObject.title,
                    updated: prObject.updated,
                  });
              });
            });
            this.setState({
              createdPR: createdPR,
              assignedPR: assignedPR,
              reviewedPR: reviewedPR,
            });
          });
      })
      .catch(error => {
        console.log(error);
      });
  }

  listOfPullRequest() {
    let list = [];
    this.state.prOptions.forEach(option => {
      if (option.value === 'Created' && option.isChecked)
        list.push(...this.state.createdPR);
      else if (option.value === 'Assigned' && option.isChecked)
        list.push(...this.state.assignedPR);
      else if (option.value === 'Mentioned' && option.isChecked)
        list.push(...this.state.mentionedPR);
      else if (option.value === 'Review request' && option.isChecked)
        list.push(...this.state.reviewedPR);
    });
    return (
      <ul>
        {[...new Set(list)].map(pr => (
          <li key={pr.id}>
            <a href={pr.link} target="_blank">
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

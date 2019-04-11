/*global chrome*/

import React, { Component } from 'react';
import { initialState } from './Options';

const options = {
  CREATED: 'Created',
  ASSIGNED: 'Assigned',
  MENTIONED: 'Mentioned',
  REVIEW: 'Review request',
  FOLLOWED: 'From followed repositories',
};

class Github extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasData: false,
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
      createdPR: [],
      assignedPR: [],
      mentionedPR: [],
      reviewedPR: [],
      followedPR: [],
    };
  }

  componentDidMount() {
    this.getDataFromChromeStorage();
  }

  getDataFromChromeStorage() {
    chrome.storage.local.get(
      [
        'username',
        'auth',
        'token',
        'prTypes',
        'followedPR',
        'createdPR',
        'assignedPR',
        'mentionedPR',
        'reviewedPR',
      ],
      function(result) {
        this.setState(
          {
            user: result.username ? result.username : initialState.user,
            auth: result.auth ? result.auth : initialState.auth,
            token: result.token ? result.token : initialState.token,
            prOptions: result.prTypes ? result.prTypes : initialState.prTypes,
            followedPR: result.followedPR ? result.followedPR : [],
            createdPR: result.createdPR ? result.createdPR : [],
            assignedPR: result.assignedPR ? result.assignedPR : [],
            mentionedPR: result.mentionedPR ? result.mentionedPR : [],
            reviewedPR: result.reviewedPR ? result.reviewedPR : [],
            hasData: true,
          },
          () => {
            this.listOfPullRequests();
          }
        );
      }.bind(this)
    );
  }

  listOfPullRequests() {
    let list = [];
    this.state.prOptions.forEach(option => {
      if (option.isChecked)
        switch (option.value) {
          case options.CREATED:
            list.push(...this.state.createdPR);
            break;
          case options.ASSIGNED:
            list.push(...this.state.assignedPR);
            break;
          case options.MENTIONED:
            list.push(...this.state.mentionedPR);
            break;
          case options.REVIEW:
            list.push(...this.state.reviewedPR);
            break;
          case options.FOLLOWED:
            break;
          default:
            throw new Error('Value do not match any option.');
        }
    });
    if (list.length > 0) {
      return (
        <>
          <p>User related pull requests:</p>
          <ul>
            {this.removeDuplicates(list).map(pr => (
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
  }

  removeDuplicates(list) {
    const setFromList = new Set();
    list.forEach(item => setFromList.add(item));
    return Array.from(setFromList);
  }

  listOfFollowedPullRequests() {
    if (
      this.state.followedPR.length > 0 &&
      this.state.prOptions.find(
        option => option.value === options.FOLLOWED && option.isChecked === true
      )
    ) {
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
                <p>comments: {this.listComments(pr)}</p>
              </li>
            ))}
          </ul>
        </>
      );
    } else
      return (
        <p>
          You do not have any followed repositories or option to display them is
          not checked.
        </p>
      );
  }

  listComments(prObject) {
    console.log(prObject);
    if (prObject.commentsData.length > 0) {
      // const commDataLen = prObject.commentsData.length;
      const length = prObject.commentsData.length;
      if (length > 0) {
        return prObject.commentsData[length - 1].body;
      }
    }
    return 'There are no comments';
  }

  render() {
    let prompt = <p />;
    if (!this.state.hasData) {
      prompt = <p>Loading...</p>;
    } else if (this.state.user === '') {
      prompt = <p>Add your username to display more pull requests</p>;
    } else if (this.state.token === '' || !this.state.auth) {
      prompt = <p>Add token to display more pull requests</p>;
    }
    return (
      <div>
        {prompt}
        {this.listOfPullRequests()}
        {this.listOfFollowedPullRequests()}
      </div>
    );
  }
}

export { Github };

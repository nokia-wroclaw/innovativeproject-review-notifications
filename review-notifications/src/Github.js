/*global chrome*/

import React, { Component } from 'react';
import { initialState } from './Options';

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
    console.log(this.state);
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

  removeDuplicates(list) {
    let setFromList = new Set();
    list.forEach(item => setFromList.add(item));
    return Array.from(setFromList);
  }

  listOfFollowedPullRequests() {
    if (this.state.followedPR !== []) {
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
    } else return <p> You do not have any followed repositories.</p>;
  }

  listComments(prObject) {
    if (prObject.commentsData.data.length > 0) {
      return prObject.commentsData.data[0].body;
    } else return 'There is no comments';
  }

  render() {
    if (this.state.user !== '') {
      let prompt;
      if (!this.state.hasData) {
        prompt = <p>Loading...</p>;
      } else if (this.state.token === '' || !this.state.auth) {
        prompt = <p>Add token to display more pull requests</p>;
      } else {
        prompt = <p />;
      }
      return (
        <div>
          <p>{prompt}</p>
          {this.listOfPullRequests()}
          {this.listOfFollowedPullRequests()}
        </div>
      );
    } else return <div>Add your username in options</div>;
  }
}

export { Github };

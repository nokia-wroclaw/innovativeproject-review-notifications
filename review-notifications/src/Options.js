/*global chrome*/

import React, { Component } from 'react';
import axios from 'axios';
import './App.css';

export const initialState = {
  user: '',
  auth: false,
  token: '',
  newRepo: '',
  prTypes: [
    { id: 1, value: 'Created', isChecked: false },
    { id: 2, value: 'Assigned', isChecked: false },
    { id: 3, value: 'Mentioned', isChecked: false },
    { id: 4, value: 'Review request', isChecked: false },
    { id: 5, value: 'From followed repositories', isChecked: false },
  ],
  followedRepos: [],
};

class Options extends Component {
  constructor(props) {
    super(props);
    this.state = {
      user: '',
      auth: false,
      token: '',
      newRepo: '',
      followedRepos: [],
      prTypes: [],
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleChangeRepository = this.handleChangeRepository.bind(this);
    this.handleAddRepository = this.handleAddRepository.bind(this);
  }

  componentDidMount() {
    chrome.storage.local.get(
      ['username', 'auth', 'token', 'prTypes', 'followedRepos'],
      function(result) {
        this.setState({
          user: result.username ? result.username : initialState.user,
          auth: result.auth ? result.auth : initialState.auth,
          token: result.token ? result.token : initialState.token,
          prTypes: result.prTypes ? result.prTypes : initialState.prTypes,
          followedRepos: result.followedRepos
            ? result.followedRepos
            : initialState.followedRepos,
        });
      }.bind(this)
    );
  }

  handleChange(key, event) {
    this.setState({
      [key]:
        event.target.type === 'checkbox'
          ? event.target.checked
          : event.target.value,
    });
  }

  handleSubmit(event) {
    event.preventDefault();
    chrome.storage.local.set({
      username: this.state.user,
      auth: this.state.auth,
      token: this.state.token,
      prTypes: this.state.prTypes,
    });
    chrome.runtime.sendMessage({
      message: 'Changed options',
    });
  }

  handleInputChange(event) {
    const newState = this.state.prTypes.map(option => {
      if (option.value === event.target.value)
        option.isChecked = event.target.checked;
      return option;
    });
    this.setState({ prTypes: newState });
  }

  checkboxList() {
    const checkboxList = this.state.prTypes.map(option => (
      <li key={option.id}>
        <input
          key={option.id}
          type="checkbox"
          value={option.value}
          checked={option.isChecked}
          onChange={this.handleInputChange}
        />
        {option.value}
      </li>
    ));
    return <ul>{checkboxList}</ul>;
  }

  displayRepositories() {
    return this.state.followedRepos.map(item => (
      <li key={item.link}>
        <a href={item.link}>{item.name}</a>
      </li>
    ));
  }

  handleChangeRepository(event) {
    this.setState({ newRepo: event.target.value });
  }

  handleAddRepository(event) {
    event.preventDefault();
    const apiLink = this.state.newRepo.replace(
      'github.com',
      'api.github.com/repos'
    );
    let newRepos = this.state.followedRepos;

    axios
      .get(apiLink)
      .then(response => {
        newRepos.push({
          name: response.data.full_name,
          link: this.state.newRepo,
          prLink: response.data.pulls_url.replace('{/number}', ''),
        });
        this.setState({ followedRepos: newRepos, newRepo: '' }, () => {
          chrome.storage.local.set({ followedRepos: this.state.followedRepos });
          chrome.runtime.sendMessage({
            message: 'Changed followed repositories',
          });
        });
      })
      .catch(error => {
        console.log(error);
      });
  }

  render() {
    return (
      <div className="Options">
        <form onSubmit={this.handleSubmit}>
          <div>
            <label>
              Username:
              <input
                type="text"
                value={this.state.user}
                onChange={e => this.handleChange('user', e)}
              />
            </label>
          </div>
          <div>
            <input
              type="checkbox"
              value={this.state.auth}
              checked={this.state.auth}
              onChange={e => this.handleChange('auth', e)}
              name="ifAuthToken"
            />
            <label htmlFor="ifAuthToken">
              Authenticate with personal access token
            </label>
          </div>
          <div>
            <label>
              Your personal access token:
              <input
                type="password"
                value={this.state.token}
                onChange={e => this.handleChange('token', e)}
              />
            </label>
          </div>
          <br />
          Choose type of PR you`d like to follow:
          <div>{this.checkboxList()}</div>
          <input type="submit" value="Save" />
        </form>
        <br />
        Add repositories you`d like to follow:
        <div>
          <ul>
            {this.displayRepositories()}
            <li>
              <form onSubmit={this.handleAddRepository}>
                <label>
                  Add repository(without validation):
                  <input
                    type="text"
                    value={this.state.newRepo}
                    onChange={this.handleChangeRepository}
                  />
                </label>
                <input type="submit" value="Add" />
              </form>
            </li>
          </ul>
        </div>
      </div>
    );
  }
}

export { Options };

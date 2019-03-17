/*global chrome*/

import React, { Component } from 'react';
import axios from 'axios';
import './App.css';

class Options extends Component {
  constructor(props) {
    super(props);
    this.state = {
      user: '',
      auth: false,
      token: '',
      newRepo: '',
      reposLinks: [],
      prTypes: [
        { id: 1, value: 'Created', isChecked: false },
        { id: 2, value: 'Assigned', isChecked: false },
        { id: 3, value: 'Mentioned', isChecked: false },
        { id: 4, value: 'Review request', isChecked: false },
      ],
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleGet = this.handleGet.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleChangeRepository = this.handleChangeRepository.bind(this);
    this.handleAddRepository = this.handleAddRepository.bind(this);
  }

  handleChange(key) {
    return function(event) {
      var state = {};
      state[key] =
        event.target.type === 'checkbox'
          ? event.target.checked
          : event.target.value;
      this.setState(state);
    }.bind(this);
  }

  handleSubmit(event) {
    event.preventDefault();
    chrome.storage.local.set(
      {
        username: this.state.user,
        auth: this.state.auth,
        token: this.state.token,
        prTypes: this.state.prTypes,
      },
      () => {
        console.log(
          'username: ' +
            this.state.user +
            ',\npersonal access token: ' +
            this.state.token +
            ',\nshould authenticate with personal access token: ' +
            this.state.auth +
            ',\nPR options are set.'
        );
      }
    );
  }

  handleGet() {
    chrome.storage.local.get(
      ['username', 'auth', 'token', 'prTypes', 'reposLinks'],
      function(result) {
        console.log(
          'username: ' +
            result.username +
            ',\npersonal access token: ' +
            result.token +
            ',\nshould authenticate with personal access token: ' +
            result.auth +
            ',\nfollowed repositories:' +
            result.reposLinks.map(item => item.name).join()
        );
        var options = [];
        result.prTypes.forEach(element => {
          if (element.isChecked) options.push(element.value);
        });
        console.log('Your PR options are: ' + options.join());
      }
    );
  }

  handleInputChange(event) {
    var newState = this.state.prTypes.map(option => {
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
    const localReposList = this.state.reposLinks.map(item => (
      <li key={item.link}>
        <a href={item.link}>{item.name}</a>
      </li>
    ));
    return localReposList;
  }

  handleChangeRepository(event) {
    this.setState({ newRepo: event.target.value });
  }

  handleAddRepository(event) {
    event.preventDefault();
    var apiLink = this.state.newRepo.replace(
      'github.com',
      'api.github.com/repos'
    );
    var newReposLinks = this.state.reposLinks;

    axios
      .get(apiLink)
      .then(response => {
        newReposLinks.push({
          name: response.data.full_name,
          link: this.state.newRepo,
        });
        this.setState({ reposLinks: newReposLinks });
        this.setState({ newRepo: '' });
        chrome.storage.local.set(
          { reposLinks: this.state.reposLinks },
          () => {}
        );
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
                onChange={this.handleChange('user')}
              />
            </label>
          </div>
          <div>
            <input
              type="checkbox"
              value={this.state.auth}
              onChange={this.handleChange('auth')}
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
                type="text"
                value={this.state.token}
                onChange={this.handleChange('token')}
              />
            </label>
          </div>
          <br />
          Choose type of PR you`d like to follow:
          <div>{this.checkboxList()}</div>
          <input type="submit" value="Submit" />
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
        <button onClick={this.handleGet}>Get data from storage</button>
      </div>
    );
  }
}

export { Options };

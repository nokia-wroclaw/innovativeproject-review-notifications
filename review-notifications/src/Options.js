/*global chrome*/

import React, { Component } from 'react';
import './App.css';

class Options extends Component {
  constructor(props) {
    super(props);
    this.state = {
      user: 'a',
      auth: false,
      token: '',
    };
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
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
      },
      () => {
        console.log(
          'username: ' +
            this.state.user +
            ',\npersonal access token: ' +
            this.state.token +
            ',\nshould authenticate with personal access token: ' +
            this.state.auth
        );
      }
    );
  }

  handleGet() {
    chrome.storage.local.get(['username', 'auth', 'token'], function(result) {
      console.log(
        'username: ' +
          result.username +
          ',\npersonal access token: ' +
          result.token +
          ',\nshould authenticate with personal access token: ' +
          result.auth
      );
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
            <label for="ifAuthToken">
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
          <input type="submit" value="Submit" />
        </form>

        <button onClick={this.handleGet.bind(this)}>GET</button>
      </div>
    );
  }
}

export { Options };

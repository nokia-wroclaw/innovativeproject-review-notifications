/*global chrome*/

import React, { Component } from 'react';
import './App.css';

class Options extends Component {
  constructor(props) {
    super(props);
    this.state = {
      user: '',
    };
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(event) {
    this.setState({ user: event.target.value });
  }

  handleSubmit(event) {
    event.preventDefault();
    chrome.storage.local.set({ username: this.state.user }, () => {
      console.log('Username is set to ' + this.state.user);
    });
  }

  handleGet() {
    chrome.storage.local.get(['username'], function(result) {
      console.log('Username currently is ' + result.username);
    });
  }

  render() {
    return (
      <div className="Options">
        <form onSubmit={this.handleSubmit}>
          <label>
            Username:
            <input
              type="text"
              value={this.state.user}
              onChange={this.handleChange}
            />
          </label>
          <input type="submit" value="Submit" />
        </form>

        <button onClick={this.handleGet.bind(this)}>GET</button>
      </div>
    );
  }
}

export { Options };

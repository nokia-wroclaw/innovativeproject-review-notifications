import React, { Component } from 'react';
import { HashRouter as Router, Route } from 'react-router-dom';
import { Github } from './Github';
import Options from './Options';
import './App.css';

class App extends Component {
  render() {
    return (
      <Router>
        <div>
          <Route exact path="/" component={Github} />
          <Route path="/options" component={Options} />
        </div>
      </Router>
    );
  }
}

export { App };

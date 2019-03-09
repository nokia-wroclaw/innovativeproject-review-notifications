import React, { Component } from 'react';
import axios from 'axios';

class Github extends Component {
  constructor(props) {
    super(props);
    this.state = {
      pulls: [],
    };

    this.handleClick = this.handleClick.bind(this);
  }

  handleClick() {
    axios
      .get('https://api.github.com/repos/facebook/react/pulls')
      .then(response => {
        this.setState({
          pulls: response.data,
        });
      })
      .catch(error => {
        console.log(error);
      });
  }
  listOfTitles() {
    const list = this.state.pulls.map(pr => <li key={pr.id}>{pr.title}</li>);
    return <ul>{list}</ul>;
  }

  render() {
    return (
      <div>
        <button onClick={this.handleClick}>Get data from Github</button>
        <div>{this.listOfTitles()}</div>
      </div>
    );
  }
}

export { Github };

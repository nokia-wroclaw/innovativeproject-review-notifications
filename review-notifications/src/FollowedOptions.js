/*global chrome*/

import React, { Component } from 'react';
import axios from 'axios';

import { withStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import AddIcon from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';
import {
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  TextField,
} from '@material-ui/core';

const styles = {
  gridItemBox: { paddingBottom: 10 },
  oneLineForm: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wideInput: { width: '85%' },
};

class FollowedOptions extends Component {
  constructor(props) {
    super(props);
    this.state = {
      newRepo: '',
      followedRepos: [],
    };
    this.handleChangeRepository = this.handleChangeRepository.bind(this);
    this.handleAddRepository = this.handleAddRepository.bind(this);
    this.handleDeleteRepository = this.handleDeleteRepository.bind(this);
  }

  componentDidMount() {
    chrome.storage.local.get(
      ['followedRepos'],
      function(result) {
        this.setState({
          followedRepos: result.followedRepos ? result.followedRepos : [],
        });
      }.bind(this)
    );
  }

  displayRepositories() {
    return this.state.followedRepos.map(item => (
      <ListItem key={item.link} dense button component="a" href={item.link}>
        <ListItemText primary={item.name} />
        <ListItemSecondaryAction>
          <IconButton
            aria-label="Delete"
            onClick={e => this.handleDeleteRepository(item, e)}
          >
            <DeleteIcon />
          </IconButton>
        </ListItemSecondaryAction>
      </ListItem>
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

    if (
      !this.state.followedRepos.find(repo => repo.link === this.state.newRepo)
    ) {
      const newRepos = this.state.followedRepos.slice();
      axios
        .get(apiLink)
        .then(response => {
          newRepos.push({
            name: response.data.full_name,
            link: this.state.newRepo,
            prLink: response.data.pulls_url.replace('{/number}', ''),
          });
          this.setState({ followedRepos: newRepos, newRepo: '' }, () => {
            chrome.storage.local.set(
              {
                followedRepos: this.state.followedRepos,
              },
              () => {
                chrome.runtime.sendMessage({
                  message: 'Changed followed repositories',
                });
              }
            );
          });
        })
        .catch(() => {
          this.props.openSnackbar('Invalid link or api limit exceeded');
          this.setState({ newRepo: '' });
        });
    } else {
      this.props.openSnackbar('You are already following this repository');
      this.setState({ newRepo: '' });
    }
  }

  handleDeleteRepository(item, event) {
    event.preventDefault();
    let newRepos = this.state.followedRepos.filter(
      repo => repo.link !== item.link
    );
    this.setState({ followedRepos: newRepos }, () => {
      chrome.storage.local.set(
        { followedRepos: this.state.followedRepos },
        () => {
          chrome.runtime.sendMessage({
            message: 'Changed followed repositories',
          });
        }
      );
    });
  }
  render() {
    const { classes } = this.props;
    return (
      <Grid item sm container direction="column">
        <List>{this.displayRepositories()}</List>
        <Grid item>
          <form
            onSubmit={this.handleAddRepository}
            className={classes.oneLineForm}
          >
            <TextField
              label="Add repository"
              className={`${classes.textField} ${classes.wideInput}`}
              type="text"
              value={this.state.newRepo}
              onChange={this.handleChangeRepository}
              margin="normal"
              variant="outlined"
            />
            <IconButton
              className={classes.button}
              type="submit"
              color="inherit"
              aria-label="Add"
            >
              <AddIcon />
            </IconButton>
          </form>
        </Grid>
      </Grid>
    );
  }
}

FollowedOptions.propTypes = {
  classes: PropTypes.object.isRequired,
  openSnackbar: PropTypes.func,
};

export default withStyles(styles)(FollowedOptions);

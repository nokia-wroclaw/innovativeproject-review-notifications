/*global chrome*/

import React, { Component } from 'react';
import axios from 'axios';
import './App.css';

import { withStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import AddIcon from '@material-ui/icons/Add';
import CloseIcon from '@material-ui/icons/Close';
import DeleteIcon from '@material-ui/icons/Delete';
import {
  AppBar,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  Paper,
  Snackbar,
  TextField,
  Tabs,
  Tab,
  Typography,
} from '@material-ui/core';

function TabContainer(props) {
  return (
    <Typography component="div" style={{ padding: 8 * 3 }}>
      {props.children}
    </Typography>
  );
}

TabContainer.propTypes = {
  children: PropTypes.node.isRequired,
};

const styles = theme => ({
  root: {
    backgroundColor: theme.palette.background.paper,
    flexGrow: 1,
  },
  paper: {
    padding: 0,
    margin: 'auto',
    maxWidth: 500,
  },
  snackbar: {
    position: 'absolute',
  },
  snackbarContent: {
    width: 360,
  },
});

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
  tabValue: 0,
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
      snackbarOpen: false,
      snackbarMessage: '',
      tabValue: 0,
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleChangeRepository = this.handleChangeRepository.bind(this);
    this.handleAddRepository = this.handleAddRepository.bind(this);
    this.handleDeleteRepository = this.handleDeleteRepository.bind(this);
    this.handleOpenSnackbar = this.handleOpenSnackbar.bind(this);
    this.handleCloseSnackbar = this.handleCloseSnackbar.bind(this);
    this.handleChangeTab = this.handleChangeTab.bind(this);
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

  handleOpenSnackbar(message) {
    this.setState({ snackbarOpen: true, snackbarMessage: message });
  }

  handleCloseSnackbar() {
    this.setState({ snackbarOpen: false });
  }

  handleChangeTab(event, value) {
    this.setState({ tabValue: value });
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
      <FormControlLabel
        key={option.value}
        control={
          <Checkbox
            checked={option.isChecked}
            onChange={this.handleInputChange}
            value={option.value}
          />
        }
        label={option.value}
      />
    ));
    return <FormGroup>{checkboxList} </FormGroup>;
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
            chrome.storage.local.set({
              followedRepos: this.state.followedRepos,
            });
            chrome.runtime.sendMessage({
              message: 'Changed followed repositories',
            });
          });
        })
        .catch(() => {
          this.handleOpenSnackbar('Invalid link');
          this.setState({ newRepo: '' });
        });
    } else {
      this.handleOpenSnackbar('You are already following this repository');
      this.setState({ newRepo: '' });
    }
  }

  handleDeleteRepository(item, event) {
    event.preventDefault();
    let newRepos = this.state.followedRepos.filter(
      repo => repo.link !== item.link
    );
    this.setState({ followedRepos: newRepos }, () => {
      chrome.storage.local.set({ followedRepos: this.state.followedRepos });
      chrome.runtime.sendMessage({
        message: 'Changed followed repositories',
      });
    });
  }

  render() {
    const { classes } = this.props;
    return (
      <div className={classes.root}>
        <Paper className={classes.paper}>
          <AppBar position="static" color="default">
            <Tabs
              value={this.state.tabValue}
              onChange={this.handleChangeTab}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
            >
              <Tab label="General options" />
              <Tab label="Followed repositories" />
            </Tabs>
          </AppBar>
          {this.state.tabValue === 0 && (
            <TabContainer>
              <Grid item xs={12} sm container>
                <form
                  className={classes.container}
                  onSubmit={this.handleSubmit}
                  noValidate
                  autoComplete="off"
                >
                  <Grid item xs container direction="column">
                    <TextField
                      id="username"
                      label="Username"
                      className={classes.textField}
                      value={this.state.user}
                      onChange={e => this.handleChange('user', e)}
                      margin="normal"
                      variant="outlined"
                    />
                    <TextField
                      id="token"
                      label="Personal access token"
                      type="password"
                      className={classes.textField}
                      value={this.state.token}
                      onChange={e => this.handleChange('token', e)}
                      margin="normal"
                      variant="outlined"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={this.state.auth}
                          onChange={e => this.handleChange('auth', e)}
                          value={this.state.auth}
                          classes={{
                            root: classes.root,
                            checked: classes.checked,
                          }}
                        />
                      }
                      label="Authenticate with personal access token"
                    />
                  </Grid>
                  <Grid item>
                    <FormControl
                      component="fieldset"
                      className={classes.formControl}
                    >
                      <FormLabel component="legend">
                        Choose type of PR you`d like to follow:
                      </FormLabel>
                      {this.checkboxList()}
                    </FormControl>
                  </Grid>
                  <Button
                    variant="contained"
                    className={classes.button}
                    type="submit"
                  >
                    Save
                  </Button>
                </form>
              </Grid>
            </TabContainer>
          )}
          {this.state.tabValue === 1 && (
            <TabContainer>
              <Grid item sm container direction="column">
                <List>{this.displayRepositories()}</List>
                <Grid item>
                  <form onSubmit={this.handleAddRepository}>
                    <TextField
                      label="Add repository"
                      className={classes.textField}
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
                <Snackbar
                  open={this.state.snackbarOpen}
                  autoHideDuration={4000}
                  onClose={this.handleCloseSnackbar}
                  ContentProps={{
                    'aria-describedby': 'snackbar-fab-message-id',
                    className: classes.snackbarContent,
                  }}
                  message={
                    <span id="snackbar-message-id">
                      {this.state.snackbarMessage}
                    </span>
                  }
                  action={
                    <IconButton
                      key="close"
                      aria-label="Close"
                      color="inherit"
                      className={classes.close}
                      onClick={this.handleCloseSnackbar}
                    >
                      <CloseIcon />
                    </IconButton>
                  }
                  className={classes.snackbar}
                />
              </Grid>
            </TabContainer>
          )}
        </Paper>
      </div>
    );
  }
}

Options.propTypes = {
  classes: PropTypes.object.isRequired,
  theme: PropTypes.object.isRequired,
};

export default withStyles(styles)(Options);

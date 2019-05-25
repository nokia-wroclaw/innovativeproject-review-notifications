/*global chrome*/

import React, { Component } from 'react';
import { initialState } from './UserOptions';
import { Route, Switch, Link as RouterLink } from 'react-router-dom';
import ListOfUsersPR from './ListOfUsersPR';
import ListOfFollowedPR from './ListOfFollowedPR';
import './Github.css';

import { withStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import NavigateBeforeIcon from '@material-ui/icons/NavigateBefore';
import NavigateNextIcon from '@material-ui/icons/NavigateNext';
import { Divider, Grid, ListItem, ListItemText } from '@material-ui/core';

const styles = {
  root: {
    flexGrow: 1,
  },
  mainBarFont: {
    // color: '#4253b3',
    textTransform: 'uppercase',
    fontSize: '1.1em',
    fontWeight: 'bold',
  },
};

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
      fetchingFollowedRepos: false,
      fetchingPullRequests: false,
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
      userRelatedPRList: [],
    };

    this.handleMessage.bind(this);
    this.saveInStorage = this.saveInStorage.bind(this);

    chrome.runtime.onMessage.addListener(message => {
      this.handleMessage(message);
    });
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
        'fetchingFollowedRepos',
        'fetchingPullRequests',
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
            fetchingFollowedRepos: result.fetchingFollowedRepos,
            fetchingPullRequests: result.fetchingPullRequests,
          },
          () => {
            this.makeUserRelatedPRList();
          }
        );
      }.bind(this)
    );
  }

  handleMessage(msg) {
    switch (msg.message) {
      case 'Fetching followed repos':
        this.setState({ fetchingFollowedRepos: true });
        break;
      case 'Followed repos fetched':
        chrome.storage.local.get(['followedPR'], result => {
          this.setState({
            followedPR: result.followedPR,
            fetchingFollowedRepos: false,
          });
        });
        break;
      case 'Fetching pull requests':
        this.setState({ fetchingPullRequests: true });
        break;
      case 'Pull requests fetched':
        chrome.storage.local.get(
          ['user', 'auth', 'token', 'prTypes'],
          result => {
            this.setState(
              {
                user: result.username ? result.username : this.state.user,
                auth: result.auth ? result.auth : this.state.auth,
                token: result.token ? result.token : this.state.token,
                prOptions: result.prTypes ? result.prTypes : this.state.prTypes,
              },
              () => {
                this.makeUserRelatedPRList();
                this.setState({ fetchingPullRequests: false });
              }
            );
          }
        );
        break;
    }
  }

  makeUserRelatedPRList() {
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

    this.setState({
      userRelatedPRList: list,
    });
  }

  saveInStorage() {
    chrome.storage.local.set({
      createdPR: this.state.createdPR,
      assignedPR: this.state.assignedPR,
      mentionedPR: this.state.mentionedPR,
      reviewedPR: this.state.reviewedPR,
      followedPR: this.state.followedPR,
    });
  }

  checkIfIsNew(e) {
    if (e && e.dataset.isnew) {
      console.log(e);
      e.classList.add('isNew');
    }
  }

  render() {
    let { location } = this.props;
    const { classes } = this.props;

    return (
      <div className={classes.root}>
        <Switch location={location}>
          <Route
            exact
            path="/"
            render={props => (
              <MainSite
                {...props}
                classes={classes}
                user={this.state.user}
                auth={this.state.auth}
                token={this.state.token}
                hasData={this.state.hasData}
                saveInStorage={this.saveInStorage}
                followedPR={this.state.followedPR}
                prOptions={this.state.prOptions}
                fetchingFollowedRepos={this.state.fetchingFollowedRepos}
                userRelatedPRList={this.state.userRelatedPRList}
              />
            )}
          />
          <Route
            path="/user-related"
            render={props => (
              <UserRelatedPullRequests
                {...props}
                classes={classes}
                itemsNum={this.state.userRelatedPRList.length}
                user={this.state.user}
                auth={this.state.auth}
                token={this.state.token}
                hasData={this.state.hasData}
                saveInStorage={this.saveInStorage}
                followedPR={this.state.followedPR}
                fetchingFollowedRepos={this.state.fetchingFollowedRepos}
                userRelatedPRList={this.state.userRelatedPRList}
              />
            )}
          />
          <Route
            path="/followed"
            render={props => (
              <FollowedPullRequests
                {...props}
                classes={classes}
                itemsNum={this.state.followedPR.length}
                saveInStorage={this.saveInStorage}
                followedPR={this.state.followedPR}
                prOptions={this.state.prOptions}
                fetchingFollowedRepos={this.state.fetchingFollowedRepos}
              />
            )}
          />
        </Switch>
      </div>
    );
  }
}

function MainSite(props) {
  return (
    <div>
      <ListOfUsersPR
        itemsNum={2}
        user={props.user}
        auth={props.auth}
        token={props.token}
        hasData={props.hasData}
        saveInStorage={props.saveInStorage}
        fetchingFollowedRepos={props.fetchingFollowedRepos}
        userRelatedPRList={props.userRelatedPRList}
      />
      <Divider light />
      <Grid item container className="mainBar">
        <ListItem button component={RouterLink} to="/user-related">
          <ListItemText
            primary="Show more"
            classes={{
              primary: props.classes.mainBarFont,
            }}
          />
          <NavigateNextIcon />
        </ListItem>
      </Grid>
      <Divider />
      <ListOfFollowedPR
        itemsNum={2}
        saveInStorage={props.saveInStorage}
        followedPR={props.followedPR}
        prOptions={props.prOptions}
        fetchingFollowedRepos={props.fetchingFollowedRepos}
      />
      <Divider light />
      <Grid item container className="mainBar">
        <ListItem button component={RouterLink} to="/followed">
          <ListItemText
            primary="Show more"
            classes={{
              primary: props.classes.mainBarFont,
            }}
          />
          <NavigateNextIcon />
        </ListItem>
      </Grid>
      <Divider />
      <Grid item container className="mainBar">
        <ListItem
          button
          component="button"
          onClick={() => chrome.runtime.openOptionsPage()}
        >
          <ListItemText
            primary="Options"
            classes={{
              primary: props.classes.mainBarFont,
            }}
          />
        </ListItem>
      </Grid>
    </div>
  );
}

function UserRelatedPullRequests(props) {
  return (
    <div>
      <Grid item container className="mainBar">
        <ListItem button component={RouterLink} to="/">
          <NavigateBeforeIcon />
          <ListItemText
            primary="Back"
            classes={{
              primary: props.classes.mainBarFont,
            }}
          />
        </ListItem>
      </Grid>
      <Divider light />
      <ListOfUsersPR
        itemsNum={props.itemsNum}
        user={props.user}
        auth={props.auth}
        token={props.token}
        hasData={props.hasData}
        saveInStorage={props.saveInStorage}
        fetchingFollowedRepos={props.fetchingFollowedRepos}
        userRelatedPRList={props.userRelatedPRList}
      />
    </div>
  );
}

function FollowedPullRequests(props) {
  return (
    <div>
      <Grid item container className="mainBar">
        <ListItem button component={RouterLink} to="/">
          <NavigateBeforeIcon />
          <ListItemText
            primary="Back"
            classes={{
              primary: props.classes.mainBarFont,
            }}
          />
        </ListItem>
      </Grid>
      <Divider light />
      <ListOfFollowedPR
        itemsNum={props.itemsNum}
        saveInStorage={props.saveInStorage}
        followedPR={props.followedPR}
        prOptions={props.prOptions}
        fetchingFollowedRepos={props.fetchingFollowedRepos}
      />
    </div>
  );
}

Github.propTypes = {
  location: PropTypes.object.isRequired,
  classes: PropTypes.object.isRequired,
};

MainSite.propTypes = {
  classes: PropTypes.object.isRequired,
  itemsNum: PropTypes.number,
  saveInStorage: PropTypes.func,
  user: PropTypes.string,
  token: PropTypes.number,
  auth: PropTypes.bool,
  hasData: PropTypes.bool,
  fetchingPullRequests: PropTypes.bool,
  userRelatedPRList: PropTypes.array,
  prOptions: PropTypes.array,
  fetchingFollowedRepos: PropTypes.bool,
  followedList: PropTypes.object.isRequired,
  followedPR: PropTypes.array,
};

UserRelatedPullRequests.propTypes = {
  classes: PropTypes.object.isRequired,
  user: PropTypes.string,
  token: PropTypes.number,
  auth: PropTypes.bool,
  hasData: PropTypes.bool,
  fetchingPullRequests: PropTypes.bool,
  itemsNum: PropTypes.number,
  saveInStorage: PropTypes.func,
  userRelatedPRList: PropTypes.array,
  fetchingFollowedRepos: PropTypes.bool,
};

FollowedPullRequests.propTypes = {
  classes: PropTypes.object.isRequired,
  itemsNum: PropTypes.number,
  saveInStorage: PropTypes.func,
  followedPR: PropTypes.array,
  prOptions: PropTypes.array,
  fetchingFollowedRepos: PropTypes.bool,
};

export default withStyles(styles)(Github);

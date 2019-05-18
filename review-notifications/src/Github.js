/*global chrome*/

import React, { Component } from 'react';
import { initialState } from './Options';
import { Route, Switch, Link as RouterLink } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

import { withStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import NavigateBeforeIcon from '@material-ui/icons/NavigateBefore';
import NavigateNextIcon from '@material-ui/icons/NavigateNext';
import {
  CircularProgress,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@material-ui/core';
import ReactTimeAgo from 'react-time-ago';
import './Github.css';

const styles = {
  root: {
    flexGrow: 1,
  },
  bar: {
    fontSize: '0.9em',
    backgroundColor: '#e0e0e0',
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

  listOfPullRequests(itemNum) {
    const { classes } = this.props;
    const list = this.state.userRelatedPRList;
    let prompt = <ListItemText dense primary="No pull requests" />;

    if (this.state.user === '')
      prompt = (
        <ListItemText
          dense
          primary="Add username to display more pull requests"
        />
      );
    else if (this.state.token === '' || !this.state.auth)
      prompt = (
        <ListItemText dense primary="Add token to display more pull requests" />
      );
    else if (list.length > 0) prompt = <></>;

    const header = (
      <Grid item container class={classes.bar}>
        <ListItem>
          <ListItemText primary="User related pull requests" />
        </ListItem>
      </Grid>
    );

    if (!this.state.hasData || this.state.fetchingPullRequests)
      return (
        <>
          {header}
          <Divider />
          <Grid item container style={{ textAlign: 'center' }}>
            <ListItem>
              <CircularProgress className={classes.progress} />
            </ListItem>
          </Grid>
        </>
      );
    else if (list.length > 0) {
      list.sort(function(a, b) {
        return new Date(b.updated) - new Date(a.updated);
      });
      return (
        <>
          {header}
          <Divider />
          <List dense component="nav">
            {this.removeDuplicates(list)
              .slice(0, itemNum)
              .map(pr => (
                <ListItem key={pr.link} className="noPadding">
                  <ListItemText
                    className="noPadding listElem"
                    primary={
                      <Grid
                        container
                        dense
                        component="a"
                        className="buttonHover padding"
                        href={pr.link}
                        style={{ textDecoration: 'none' }}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Grid item xs>
                          <Typography>{pr.title}</Typography>
                        </Grid>
                        <Grid item>
                          <Typography color="textSecondary">
                            <ReactTimeAgo date={new Date(pr.updated)} />
                          </Typography>
                        </Grid>
                      </Grid>
                    }
                    secondary={
                      <div
                        className={
                          'paddingComment ' + (pr.hasNewComment ? 'isNew' : '')
                        }
                      >
                        <div name="showMoreOrLess">{this.listComments(pr)}</div>
                        <button
                          ref={this.handleDisplayButton}
                          className="commentButton right"
                          onClick={this.handleMoreLess}
                        >
                          show more
                        </button>
                        <button
                          ref={this.handleReadOnLoad}
                          data-length={pr.commentsData.length}
                          data-isnew={pr.hasNewComment}
                          className="commentButton left"
                          onClick={this.handleReadButton.bind(this, pr)}
                        >
                          {pr.hasNewComment ? 'Mark as read' : 'Mark as unread'}
                        </button>
                      </div>
                    }
                  />
                </ListItem>
              ))}
          </List>
          <Grid item container>
            <ListItem>{prompt}</ListItem>
          </Grid>
        </>
      );
    } else
      return (
        <>
          {header}
          <Divider />
          <Grid item container>
            <ListItem>{prompt}</ListItem>
          </Grid>
        </>
      );
  }

  removeDuplicates(list) {
    const setOfLinks = new Set();
    list.forEach(item => setOfLinks.add(item.link));
    const listWithoutDuplicates = [];
    list.forEach(item => {
      if (setOfLinks.has(item.link)) {
        setOfLinks.delete(item.link);
        listWithoutDuplicates.push(item);
      }
    });
    return listWithoutDuplicates;
  }

  handleMoreLess(e) {
    const div = e.target.previousSibling;
    if (div.className === 'showLess') {
      div.className = '';
      e.target.innerHTML = 'show less';
    } else {
      div.className += 'showLess';
      e.target.innerHTML = 'show more';
    }
  }

  handleDisplayButton(e) {
    if (e) {
      var div = e.previousElementSibling;
      if (div.clientHeight <= 40) {
        e.classList.add('hidden');
      } else {
        div.classList += 'showLess';
      }
    }
  }

  listOfFollowedPullRequests(itemsNum) {
    const { classes } = this.props;
    const header = (
      <Grid item container class={classes.bar}>
        <ListItem>
          <ListItemText primary="Pull requests from followed repositories" />
        </ListItem>
      </Grid>
    );
    if (this.state.fetchingFollowedRepos) {
      return (
        <>
          {header}
          <Divider />
          <Grid item container>
            <ListItem style={{ textAlign: 'center' }}>
              <CircularProgress className={classes.progress} />
            </ListItem>
          </Grid>
        </>
      );
    } else if (
      this.state.followedPR.length > 0 &&
      this.state.prOptions.find(
        option => option.value === options.FOLLOWED && option.isChecked === true
      )
    ) {
      this.state.followedPR.sort(function(a, b) {
        return new Date(b.updated) - new Date(a.updated);
      });
      return (
        <>
          {header}
          <Divider />
          <List dense component="nav">
            {this.state.followedPR.slice(0, itemsNum).map(pr => (
              <ListItem key={pr.id} className="noPadding">
                <ListItemText
                  className="noPadding listElem"
                  primary={
                    <Grid
                      container
                      dense
                      component="a"
                      className="buttonHover padding"
                      href={pr.link}
                      style={{ textDecoration: 'none' }}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Grid item xs>
                        <Typography>{pr.title}</Typography>
                      </Grid>
                      <Grid item>
                        <Typography color="textSecondary">
                          <ReactTimeAgo date={new Date(pr.updated)} />
                        </Typography>
                      </Grid>
                    </Grid>
                  }
                  secondary={
                    <div
                      className={
                        'paddingComment ' + (pr.hasNewComment ? 'isNew' : '')
                      }
                    >
                      <div name="showMoreOrLess">{this.listComments(pr)}</div>
                      <button
                        ref={this.handleDisplayButton}
                        className="commentButton right"
                        onClick={this.handleMoreLess}
                      >
                        Show more
                      </button>
                      <button
                        ref={this.handleReadOnLoad}
                        data-length={pr.commentsData.length}
                        data-isnew={pr.hasNewComment}
                        className="commentButton left"
                        onClick={this.handleReadButton.bind(this, pr)}
                      >
                        {pr.hasNewComment ? 'Mark as read' : 'Mark as unread'}
                      </button>
                    </div>
                  }
                />
              </ListItem>
            ))}
          </List>
        </>
      );
    } else
      return (
        <>
          {header}
          <Divider />
          <Grid item container>
            <ListItem>
              <ListItemText
                dense
                primary="You do not have any followed repositories or option to display them
                  is not checked."
                target
              />
            </ListItem>
          </Grid>
        </>
      );
  }

  listComments(prObject) {
    if (prObject.commentsData.length > 0) {
      const length = prObject.commentsData.length;
      const lastComment = prObject.commentsData[length - 1];
      const result = `${lastComment.user.login}: ${lastComment.body}`;
      return <ReactMarkdown className="noMargin" source={result} />;
    }
    return 'There are no comments';
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

  markAsReadOrUnread(prObject, e) {
    if (prObject.hasNewComment) {
      prObject.hasNewComment = false;
      e.target.parentNode.classList.remove('isNew');
      e.target.innerHTML = 'Mark as unread';
    } else {
      prObject.hasNewComment = true;
      e.target.parentNode.classList.add('isNew');
      e.target.innerHTML = 'Mark as read';
    }
  }

  handleReadButton(prObject, e) {
    this.markAsReadOrUnread(prObject, e);
    this.saveInStorage();
  }

  handleReadOnLoad(e) {
    if (e) {
      if (e.dataset.length == 0) {
        e.classList.add('hidden');
      }
      if (e.dataset.isNew) {
        e.innerHTML = 'Mark as read';
      }
    }
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
    const userRelatedListSize = this.state.userRelatedPRList.length;
    const followedListSize = this.state.followedPR.length;

    return (
      <div className={classes.root}>
        <Switch location={location}>
          <Route
            exact
            path="/"
            render={props => (
              <MainSite
                {...props}
                userRelatedList={this.listOfPullRequests(2)}
                followedList={this.listOfFollowedPullRequests(2)}
                user={this.state.user}
                auth={this.state.auth}
                token={this.state.token}
                hasData={this.state.hasData}
                classes={classes}
              />
            )}
          />
          <Route
            path="/user-related"
            render={props => (
              <UserRelatedPullRequests
                {...props}
                list={this.listOfPullRequests(userRelatedListSize)}
              />
            )}
          />
          <Route
            path="/followed"
            render={props => (
              <FollowedPullRequests
                {...props}
                list={this.listOfFollowedPullRequests(followedListSize)}
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
      {props.userRelatedList}
      <Divider light />
      <Grid item container>
        <ListItem button component={RouterLink} to="/user-related">
          <ListItemText primary="Show more" />
          <NavigateNextIcon />
        </ListItem>
      </Grid>
      <Divider />
      {props.followedList}
      <Divider light />
      <Grid item container>
        <ListItem button component={RouterLink} to="/followed">
          <ListItemText primary="Show more" />
          <NavigateNextIcon />
        </ListItem>
      </Grid>
      <Divider />
      <Grid item container class={props.classes.bar}>
        <ListItem
          button
          component="button"
          onClick={() => chrome.runtime.openOptionsPage()}
        >
          <ListItemText primary="Options" />
        </ListItem>
      </Grid>
    </div>
  );
}

function UserRelatedPullRequests(props) {
  return (
    <div>
      <Grid item container>
        <ListItem button component={RouterLink} to="/">
          <NavigateBeforeIcon />
          <ListItemText primary="Back" />
        </ListItem>
      </Grid>
      <Divider light />
      {props.list}
    </div>
  );
}

function FollowedPullRequests(props) {
  return (
    <div>
      <Grid item container>
        <ListItem button component={RouterLink} to="/">
          <NavigateBeforeIcon />
          <ListItemText primary="Back" />
        </ListItem>
      </Grid>
      <Divider light />
      {props.list}
    </div>
  );
}

Github.propTypes = {
  location: PropTypes.object.isRequired,
  classes: PropTypes.object.isRequired,
};

MainSite.propTypes = {
  classes: PropTypes.object.isRequired,
  userRelatedList: PropTypes.object.isRequired,
  followedList: PropTypes.object.isRequired,
};

UserRelatedPullRequests.propTypes = {
  list: PropTypes.object.isRequired,
};

FollowedPullRequests.propTypes = {
  list: PropTypes.object.isRequired,
};

export default withStyles(styles)(Github);

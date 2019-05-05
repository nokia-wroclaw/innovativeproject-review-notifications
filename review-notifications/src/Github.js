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
  Divider,
  Grid,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@material-ui/core';
import ReactTimeAgo from 'react-time-ago';
import ReadMoreAndLess from 'react-read-more-less';

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
          },
          () => {
            this.makeUserRelatedPRList();
            this.listOfPullRequests();
          }
        );
      }.bind(this)
    );
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

    const header = (
      <Grid item container class={classes.bar}>
        <ListItem>
          <ListItemText primary="User related pull requests" />
        </ListItem>
      </Grid>
    );
    let prompt = <ListItemText dense primary="No pull requests" />;
    if (!this.state.hasData) {
      prompt = <ListItemText dense primary="Loading..." />;
    } else if (this.state.user === '') {
      prompt = (
        <ListItemText
          dense
          primary="Add username to display more pull requests"
        />
      );
    } else if (this.state.token === '' || !this.state.auth) {
      prompt = (
        <ListItemText dense primary="Add token to display more pull requests" />
      );
    } else if (list.length > 0) {
      prompt = <></>;
    }

    if (list.length > 0)
      return (
        <>
          {header}
          <Divider />
          <List dense component="nav">
            {this.removeDuplicates(list)
              .slice(0, itemNum)
              .map(pr => (
                <ListItem key={pr.link} button>
                  <ListItemText
                    primary={
                      <Grid
                        container
                        dense
                        component="a"
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
                      <ReadMoreAndLess
                        ref={this.ReadMore}
                        className="read-more-content"
                        charLimit={80}
                        readMoreText={
                          <Typography inline variant="caption" color="primary">
                            Read more
                          </Typography>
                        }
                        readLessText={
                          <Typography inline variant="caption" color="primary">
                            Read less
                          </Typography>
                        }
                      >
                        {this.listComments(pr)}
                      </ReadMoreAndLess>
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
    else
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

  listOfFollowedPullRequests(itemsNum) {
    const { classes } = this.props;
    const header = (
      <Grid item container class={classes.bar}>
        <ListItem>
          <ListItemText primary="Pull requests from followed repositories" />
        </ListItem>
      </Grid>
    );
    if (
      this.state.followedPR.length > 0 &&
      this.state.prOptions.find(
        option => option.value === options.FOLLOWED && option.isChecked === true
      )
    ) {
      return (
        <>
          {header}
          <Divider />
          <List dense component="nav">
            {this.state.followedPR.slice(0, itemsNum).map(pr => (
              <ListItem key={pr.id} button>
                <ListItemText
                  primary={
                    <Grid
                      container
                      dense
                      component="a"
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
                    <ReadMoreAndLess
                      ref={this.ReadMore}
                      className="read-more-content"
                      charLimit={80}
                      readMoreText={
                        <Typography inline variant="caption" color="primary">
                          Read more
                        </Typography>
                      }
                      readLessText={
                        <Typography inline variant="caption" color="primary">
                          Read less
                        </Typography>
                      }
                    >
                      {this.listComments(pr)}
                    </ReadMoreAndLess>
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
              />
            </ListItem>
          </Grid>
        </>
      );
  }

  listComments(prObject) {
    if (prObject.commentsData.length > 0) {
      const length = prObject.commentsData.length;
      const result = `${prObject.commentsData[length - 1].user.login}: ${
        prObject.commentsData[length - 1].body
      }`;
      return <ReactMarkdown source={result} />;
    }
    return 'There are no comments';
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

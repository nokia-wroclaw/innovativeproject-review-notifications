import React, { Component } from 'react';
import FollowedOptions from './FollowedOptions';
import UserOptions from './UserOptions';

import { withStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import CloseIcon from '@material-ui/icons/Close';

import {
  AppBar,
  IconButton,
  Paper,
  Snackbar,
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

class Options extends Component {
  constructor(props) {
    super(props);
    this.state = {
      snackbarOpen: false,
      snackbarMessage: '',
      tabValue: 0,
    };

    this.handleOpenSnackbar = this.handleOpenSnackbar.bind(this);
    this.handleCloseSnackbar = this.handleCloseSnackbar.bind(this);
    this.handleChangeTab = this.handleChangeTab.bind(this);
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
              <UserOptions openSnackbar={this.handleOpenSnackbar} />
            </TabContainer>
          )}
          {this.state.tabValue === 1 && (
            <TabContainer>
              <FollowedOptions openSnackbar={this.handleOpenSnackbar} />
            </TabContainer>
          )}
          <Snackbar
            open={this.state.snackbarOpen}
            autoHideDuration={4000}
            onClose={this.handleCloseSnackbar}
            ContentProps={{
              'aria-describedby': 'snackbar-fab-message-id',
              className: classes.snackbarContent,
            }}
            message={
              <span id="snackbar-message-id">{this.state.snackbarMessage}</span>
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

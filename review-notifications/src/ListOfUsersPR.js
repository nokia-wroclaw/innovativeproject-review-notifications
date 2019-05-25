import React, { Component } from 'react';
import ListElement from './ListElement';
import './Github.css';

import { withStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import {
  CircularProgress,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemText,
} from '@material-ui/core';

const styles = {
  mainBarFont: {
    textTransform: 'uppercase',
    fontSize: '1.1em',
    fontWeight: 'bold',
  },
};

class ListOfUsersPR extends Component {
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

  render() {
    const { classes } = this.props;
    const list = this.props.userRelatedPRList;
    let prompt = <ListItemText dense primary="No pull requests" />;

    if (this.props.user === '')
      prompt = (
        <ListItemText
          dense
          primary="Add username to display more pull requests"
        />
      );
    else if (this.props.token === '' || !this.props.auth)
      prompt = (
        <ListItemText dense primary="Add token to display more pull requests" />
      );
    else if (list.length > 0) prompt = <></>;

    const header = (
      <Grid item container className="mainBar">
        <ListItem>
          <ListItemText
            primary="User related pull requests"
            classes={{
              primary: classes.mainBarFont,
            }}
          />
        </ListItem>
      </Grid>
    );

    if (!this.props.hasData || this.props.fetchingPullRequests)
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
          <List dense component="nav" disablePadding="true">
            {this.removeDuplicates(list)
              .slice(0, this.props.itemsNum)
              .map(pr => (
                <ListElement
                  key={pr.link}
                  pr={pr}
                  saveInStorage={this.props.saveInStorage}
                />
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
}

ListOfUsersPR.propTypes = {
  classes: PropTypes.object.isRequired,
  user: PropTypes.string,
  token: PropTypes.number,
  auth: PropTypes.bool,
  hasData: PropTypes.bool,
  fetchingPullRequests: PropTypes.bool,
  itemsNum: PropTypes.number,
  saveInStorage: PropTypes.func,
  userRelatedPRList: PropTypes.array,
};

export default withStyles(styles)(ListOfUsersPR);

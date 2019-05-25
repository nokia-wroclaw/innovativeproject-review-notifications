import React from 'react';
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

const options = {
  FOLLOWED: 'From followed repositories',
};

function ListOfFollowedPR(props) {
  const { classes } = props;
  const header = (
    <Grid item container className="mainBar">
      <ListItem>
        <ListItemText
          primary="Pull requests from followed repositories"
          classes={{
            primary: classes.mainBarFont,
          }}
        />
      </ListItem>
    </Grid>
  );

  if (props.fetchingFollowedRepos) {
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
    props.followedPR.length > 0 &&
    props.prOptions.find(
      option => option.value === options.FOLLOWED && option.isChecked === true
    )
  ) {
    props.followedPR.sort(function(a, b) {
      return new Date(b.updated) - new Date(a.updated);
    });
    return (
      <>
        {header}
        <Divider />
        <List dense component="nav" disablePadding="true">
          {props.followedPR.slice(0, props.itemsNum).map(pr => (
            <ListElement
              key={pr.link}
              pr={pr}
              saveInStorage={props.saveInStorage}
            />
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
              primary="You do not have any followed repositories or option to display them is not checked."
              target
            />
          </ListItem>
        </Grid>
      </>
    );
}

ListOfFollowedPR.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(ListOfFollowedPR);

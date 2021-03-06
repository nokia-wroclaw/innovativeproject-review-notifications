/*global chrome*/

import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import indigo from '@material-ui/core/colors/indigo';
import {
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Grid,
  TextField,
} from '@material-ui/core';

const styles = {
  checkboxRoot: {
    color: indigo[600],
    '&$checked': {
      color: indigo[500],
    },
  },
  checked: {},
};

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
};

class UserOptions extends Component {
  constructor(props) {
    super(props);
    this.state = {
      user: '',
      auth: false,
      token: '',
      prTypes: [],
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
  }
  componentDidMount() {
    chrome.storage.local.get(
      ['username', 'auth', 'token', 'prTypes'],
      function(result) {
        this.setState({
          user: result.username ? result.username : initialState.user,
          auth: result.auth ? result.auth : initialState.auth,
          token: result.token ? result.token : initialState.token,
          prTypes: result.prTypes ? result.prTypes : initialState.prTypes,
        });
      }.bind(this)
    );
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
    this.props.openSnackbar('Options saved');
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
    const { classes } = this.props;
    const checkboxList = this.state.prTypes.map(option => (
      <FormControlLabel
        key={option.value}
        control={
          <Checkbox
            checked={option.isChecked}
            onChange={this.handleInputChange}
            value={option.value}
            classes={{
              root: classes.checkboxRoot,
              checked: classes.checked,
            }}
          />
        }
        label={option.value}
      />
    ));
    return <FormGroup>{checkboxList} </FormGroup>;
  }
  render() {
    const { classes } = this.props;
    return (
      <Grid item xs={12} sm container>
        <form
          className={classes.container}
          onSubmit={this.handleSubmit}
          noValidate
          autoComplete="off"
        >
          <Grid
            item
            container
            direction="column"
            className={classes.gridItemBox}
          >
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
                    root: classes.checkboxRoot,
                    checked: classes.checked,
                  }}
                />
              }
              label="Authenticate with personal access token"
            />
          </Grid>
          <Grid item className={classes.gridItemBox}>
            <FormControl component="fieldset" className={classes.formControl}>
              <FormLabel component="legend">
                Choose type of PR you`d like to follow:
              </FormLabel>
              {this.checkboxList()}
            </FormControl>
          </Grid>
          <Button variant="contained" className={classes.button} type="submit">
            Save
          </Button>
        </form>
      </Grid>
    );
  }
}

UserOptions.propTypes = {
  classes: PropTypes.object.isRequired,
  openSnackbar: PropTypes.func,
};

export default withStyles(styles)(UserOptions);

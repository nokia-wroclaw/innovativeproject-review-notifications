import React, { Component } from 'react';
import ReactMarkdown from 'react-markdown';
import ReactTimeAgo from 'react-time-ago';
import './Github.css';
import './ListElement.css';

import PropTypes from 'prop-types';

import { Grid, ListItem, ListItemText, Typography } from '@material-ui/core';

class ListElement extends Component {
  constructor(props) {
    super(props);
    this.state = {
      overflows: false,
      fullShown: true,
      read: !this.props.pr.hasNewComment,
    };
    this.setReadStatus = this.setReadStatus.bind(this);
  }

  componentDidMount() {
    if (this.divWithComments.clientHeight > 40) {
      this.setState({
        overflows: true,
        fullShown: false,
      });
    }
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

  setReadStatus(read) {
    this.setState({ read });
    this.props.pr.hasNewComment = !read;
    this.props.saveInStorage();
  }

  render() {
    return (
      <ListItem key={this.props.pr.link} className="noPadding">
        <ListItemText
          className="noPadding listElem"
          primary={
            <Grid
              container
              dense
              component="a"
              className="buttonHover padding"
              href={this.props.pr.link}
              onClick={() => this.setReadStatus(true)}
              style={{ textDecoration: 'none' }}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Grid item xs>
                <Typography>{this.props.pr.title}</Typography>
              </Grid>
              <Grid item>
                <Typography color="textSecondary">
                  <ReactTimeAgo date={new Date(this.props.pr.updated)} />
                </Typography>
              </Grid>
            </Grid>
          }
          secondary={
            <div
              className={
                'paddingComment ' + (this.props.pr.hasNewComment ? 'isNew' : '')
              }
            >
              <div
                name="showMoreOrLess"
                class={this.state.fullShown ? '' : 'showLess'}
                ref={r => {
                  this.divWithComments = r;
                }}
              >
                {this.listComments(this.props.pr)}
              </div>
              <>
                {this.state.overflows && (
                  <button
                    value="ready"
                    className="commentButton right"
                    onClick={() => {
                      this.setState({ fullShown: !this.state.fullShown });
                    }}
                  >
                    {`SHOW ${this.state.fullShown ? 'LESS' : 'MORE'}`}
                  </button>
                )}
                <button
                  data-length={this.props.pr.commentsData.length}
                  data-isnew={this.state.read}
                  className={`commentButton left ${
                    this.state.read ? '' : 'isNew'
                  }`}
                  onClick={() => this.setReadStatus(!this.state.read)}
                >
                  {this.state.read ? 'MARK AS UNREAD' : 'MARK AS READ'}
                </button>
              </>
            </div>
          }
        />
      </ListItem>
    );
  }
}

ListElement.propTypes = {
  pr: PropTypes.object,
  saveInStorage: PropTypes.func,
};

export default ListElement;

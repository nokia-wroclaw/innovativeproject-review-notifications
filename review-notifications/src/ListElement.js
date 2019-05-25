import React, { Component } from 'react';
import ReactMarkdown from 'react-markdown';
import ReactTimeAgo from 'react-time-ago';
import './Github.css';
import './ListElement.css';

import PropTypes from 'prop-types';

import { Grid, ListItem, ListItemText, Typography } from '@material-ui/core';

class ListElement extends Component {
  listComments(prObject) {
    if (prObject.commentsData.length > 0) {
      const length = prObject.commentsData.length;
      const lastComment = prObject.commentsData[length - 1];
      const result = `${lastComment.user.login}: ${lastComment.body}`;
      return <ReactMarkdown className="noMargin" source={result} />;
    }
    return 'There are no comments';
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

  handleReadButtonOnLoad(e) {
    if (e) {
      if (e.dataset.length === 0) {
        e.classList.add('hidden');
      }
      if (e.dataset.isNew) {
        e.innerHTML = 'Mark as read';
      }
    }
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
              onClick={() => {
                if (this.props.pr.hasNewComment) {
                  this.props.pr.hasNewComment = false;
                  this.props.saveInStorage();
                }
              }}
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
              <div name="showMoreOrLess">
                {this.listComments(this.props.pr)}
              </div>
              <button
                ref={this.handleDisplayButton}
                className="commentButton right"
                onClick={this.handleMoreLess}
              >
                Show more
              </button>
              <button
                ref={this.handleReadButtonOnLoad}
                data-length={this.props.pr.commentsData.length}
                data-isnew={this.props.pr.hasNewComment}
                className="commentButton left"
                onClick={this.handleReadButton.bind(this, this.props.pr)}
              >
                {this.props.pr.hasNewComment
                  ? 'Mark as read'
                  : 'Mark as unread'}
              </button>
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

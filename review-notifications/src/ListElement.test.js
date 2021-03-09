import { mount } from 'enzyme';
import ListElement from './ListElement';
import React from 'react';
import './Github.css';
import './ListElement.css';
import { Grid, ListItemText, Typography, Button } from '@material-ui/core';
import JavascriptTimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';
JavascriptTimeAgo.locale(en);

describe('', () => {
  const props = {
    pr: {
      commentsData: {
        author_association: 'COLLABORATOR',
        body: 'Great!',
        created_at: '2019-04-17T11:24:46Z',
        html_url: 'https://github.com',
        id: 484043785,
        issue_url: 'https://api.github.com/repos/username/reponame/issues/13',
        node_id: 'MDEyOklzc3VlQ29tbWVudDQ4NDA0Mzc4NQ==',
        updated_at: '2019-04-17T11:24:46Z',
        url:
          'https://api.github.com/repos/username/reponame/issues/comments/484043785',
      },
      hasNewComment: true,
      link: 'https://github.com/username/reponame/pull/13',
      requestedReviewers: [],
      title: 'Test pull request 1',
      updated: '2019-05-18T08:00:35Z',
    },
  };

  it('renders correct title', () => {
    const wrapper = mount(<ListElement {...props} />);
    const listItemText = wrapper.find(ListItemText);

    const grid1 = listItemText.prop('primary');
    expect(grid1.type).toBe(Grid);

    const grid2 = grid1.props.children[0];
    expect(grid2.type).toBe(Grid);

    const typography = grid2.props.children;
    expect(typography.type).toBe(Typography);

    const text = typography.props.children;
    expect(text).toEqual(props.pr.title);
  });
  it('should not display show more button', () => {
    props.pr.hasNewComment = true;
    const wrapper = mount(<ListElement {...props} />);
    const listItemText = wrapper.find(ListItemText);
    const div = listItemText.prop('secondary');
    expect(div.type).toBe('div');
    expect(div.props.children[1].props.children[0]).toEqual(false);
  });
  it('can mark as read', () => {
    props.pr.hasNewComment = true;
    const wrapper = mount(<ListElement {...props} />);
    const listItemText = wrapper.find(ListItemText);
    const div = listItemText.prop('secondary');
    expect(div.type).toBe('div');
    const button1 = div.props.children[1].props.children[1];
    expect(button1.type).toBe(Button);
    expect(button1.props.children).toEqual('MARK AS READ');
  });

  it('can mark as unread', () => {
    props.pr.hasNewComment = false;
    const wrapper = mount(<ListElement {...props} />);
    const listItemText = wrapper.find(ListItemText);
    const div = listItemText.prop('secondary');
    expect(div.type).toBe('div');
    const button1 = div.props.children[1].props.children[1];
    expect(button1.type).toBe(Button);
    expect(button1.props.children).toEqual('MARK AS UNREAD');
  });
});

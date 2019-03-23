/*global chrome*/

var opt = {
  type: 'basic',
  title: 'Notification',
  message: 'Hi!',
  iconUrl: 'git-icon.png',
};

chrome.notifications.create(opt);

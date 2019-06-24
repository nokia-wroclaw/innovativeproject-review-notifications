# innovativeproject-review-notifications

## About

Browser extension to notify developers about changes in projects from Github repositories. It's dedicated to Chrome but works also on Firefox.

## Install

Extension is not available in Chrome Store, so it can be installed only from developer mode. To install it you will need [yarn](https://yarnpkg.com/en/docs/install#debian-stable).
Installation steps:

Clone and `cd` into repository

```
git clone https://github.com/nokia-wroclaw/innovativeproject-review-notifications.git
cd innovativeproject-review-notifications/review-notifications
```

Install dependencies and build extension

```
yarn install && yarn build
```

Open [chrome://extensions/](chrome://extensions/) in browser, click `load unpacked` (in upper left corner) and select directory `build` inside `innovativeproject-review-notifications/review-notifications`.

Extension is ready to use. If you don't plan to modify it you can leave only `build` directory.

## Usage

Now you can choose what kind of repositories you'd like to track. To have access to all your repositories you'll need to generate Github token(Settings > Developer settings > Personal access tokens) and add it in extension's Options. If you'd like to follow repositories that aren't related to your Github profile, you can add them in Options > Followed Repositories.

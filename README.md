# github-pull-requests

A JavaScript function that fetches pull requests initiated by a given GitHub user. Works on the client or server side.

## How it works

We query the GitHub API v3 for the full list of available events triggered by the specified user (probably won't reach back further than several months). Each time a pull request **initiated by this user** is referenced, we store that reference. Then we filter out duplicates and finally re-fetch updated information before resolving the Promise with the list of pull requests.

### Install

```
npm install github-pull-requests
```

### API:

`getPullRequests (username[, state[, authOptions]])`

* `username`: any valid GitHub username
* `state` (optional): filters results - "all" (default), "opened", "closed" or "merged" (subset of "closed")
* `authOptions` (optional): options hash containing OAuth2 credentials (see [Auth](#auth) below).

### Usage:

```
var getPullRequests = require('github-pull-requests');

getPullRequests('someuser', 'merged')
  .then(pullRequests => pullRequests.map(pr => pr.url))
  .then(urls => console.log(urls));
```

#### Prints:

```
> Ending query early due to GitHub API fetch limits.
[ 'https://api.github.com/repos/FooWorks/foo-works/pulls/20',
  'https://api.github.com/repos/BarSoft/bar-soft/pulls/492' ]
```

### Auth

If you plan to use this function at least a few times per hour, you will *need* to supply some form of GitHub OAuth with your request: either an OAuth2 token ([obtained via user-side authentication](https://developer.github.com/v3/oauth/#web-application-flow)), or a client ID and secret, which you can obtain by [registering a new OAuth application on GitHub](https://github.com/settings/applications/new) (only safe for server-side auth).

These parameters can be passed into `getPullRequests` as keys in an object, passed as a third argument to the function.

E.g.

```
getPullRequests('someuser', 'all', { oAuthToken: 'OAUTH-TOKEN' })
  .then(/* ... handle data */);
```

or

```
getPullRequests('someuser', 'all', {
  clientId: 'CLIENT-ID',
  clientSecret: 'CLIENT-SECRET'
}).then(/* ... handle data */);
```

## Promises

This module assumes your environment already supports Promises. If you need a polyfill, try [es6-promise](https://github.com/stefanpenner/es6-promise).

# github-pull-requests

A JavaScript function that fetches pull requests initiated by a given GitHub user. Works on the client or server side.

### API:

`getPullRequests (username[, status)`

* `username`: any valid GitHub username
* `state` (optional): filters results - "all" (default), "opened", "closed" or "merged" (subset of "closed")

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

## Promises

This module assumes your environment already supports Promises. If you need a polyfill, try [es6-promise](https://github.com/stefanpenner/es6-promise).

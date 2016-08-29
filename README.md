# git-merged-pull-requests

A function that fetches all merged pull requests initiated by a given GitHub user.

Usage:

```
var gitMergedPullRequests = require('git-merged-pull-requests');

gitMergedPullRequests('someuser')
  .then(pullRequests => pullRequests.map(pr => pr.url))
  .then(url => console.log(url));
```

Prints:

```
> Ending query early due to GitHub API fetch limits.
[ 'https://api.github.com/repos/FooWorks/foo-works/pulls/20',
  'https://api.github.com/repos/BarSoft/bar-soft/pulls/492' ]
```

## Promises

This module assumes your environment already supports Promises. If you need a polyfill, try [es6-promise](https://github.com/stefanpenner/es6-promise).

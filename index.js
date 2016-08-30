/* Using the GitHub API, fetches data for public pull
 * requests by a given user.
 *
 * Due to the API's limitations, results are limited to
 * recent months.
 *
 * Ben Wiley 2016
 */

var axios = require('axios');

function request (url, authOptions) {
  return axios.get(url, {
    headers: authOptions.oAuthToken ? {
      'Authentication': 'token ' + authOptions.oAuthToken
    } : void 0,
    params: {
      'client_id': authOptions.clientId || void 0,
      'client_secret': authOptions.clientSecret || void 0
    }
  });
}

// https://gist.github.com/niallo/3109252
function parseLinkHeader (header) {
  if (header.length === 0) {
    throw new Error('input must not be of zero length');
  }

  // Split parts by comma
  var parts = header.split(',');
  var links = {};
  // Parse each part into a named link
  parts.forEach(function (p) {
    var section = p.split(';');
    if (section.length !== 2) {
      throw new Error('section could not be split on \';\'');
    }
    var url = section[0].replace(/<(.*)>/, '$1').trim();
    var name = section[1].replace(/rel="(.*)"/, '$1').trim();
    links[name] = url;
  });

  return links;
}

function getPageLimit (header, existingLimit) {
  var parsedLinkHeader = parseLinkHeader(header);
  var lastPage = (
    parsedLinkHeader.last &&
    parsedLinkHeader.last.indexOf('page=') !== -1 &&
    parsedLinkHeader.last.split('page=')[1].split('&')[0]
  );
  return lastPage || existingLimit;
}

function getEvents (username, authOptions, prev, page, pageLimit) {
  prev = prev || [];
  page = page || 1;
  pageLimit = pageLimit || null;

  return request('https://api.github.com/users/' + username + '/events?page=' + page, authOptions)
    .then(function (res) {
      var events = res.data;
      if (!events.length) {
        return prev;
      }
      var newPageLimit = getPageLimit(res.headers.link, pageLimit);
      if (page >= newPageLimit) {
        console.warn('Ending query early due to GitHub API fetch limits.');
        return prev;
      }
      return getEvents(
        username,
        authOptions,
        prev.concat(events),
        ++page,
        newPageLimit
      );
    });
}

function getAllPullRequests (username, authOptions) {
  return getEvents(username, authOptions)
    .then(function (events) {
      return events
        .filter(function (event) {
          return (
            event.payload &&
            event.payload.pull_request &&
            event.payload.pull_request.user &&
            event.payload.pull_request.user.login &&
            event.payload.pull_request.user.login.toUpperCase() === username.toUpperCase()
          );
        })
        .map(function (event) {
          return event.payload.pull_request;
        })
        // filter out duplicates so our re-fetch isn't excessive.
        .reduce(function (prev, curr) {
          var exists = prev.some(function (pr) {
            return pr.id === curr.id;
          });
          if (exists) {
            return prev;
          }
          return prev.concat(curr);
        }, []);
    })
    // re-fetch each pull request for updated information.
    .then(function (pullRequests) {
      return Promise.all(pullRequests.map(function (pr) {
        return request(pr.url, authOptions)
          .then(function (res) {
            return res.data;
          });
      }));
    });
}

function getPullRequests (username, state, authOptions) {
  state = state || 'all';
  authOptions = authOptions || {};

  return getAllPullRequests(username, authOptions)
    .then(function (pullRequests) {
      return pullRequests.filter(function (pr) {
        switch (state) {
          case 'merged':
            return pr.merged;
          case 'open':
            return pr.state === 'open';
          case 'closed':
            return pr.state === 'closed';
          default:
            return true;
        }
      });
    });
}

module.exports = getPullRequests;

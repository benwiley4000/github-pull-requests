/* Using the GitHub API, fetches data for public pull
 * requests by a given user.
 *
 * Due to the API's limitations, results are limited to
 * recent months.
 *
 * Ben Wiley 2016
 */

var axios = require('axios');

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

function getEvents (username, prev, page, pageLimit) {
  prev = prev || [];
  page = page || 1;
  pageLimit = pageLimit || null;

  return axios
    .get('https://api.github.com/users/' + username + '/events?page=' + page)
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
      return getEvents(username, prev.concat(events), ++page, newPageLimit);
    });
}

function getAllPullRequests (username) {
  return getEvents(username)
    .then(function (events) {
      return events
        .filter(function (event) {
          return (
            event.type === 'PullRequestEvent' &&
            event.payload.action === 'opened'
          );
        })
        .map(function (event) {
          return event.payload.pull_request;
        });
    })
    // re-fetch each pull request for updated information.
    .then(function (pullRequests) {
      return Promise.all(pullRequests.map(function (pr) {
        return axios
          .get(pr.url)
          .then(function (res) {
            return res.data;
          });
      }));
    });
}

function getPullRequests (username, state) {
  state = state || 'all';

  return getAllPullRequests(username)
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

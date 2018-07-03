(function () {
  'use strict'

  if (window.chrome) {
    window.browser = window.chrome
  } else {
    window.browser = browser
  }

  // User page

  function addUserPageStylesheet () {
    let css = document.createElement('style')
    css.type = 'text/css'
    css.innerHTML = `
    .user-filter {
      background-color: #065a8f;
      border: 1px solid white;
      color: white;
      padding: 5px;
    }

    .user-filter:hover {
      cursor: pointer;
    }`

    document.head.appendChild(css)
  }

  function setUpUserPage () {
    window.browser.runtime.sendMessage({
      'type': 'get'
    }, function (res) {
      const userIdList = res.data

      const userId = href.split('/').pop()
      const userName = document.title.split("'s profile")[0]

      let hideButton = document.createElement('span')
      hideButton.className = 'user-filter'

      if (userIdList.indexOf(userId) > -1) {
        hideButton.textContent = 'remove comment filter'
      } else {
        hideButton.textContent = 'add comment filter'
      }

      document.querySelector('.content > .container').prepend(hideButton)

      hideButton.addEventListener('click', function () {
        if (hideButton.textContent === 'remove comment filter') {
          removeUserFromFilter(userId)
          hideButton.textContent = 'add comment filter'
        } else {
          addUserToFilter(userName, userId)
          hideButton.textContent = 'remove comment filter'
        }
      })
    })
  }

  // Comment thread page

  function addCommentThreadStylesheet () {
    let css = document.createElement('style')
    css.type = 'text/css'
    css.innerHTML = `
    .filtered-comment {
      color: lightslategray !important;
    }

    .filtered-comment a {
      color: lightslategray !important;
    }

    .filtered-comment .smallcopy {
      color: lightslategray !important;
    }`

    document.head.appendChild(css)
  }

  function filterThread (filterIndex = 0) {
    window.browser.runtime.sendMessage({
      'type': 'get'
    }, function (res) {
      const userIdList = res.data

      const comments = Array.from(document.querySelectorAll('div.comments')).slice(0, -2)
      const commentAuthors = Array.from(document.querySelectorAll('.smallcopy > a:first-child')).slice(1, -1)

      for (let i = filterIndex; i < commentAuthors.length; i++) {
        let userId = commentAuthors[i].href.split('/').pop()
        filterComment(userIdList, userId, comments[i])
      }
    })
  }

  function filterRecentActivity () {
    window.browser.runtime.sendMessage({
      'type': 'get'
    }, function (res) {
      const userIdList = res.data

      const comments = Array.from(document.querySelectorAll('div.racomments'))
      const commentAuthors = Array.from(document.querySelectorAll('a.rauname'))

      for (let i = 0; i < commentAuthors.length; i++) {
        let userId = commentAuthors[i].href.split('/').pop()
        filterComment(userIdList, userId, comments[i])
      }
    })
  }

  function filterComment (userIdList, userId, comment) {
    let hideSpan = document.createElement('span')
    hideSpan.classList.add('filter-' + userId)

    if (userIdList.indexOf(userId) > -1) {
      comment.classList.add('filtered-comment')
    }
  }

  // Database functions

  function addUserToFilter (userName, userId) {
    window.browser.runtime.sendMessage({
      'type': 'add',
      'data': {'userName': userName, 'userId': userId}
    })
  }

  function removeUserFromFilter (userId) {
    window.browser.runtime.sendMessage({
      'type': 'delete',
      'data': userId
    })
  }

  let href = document.location.href

  if (href.match(/metafilter\.com\/[0-9]+\//)) {
    // On comment thread
    addCommentThreadStylesheet()
    filterThread()
    let commentCount = 0

    let target = document.getElementById('newcommentsmsg')
    new MutationObserver(function () {
      let newDiv = document.getElementById('newcommentsmsg')
      if (newDiv.style.display === 'none') {
        // Only re-filter new comments
        filterThread(commentCount)
        commentCount = document.querySelectorAll('div.comments').length - 2
      }
    }).observe(target, {
      attributes: true,
      attributeFilter: ['style']
    })
  } else if (href.match(/metafilter\.com\/contribute\/activity\//)) {
    // On recent activity page
    addCommentThreadStylesheet()
    filterRecentActivity()
  } else if (href.match(/metafilter\.com\/user\//)) {
    // On user page
    addUserPageStylesheet()
    setUpUserPage()
  }
})()

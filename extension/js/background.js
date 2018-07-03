(function () {
  'use strict'

  if (window.chrome) {
    window.browser = window.chrome
  } else {
    window.browser = browser
  }

  const DB_NAME = 'metafilter-filter-test'
  const DB_VERSION = 1
  const DB_PAGE_STORE_NAME = 'user'

  let db

  openDB()

  window.browser.runtime.onMessage.addListener(handleMessage)

  function handleMessage (request, sender, sendResponse) {
    console.log('message', request)
    const type = request.type
    const data = request.data
    if (type === 'get') {
      getAllItemsInStore(DB_PAGE_STORE_NAME, sendResponse)
      return true
    } else if (type === 'add') {
      addToDB(data)
    } else if (type === 'delete') {
      removeFromDB(data)
    }
  }

  function openDB () {
    const req = indexedDB.open(DB_NAME, DB_VERSION)

    req.onupgradeneeded = function (evt) {
      db = this.result

      if (!db.objectStoreNames.contains('user')) {
        let objectStore = db.createObjectStore('user',
          { keyPath: 'userId', autoIncrement: false })
        objectStore.createIndex('userName', 'userName')
      }
    }

    req.onsuccess = function (evt) {
      db = this.result
    }

    req.onerror = function (evt) {
      console.error('Failed to open filter list DB')
      console.error(this.error)
    }
  }

  function addToDB (entry) {
    const store = getObjectStore(DB_PAGE_STORE_NAME, 'readwrite')
    const req = store.put(entry)

    req.onsuccess = function (evt) {
      console.log('Successfully added to filter list:', entry.userName)
    }

    req.onerror = function (evt) {
      console.error('Failed to add to filter list:', entry.userName)
      console.error(this.error)
    }
  }

  function removeFromDB (id) {
    const store = getObjectStore(DB_PAGE_STORE_NAME, 'readwrite')
    const req = store.delete(id)

    req.onsuccess = function (evt) {
      console.log('Successfully deleted from filter list:', id)
    }

    req.onerror = function (evt) {
      console.error('Failed to remove from filter list:', id)
      console.error(this.error)
    }
  }

  function getObjectStore (storeName, mode) {
    const tx = db.transaction(storeName, mode)
    return tx.objectStore(storeName)
  }

  function getAllItemsInStore (storeName, sendResponse) {
    const tx = db.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)
    const req = store.openCursor()
    const items = []

    req.onsuccess = function (evt) {
      const cursor = evt.target.result
      if (cursor) {
        items.push(cursor.value.userId)
        cursor.continue()
      }
    }

    req.onerror = function (evt) {
      console.error('Failed to prepare:', storeName)
      console.error(this.error)
    }

    tx.oncomplete = function () {
      sendResponse({ 'data': items })
    }
  }
})()

RemoteStorage.defineModule('tiddlers', function (privateClient) {

  privateClient.on('conflict', function (event) {
    console.log("Conflict:", event);
    event.resolve('local');
  });

  var defaultWikiID = 'default';

  function path(tiddler, wikiID) {
    return wikiID + '/' + tiddler.id;
  }

  return {
    exports: {
      on: privateClient.on,

      save: function (tiddler, wikiID) {
        wikiID = wikiID || defaultWikiID;
        if (!tiddler.id) {
          tiddler.id = Math.uuid();
        }
        return privateClient.storeObject('tiddler', path(tiddler, wikiID), tiddler);
      },

      remove: function (tiddler, wikiID) {
        wikiID = wikiID || defaultWikiID;
        return privateClient.remove(path(tiddler, wikiID));
      },

      getAll: function (wikiID) {
        wikiID = wikiID || defaultWikiID;
        return privateClient.getAll(wikiID + '/');
      }

    }
  };
});

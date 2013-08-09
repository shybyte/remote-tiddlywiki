function log() {
  console.log.apply(console, arguments);
}

function clone(object, properties) {
  var clone = {};
  properties.forEach(function (property) {
    clone[property] = object[property];
  });
  return clone;
}


function saveModifiedTiddlers() {
  log('Saving modified tiddlers ...');
  var tiddlers = store.getTiddlers();
  tiddlers.forEach(function (tiddler) {
    log(tiddler);
    var propertiesToSave = ['title', 'text', 'modifier', 'modified', 'tags', 'created', 'fields', 'creator'];
    var tiddlerData = clone(tiddler, propertiesToSave);
    localStorage.setItem('TIDDLER_' + tiddler.title, JSON.stringify(tiddler));
  });
}

function loadTiddlers() {
  log('Load Tiddlers tiddlers ...');
  for (var key in localStorage) {
    var tiddlerKeyMatch = /^TIDDLER_(.*)$/.exec(key);
    if (tiddlerKeyMatch) {
      var tiddlerData = JSON.parse(localStorage.getItem(key));
      tiddlerData.created = new Date(tiddlerData.created);
      tiddlerData.modified = new Date(tiddlerData.modified);
      var tiddler = store.getTiddler(tiddlerData.title);
      if (!tiddler) {
        tiddler = store.createTiddler(tiddlerData.title);
      }
      tiddler.set(tiddlerData.title, tiddlerData.text, tiddlerData.modifier, tiddlerData.modified,
        tiddlerData.tags, tiddlerData.created, tiddlerData.fields, tiddlerData.creator);
    }
  }
  refreshDisplay();
  story.refreshAllTiddlers();
  restart();
}

// restart();
// story.closeAllTiddlers()
// story.displayDefaultTiddlers();

//setInterval(saveTiddlers, 1000);

window.checkUnsavedChanges = undefined;
window.confirmExit = function () {}
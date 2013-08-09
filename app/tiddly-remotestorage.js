function log() {
  if (window.console) {
    console.log.apply(console, arguments);
  }
}

function debounce(func, wait, immediate) {
  var result;
  var timeout = null;
  return function () {
    var context = this, args = arguments;
    var later = function () {
      timeout = null;
      if (!immediate) result = func.apply(context, args);
    };
    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) result = func.apply(context, args);
    return result;
  };
}

function clone(object, properties) {
  var clone = {};
  properties.forEach(function (property) {
    clone[property] = object[property];
  });
  return clone;
}


function saveTiddlers() {
  log('Saving modified tiddlers ...');
  var tiddlers = store.getTiddlers();
  var tiddlerByID = {};
  tiddlers.forEach(function (tiddler) {
    if (tiddler.id) {
      tiddlerByID[tiddler.id] = tiddler;
    }
    if (tiddler.id && tiddler.modified.getTime() <= new Date(loadedTiddlerDTOByID[tiddler.id].modified).getTime()) {
      return;
    }
    var propertiesToSave = ['title', 'text', 'modifier', 'modified', 'tags', 'created', 'fields', 'creator', 'id'];
    var tiddlerData = clone(tiddler, propertiesToSave);
    log("Saving:", tiddler);
    remoteStorage.tiddlers.save(tiddlerData);
    tiddler.id = tiddlerData.id;
    tiddlerByID[tiddler.id] = tiddler;
  });

  // remove tiddlers
  var loadedTiddlerDTOS = Object.values(loadedTiddlerDTOByID);
  loadedTiddlerDTOS.forEach(function (tiddlerDTO) {
    if (!tiddlerByID[tiddlerDTO.id]) {
      log("Removing:", tiddlerDTO);
      remoteStorage.tiddlers.remove(tiddlerDTO);
    }
  });

}

var loadedTiddlerDTOByID = [];

function loadTiddlers() {
  log('Load Tiddlers ...');
  remoteStorage.tiddlers.getAll().then(function (tiddlerDTOsByID) {
    var tiddlerDTOs = Object.values(tiddlerDTOsByID);
    log('tiddlerDTOs:', tiddlerDTOs);
    tiddlerDTOs.forEach(addTiddler);
    restartOnce();
  });
}

function addTiddler(tiddlerDTO) {
  loadedTiddlerDTOByID[tiddlerDTO.id] = tiddlerDTO;
  var tiddler = store.createTiddler(tiddlerDTO.title);
  tiddler.id = tiddlerDTO.id;
  tiddler.set(tiddlerDTO.title, tiddlerDTO.text, tiddlerDTO.modifier, new Date(tiddlerDTO.modified),
    tiddlerDTO.tags, new Date(tiddlerDTO.created), tiddlerDTO.fields, tiddlerDTO.creator);
  refresh();
  restartOnce();
}


function getTiddler(id) {
  return  store.getTiddlers().filter({id: id})[0];
}

function updateTiddler(tiddlerDTO) {
  loadedTiddlerDTOByID[tiddlerDTO.id] = tiddlerDTO;
  var existingTiddler = getTiddler(tiddlerDTO.id)
  if (!existingTiddler) {
    addTiddler(tiddlerDTO);
    return;
  }
  existingTiddler.set(tiddlerDTO.title, tiddlerDTO.text, tiddlerDTO.modifier, new Date(tiddlerDTO.modified),
    tiddlerDTO.tags, new Date(tiddlerDTO.created), tiddlerDTO.fields, tiddlerDTO.creator);
  refresh();
}

function removeTiddler(tiddlerDTO) {
  delete loadedTiddlerDTOByID[tiddlerDTO.id];
  var existingTiddler = getTiddler(tiddlerDTO.id);
  if (existingTiddler) {
    store.remove(existingTiddler.title);
  }
  refresh();
}

var refresh = debounce(function () {
  refreshDisplay();
  story.refreshAllTiddlers();
}, 500);

var restartedOnce = false;
var restartOnce = debounce(function () {
  if (restartedOnce) return;
  restartedOnce = true;
  refreshDisplay();
  story.refreshAllTiddlers();
  restart();
}, 500);


// story.closeAllTiddlers()
// story.displayDefaultTiddlers();

config.options.chkHttpReadOnly = false;
config.options.chkAutoSave = true;
var useJavaSaver = false;
var showBackstage = false; // Whether to include the backstage area
merge(config.shadowTiddlers, {
  DefaultTiddlers: '',//"[[GettingStarted]]",
  MainMenu: "[[GettingStarted]]",
  SiteTitle: "My TiddlyWiki",
  SiteSubtitle: "a reusable non-linear personal web notebook",
  SiteUrl: "",
  SideBarOptions: '<<search>><<newTiddler>><<newJournal "DD MMM YYYY" "journal">><<closeAll>><<slider chkSliderOptionsPanel OptionsPanel "options \u00bb" "Change TiddlyWiki advanced options">>',
  SideBarTabs: '<<tabs txtMainTab "Timeline" "Timeline" TabTimeline "All" "All tiddlers" TabAll "Tags" "All tags" TabTags "More" "More lists" TabMore>>',
  TabMore: '<<tabs txtMoreTab "Missing" "Missing tiddlers" TabMoreMissing "Orphans" "Orphaned tiddlers" TabMoreOrphans "Shadowed" "Shadowed tiddlers" TabMoreShadowed>>'
});
window.checkUnsavedChanges = undefined;
window.confirmExit = function () {
}

remoteStorage.claimAccess({tiddlers: 'rw' });
remoteStorage.displayWidget();


remoteStorage.tiddlers.on('change', function (event) {
  log(event);
  if (event.newValue && !event.oldValue) {
    addTiddler(event.newValue);
  } else if (event.newValue && event.oldValue) {
    updateTiddler(event.newValue);
  } else if (!event.newValue && event.oldValue) {
    removeTiddler(event.oldValue);
  }
});

loadTiddlers();

// Save this tiddlywiki with the pending changes
function saveChanges(onlyIfDirty, tiddlers) {
  log(onlyIfDirty, tiddlers);
  if (onlyIfDirty && !store.isDirty()) return;
  saveTiddlers(tiddlers);
  store.setDirty(false);
}
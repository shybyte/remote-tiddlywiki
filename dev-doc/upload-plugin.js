version.extensions.UploadTiddlerPlugin = {
  major: 1, minor: 2, revision: 2,
  date: new Date("2008-09-13"),
  source: 'http://tiddlywiki.bidix.info/#UploadTiddlerPlugin',
  author: 'BidiX (BidiX (at) bidix (dot) info',
  coreVersion: '2.3.0'
};

if (!window.bidix) window.bidix = {}; // bidix namespace
bidix.debugMode = false;
bidix.uploadTiddler = {
  messages: {
    aboutToSaveTiddler: "About to update tiddler '%0'...",
    aboutToRemotelySaveTiddler: "About to REMOTELY update tiddler '%0'...",
    storeTiddlerNotFound: "Script store tiddler '%0' not found",
    tiddlerSaved: "Tiddler '%0' updated in '%1' using '%2' "
  },
  upload: function(title,tiddler,oldTitle) {
    var callback = function(status,params,responseText,url,xhr) {
      if (xhr.status == 404) {
        alert(bidix.uploadTiddler.messages.storeTiddlerNotFound.format([url]));
        return;
      }
      if ((bidix.debugMode) || (responseText.indexOf("Debug mode") >= 0 )) {
        alert(responseText);
        if (responseText.indexOf("Debug mode") >= 0 )
          responseText = responseText.substring(responseText.indexOf("\n\n")+2);
      } else if (responseText.charAt(0) != '0')
        alert(responseText);
      else
        displayMessage(bidix.uploadTiddler.messages.tiddlerSaved.format([params[0], params[1], params[2]]));
      store.setDirty(false);
    }

    if ((config.options['chkUploadTiddler']) &&
      ((document.location.toString().substr(0,4) == "http") || config.options['chkUploadTiddlerFromFile'])) {
      clearMessage();
      if (document.location.toString().substr(0,4) != "http")
        displayMessage(bidix.uploadTiddler.messages.aboutToRemotelySaveTiddler.format([title]));
      else
        displayMessage(bidix.uploadTiddler.messages.aboutToSaveTiddler.format([title]));
      var ExtTiddler = null;
      var html = null;
      if (tiddler) {
        ExtTiddler = store.getSaver().externalizeTiddler(store,tiddler);
        html = wikifyStatic(tiddler.text,null,tiddler).htmlEncode();
      }
      var form = "title="+encodeURIComponent(title);
      form = form + "&tiddler="+(ExtTiddler?encodeURIComponent(ExtTiddler):'');
      form = form + "&html="+(html?encodeURIComponent(html):'');
      var filename = (config.options['txtUploadFilename']?config.options['txtUploadFilename']:'index.html');
      form = form +"&oldTitle="+encodeURIComponent(oldTitle);
      form = form +"&fileName="+encodeURIComponent(filename);
      form = form +"&backupDir="+encodeURIComponent(config.options['txtUploadBackupDir']);
      form = form +"&user="+encodeURIComponent(config.options['txtUploadUserName']);
      form = form +"&password="+encodeURIComponent(config.options['pasUploadPassword']);
      form = form +"&uploadir="+encodeURIComponent(config.options['txtUploadDir']);
      form = form +"&debug="+encodeURIComponent(0);
      var storeScript = (config.options.txtUploadTiddlerStoreUrl
        ? config.options.txtUploadTiddlerStoreUrl : 'storeTiddler.php');
      var r = doHttp("POST",storeScript,form+"\n",'application/x-www-form-urlencoded',
        config.options['txtUploadUserName'],config.options['pasUploadPassword'],callback,Array(title,filename, storeScript),null);
    }
  }
}
TiddlyWiki.prototype.saveTiddler_bidix = TiddlyWiki.prototype.saveTiddler;
TiddlyWiki.prototype.saveTiddler = function(oldTitle,newTitle,newBody,modifier,modified,tags,fields,clearChangeCount,created) {
  var tiddler = TiddlyWiki.prototype.saveTiddler_bidix.apply(this,arguments);
  var title = (newTitle?newTitle:oldTitle);
  if (oldTitle == title)
    oldTitle = '';
  bidix.uploadTiddler.upload(title, tiddler, oldTitle);
}
TiddlyWiki.prototype.removeTiddler_bidix =TiddlyWiki.prototype.removeTiddler;
TiddlyWiki.prototype.removeTiddler = function(title) {
  TiddlyWiki.prototype.removeTiddler_bidix.apply(this,arguments);
  bidix.uploadTiddler.upload(title, null);
}

//
// Initializations
//

bidix.initOption = function(name,value) {
  if (!config.options[name])
    config.options[name] = value;
};

// styleSheet
setStylesheet('.txtUploadTiddlerStoreUrl {width: 22em;}',"uploadTiddlerPluginStyles");

//optionsDesc
merge(config.optionsDesc,{
  txtUploadTiddlerStoreUrl: "Url of the UploadTiddlerService script (default: storeTiddler.php)",
  chkUploadTiddler: "Do per Tiddler upload using txtUploadTiddlerStoreUrl (default: false)",
  chkUploadTiddlerFromFile: "Upload tiddler even if TiddlyWiki is located on local file (default: false)"
});

// Options Initializations
bidix.initOption('txtUploadTiddlerStoreUrl','');
bidix.initOption('chkUploadTiddler','');
bidix.initOption('chkUploadTiddlerFromFile','');


// add options in backstage UploadOptions
if (config.macros.uploadOptions) {
  if (config.macros.uploadOptions.options) {
    config.macros.uploadOptions.options.push("txtUploadTiddlerStoreUrl","chkUploadTiddler", "chkUploadTiddlerFromFile");
  }
}
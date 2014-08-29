/* toxlog.js - An activity logger, especially - an error reporter
 *
 * Copyright 2012-2014, IDEAconsult Ltd. http://www.ideaconsult.net/
 * Created by Ivan Georgiev
**/

var jToxLog = (function () {
  var defaultSettings = { // all settings, specific for the kit, with their defaults. These got merged with general (jToxKit) ones.
    statusDelay: 1500,      // number of milliseconds to keep success / error messages before fading out
    resendEvents: false,    // whether received onConnect, onSuccess and onError events are passed back to original jToxKit one's.
    onStatus: null,         // a callback, when new status has arrived: function (newstatus, oldstatus)
    onLine: null,           // a new line callback: function (service, status)
  };
  
  var cls = function (root, settings) {
    var self = this;
    self.rootElement = root;
    jT.$(root).addClass('jtox-toolkit'); // to make sure it is there even when manually initialized

    self.settings = jT.$.extend(true, {}, defaultSettings, jT.settings, settings);
    self.rootElement.appendChild(jT.getTemplate('#jtox-logger'));
    
    // save the originals in case we need them for resending
    if (!!self.settings.resendEvents) {
      self.originals = {
        onConnect: jT.onConnect,
        onSuccess: jT.onSuccess,
        onError: jT.onError
      };
    }
    
    // now the actual UI manipulation functions...
    var listRoot = $('.list-root', self.rootElement)[0];
    var statusEl = $('.status', self.rootElement)[0];
    
    var setIcon = function (root, status) {
      if (status == "error")
        jT.$(root).addClass('ui-state-error');
      else
        jT.$(root).removeClass('ui-state-error');

      if (status == "error")
        jT.$('.icon', root).addClass('ui-icon ui-icon-alert').removeClass('loading');
      else if (status == "success")
        jT.$('.icon', root).addClass('ui-icon ui-icon-check').removeClass('loading');
      else {
        jT.$('.icon', root).removeClass('ui-icon ui-icon-check ui-icon-alert');
        if (status == "connecting")
          jT.$('.icon', root).addClass('loading');
        
      }
    };
    
    var setStatus = function (status) {
      $(".icon", statusEl).removeClass("jt-faded");
      setIcon (statusEl, status);
      if (status == "error" || status == "success") {
        setTimeout(function () { 
          jT.$('.icon', statusEl).addClass('jt-faded'); 
        }, self.settings.statusDelay);
      }
      ccLib.fireCallback(self.settings.onStatus, self, status, self.theStatus);
      self.theStatus = status;
    };
    
    var addLine = function (line) {
      var el = jT.getTemplate("#jtox-logline");
      listRoot.insertBefore(el, listRoot.firstElementChild);
      $('.content', el)[0].innerHTML = line;
      return el;
    };
    
    setStatus('');
    
    // this is the queue of events - indexes by the passed service
    self.events = {};
    
    jT.onConnect = function (service, params) {
      setStatus("connecting");
      var line = addLine(service, params.method.toUpperCase() + ": " + service);
      self.events[service] = line;
      setIcon(line, 'connecting');
      if (!!self.settings.resendEvents)
        ccLib.fireCallback(self.originals.onConnect, this, service, params);
    };
    
    jT.onSuccess = function (service, status, jhr) {
      setStatus("success");
      var line = self.events[service];
      if (!line) {
        console.log("jToxLog: missing line for:" + service);
        return;
      }
      delete self.events[service];
      setIcon(line, 'success');
      if (!!self.settings.resendEvents)
        ccLib.fireCallback(self.originals.onSuccess, this, service, status, jhr);
    };
    
    jT.onError = function (service, status, jhr) {
      setStatus("error");
      var line = self.events[service];
      if (!line) {
        console.log("jToxLog: missing line for:" + service + "(" + status + ")");
        return;
      }
      delete self.events[service];
      setIcon(line, 'error');
      if (!!self.settings.resendEvents)
        ccLib.fireCallback(self.originals.onError, this, service, status, jhr);
    };
  };
  
  return cls;
})();

/* toxlog.js - An activity logger, especially - an error reporter
 *
 * Copyright 2012-2014, IDEAconsult Ltd. http://www.ideaconsult.net/
 * Created by Ivan Georgiev
**/

var jToxLog = (function () {
  var defaultSettings = { // all settings, specific for the kit, with their defaults. These got merged with general (jToxKit) ones.
    statusDelay: 1500,      // number of milliseconds to keep success / error messages before fading out
    keepMessages: 50,       // how many messages to keep in the queue
    lineHeight: "20px",     // the height of each status line
    rightSide: false,       // put the status icon on the right side
    hasDetails: true,       // whether to have the ability to open each line, to show it's details
    onStatus: null,         // a callback, when new status has arrived: function (newstatus, oldstatus)
    
    // line formatting function - function (service, params, status, jhr) -> { header: "", details: "" }
    formatLine: function (service, params, status, jhr) {
      if (params != null)
        return { 
          header: params.method.toUpperCase() + ": " + service,
          details: "..."
        };
      else if (jhr != null)
        // by returning only the details part, we leave the header as it is.
        return {
          details: jhr.status + " " + jhr.statusText + '<br/>' + jhr.getAllResponseHeaders()
        };
      else
        return null;
    }       
  };
  
  var cls = function (root, settings) {
    var self = this;
    self.rootElement = root;
    jT.$(root).addClass('jtox-toolkit'); // to make sure it is there even when manually initialized

    self.settings = jT.$.extend(true, {}, defaultSettings, jT.settings, settings);
    self.rootElement.appendChild(jT.getTemplate('#jtox-logger'));
    
    if (typeof self.settings.lineHeight == "number")
      self.settings.lineHeight = self.settings.lineHeight.toString() + 'px';
    if (typeof self.settings.keepMessages != "number")
      self.settings.keepMessages = parseInt(self.settings.keepMessages);
      
    // now the actual UI manipulation functions...
    var listRoot = $('.list-root', self.rootElement)[0];
    var statusEl = $('.status', self.rootElement)[0];

    if (!!self.settings.rightSide) {
      statusEl.style.right = '0px';
      jT.$('.list-wrap', self.rootElement).addClass('right-side');
    }
    else
      statusEl.style.left = '0px';
    
    var setIcon = function (root, status) {
      if (status == "error")
        jT.$(root).addClass('ui-state-error');
      else
        jT.$(root).removeClass('ui-state-error');

      if (status == "error")
        jT.$('.icon', root).addClass('ui-icon ui-icon-alert').removeClass('loading ui-icon-check');
      else if (status == "success")
        jT.$('.icon', root).addClass('ui-icon ui-icon-check').removeClass('loading ui-icon-alert');
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
          var hasConnect = false;
          jT.$('.logline', listRoot).each(function () {
            if (jT.$(this).data('status') == "connecting")
              hasConnect = true;
          });
          if (hasConnect)
            setStatus("connecting");
        }, self.settings.statusDelay);
      }
      ccLib.fireCallback(self.settings.onStatus, self, status, self.theStatus);
      self.theStatus = status;
    };
    
    var addLine = function (data) {
      var el = jT.getTemplate("#jtox-logline");
      el.style.height = '0px';
      listRoot.insertBefore(el, listRoot.firstElementChild);
      ccLib.fillTree(el, data);
      setTimeout(function () { el.style.height = self.settings.lineHeight; }, 150);
      if (!!self.settings.hasDetails) {
        jT.$('.icon', el).on('click', function (e) {
          jT.$(el).toggleClass('openned');
          if (jT.$(el).hasClass("openned")) {
            var height = 0;
            jT.$('.data-field', el).each(function () {
              height += this.offsetHeight;
            });
            el.style.height = (height + 6) + 'px';
          }
          else
            el.style.height = self.settings.lineHeight;
        });
      }
      
      while (listRoot.childNodes.length > self.settings.keepMessages)
        listRoot.removeChild(listRoot.lastElementChild);

      return el;
    };
    
    setStatus('');
    
    // this is the queue of events - indexes by the passed service
    self.events = {};
    
    var onConnect = function (service, params) {
      setStatus("connecting");
      var line = addLine(ccLib.fireCallback(self.settings.formatLine, this, service, params, null, null));
      self.events[service] = line;
      setIcon(line, 'connecting');
      jT.$(line).data('status', "connecting");
    };
    
    var onSuccess = function (service, status, jhr) {
      setStatus("success");
      var line = self.events[service];
      if (!line) {
        console.log("jToxLog: missing line for:" + service);
        return;
      }
      delete self.events[service];
      setIcon(line, 'success');
      ccLib.fillTree(line, ccLib.fireCallback(self.settings.formatLine, this, service, null, status, jhr));
      jT.$(line).data('status', "success");
    };
    
    var onError = function (service, status, jhr) {
      setStatus("error");
      var line = self.events[service];
      if (!line) {
        console.log("jToxLog: missing line for:" + service + "(" + status + ")");
        return;
      }
      delete self.events[service];
      setIcon(line, 'error');
      ccLib.fillTree(line, ccLib.fireCallback(self.settings.formatLine, this, service, null, status, jhr));
      jT.$(line).data('status', "error");
    };
    
    // now, finally swipe through everybody and install me...
    var installHnd = function (kit) {
      if (kit == null || kit == self)
        return;
        
      kit.settings.onConnect = onConnect;
      kit.settings.onError = onError;
      kit.settings.onSuccess = onSuccess;
    };
    
    installHnd(jT);
  };
  
  cls.prototype.modifyUri = function (uri) { 
    return uri;
  };
  
  return cls;
})();

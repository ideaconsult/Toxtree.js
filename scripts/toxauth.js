/* toxauth.js - Several kits for querying/manipulating authorization-related stuff: policies, roles, users
 *
 * Copyright 2012-2014, IDEAconsult Ltd. http://www.ideaconsult.net/
 * Created by Ivan Georgiev
**/

/* jToxPolicy - manages connection between user roles and permitted actions on specified services
*/
var jToxPolicy = (function () {
  var defaultSettings = { // all settings, specific for the kit, with their defaults. These got merged with general (jToxKit) ones.
    loadOnInit: false,      // whether to make initial load upon initializing the kit
    sDom: "rt",
    configuration: { 
      columns : {
        policy: {
          'Id': { iOrder: 0, sClass: "center", sDefaultContent: '', bSortable: false, sTitle: "Id", mData: "uri", sWidth: "50px", mRender: function (data, type, full) {
            if (type == 'sort')
              return !!data ? '0' : '1';
            else if (type != 'display')
              return data || '';
            else if (!data)
              return '<span class="ui-icon ui-icon-plusthick jt-inlineaction jtox-inline jtox-hidden" data-action="add"></span>';
            else
              return '<span class="ui-icon ui-icon-closethick jt-inlineaction jtox-inline" data-action="remove"></span>';
          }},
          'Role': { iOrder: 1, sTitle: "Role", sDefaultContent: '', sWidth: "20%", mData: "role", mRender: jT.ui.inlineChanger('role', 'select', '-- Role --') },
          'Service': {iOrder: 3, sTitle: "Service", sDefaultContent: '', mData: "resource", sWidth: "40%", mRender: jT.ui.inlineChanger('resource', 'text', 'Service_') },
          'Get': { iOrder: 4, sClass: "center", sTitle: "Get", bSortable: false, sDefaultContent: '', mData: "methods.get", mRender: jT.ui.inlineChanger('methods.get', 'checkbox') },
          'Post': { iOrder: 5, sClass: "center", sTitle: "Post", bSortable: false, sDefaultContent: '', mData: "methods.post", mRender: jT.ui.inlineChanger('methods.post', 'checkbox') },
          'Put': { iOrder: 6, sClass: "center", sTitle: "Put", bSortable: false, sDefaultContent: '', mData: "methods.put", mRender: jT.ui.inlineChanger('methods.put', 'checkbox') },
          'Delete': { iOrder: 7, sClass: "center", sTitle: "Delete", bSortable: false, sDefaultContent: '', mData: "methods.delete", mRender: jT.ui.inlineChanger('methods.delete', 'checkbox') },
        }
      }
    }
  };
  
  var cls = function (root, settings) {
    var self = this;
    self.rootElement = root;
    jT.$(root).addClass('jtox-toolkit'); // to make sure it is there even when manually initialized
    
    self.settings = jT.$.extend(true, {}, defaultSettings, jT.settings, settings);
    self.policies = null;
    
    if (!self.settings.noInterface) {
      self.rootElement.appendChild(jT.getTemplate('#jtox-policy'));
      self.settings.configuration.columns.policy.Id.sTitle = '';
      
      var inlineHandlers = {
        change: function (e) {
          var data = jT.ui.rowData(this);
          if (data.uri != null) {
            // Initiate a change in THIS field.
            var el = this;
            var myData = $(el).data('data');
            var myArr = myData.split('.');
            var fd = new FormData();
            fd.append(myArr[myArr.length - 1], $(el).val());
            $(el).addClass('loading');
            // now make the update call...
            jT.call(self, data.uri, { method: 'PUT', form: fd }, function (task) {
              if (!task) {
                $(el).removeClass('loading');
                $(el).val(ccLib.getJsonValue(data, myData)); // i.e. revert the old value
              }
              else {
                jT.pollTask(self, task, function (task) {
                  $(el).removeClass('loading');
                  if (!task)
                    $(el).val(ccLib.getJsonValue(data, myData)); // i.e. revert the old value
                });
              }
            });
          }
          else {
            // collect and validate and react
            var row = $(this).closest('tr');
            var inline = jT.ui.rowInline(row);
            if (!inline.role || !inline.resource)
              $('span.ui-icon-plusthick', row).addClass('jtox-hidden');
            else
              $('span.ui-icon-plusthick', row).removeClass('jtox-hidden');
          }
          console.log("CHANGE");
        },
        remove: function (e) {
          console.log("REMOVE");
        },
        add: function (e) {
          console.log("ADD");
        },
      };
      
      self.table = jT.$('table', self.rootElement).dataTable({
        "bPaginate": false,
        "bLengthChange": false,
				"bAutoWidth": false,
        "sDom" : self.settings.sDom,
        "aoColumns": jT.ui.processColumns(self, 'policy'),
        "aaSortingFixed": [[0, 'asc']],
        "fnCreatedRow": jT.ui.inlineRowFn(inlineHandlers),
				"oLanguage": jT.$.extend({
          "sLoadingRecords": "No policies found.",
          "sZeroRecords": "No policies found.",
          "sEmptyTable": "No policies available.",
          "sInfo": "Showing _TOTAL_ policy(s) (_START_ to _END_)"
        }, self.settings.oLanguage)
      });
      
      jT.$(self.table).dataTable().fnAdjustColumnSizing();
    }
        
    // finally, wait a bit for everyone to get initialized and make a call, if asked to
    if (self.settings.loadOnInit)
      self.loadPolicies();
  };

  cls.prototype.loadPolicies = function () {
    var self = this;
    $(self.table).dataTable().fnClearTable();
    jT.call(self, '/admin/restpolicy', function (result) { 
      if (!!result) {
        $(self.table).dataTable().fnAddData(result.policy.concat({  }));  
      }
    });
  };
  
  cls.prototype.query = function () {
    this.loadPolicies();
  }
  
  return cls;
})();
  
(function() {
  'use strict';

  angular.module('app.services')
    .factory('DialogEditor', DialogEditorFactory);

  /** @ngInject */
  function DialogEditorFactory(CollectionsApi, $q, $log, lodash) {
    var service = {
      data: {},
      originalData: {},
      activeTab: 0,
    };

    /**
     * Store data passed in parameter
     *
     * Parameter: data -- nested object containing data of the dialog
     */
    service.setData = function(data) {
      service.data = data;
      service.saveOriginalData(angular.copy(data));
    };

    /**
     * Save original data, before any changes
     *
     * Parameter: origData -- nested object containing data of the dialog
     */
    service.saveOriginalData = function(origData) {
      // save original with any 'active tab' property
      var origDialog = angular.copy(origData);
      origDialog.content[0].dialog_tabs.forEach(function(tab) {
        delete tab.active;
      });
      service.originalData = origDialog;
      service.setDoNotSave(false);
    };

    /**
     * Return the original dialog data object
     */
    service.getOriginalData = function() {
      return service.originalData;
    };

    /**
     * Toggles the selection of a tab, box or field
     */
    service.toggleSelection = function(tab, box, field) {
      var testObj = {tabId: tab, boxId: box, fieldId: field};
      service.selected = angular.equals(testObj, service.selected) ? undefined : testObj;
    };

    /**
     * Test to see if data is unchanged from original.
     */
    service.isDialogDataUnchanged = function() {
      // compare without 'active tab' property -which is added by the UI and messes up comparisons between orig and curr. data objects
      var rawData = angular.copy(service.data);
      rawData.content[0].dialog_tabs.forEach(function(tab) {
        delete tab.active;
      });

      return angular.equals(rawData, service.originalData);
    };

    /**
     * Flag to indicate not to save a changed dialog
     */
    service.setDoNotSave = function(value) {
      service.doNotSaveFlag = value;
    };

    service.doNotSave = function() {
      return service.doNotSaveFlag;
    };

    /**
     * Saves a dialog
     */
    service.saveDialogDetails = function() {
      var action, dialogData;

      var deferred = $q.defer();

      // load dialog data
      if (angular.isUndefined(service.getDialogId())) {
        action = 'create';
        dialogData = {
          description: service.getDialogDescription(),
          label: service.getDialogLabel(),
          dialog_tabs: [],
        };
        lodash.cloneDeep(service.getDialogTabs()).forEach(function(tab) {
          delete tab.active;
          dialogData.dialog_tabs.push(tab);
        });
      } else {
        action = 'edit';
        dialogData = {
          description: service.getDialogDescription(),
          label: service.getDialogLabel(),
          content: {
            dialog_tabs: [],
          },
        };
        lodash.cloneDeep(service.getDialogTabs()).forEach(function(tab) {
          delete tab.active;
          dialogData.content.dialog_tabs.push(tab);
        });
      }

      // save the dialog
      CollectionsApi.post(
        'service_dialogs',
        service.getDialogId(),
        {},
        angular.toJson({action: action, resource: dialogData})
      ).then(saveSuccess, saveFailure);

      function saveSuccess() {
        deferred.resolve();
      }

      function saveFailure() {
        deferred.reject();
      }

      return deferred.promise;
    };

    /**
     * Return dialog loaded at service
     */
    service.getDialog = function() {
      return service.data.content[0];
    };

    /**
     * Return dialog id loaded at service
     */
    service.getDialogId = function() {
      return service.data.content[0].id;
    };

    /**
     * Return dialog label loaded at service
     */
    service.getDialogLabel = function() {
      return service.data.content[0].label;
    };

    /**
     * Return dialog description loaded at service
     */
    service.getDialogDescription = function() {
      return service.data.content[0].description;
    };

    /**
     * Return dialog tabs loaded at service
     */
    service.getDialogTabs = function() {
      return service.data.content[0].dialog_tabs;
    };

    /**
     * Update positions for elements in array
     *
     * Parameter: elements -- array of elements to sort
     */
    service.updatePositions = function(elements) {
      if (elements.length !== 0) {
        for (var i = 0; i < elements.length; i++) {
          elements[i].position = i;
        }
      }
    };

    return service;
  }
})();

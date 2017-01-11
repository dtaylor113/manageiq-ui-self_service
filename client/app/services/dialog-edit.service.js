(function() {
  'use strict';

  angular.module('app.services')
    .factory('DialogEditor', DialogEditorFactory);

  /** @ngInject */
  function DialogEditorFactory() {
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
      service.originalData = angular.copy(data);
    };

    /**
     * Test to see if data is unchanged from original.
     */
    service.isDialogDataUnchanged = function(data) {
      // compare without 'active tab' property -which is added by the UI and messes up comparisons between orig and curr. data objects
      var rawData = angular.copy(service.data);
      rawData.content[0].dialog_tabs.forEach(function(tab) {
        delete tab.active;
      });

      return angular.equals(rawData, service.originalData);
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

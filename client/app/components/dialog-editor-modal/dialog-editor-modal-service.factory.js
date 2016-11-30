(function() {
  'use strict';

  angular.module('app.components')
    .factory('DialogEditorModal', EditDialogFactory);

  /** @ngInject */
  function EditDialogFactory($modal) {
    var modalDialog = {
      showModal: showModal,
    };

    return modalDialog;

    function showModal(tab, box, field) {
      var modalOptions = {
        templateUrl: 'app/components/dialog-editor-modal/dialog-editor-modal.html',
        controller: DialogEditorModalController,
        controllerAs: 'vm',
        size: 'lg',
        resolve: {
          dialogDetails: resolveDialogDetails,
        },
      };
      var modal = $modal.open(modalOptions);

      return modal.result;

      function resolveDialogDetails() {
        return {tabId: tab, boxId: box, fieldId: field};
      }
    }
  }

  /** @ngInject */
  function DialogEditorModalController(dialogDetails, $state, $modalInstance,
                                       CollectionsApi, Notifications,
                                       DialogEditor, lodash) {
    var vm = this;

    vm.dialog = dialogDetails;
    vm.saveDialogFieldDetails = saveDialogFieldDetails;
    vm.deleteField = deleteField;
    vm.modalUnchanged = modalUnchanged;
    vm.addEntry = addEntry;
    vm.removeEntry = removeEntry;
    vm.modalTabSet = modalTabSet;
    vm.modalTabIsSet = modalTabIsSet;

    vm.modalTab = 'element_information';

    // recognize edited element type
    if (angular.isUndefined(vm.dialog.fieldId)
     && angular.isUndefined(vm.dialog.boxId)
     && angular.isDefined(vm.dialog.tabId)) {
      vm.element = 'tab';
    } else if (angular.isUndefined(vm.dialog.fieldId)
            && angular.isDefined(vm.dialog.boxId)
            && angular.isDefined(vm.dialog.tabId)) {
      vm.element = 'box';
    } else if (angular.isDefined(vm.dialog.fieldId)
            && angular.isDefined(vm.dialog.boxId)
            && angular.isDefined(vm.dialog.tabId)) {
      vm.element = 'field';
    }

    // clone data from service
    switch (vm.element) {
      case 'tab':
        vm.modalData = lodash.cloneDeep(
          DialogEditor.getDialogTabs()[
            DialogEditor.activeTab
          ]
        );
        break;
      case 'box':
        vm.modalData = lodash.cloneDeep(
          DialogEditor.getDialogTabs()[
            DialogEditor.activeTab
          ].dialog_groups[
            vm.dialog.boxId
          ]
        );
        break;
      case 'field':
        vm.modalData = lodash.cloneDeep(
          DialogEditor.getDialogTabs()[
            DialogEditor.activeTab
          ].dialog_groups[
            vm.dialog.boxId
          ].dialog_fields[
            vm.dialog.fieldId
          ]
        );
        break;
      default:
        break;
    }

    activate();

    function activate() {
    }

    function modalTabSet(tab) {
      vm.modalTab = tab;
    }

    function modalTabIsSet(tab) {
      return vm.modalTab === tab;
    }
    /**
     * Check for changes in modal
     */
    function modalUnchanged() {
      switch (vm.element) {
        case 'tab':
          return lodash.isMatch(
            DialogEditor.getDialogTabs()[
              DialogEditor.activeTab
            ],
            vm.modalData
          );
        case 'box':
          return lodash.isMatch(
            DialogEditor.getDialogTabs()[
              DialogEditor.activeTab
            ].dialog_groups[
              vm.dialog.boxId
            ],
            vm.modalData
          );
        case 'field':
          return lodash.isMatch(
            DialogEditor.getDialogTabs()[
              DialogEditor.activeTab
            ].dialog_groups[
              vm.dialog.boxId
            ].dialog_fields[
              vm.dialog.fieldId
            ],
            vm.modalData
          );
        default:
          break;
      }
    }

    /**
     * Store modified data to service
     */
    function saveDialogFieldDetails() {
      // TODO: add verification for required forms
      // store data to service
      switch (vm.element) {
        case 'tab':
          DialogEditor.getDialogTabs()[
            DialogEditor.activeTab
          ].label = vm.modalData.label;
          // description
          DialogEditor.getDialogTabs()[
            DialogEditor.activeTab
          ].description = vm.modalData.description;
          break;
        case 'box':
          // label
          DialogEditor.getDialogTabs()[
            DialogEditor.activeTab
          ].dialog_groups[
            vm.dialog.boxId
          ].label = vm.modalData.label;
          // description
          DialogEditor.getDialogTabs()[
            DialogEditor.activeTab
          ].dialog_groups[
            vm.dialog.boxId
          ].description = vm.modalData.description;
          break;
        case 'field':
          DialogEditor.getDialogTabs()[
            DialogEditor.activeTab
          ].dialog_groups[
            vm.dialog.boxId
          ].dialog_fields[
            vm.dialog.fieldId
          ] = vm.modalData;
          break;
        default:
          break;
      }

      // close modal
      $modalInstance.close();
    }

    /**
     * Delete dialog field selected in modal
     */
    function deleteField() {
      lodash.remove(
        DialogEditor.getDialogTabs()[
          DialogEditor.activeTab
        ].dialog_groups[
          vm.dialog.boxId
        ].dialog_fields,
        function(field) {
          return field.position === vm.dialog.fieldId;
        }
      );

      // close modal
      $modalInstance.close();
    }

    /**
     * Add entry for radio button / dropdown select
     */
    function addEntry() {
      vm.modalData.values.push(["", ""]);
    }

    /**
     * Remove entry for radio button / dropdown select
     *
     * Parameter: entry -- entry to remove from array
     */
    function removeEntry(entry) {
      lodash.pullAt(vm.modalData.values, entry);
    }
  }
})();

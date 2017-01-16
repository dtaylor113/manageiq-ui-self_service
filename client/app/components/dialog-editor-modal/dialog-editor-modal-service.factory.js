(function() {
  'use strict';

  angular.module('app.components')
    .factory('DialogEditorModal', EditDialogFactory);

  /** @ngInject */
  function EditDialogFactory($uibModal) {
    var modalDialog = {
      showModal: showModal,
    };

    return modalDialog;

    function showModal(dialog, tab, box, field) {
      var modalOptions = {
        templateUrl: 'app/components/dialog-editor-modal/dialog-editor-modal.html',
        controller: DialogEditorModalController,
        controllerAs: 'vm',
        size: 'lg',
        resolve: {
          dialogDetails: resolveDialogDetails,
        },
      };
      var modal = $uibModal.open(modalOptions);

      return modal.result;

      function resolveDialogDetails() {
        return {dialogId: dialog, tabId: tab, boxId: box, fieldId: field};
      }
    }
  }

  /** @ngInject */
  function DialogEditorModalController(dialogDetails, $state, $uibModalInstance,
                                       CollectionsApi, DialogEditor, lodash) {
    var vm = this;

    angular.extend(vm, {
      dialog: dialogDetails,
      saveDialogFieldDetails: saveDialogFieldDetails,
      modalUnchanged: modalUnchanged,
      addEntry: addEntry,
      removeEntry: removeEntry,
      modalTabSet: modalTabSet,
      modalTabIsSet: modalTabIsSet,
      currentCategoryEntries: currentCategoryEntries,
    });

    vm.modalTab = 'element_information';

    // recognize edited element type
    if (angular.isUndefined(vm.dialog.fieldId)
      && angular.isUndefined(vm.dialog.boxId)
      && angular.isUndefined(vm.dialog.tabId)) {
      vm.element = 'dialog';
      vm.modalTitle = __("Edit Dialog Details");
    } else if (angular.isUndefined(vm.dialog.fieldId)
     && angular.isUndefined(vm.dialog.boxId)
     && angular.isDefined(vm.dialog.tabId)) {
      vm.element = 'tab';
      vm.modalTitle = __("Edit Tab Details");
    } else if (angular.isUndefined(vm.dialog.fieldId)
            && angular.isDefined(vm.dialog.boxId)
            && angular.isDefined(vm.dialog.tabId)) {
      vm.element = 'box';
      vm.modalTitle = __("Edit Section Details");
    } else if (angular.isDefined(vm.dialog.fieldId)
            && angular.isDefined(vm.dialog.boxId)
            && angular.isDefined(vm.dialog.tabId)) {
      vm.element = 'field';
    }

    // clone data from service
    switch (vm.element) {
      case 'dialog':
        vm.modalData = lodash.cloneDeep(
          DialogEditor.getDialog()
        );
        break;
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
        // load categories from API, if the field is Tag Control
        if (vm.modalData.type === "DialogFieldTagControl") {
          resolveCategories(CollectionsApi).then(function(categories) {
            vm.categories = categories;
          });
        }
        // set modal title
        if (!vm.modalData.dynamic) {
          var titleLabel;

          switch (vm.modalData.type) {
            case 'DialogFieldTextBox':
              titleLabel = __("Text Box");
              break;
            case 'DialogFieldTextAreaBox':
              titleLabel = __("Text Area");
              break;
            case 'DialogFieldCheckBox':
              titleLabel = __("Check Box");
              break;
            case 'DialogFieldDropDownList':
              titleLabel = __("Dropdown");
              break;
            case 'DialogFieldRadioButton':
              titleLabel = __("Radio Button");
              break;
            case 'DialogFieldDateControl':
              titleLabel = __("Datepicker");
              break;
            case 'DialogFieldDateTimeControl':
              titleLabel = __("Timepicker");
              break;
            case 'DialogFieldTagControl':
              titleLabel = __("Tag Control");
              break;
          }
          vm.modalTitle =  __("Edit") + " " + titleLabel + " " + __("Field");
        } else {
          vm.modalTitle = vm.modalTitle = __("Edit Field");
        }
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
        case 'dialog':
          return lodash.isMatch(
            DialogEditor.getDialog(),
            vm.modalData
          );
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
        case 'dialog':
          DialogEditor.getDialog().label = vm.modalData.label;
          DialogEditor.getDialog().description = vm.modalData.description;
          break;
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
      $uibModalInstance.close();
    }

    function resolveCategories() {
      var options = {
        expand: 'resources',
        attributes: ['description', 'single_value', 'children'],
      };

      return CollectionsApi.query('categories', options);
    }

    /**
     * Finds entries for the selected category
     */
    function currentCategoryEntries() {
      if (angular.isDefined(vm.categories)) {
        return lodash.find(
          vm.categories.resources,
          'id',
          Number(vm.modalData.options.category_id)
        );
      }
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

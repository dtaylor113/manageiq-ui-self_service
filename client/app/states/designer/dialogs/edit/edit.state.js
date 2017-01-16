/* eslint camelcase: ["error", {properties: "never"}] */

(function() {
  'use strict';

  angular.module('app.states')
    .run(appRun);

  /** @ngInject */
  function appRun(routerHelper) {
    routerHelper.configureStates(getStates());
  }

  function getStates() {
    return {
      'designer.dialogs.edit': {
        url: '/edit/:dialogId',
        templateUrl: 'app/states/designer/dialogs/edit/edit.html',
        controller: StateController,
        controllerAs: 'vm',
        title: N_('Dialog Editing'),
        resolve: {
          dialog: resolveDialog,
        },
      },
    };
  }

  /** @ngInject */
  function resolveDialog($stateParams, CollectionsApi) {
    var options = {attributes: ['content', 'buttons', 'label']};

    if ($stateParams.dialogId === 'new') {
      return {
        "content": [{
          "dialog_tabs": [{
            "label": "New tab",
            "position": 0,
            "dialog_groups": [
            ],
          }],
        }],
      };
    }

    return CollectionsApi.get('service_dialogs', $stateParams.dialogId, options);
  }

  /** @ngInject */
  function StateController($state, dialog, DialogEditor, DialogEditorModal, CollectionsApi,
           EventNotifications, lodash, $log) {
    var vm = this;

    DialogEditor.setData(dialog);

    vm.dialog = dialog;
    vm.toggleToolbox = toggleToolbox;
    vm.editDialogDetails = editDialogDetails;
    vm.saveDialogDetails = saveDialogDetails;
    vm.dismissChanges = dismissChanges;
    vm.dialogUnchanged = dialogUnchanged;
    vm.isContentSelected = isContentSelected;
    vm.duplicateSelectedItem = duplicateSelectedItem;
    vm.removeSelectedItem = removeSelectedItem;

    vm.toolboxVisible = true;

    function toggleToolbox() {
      vm.toolboxVisible = !vm.toolboxVisible;
    }

    function dialogUnchanged() {
      return DialogEditor.isDialogDataUnchanged();
    }

    function editDialogDetails() {
      DialogEditorModal.showModal(DialogEditor.getDialogId());
    }

    function dismissChanges() {
      if (angular.isUndefined(dialog.id)) {
        $state.go('designer.dialogs.list');
      } else {
        $state.go('designer.dialogs.details', {dialogId: dialog.id});
      }
    }

    function isContentSelected() {
      return angular.isDefined(DialogEditor.selected);
    }

    function duplicateSelectedItem() {
      if (isContentSelected()) {
        $log.warn("Duplicate is under development.");
      }
    }

    function removeSelectedItem() {
      if (isContentSelected()) {
        if (DialogEditor.selected && angular.isDefined(DialogEditor.selected.fieldId)) {
          removeField();
        } else if (DialogEditor.selected && angular.isDefined(DialogEditor.selected.boxId)) {
          removeBox();
        }
      }
    }

    function removeBox() {
      var dialogTabs = DialogEditor.getDialogTabs();
      lodash.remove(
        dialogTabs[DialogEditor.activeTab].dialog_groups,
        function(box) {
          return box.position === DialogEditor.selected.boxId;
        }
      );
      DialogEditor.updatePositions(
        dialogTabs[DialogEditor.activeTab].dialog_groups
      );
      DialogEditor.selected = undefined;
    }

    function removeField() {
      lodash.remove(
        DialogEditor.getDialogTabs()[
          DialogEditor.activeTab
          ].dialog_groups[
          DialogEditor.selected.boxId
          ].dialog_fields,
        function(field) {
          return field.position === DialogEditor.selected.fieldId;
        }
      );
      DialogEditor.selected = undefined;
    }

    function saveDialogDetails() {
      var action, dialogData;

      // load dialog data
      if (angular.isUndefined(DialogEditor.getDialogId())) {
        action = 'create';
        dialogData = {
          description: DialogEditor.getDialogDescription(),
          label: DialogEditor.getDialogLabel(),
          dialog_tabs: [],
        };
        lodash.cloneDeep(DialogEditor.getDialogTabs()).forEach(function(tab) {
          delete tab.active;
          dialogData.dialog_tabs.push(tab);
        });
      } else {
        action = 'edit';
        dialogData = {
          description: DialogEditor.getDialogDescription(),
          label: DialogEditor.getDialogLabel(),
          content: {
            dialog_tabs: [],
          },
        };
        lodash.cloneDeep(DialogEditor.getDialogTabs()).forEach(function(tab) {
          delete tab.active;
          dialogData.content.dialog_tabs.push(tab);
        });
      }

      // save the dialog
      CollectionsApi.post(
        'service_dialogs',
        DialogEditor.getDialogId(),
        {},
        angular.toJson({action: action, resource: dialogData})
      ).then(saveSuccess, saveFailure);
    }

    function saveSuccess() {
      EventNotifications.success(vm.dialog.content[0].label + __(' was saved'));
      $state.go('designer.dialogs.list');
    }

    function saveFailure() {
      EventNotifications.error(__('There was an error editing this dialog.'));
    }
  }
})();

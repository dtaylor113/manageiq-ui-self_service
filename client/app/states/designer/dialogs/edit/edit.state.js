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
           EventNotifications, SaveDialogModal, lodash, $scope, $log) {
    var vm = this;

    $scope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
      if (toState.name === 'login') {
        return;
      }
      if ((fromState.name === "designer.dialogs.edit" || fromState.name === "") && toState.name !== "designer.dialogs.edit") {
        if (!DialogEditor.doNotSave() && !DialogEditor.isDialogDataUnchanged() && !event.defaultPrevented) {
          SaveDialogModal.showModal(vm.dialog, toState, toParams, fromState, fromParams);
          event.preventDefault();
        }
      }
    });

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
      DialogEditor.saveDialogDetails().then(saveSuccess, saveFailure);
    }

    function saveSuccess() {
      EventNotifications.success(vm.dialog.content[0].label + __(' was saved'));
      // reset for nav. away
      DialogEditor.setData(vm.dialog);
      $state.go('designer.dialogs.list');
    }

    function saveFailure() {
      EventNotifications.error(__('There was an error editing this dialog.'));
    }
  }
})();

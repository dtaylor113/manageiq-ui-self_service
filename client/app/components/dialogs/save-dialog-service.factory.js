(function() {
  'use strict';

  angular.module('app.components')
    .factory('SaveDialogModal', SaveDialogFactory);

  /** @ngInject */
  function SaveDialogFactory($uibModal) {
    var modalSaveDialog = {
      showModal: showModal,
    };

    return modalSaveDialog;

    function showModal(dialog, toState, toParams, fromState, fromParams) {
      var modalOptions = {
        templateUrl: 'app/components/dialogs/save-dialog-modal.html',
        controller: SaveDialogModalController,
        controllerAs: 'vm',
        resolve: {
          dialog: dialog,
          toState: toState,
          toParams: toParams,
          fromState: fromState,
          fromParams: fromParams,
        },
      };
      var modal = $uibModal.open(modalOptions);

      return modal.result;
    }
  }

  /** @ngInject */
  function SaveDialogModalController(dialog, toState, toParams, $state, $uibModalInstance, $log,
                                     DialogEditor, EventNotifications) {
    var vm = this;
    vm.dialog = dialog;
    vm.save = save;
    vm.doNotSave = doNotSave;

    function save() {
      DialogEditor.saveDialogDetails().then(saveSuccess, saveFailure);

      function saveSuccess() {
        $uibModalInstance.close();
        EventNotifications.success(vm.dialog.content[0].label + __(' was saved'));
        // reset for nav. away
        DialogEditor.setData(vm.dialog);
        $state.go(toState, toParams);
      }

      function saveFailure() {
        EventNotifications.error(__('There was an error saving the dialog.'));
        $uibModalInstance.close();
      }
    }

    function doNotSave() {
      $uibModalInstance.close();
      DialogEditor.setDoNotSave(true);
      $state.go(toState, toParams);
    }
  }
})();

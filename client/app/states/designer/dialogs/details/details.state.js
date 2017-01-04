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
      'designer.dialogs.details': {
        url: '/:dialogId',
        templateUrl: 'app/states/designer/dialogs/details/details.html',
        controller: StateController,
        controllerAs: 'vm',
        title: N_('Dialog Detail'),
        resolve: {
          dialog: resolveDialog,
        },
      },
    };
  }

  /** @ngInject */
  function resolveDialog($stateParams, CollectionsApi) {
    var options = {};

    return CollectionsApi.get('service_dialogs', $stateParams.dialogId, options);
  }

  /** @ngInject */
  function StateController($state, dialog, CollectionsApi, EventNotifications, sprintf) {
    var vm = this;

    vm.dialog = dialog;
    vm.dialog.editDialog = editDialog;
    vm.dialog.removeDialog = dialogAction('delete');
    vm.dialog.copyDialog = dialogAction('copy');

    function editDialog(item) {
      $state.go('designer.dialogs.edit', {dialogId: dialog.id});
    }

    function dialogAction(action) {
      return function() {
        var actionData = {action: action};
        CollectionsApi.post('service_dialogs', vm.dialog.id, {}, actionData)
          .then(actionSuccess, actionFailure);

        function actionSuccess() {
          var actionString;
          if (action === 'copy') {
            actionString = sprintf(__('%s was copied.'), vm.dialog.label);
          } else {
            actionString = sprintf(__('%s was removed.'), vm.dialog.label);
          }
          EventNotifications.success(actionString);
          $state.go('designer.dialogs.list');
        }

        function actionFailure() {
          var actionString;
          if (action === 'copy') {
            actionString = EventNotifications.error(__('There was an error copying this dialog.'));
          } else {
            actionString = EventNotifications.error(__('There was an error removing this dialog.'));
          }
        }
      };
    }
  }
})();

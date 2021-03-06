(function() {
  'use strict';

  angular.module('app.components')
    .factory('RetireRemoveServiceModal', Factory);

  /** @ngInject */
  function Factory($uibModal) {
    return {showModal: showModal};

    function showModal(services, modalType) {
      var modalOptions = {
        templateUrl: 'app/components/retire-remove-service-modal/retire-remove-service-modal.html',
        controller: ModalController,
        controllerAs: 'vm',
        size: 'md',
        resolve: {
          services: resolveServices,
          modalType: resolveModalType,
        },
      };
      var modal = $uibModal.open(modalOptions);

      return modal.result;

      /** @ngInject */
      function resolveServices() {
        return services;
      }

      /** @ngInject */
      function resolveModalType() {
        return modalType;
      }
    }
  }

  /** @ngInject */
  function ModalController($state, $uibModalInstance, lodash, CollectionsApi, EventNotifications, services, modalType) {
    var vm = this;

    angular.extend(vm, {
      services: services,
      isRemove: modalType === "remove",
      isRetireNow: modalType === "retire",
      confirm: confirm,
      cancel: cancel,
    });

    function cancel() {
      $uibModalInstance.dismiss();
    }

    function confirm() {
      var data = {
        action: vm.isRemove ? 'delete' : 'retire',
        resources: vm.services,
      };
      CollectionsApi.post('services', '', {}, data).then(saveSuccess, saveFailure);

      function saveSuccess() {
        $uibModalInstance.close();
        switch (modalType) {
          case "retire":
            EventNotifications.success(__("Services Retired"));
            break;
          case "remove":
            EventNotifications.success(__("Services Removed"));
            break;
        }
        $state.go($state.current, {}, {reload: true});
      }

      function saveFailure() {
        EventNotifications.error(__('There was an error removing one or more services.'));
      }
    }
  }
})();

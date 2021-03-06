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
      'services.explorer': {
        url: '', // No url, this state is the index of projects
        templateUrl: 'app/states/services/explorer/explorer.html',
        controller: StateController,
        controllerAs: 'vm',
        title: N_('Services Explorer'),
        resolve: {
          services: resolveServices,
        },
      },
    };
  }

  /** @ngInject */
  function resolveServices(CollectionsApi) {
    var options = {
      hide: 'resources',
      filter: ['ancestry=null'],
    };

    return CollectionsApi.query('services', options);
  }

  /** @ngInject */
  function StateController(services) {
    var vm = this;
    vm.services = services;
  }
})();

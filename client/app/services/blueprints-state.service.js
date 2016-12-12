/* eslint camelcase: "off" */
/* eslint no-cond-assign: "off" */
(function() {
  'use strict';

  angular.module('app.services')
    .factory('BlueprintsState', BlueprintsStateFactory);

  /** @ngInject */
  function BlueprintsStateFactory(CollectionsApi, EventNotifications, $log, $q) {
    var blueprint = {};

    blueprint.sort = {
      isAscending: true,
      currentField: {id: 'name', title: __('Name'), sortType: 'alpha'},
    };

    blueprint.filters = [];

    blueprint.setSort = function(currentField, isAscending) {
      blueprint.sort.isAscending = isAscending;
      blueprint.sort.currentField = currentField;
    };

    blueprint.getSort = function() {
      return blueprint.sort;
    };

    blueprint.setFilters = function(filterArray) {
      blueprint.filters = filterArray;
    };

    blueprint.getFilters = function() {
      return blueprint.filters;
    };

    blueprint.origBlueprint = null;
    blueprint.selectedBlueprints = [];
    blueprint.doNotSaveFlag = false;

    blueprint.handleSelectionChange = function(tmpBlueprint) {
      if (tmpBlueprint.selected) {
        blueprint.selectedBlueprints.push(tmpBlueprint);
      } else {
        blueprint.unselectBlueprint(tmpBlueprint.id);
      }
    };

    blueprint.getSelectedBlueprints = function() {
      return blueprint.selectedBlueprints;
    };

    blueprint.unselectBlueprints = function() {
      blueprint.selectedBlueprints = [];
    };

    blueprint.unselectBlueprint = function(id) {
      var index = findWithAttr(blueprint.selectedBlueprints, 'id', id);
      if (index !== -1) {
        blueprint.selectedBlueprints.splice(index, 1);
      }
    };

    blueprint.saveOriginalBlueprint = function(origBlueprint) {
      blueprint.origBlueprint = origBlueprint;
      blueprint.setDoNotSave(false);
    };

    blueprint.getOriginalBlueprint = function() {
      return blueprint.origBlueprint;
    };

    blueprint.setDoNotSave = function(value) {
      blueprint.doNotSaveFlag = value;
    };

    blueprint.doNotSave = function() {
      return blueprint.doNotSaveFlag;
    };

    blueprint.publishBlueprint = function(tmpBlueprint) {
      var deferred = $q.defer();
      var origBlueprint = blueprint.getOriginalBlueprint();
      if (!angular.equals(origBlueprint, tmpBlueprint)) {
        // save the changed blueprint
        blueprint.saveBlueprint(tmpBlueprint).then(function(id) {
          // publish blueprint
          blueprint.saveBlueprint(tmpBlueprint, true).then(function() {
            deferred.resolve();
          }, publishfailure);
        }, savefailure);
      } else {
        // just publish the unchanged blueprint
        blueprint.saveBlueprint(tmpBlueprint, true).then(function() {
          deferred.resolve();
        }, publishfailure);
      }

      function savefailure() {
        $log.info("Failed to save '" + tmpBlueprint.name + "' before publication.");
        deferred.reject();
      }

      function publishfailure(errorMsg) {
        $log.info("Failed to publish '" + tmpBlueprint.name + "': " + errorMsg);
        deferred.reject(errorMsg);
      }

      return deferred.promise;
    };

    blueprint.saveBlueprint = function(tmpBlueprint, andPublish) {
      var deferred = $q.defer();

      saveBlueprintProperties(tmpBlueprint, andPublish).then(function(id) {
        if (andPublish) {
          $log.info("'" + tmpBlueprint.name + "' Blueprint was published.");
        } else {
          $log.info("'" + tmpBlueprint.name + "' Blueprint Properties were saved.");
        }
        saveBlueprintTags(id, tmpBlueprint).then(function() {
          $log.info("'" + tmpBlueprint.name + "' Blueprint Tags were saved.");
          deferred.resolve(id);
        }, saveTagsfailure);
      }, savePropsfailure);

      function savePropsfailure(errorMsg) {
        deferred.reject(errorMsg);
      }

      function saveTagsfailure() {
        deferred.reject();
      }

      return deferred.promise;
    };

    function saveBlueprintProperties(tmpBlueprint, andPublish) {
      var deferred = $q.defer();

      var blueprintObj = getBlueprintPostObj(tmpBlueprint, andPublish);

      if (tmpBlueprint.id) {
        CollectionsApi.post('blueprints', tmpBlueprint.id, {}, blueprintObj).then(updateSuccess, updateFailure);
      } else {
        CollectionsApi.post('blueprints', null, {}, blueprintObj).then(createSuccess, createFailure);
      }

      function updateSuccess(response) {
        deferred.resolve(response.id);
      }

      function updateFailure(error) {
        var errorMsg = error.status + " : " + error.statusText;
        deferred.reject(errorMsg);
      }

      function createSuccess(response) {
        deferred.resolve(response.results[0].id);
      }

      function createFailure() {
        $log.error('There was an error creating this blueprint.');
        deferred.reject();
      }

      function getBlueprintPostObj(tmpBlueprint, andPublish) {
        var blueprintObj;

        if (andPublish) {
          blueprintObj = {
            "action": "publish"
          };
        } else {
          blueprintObj = {
            "name": tmpBlueprint.name,
            "description": tmpBlueprint.description,
            "ui_properties": tmpBlueprint.ui_properties,
          };

          blueprintObj.ui_properties.num_items = tmpBlueprint.ui_properties.chart_data_model.nodes.length;

          if (tmpBlueprint.id) {
            blueprintObj.action = "edit";
          }
        }

        // $log.info("blueprint obj = " + angular.toJson(blueprintObj, true));

        return blueprintObj;
      }

      return deferred.promise;
    }

    function saveBlueprintTags(blueprintId, tmpBlueprint) {
      var deferred = $q.defer();

      var blueprintTags = tmpBlueprint.tags;
      var origBlueprintTags = blueprint.getOriginalBlueprint().tags;
      var assignObj = getTagsToAddRemove("assign", blueprintTags, origBlueprintTags);
      var unassignObj = getTagsToAddRemove("unassign", blueprintTags, origBlueprintTags);

      var collection = 'blueprints/' + blueprintId + '/tags';

      if (assignObj.resources.length > 0) {
        CollectionsApi.post(collection, null, {}, assignObj).then(function() {
          $log.info("  Blueprint tags assigned succesfully.");
          if (unassignObj.resources.length > 0) {
            CollectionsApi.post(collection, null, {}, unassignObj).then(function() {
              $log.info("  Blueprint tags unassigned succesfully.");
              deferred.resolve();
            }, assignFailure);
          } else {
            deferred.resolve();
          }
        }, unassignFailure);
      } else {
        if (unassignObj.resources.length > 0) {
          CollectionsApi.post(collection, null, {}, unassignObj).then(function() {
            $log.info("  Blueprint tags unassigned succesfully.");
            deferred.resolve();
          }, assignFailure);
        } else {
          deferred.resolve();
        }
      }

      function assignFailure() {
        $log.error('There was an error assigning blueprint tags.');
        deferred.reject();
      }

      function unassignFailure() {
        $log.error('There was an error unassigning blueprint tags.');
        deferred.reject();
      }

      return deferred.promise;
    }

    function getTagsToAddRemove(action, tags, origTags) {
      var resultObj = {
        "action": action,
        "resources": [],
      };
      var resources = [];

      var foundInOther, matchTag, tag ;

      // if blueprintTag not in origBlueprintTags, assign
      var bpComp1 = tags;
      var bpComp2 = origTags;

      if (action === "unassign") {
        // if origBlueprintTag not in blueprintTags, it was removed, unassign
        bpComp1 = origTags;
        bpComp2 = tags;
      }

      for (var i = 0; i < bpComp1.length; i++) {
        tag = bpComp1[i];
        foundInOther = false;
        for (var t = 0; t < bpComp2.length; t++) {
          matchTag = bpComp2[t];
          if (tag.id === matchTag.id) {
            foundInOther = true;
            break;
          }
        }
        if (!foundInOther) {
          // $log.debug("--> " + action + " " + tag.id + " - " + tag.categorization.display_name);
          resources.push({id: tag.id});
        }
      }

      resultObj.resources = resources;

      return resultObj;
    }

    blueprint.deleteBlueprints = function(blueprints) {
      var deferred = $q.defer();

      var resources = [];
      for (var i = 0; i < blueprints.length; i++) {
        resources.push({"id": blueprints[i].id});
      }

      var blueprintObj = {
        "action": "delete",
        "resources": resources,
      };

      CollectionsApi.post('blueprints', null, {}, blueprintObj).then(deleteSuccess, deleteFailure);

      function deleteSuccess() {
        EventNotifications.success(__('Blueprint(s) were succesfully deleted.'));
        deferred.resolve();
      }

      function deleteFailure() {
        EventNotifications.error(__('There was an error deleting the blueprint(s).'));
        deferred.reject();
      }

      return deferred.promise;
    };

    blueprint.getNewBlueprintObj = function() {
      var tmpBlueprint = {};
      tmpBlueprint.name = "";
      tmpBlueprint.tags = [];
      // TODO Need to get default Provision entry point
      tmpBlueprint.ui_properties = {
        automate_entrypoints: {Provision: "Service/Provisioning/StateMachines/ServiceProvision_Template/default"},
        visibility: {"id": 800, "name": "Private"},
        chart_data_model: {
          "nodes": [],
        },
      };

      blueprint.setDoNotSave(false);

      return tmpBlueprint;
    };

    blueprint.prepareNodeForCanvas = function(item) {
      var newNode = angular.copy(item);
      if (newNode.type && newNode.type === 'new-generic') {
        newNode.name = 'New ' + newNode.name;
        newNode.tags = [];
      } else {
        item.disableInToolbox = true;
        blueprint.getTagsForItem('service_templates', newNode.id).then(function(tags) {
          newNode.tags = tags;
        });
      }

      return newNode;
    };

    blueprint.getTagsForItem = function (collectionType, id) {
      var deferred = $q.defer();

      var attributes = ['categorization', 'category.id', 'category.single_value'];
      var options = {
        expand: 'resources',
        attributes: attributes,
      };

      var collection = collectionType+ '/' + id + '/tags';

      CollectionsApi.query(collection, options).then(loadSuccess, loadFailure);

      function loadSuccess(response) {
        var tags = [];
        angular.forEach(response.resources, processTag);

        function processTag(tag) {
          tags.push(getSmTagObj(tag));
        }

        function getSmTagObj(tag) {
          return {id: tag.id,
            category: {id: tag.category.id},
            categorization: {
              displayName: tag.categorization.display_name,
            },
          };
        }

        deferred.resolve(tags);
      }

      function loadFailure() {
        $log.error('There was an error service template tags');
        deferred.reject();
      }

      return deferred.promise;
    }

    blueprint.difference = function(o1, o2) {
      var k, kDiff;
      var diff = {};

      for (k in o1) {
        if (!o1.hasOwnProperty(k)) {
          $log.warn("obj 2 doesn't have " + k);
        } else if (!angular.isObject(o1[k]) || !angular.isObject(o2[k]) ) {
          if (!(k in o2) || o1[k] !== o2[k]) {
            diff[k] = o2[k];
          }
        } else if (kDiff = blueprint.difference(o1[k], o2[k])) {
          diff[k] = kDiff;
        }
      }
      for (k in o2) {
        if (o2.hasOwnProperty(k) && !(k in o1)) {
          diff[k] = o2[k];
        }
      }
      for (k in diff) {
        if (diff.hasOwnProperty(k)) {
          return diff;
        }
      }

      return false;
    };

    function findWithAttr(array, attr, value) {
      for (var i = 0; i < array.length; i += 1) {
        if (array[i][attr] === value) {
          return i;
        }
      }

      return -1;
    }

    return blueprint;
  }
})();

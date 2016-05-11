var socket = io.connect("//" + window.location.host + "/");
angular.module('APP', ['ui.router', 'ngResource', 'app.routes', 'app.services', 'app.resources', 'app.controllers']);

angular.module('app.controllers', [
  'app.controllers.votes',
  'app.controllers.home'
]);

angular.module('app.services', [
  'app.services.localStorage'
]);

angular.module('app.resources', [
    'app.resources.vote'
]);

angular.module('app.services.localStorage', [])
  .factory('localStorageService', ['$window', function ($window) {
    return {
      set: function (id) {
        $window.localStorage.setItem('bg-vote-' + id, 'true');
      },
      get: function (id) {
        return $window.localStorage.getItem('bg-vote-' + id);
      }
    };
  }]);

angular.module('app.controllers.home', [])
  .controller('homeCtrl', ['$scope', 'voteResource', 'localStorageService', function ($scope, voteResource, localStorageService) {
    'use strict';
    $scope.submitted = true;
    $scope.loading = true;
    voteResource.query({active: true})
      .$promise
      .then(function (votes) {
        $scope.loading = false;
        $scope.vote = votes && votes[0];
        $scope.submitted = localStorageService.get($scope.vote._id);
      });
    $scope.submitVote = function (value) {
      $scope.submitted = true;
      localStorageService.set($scope.vote._id);
      $scope.vote.$vote({todo: value});
    };
    socket.on('vote', function (data) {
      $scope.$apply(function () {
        $scope.vote.votes.yes = data.votes.yes;
        $scope.vote.votes.no = data.votes.no;
      });
    });
  }]);

angular.module('app.controllers.votes', [])
  .controller('votesCtrl', ['$scope', 'voteResource', function ($scope, voteResource) {
    'use strict';
    var loadAll = function () {
      $scope.votes = voteResource.query();
    };
    loadAll();
    $scope.submit = function (form) {
      if (form.$valid) {
        voteResource.save({vote: $scope.vote})
          .$promise
          .then(function () {
            loadAll();
            $scope.vote = '';
          });
      }
    };
    $scope.activate = function (vote) {
      vote.active = !vote.active;
      $scope.votes.forEach(function (_vote) {
        if (vote.active) {
          _vote.active = vote._id === _vote._id;
        } else {
          _vote.active = false;
        }
      });
      vote.$update();
    };
  }]);

angular.module('app.routes', [
  'app.routes.home'
]);

angular.module('app.routes.home', [])
  .config(function($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/');
    $stateProvider
      .state('home', {
        url: '/',
        templateUrl: '/templates/home.html',
        controller: 'homeCtrl'
      })
      .state('votes', {
        url: '/votes',
        templateUrl: '/templates/votes.html',
        controller: 'votesCtrl'
      });

  });


angular.module('app.resources.vote', [])
  .factory('voteResource', ['$resource', function ($resource) {
    'use strict';
    return $resource('/api/votes/:id', {id: '@_id'}, {
      update: {
        method: 'PUT'
      },
      vote: {
        method: 'POST',
        url: '/api/votes/:id/vote/:todo'
      }
    });
  }]);

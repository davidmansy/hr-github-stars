var app = angular.module("hrgithubstarsApp", ["firebase", "ngRoute"]);

// Service
app.service('reposService', 
  ['$rootScope', '$http', '$q',
    function($rootScope, $http, $q) {

    // var config = { headers:  {
    //     'Accept': 'application/json, text/plain, * / *',
    //     'Content-Type': 'application/json',
    //     'X-OAuth-Scopes': 'repo, user',
    //     'X-Accepted-OAuth-Scopes': 'user'
    //   }
    // };
  
    var getRepos = function(reposUrl) {
      var d = $q.defer();
      $http({
        method: 'GET',
        url: reposUrl
        //Here I only want the public repos so we use a public url, no token needed
        // params: {'access_token': token}
      }).success(function(data, status) {
        if (status == 200) {
          d.resolve(data);
        }
      });    
      return d.promise;
    };

    var getUserStarredRepos = function(token) {
      var starUrl = 'https://api.github.com/user/starred'
      var d = $q.defer();
      $http({
        method: 'GET',
        url: starUrl,
        params: {'access_token': token}
      }).success(function(data, status, headers) {
        d.resolve(data);
      }).error(function(data, status, headers) {
        d.reject(data);
      });    
      return d.promise;
    };

    var star = function(login, token, repo) {
      //STAR PUT /user/starred/:owner/:repo
      var starUrl = 'https://api.github.com/user/starred/' +
                    login + '/' + repo.name;

      var d = $q.defer();
      $http({
        method: 'PUT',
        url: starUrl,
        params: {'access_token': token}
      }).success(function(data, status, header) {
        if (status === 204) {
          d.resolve(data);
        }
      }).error(function(data, status, header) {
          d.reject(data);
      });    
      return d.promise;      
    }

    var unStar = function(login, token, repo) {
      //STAR DELETE /user/starred/:owner/:repo
      var starUrl = 'https://api.github.com/user/starred/' +
                    login + '/' + repo.name;

      var d = $q.defer();
      $http({
        method: 'DELETE',
        url: starUrl,
        params: {'access_token': token}
      }).success(function(data, status) {
        if (status === 204) {
          d.resolve(data);
        }
      }).error(function(data, status, header) {
          d.reject(data);
      });    
      return d.promise;      
    }

    return {
      getRepos: getRepos,
      getUserStarredRepos: getUserStarredRepos,
      star: star,
      unStar: unStar 
    }
}]);


// Router
app.config(['$routeProvider', function($routeProvider) {
  $routeProvider
  .when('/', {
    templateUrl: "templates/home.html",
    controller: "HomeController"
    // authRequired: true
  })
  .when('/login', {
    templateUrl: "templates/login.html",
    controller: "LoginController"
    // authRequired: false
  })
  .otherwise({redirect_to: '/login'})
}]);

// Controllers
app.controller('LoginController', 
  ['$scope',
    function($scope){
}]);

app.controller('HomeController',
  ['$scope', '$location', '$firebaseSimpleLogin', '$firebase', 'reposService',
    function($scope, $location, $firebaseSimpleLogin, $firebase, reposService) {

      //Firebase members data collection
      var dataRef = new Firebase('https://intense-fire-2672.firebaseio.com/members');

      //Firebase/Github Authentication
      $scope.loginObj = $firebaseSimpleLogin(dataRef);

      //Listening to login
      $scope.$on("$firebaseSimpleLogin:login", function(evt, user) {
        console.log("User " + user.id + " successfully logged in!");
        $location.path("/"); //When a user is logged in, redirect him to the '/''
        //Add user to the list of members, will not add the user if it already exists because same key
        $scope.members = $firebase(dataRef);
        $scope.members[user['id']] = user;
        $scope.members.$save(user['id']);
        // $scope.members['David'] = user;
        // $scope.members.$save('David');
        $scope.user = user;
      });

      //Listening to logout
      $scope.$on("$firebaseSimpleLogin:logout", function(evt) {
        console.log("User logged out!");
        $location.path("/login"); //When a user is logged out, redirect him to '/login'
      });

      //Listening to authentication error
      $scope.$on("$firebaseSimpleLogin:error", function(err) {
        console.log("Authentication error: " + err);
      });

      //Manage the selected member
      $scope.selectedMember = null;

      $scope.setSelectedMember = function(member) {
        $scope.selectedMember = member;

        //Get the list of repos of the selectedMember
        reposService.getRepos($scope.selectedMember.repos_url)
        .then(function(repos) {
          $scope.repos = repos;
          //Get the list of repos starred by the user
          return reposService.getUserStarredRepos($scope.user.accessToken)
        })
        .then(function(userStarredRepos) {
          //Should find another way than a double loop...
          var repos = $scope.repos;
          for (var i = 0; i < repos.length; i++) {
            var repo = repos[i];
            repo.isStarred = false;
            var result = false;
            for (var j = 0; j < userStarredRepos.length && result === false; j++) {
              var userStarredRepo = userStarredRepos[j];
              if(repo.id === userStarredRepo.id) {
                result = true;
                repo.isStarred = true;
              }
            };
          };
        });

      };

      //Function that will star the repo via a toggle function
      $scope.star = function(repo) {

        reposService.star($scope.selectedMember.login, $scope.user.accessToken, repo)
        .then(function(response) {
          console.log('star success');
          repo.isStarred = true;
          console.log(response);
        }, function(response) {
          console.log('star error');
          console.log(response);
        });
      };

      //Function that will unStar the repo via a toggle function
      $scope.unStar = function(repo) {

        reposService.unStar($scope.selectedMember.login, $scope.user.accessToken, repo)
        .then(function(response) {
          console.log('unStar success');
          repo.isStarred = false;
          console.log(response);
        }, function(response) {
          console.log('unStar error');
          console.log(response);
        });
      };

      $scope.isSelected = function(member) {
        if($scope.selectedMember) {
          return $scope.selectedMember === member;
        }
      }

      //Manage the loading wheel
      $scope.loading = false;
  
}]);

app.controller('MemberListController',
  ['$scope',
    function($scope){

}]);

app.controller('ReposListController', 
  ['$scope',
    function($scope){

}]);
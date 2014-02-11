var app = angular.module("hrgithubstarsApp", ["firebase", "ngRoute"]);

// Service
app.service('reposService', 
  ['$rootScope', '$http', '$q',
    function($rootScope, $http, $q) {

    var config = { headers:  {
        'Accept': 'application/json, text/plain, * / *',
        'Content-Type': 'application/json',
        'X-OAuth-Scopes': 'repo, user',
        'X-Accepted-OAuth-Scopes': 'user'
      }
    };
  
    var getRepos = function(reposUrl, token) {
      console.log(token);
      var d = $q.defer();
      $http({
        method: 'GET',
        url: reposUrl,
        params: {'access_token': token}
        // headers: config
      }).success(function(data, status) {
        if (status == 200) {
          d.resolve(data);
        }
      });    
      return d.promise;
    };

    var isStarred = function(starUrl, token) {
      var d = $q.defer();
      $http({
        method: 'GET',
        url: starUrl,
        params: {'access_token': token}
        // headers: config
      }).success(function(data, status) {
        //Repository starred
        if (status === 204) {
          d.resolve(data);
        }
      }).error(function(data, status, headers) {
        if (status === 404) {
          //Repository not starred
          d.reject(data);
        }
      });    
      return d.promise;
    };

    var star = function(starUrl) {
      var d = $q.defer();
      $http({
        method: 'PUT',
        url: starUrl
        //ADD AUTHENTICATION PARAMETERS
      }).success(function(data, status) {
        if (status === 204) {
          d.resolve(data);
        }
      }).error(function(data, status, header) {
          d.reject(data);
      });    
      return d.promise;      
    }

    var unStar = function(starUrl) {
      var d = $q.defer();
      $http({
        method: 'DELETE',
        url: starUrl
        //ADD AUTHENTICATION PARAMETERS
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
      isStarred: isStarred,
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
      var dataRef = new Firebase('https://intense-fire-2672.firebaseio.com/members');

      //Firebase/Github Authentication
      $scope.loginObj = $firebaseSimpleLogin(dataRef);

      //Listening to login
      $scope.$on("$firebaseSimpleLogin:login", function(evt, user) {
        console.log("User " + user.id + " successfully logged in!");
        $location.path("/"); //When a user is logged in, redirect him to the '/''
        //Add user to the list of members, will not add the user if it already exists
        $scope.members = $firebase(dataRef);
        $scope.members[user['id']] = user;
        $scope.members.$save(user['id']);
        $scope.members['David'] = user;
        $scope.members.$save('David');
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
        //Load the member repos
        console.log($scope.user);
        reposService.getRepos(member.repos_url, $scope.user.accessToken)
        .then(function(repos) {
          //For each repo, load if the user stars it
          for (var i = 0; i < repos.length; i++) {
            var repoName = repos[i].name;
            //api.github.com/user/starred/:targetuser/:targetrepo
            var url = 'https://api.github.com/user/starred/' +
                          $scope.user.login + '/' + repoName;
            reposService.isStarred(url, $scope.user.accessToken)
            .then(function(response) {
              //Enrich the repo object with isStarred
              console.log('isStarred / YES');
              console.log(response);
              // repos[i].isStarred = isStarred;
            }, function(response) {
              console.log('isStarred / NO');
              console.log(response);
            });
          }
          $scope.repos = repos;
        });
      };

      //Function that will star the repo via a toggle function
      var star = function(repo) {
        //STAR PUT /user/starred/:owner/:repo
        var url = 'https://api.github.com/user/starred/' +
                      $scope.user.login + '/' + repo.name;
        repo.isStarred = true;

        reposService.star(url)
        .then(function(response) {
          console.log('star success');
          console.log(response);
        }, function(response) {
          console.log('star error');
          console.log(response);
        });
      };

      //Function that will unStar the repo via a toggle function
      var unStar = function(repo) {
        //STAR PUT /user/starred/:owner/:repo
        var url = 'https://api.github.com/user/starred/' +
                      $scope.user.login + '/' + repo.name;
        repo.isStarred = false;

        reposService.unStar(url)
        .then(function(response) {
          console.log('unStar success');
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
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
        //Here I only want the public repos so we use a public url
        // params: {'access_token': token}
      }).success(function(data, status) {
        if (status == 200) {
          d.resolve(data);
        }
      });    
      return d.promise;
    };

    var getMemberStarredRepos = function(token) {
      var starUrl = 'https://api.github.com/user/starred'
      var d = $q.defer();
      $http({
        method: 'GET',
        url: starUrl,
        params: {'access_token': token}
        // headers: config
      }).success(function(data, status, headers) {
        d.resolve(data);
      }).error(function(data, status, headers) {
        d.reject(data);
      });    
      return d.promise;
    };

    // var isStarred = function(starUrl, token) {
    //   var d = $q.defer();
    //   $http({
    //     method: 'GET',
    //     url: starUrl,
    //     params: {'access_token': token, 'scope': 'user, repo'}
    //     // headers: config
    //   }).success(function(data, status) {
    //     //Repository starred
    //     if (status === 204) {
    //       d.resolve(data);
    //     }
    //   }).error(function(data, status, headers) {
    //     if (status === 404) {
    //       //Repository not starred
    //       d.reject(data);
    //     }
    //   });    
    //   return d.promise;
    // };

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
      getMemberStarredRepos: getMemberStarredRepos,
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
        // reposService.getRepos(member.repos_url)
        // .then(function(repos) {
        //   //For each repo, load if the user stars it
        //   for (var i = 0; i < repos.length; i++) {
        //     var repoName = repos[i].name;
        //     //api.github.com/user/starred/:targetuser/:targetrepo
        //     var url = 'https://api.github.com/user/starred/' +
        //                   $scope.selectedMember.login + '/' + repoName;
        //     reposService.isStarred(url, $scope.user.accessToken)
        //     .then(function(response) {
        //       //Enrich the repo object with isStarred
        //       // repos[i].isStarred = true;
        //       console.log('isStarred / YES');
        //       console.log(response);
        //       console.log(repos[i]);
        //     }, function(response) {
        //       // repos[i].isStarred = false;
        //       console.log('isStarred / NO');
        //       console.log(response);
        //       console.log(repos[i]);
        //     });
        //   }
        //   $scope.repos = repos;
        // });
        //Get the list of repos
        reposService.getRepos($scope.selectedMember.repos_url)
        .then(function(repos) {
          $scope.repos = repos;
          return reposService.getMemberStarredRepos($scope.selectedMember.accessToken)
        })
        //Get the list of repos starred by the member
        .then(function(memberStarredRepos) {
          //Should find another way than a double loop...
          console.log('memberStarredRepos');
          console.log(memberStarredRepos);
          var repos = $scope.repos;
          for (var i = 0; i < repos.length; i++) {
            var repo = repos[i];
            console.log('repo' + i);
            console.log(repo);
            repo.isStarred = false;
            var result = false;
            for (var j = 0; j < memberStarredRepos.length && result === false; j++) {
              var memberStarredRepo = memberStarredRepos[j];
              console.log('Checking the id');
              console.log(repo.name + ': ' + repo.id);
              console.log(memberStarredRepo.name + ': ' + memberStarredRepo.id);              
              if(repo.id === memberStarredRepo.id) {
                result = true;
                repo.isStarred = true;
              }
            };
          };
        });

      };


      //Function that will star the repo via a toggle function
      var star = function(repo) {
        //STAR PUT /user/starred/:owner/:repo
        var starUrl = 'https://api.github.com/user/starred/' +
                      $scope.selectedMember.login + '/' + repo.name;

        reposService.star(starUrl)
        .then(function(response) {
          console.log('star success');
          //TO DO
          // repo.isStarred = true;
          console.log(response);
        }, function(response) {
          console.log('star error');
          console.log(response);
        });
      };

      //Function that will unStar the repo via a toggle function
      var unStar = function(repo) {
        //STAR PUT /user/starred/:owner/:repo
        var starUrl = 'https://api.github.com/user/starred/' +
                      $scope.selectedMember.login + '/' + repo.name;

        reposService.unStar(starUrl + repo.name)
        .then(function(response) {
          console.log('unStar success');
          //TO DO
          // repo.isStarred = true;
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
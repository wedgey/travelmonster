(function() {
	var app = angular.module('travelmonster', [ ]);

	app.run(['$rootScope','auth','session', function($rootScope,auth,session) {
		/**
		* Assign auth and session to $rootScope so they are available to all templates
		*/
		$rootScope.auth = auth;
		$rootScope.session = session;
	}]);

	app.service('auth', ['$http', 'session', function($http,session) {
		/** 
		* Check whether the user is logged 
		* @returns boolean
		**/
		this.isLoggedIn = function() {
			return session.getUser() !== null;
		};

		/**
		* Login
		* @params creds
		* @returns {*|Promise}
		**/
		this.logIn = function(creds) {
			return $http.post('http://23.227.184.143/travelmonster/api/user/login', creds).then(function(response) {
				var data = response.data;
				session.setUser(data.jwt);
				//session.setAccessToken(data.accessToken);
			});
		};
		
		/**
		* Logout
		* @returns {*|Promise}
		**/
		this.logOut = function() {
			return $http.get('../scripts/user_script.php').then(function(response) {

				// Destroy the session in the browser
				session.destroy();
			});
		};
	}]);

	app.service('session', ['$log', 'localStorage', function($log,localStorage) {
		/**
		* Instantiate data when the service is loaded
		**/
		this._user = JSON.parse(localStorage.getItem('session.user'));
		//this._accessToken = JSON.parse(localStorage.getItem('session.accessToken'));

		/**
		* Getuser
		* @returns current user
		**/
		this.getUser = function() {
			return this._user;
		};

		/**
		* Setuser
		* @params user
		* @returns service
		**/
		this.setUser = function(user) {
			this._user = user;
			localStorage.setItem('session.user', JSON.stringify(user));
			return this;
		};

		/**
		* getAccessToken
		* @return accessToken of current user
		**/
		this.getAcessToken = function() {
			return this._acessToken;
		};

		/**
		* setAccessToken
		* @params accessToken
		* @result service
		**/
		this.setAcessToken = function(token) {
			this._acessToken = token;
			localStorage.getItem('session.accesstoken', token);
			return this;
		};

		/**
		* destroy
		**/
		this.destroy = function() {
			this.setUser(null);
			this.setAcessToken(null);
		};
	}]);

	app.factory('localStorage', ['$window', function($window) {
		if($window.localStorage) {
			return $window.localStorage;
		} throw new Error('Local storage support is needed.');
	}]);

	app.controller('HeaderController', function() {
		this.currentMenu = "";

		this.setMenu = function(menuSelected) {
			if(this.currentMenu === menuSelected) {
				this.currentMenu = "";
			} else {
				this.currentMenu = menuSelected;
			}
		};

		this.isSet = function(checkTab) {
			return this.currentMenu === checkTab;
		};
	});

	app.controller('LoginFormController', ['auth', function(auth) {
		this.email = "";
		this.password = "";

		var creds = {username: this.email, password: this.password};

		this.loginUser = auth.logIn()



		//this.loginUser = function() {
		//	var creds = { action: 'login', username: this.email, password: this.password};
		//	$http.post('../scripts/user_scripts.php', creds).then(function(data) {
		//		if(data) {

		//		}
		//	})
		//};

	}]);

})();

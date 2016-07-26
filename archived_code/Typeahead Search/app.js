(function() {
	var app = angular.module('travelmonster', ['angular-jwt','angular-storage','ui.router']);

	app.run(['$rootScope','auth', function($rootScope,auth) {
		/**
		* Assign auth and session to $rootScope so they are available to all templates
		*/
		$rootScope.auth = auth;
		auth.retoken();
		auth.setUser();
	}]);

	app.config(['$httpProvider', 'jwtInterceptorProvider', '$stateProvider', '$urlRouterProvider', '$locationProvider', function($httpProvider, jwtInterceptorProvider, $stateProvider, $urlRouterProvider, $locationProvider) {

		$stateProvider
			.state('home', {
				url: '/travelmonster',
			})
			.state('guidify', {
				url: '/travelmonster/guidify',
				templateUrl: '/travelmonster/templates/guidify.html'
			});

		$urlRouterProvider.otherwise('/travelmonster');

		$locationProvider.html5Mode({
			enabled: true,
			requireBase: false,
		});


		jwtInterceptorProvider.tokenGetter = ['store', '$http', function(store,$http) {
			return store.get('jwt');
		}];

		$httpProvider.interceptors.push('jwtInterceptor');

		$httpProvider.defaults.cache = false;
		if (!$httpProvider.defaults.headers.get) {
			$httpProvider.defaults.headers.get = {};
		}
		// disable IE ajax request caching
		$httpProvider.defaults.headers.get['If-Modified-Since'] = '0';
	}]);

	app.service('auth', ['$http', 'jwtHelper', 'store', function($http, jwtHelper, store) {

		this.jwt = '';
		this.decodedJwt = '';
		this.user = '';

		this.setUser = function() {
			this.jwt = store.get('jwt');
			this.decodedJwt = this.jwt && jwtHelper.decodeToken(this.jwt); // Return decoded token if this.jwt is set
			this.user = this.decodedJwt && this.decodedJwt.data;
		}

		this.isLoggedIn = function() {
			if(this.decodedJwt) {
				return true;
			} else {
				return false;
			}
		};

		this.clear = function() {
			this.jwt = "";
			this.decodedJwt = "";
			this.user = "";
		};

		this.logout = function() {
			store.remove('jwt');
			this.clear();
		};

		this.retoken = function() {
			if(store.get('jwt')) {
				$http.get('/travelmonster/api/user/tokenrefresh').then(function(data, status, headers) {
					store.set('jwt', data.data.jwt);
				});
			}
		};
	}]);

	app.service('autocomplete', function() {
		var vm = this;
		/**var defaultBounds = new google.maps.LatLngBounds(
			new google.maps.LatLng(-33.8902, 151.1759),
			new google.maps.LatLng(-33.8474, 151.2631));

		var input = document.getElementById('headerSearchBar');
		var options = {
			bounds: defaultBounds,
			types: ['geocode']
		};

		autocomplete = new google.maps.places.Autocomplete(input, options);
		var displaySuggestions = function(predictions, status) {
			if (status != google.maps.places.PlacesServiceStatus.OK) {
				alert(status);
				return;
			}
			predictions.forEach(function(prediction) {
				var li = document.createElement('li');
				li.appendChild(document.createTextNode(prediction.description));
				document.getElementById('results').appendChild(li);
			});
		};**/

		this.service = new google.maps.places.AutocompleteService();

		this.genAutoComplete = function(autocompletionRequestObject,callbackFunc) {
			vm.service.getPlacePredictions(autocompletionRequestObject, callbackFunc);
		};

		//var service = new google.maps.places.AutocompleteService();
  		//service.getPlacePredictions({input: 'pizza near Syd'}, displaySuggestions);
	});

	app.service('mapDisplay', function() {
		this.cities = "";

		this.mapOptions = {
			zoom: 4,
			center: new google.maps.LatLng(25,80),
			mapTypeId: google.maps.MapTypeId.ROADMAP
		}

		this.map = new google.maps.Map(document.getElementById('googleMapCanvas'), this.mapOptions);
	});

	app.directive('clickOut', ['$window','$parse', function($window, $parse) {
		return {
			restrict: 'A',
			link: function(scope, element, attrs) {
				var clickOutHandler = $parse(attrs.clickOut);

				function handleClickEvent(event) {
					if(element[0].contains(event.target)) {
						return;
					} else {
						clickOutHandler(scope, {$event: event});
						scope.$apply();
					}
				};

				angular.element($window).on('click', handleClickEvent);

				scope.$on('$destroy', function() {
					angular.element($window).off('click', handleClickEvent);
				});
			}
		}
	}]);

	app.directive('headerView', function() {
		return {
			restrict: 'E',
			templateUrl: 'templates/headerView.html',
		};
	});

	app.directive('typeahead', ['$timeout', function($timeout) {
		return {
			restrict: 'E',
			transclude: true,
			replace: true,
			controller: 'TypeaheadController',
			//controllerAs: 'typeaheadCtrl',
			templateUrl: './travelmonster/templates/typeahead.html',
			scope: {
				search: '&',
				select: '&',
				items: '=',
				term: '=',
			},
			link: function(scope, element, attrs, controller) {
				var $input = element.find('form > input');
				var $list = element.find('> div');

				$input.bind('focus', function() {
					scope.$apply(function() {scope.focused = true;});
				});

				$input.bind('blur', function() {
					scope.$apply(function() {scope.focused = false;});
				});

				$input.bind('mouseover', function() {
					scope.$apply(function() {scope.mousedOver = true;});
				});

				$input.bind('mouseleave', function() {
					scope.$apply(function() {scope.mousedOver = false;});
				});

				$input.bind('keyup',function(e) {
					if(e.keyCode === 9 || e.keyCode === 13) {
						scope.$apply(function() {controller.selectActive();});
					}

					if(e.keyCode === 27) {
						scope.$apply(function() {scope.hide = true;});
					}
				});

				$input.bind('keydown', function(e) {
					if(e.keyCode === 9 || e.keyCode === 13 || e.keyCode === 27) {
						e.preventDefault();
					}

					if(e.keyCode === 40) {
						e.preventDefault();
						scope.$apply(function() {controller.activateNextItem();});
					}

					if(e.keyCode === 38) {
						e.preventDefault();
						scope.$apply(function() {controller.activatePreviousItem();});
					}
				});

				scope.$watch('items', function(items) {
					controller.activate(items.length ? items[0] : null);
				});

				scope.$watch('focused', function(focused) {
					if(focused) {
						$timeout(function() {$input.focus();}, 0, false);
					}
				});

				scope.$watch('isVisible()', function(visible) {
					if(visible) {
						this.pos = $input.position();
						this.height = $input[0].offsetHeight;

						$list.css({
							top: pos.top + height,
							left: pos.left,
							position: absolute,
							display: block,
						});
					} else {
						$list.css('display', 'none');
					}
				});
			}
		};
	}]);

	app.directive('typeaheadItem', function() {
		return {
			require: '^typeahead',
			link: function(scope, element, attrs, controller) {
				this.item = scope.$eval(attrs.typeaheadItem);
				scope.$watch(function() {return controller.isActive(item);}, function(active) {
					if(active) {
						element.addClass('active');
					} else {
						element.removeClass('active');
					}
				});

				element.bind('mouseenter', function(e) {
					scope.$apply(function() {controller.activate(item);});
				});

				element.bind('click', function(e) {
					scope.$apply(function() {controller.select(item);});
				});
			}
		};
	});

	app.controller('TypeaheadController', function() {
		var vm = this;
		this.items = [];
		this.hide = false;

		this.activate = function(item) {
			vm.active = item;
		};

		this.activateNextItem = function() {
			this.index = vm.items.indexOf(vm.active);
			this.activate(vm.items[(index+1) % vm.items.length]);
		};

		this.activatePreviousItem = function() {
			this.index = vm.items.indexOf(vm.active);
			this.activate(vm.items[index === 0 ? vm.items.length - 1 : index - 1]);
		};

		this.isActive = function(item) {
			return vm.active === item;
		};

		this.selectActive = function() {
			this.select(vm.active);
		};

		this.select = function(item) {
			vm.hide = true;
			vm.focused = true;
			vm.select({item: item});
		};

		vm.isVisible = function() {
			return !vm.hide && (vm.focused || vm.mousedOver);
		};

		vm.query = function() {
			vm.hide = false;
			vm.search({term:vm.term});
		};

	});

	app.controller('PageController', function() {
		this.pageOverlay = '';

		this.setPageOverlay = function(status) {
			if(this.pageOverlay == status) {
				this.pageOverlay = '';
			} else {
				this.pageOverlay = status;
			}
		};
	});

	app.controller('HeaderController', ['autocomplete','auth', '$http', '$scope', function(autocomplete, auth, $http, $scope) {
		var vm = this;
		this.currentMenu = "";
		this.searchTerms = "";
		this.userMenuVisibility = false;
		this.predictions = new Array;
		this.searchOut = true;

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

		this.testFunc = function() {
			$http.get('/travelmonster/api/user/getaccount').then(function(data, status, headers) {
			});
		};

		this.displaySuggestions = function(resultpredictions, status) {
			if (status != google.maps.places.PlacesServiceStatus.OK) {
				return;
			} else {
				vm.predictions = resultpredictions;
				$scope.$apply();
			}
		};

		this.getSuggestions = function() {
			if(vm.searchTerms.length > 0) {
				autocomplete.genAutoComplete({input: vm.searchTerms, types: ['geocode']}, this.displaySuggestions);
			} else {
				vm.predictions = [];
			}
		};

		this.setSearchOut = function() {
			vm.searchOut = true;
		};

		this.setSearchIn = function() {
			vm.searchOut = false;
		};

		this.searchKeyPress = function(keyEvent) {
			//down arrow
			if(keyEvent.keyCode == 40) {
				console.log(keyEvent.keyIdentifier);
			} else if (keyEvent.keyCode == 38) {
				//Up arrow
				console.log(keyEvent.keyIdentifier);
			}
		};
	}]);

	app.controller('LoginFormController', ['$http', 'store', 'auth', function($http, store, auth, $scope) {
		var self = this;
		this.email = "";
		this.password = "";

		this.login = function() {
			var creds = {email: this.email, password: this.password};
			$http.post('/travelmonster/api/user/login', creds).then(function(data, status, headers) {
				store.set('jwt', data.data.jwt);
				auth.setUser();
				self.reset();
			});
		};

		this.reset = function() {
			this.email = "";
			this.password = "";
		};

	}]);

	app.controller('SignupFormController', ['$http', 'store', 'auth', function($http, store, auth) {
		var self = this;
		this.firstname = "";
		this.lastname ="";
		this.email = "";
		this.password = "";
		this.cpassword = "";
		this.dateofbirth = "";
		this.country = "";
		this.city = "";

		this.signup = function() {
			var creds = {
				firstname: this.firstname, 
				lastname: this.lastname,
				email: this.email, 
				password: this.password,
				dateofbirth: this.dateofbirth,
				country: this.country,
				city: this.city,
			};

			$http.post('/travelmonster/api/user/register', creds).then(function(data, status, headers) {
				store.set('jwt', data.data.jwt);
				auth.setUser();
				self.reset();
			});
		};

		this.reset = function() {
			this.firstname = "";
			this.lastname ="";
			this.email = "";
			this.password = "";
			this.cpassword = "";
			this.dateofbirth = "";
			this.country = "";
			this.city = "";
		};

	}]);

	app.controller('GuidifyFormController', ['$http', 'store', 'auth', function($http, store, auth) {
		var vm = this;
		this.firstname = "";
		this.lastname ="";
		this.email = "";
		this.gender = "";
		this.dateofbirth = "";
		this.country = "";
		this.city = "";
		this.mainCity = "";
		this.subCities = "";
		this.address = "";
		this.phone = "";
		this.mobile = "";
		this.languages = "";
		this.company = "";
		this.info = "";
		this.services = "";
		this.successMessage = "";

		this.getAccount = function() {

			$http.get('/travelmonster/api/user/getaccount').then(function(data, status, headers) {
				vm.firstname = data.data.firstname;
				vm.lastname = data['data']['lastname'];
				vm.email = data['data']['email'];
				vm.country = data['data']['country'];
				vm.city = data['data']['city'];
				vm.dateofbirth = data['data']['dob'];
			}, function(data) {
				console.log(data);
			});
		};

		this.registerGuide = function() {
			console.log('run');
			var creds = {
				'firstname': vm.firstname,
				'lastname': vm.lastname,
				'email': vm.email,
				'gender': vm.gender,
				'dateofbirth': vm.dateofbirth,
				'country': vm.country,
				'city': vm.city,
				'g_maincity': vm.mainCity,
				'g_subcities': vm.subCities,
				'g_address': vm.address,
				'g_phone': vm.phone,
				'g_mobile': vm.mobile,
				'g_languages': vm.languages,
				'g_company': vm.company,
				'g_info': vm.info,
				'g_services': vm.services,
			};

			$http.post('/travelmonster/api/user/registerguide', creds).then(function(data) {
				console.log(data);
				if(data) {
					console.log('yes');
					vm.successMessage = "Congratulations, you are now one of our awesome guides!";
				} else { console.log('data');}
			});
		};

		this.getAccount();
	}]);

	app.controller('MapController', ['mapDisplay', function(mapDisplay) {
		//this.map = new google.maps.Map(document.getElementById('googleMapCanvas'), {
		//	mapTypeId: google.maps.MapTypeId.ROADMAP
		//});

		/**$scope.markers = [];

		var infoWindow = new google.maps.InfoWindow();

		var createMarker = function (info){

			var marker = new google.maps.Marker({
				map: $scope.map,
				position: new google.maps.LatLng(info.lat, info.long),
				title: info.city
			});

			marker.content = '<div class="infoWindowContent">' + info.desc + '</div>';

			google.maps.event.addListener(marker, 'click', function(){
				infoWindow.setContent('<h2>' + marker.title + '</h2>' + marker.content);
				infoWindow.open($scope.map, marker);
			});

			$scope.markers.push(marker);

		}

		for (i = 0; i < cities.length; i++){
			createMarker(cities[i]);
		}

		$scope.openInfoWindow = function(e, selectedMarker){
			e.preventDefault();
			google.maps.event.trigger(selectedMarker, 'click');
		}

		var service = new google.maps.places.AutocompleteService();
		service.getQueryPredictions({ input: 'pizza near Syd' }, displaySuggestions);

		$scope.map.getDetails(request, callback);

		function callback(place, status) {
			if (status == google.maps.places.PlacesServiceStatus.OK) {
				createMarker(place);
			}
		}**/
	}]);
})();

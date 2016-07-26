(function() {
	var app = angular.module('travelmonster', ['angular-jwt','angular-storage','ui.router','ui.bootstrap','ngFileUpload']);

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
				url: '/',
				templateUrl: 'templates/homeView.html'
			})
			.state('guidify', {
				url: '/guidify',
				templateUrl: 'templates/guidify.html'
			})
			.state('search', {
				url: '/search',
				templateUrl: 'templates/search.html'
			})
			.state('createtour', {
				url: '/createtour',
				templateUrl: 'templates/createTourView.html'
			});

		$urlRouterProvider.otherwise('/');

		//$locationProvider.html5Mode({
		//	enabled: true,
		//	requireBase: false,
		//});


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

		this.isGuide = function() {
			if(this.isLoggedIn() && this.user.numoftourguides !== '0') {
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
			this.user = '';
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

		this.service = new google.maps.places.AutocompleteService();
		this.detailsService = new google.maps.places.PlacesService(document.getElementById('attributions'));

		this.genAutoComplete = function(autocompletionRequestObject,callbackFunc) {
			vm.service.getPlacePredictions(autocompletionRequestObject, callbackFunc);
		};

		this.getDetails = function(request, callbackFunc) {
			vm.detailsService.getDetails(request, callbackFunc);
		};
	});

	app.directive('typeahead', function($timeout) {
		return {
			restrict: 'E',
			controller: 'TypeaheadController',
			controllerAs: 'typeaheadCtrl',
			transclude: true,
			templateUrl: 'templates/typeahead.html',
			scope: {
				typemodel: '=?typemodel',
				showSearch: '=?',
				suggestTop: '=?',
				submitReady: '=?',
				typemodelDetails: '=?',
				restrictCountry: '=?'
			},
			link: function(scope,element,attrs,controller) {
				var $input = element.find('input');

				var $list = angular.element(element[0].getElementsByClassName('searchBarSuggestionsIdentifier'));

				$input.bind('focus', function() {
					scope.$apply(function() {controller.focused = true;});
				});

				$input.bind('blur', function() {
					scope.$apply(function() {controller.focused = false;});
				});

				$input.bind('mouseover', function() {
					scope.$apply(function() {scope.mousedOver = true;});
				});

				$input.bind('mouseleave', function() {
					scope.$apply(function() {scope.mousedOver = false;});
				});

				$input.bind('keyup',function(e) {
					if(e.keyCode === 9 || e.keyCode === 13) {
						scope.$apply(function() {
							controller.selectActive();
							if(typeof(scope.typemodel) != "undefined" && scope.typemodel != null) {
								scope.typemodel = controller.searchTerms;
							}
						});
						console.log(controller.active);
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

				scope.$watch(function() {return controller.items;}, function(items) {
					controller.activate(items.length ? items[0] : null);
				});

				scope.$watch('focused', function(focused) {
					if(focused) {
						$timeout(function() {$input[0].focus();}, 0, false);
					}
				});

				scope.$watch(function() {return controller.isVisible();} , function(visible) {
					if(visible) {
						//$list.addClass('make-visible');
						$list.css('display', 'block');
					} else {
						//$list.addClass('make-invisible');
						$list.css('display', 'none');
					}
				});
			}
		};
	});

	app.directive('typeaheadItem', function() {
		return {
			restrict: 'A',
			require: '^typeahead',
			link: function(scope, element, attrs, controller) {
				var item = scope.$eval(attrs.typeaheadItem);
				scope.$watch(function() {return controller.isActive(item);}, function(active) {
					if(active) {
						element.addClass('active');
					} else {
						element.removeClass('active');
					}
				});

				element.bind('mouseenter', function(e) {
					controller.mousedOver = true;
					scope.$apply(function() {controller.activate(item);});
				});

				element.bind('mouseleave', function() {
					scope.$apply(function() {controller.mousedOver = false;});
				});

				element.bind('click', function(e) {
					scope.$apply(function() {
						controller.select(item);
					});
				});
			}
		};
	});

	app.service('mapDisplay', function() {
		this.maps = {};

		this.addMap = function(mapId) {
			this.mapOptions = {
				zoom: 4,
				center: new google.maps.LatLng(25,80),
				mapTypeId: google.maps.MapTypeId.ROADMAP
			}
			this.map = new google.maps.Map(document.getElementById(mapId), this.mapOptions);
			this.maps[mapId] = this.map;
		};

		this.getMap = function(mapId) {
			if(!this.maps[mapId]) {
				this.addMap(mapId);
			}
			return this.maps[mapId];
		};
	});

	app.directive('headerView', function() {
		return {
			restrict: 'E',
			templateUrl: 'templates/headerView.html',
		};
	});

	app.controller('PageController', function($uibModal) {
		this.signupOpen = function() {
			this.modalInstance = $uibModal.open({
				templateUrl: 'templates/signupView.html',
				controller: 'SignupFormController',
				controllerAs: 'signCtrl'
			});

			this.modalInstance.result.then(function (selectedItem) {
				console.log('hello');
			    }, function () {
			    console.log('Modal dismissed at: ' + new Date());
			});
		};
	});

	app.controller('HeaderController', ['auth', '$http', '$scope', '$state', function(auth, $http, $scope, $state) {
		var vm = this;
		this.currentMenu = '';
		this.userMenuVisibility = false;
		this.navbarCollapsed = true;

		this.isHome = function() {
			if($state.current.name === 'home') {
				return true;
			} else {
				return false;
			}
		};

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
	}]);

	app.controller('TypeaheadController', ['autocomplete','auth', '$scope', function(autocomplete, auth, $scope) {
		var vm = this;
		this.searchTerms = "";
		this.items = [];
		this.searchOut = true;
		this.submitReady = true;

		this.displaySuggestions = function(resultpredictions, status) {
			if (status != google.maps.places.PlacesServiceStatus.OK) {
				return;
			} else {
				vm.items = resultpredictions;
				$scope.$apply();
			}
		};

		this.getSuggestions = function() {
			if(vm.searchTerms.length > 0) {
				vm.hide = false;
				this.searchOptions = {
					input: vm.searchTerms,
					type: ['geocode', 'establishment']
				};
				if(typeof($scope.restrictCountry) != "undefined" && $scope.restrictCountry != null && $scope.restrictCountry != "") {
					this.searchOptions["componentRestrictions"] = {country: $scope.restrictCountry};
				}
				autocomplete.genAutoComplete(this.searchOptions, this.displaySuggestions);
			} else {
				vm.items = [];
			}
		};

		this.setSearchOut = function() {
			vm.searchOut = true;
		};

		this.setSearchIn = function() {
			vm.searchOut = false;
		};

		this.hide = false;
		this.focused = false;

		this.activate = function(item) {
			vm.active = item;
		};

		this.activateNextItem = function() {
			this.index = vm.items.indexOf(vm.active);
			this.activate(vm.items[(this.index+1) % vm.items.length]);
		};

		this.activatePreviousItem = function() {
			this.index = vm.items.indexOf(vm.active);
			this.activate(vm.items[this.index === 0 ? vm.items.length - 1 : this.index - 1]);
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
			vm.active = item;
			vm.searchTerms = vm.active.description;
			this.placeid = item.place_id;
			this.request = {placeId: this.placeid};
			$scope.submitReady = false;
			var requestQuery = autocomplete.getDetails(this.request, this.returnDetails);
			if(typeof($scope.typemodel) != "undefined" && $scope.typemodel != null) {
				$scope.typemodel = vm.searchTerms;
			}
			this.setSearchOut();
		};

		this.returnDetails = function(placeResults,status) {
			if (status != google.maps.places.PlacesServiceStatus.OK) {
				return;
			} else {
				$scope.typemodelDetails = placeResults;
				$scope.submitReady = true;
				$scope.$apply();
			}
		};

		vm.isVisible = function() {
			var test = !vm.hide && (vm.focused || vm.mousedOver);
			return !vm.hide && (vm.focused || vm.mousedOver);
		};
	}]);

	app.controller('HomeSearchController', function() {
		var vm = this;
		this.startDateOpened = false;
		this.endDateOpened = false;
		this.startDate = new Date();
		this.endDate = new Date();

		this.formats = ['dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate'];
 		this.format = this.formats[0];

 		// Disable certain days on the calendar
 		function disabled(data) {
			var date = data.date,
			mode = data.mode;
			// this disables sunday and saturday
			return mode === 'day' && (date.getDay() === 0 || date.getDay() === 6);
		};

		this.dateOptions = {
			formatYear: 'yy',
			maxDate: new Date(2020, 5, 22),
			minDate: new Date(),
			startingDay: 1,
			showWeeks: false
		};

		this.startDateOpen = function() {
			vm.startDateOpened = true;
		};

		this.endDateOpen = function() {
			vm.endDateOpened = true;
		};
	});

	app.controller('LoginFormController', ['$http', 'store', 'auth', function($http, store, auth, $scope) {
		var self = this;
		this.email = "";
		this.password = "";

		this.login = function() {
			var creds = {email: this.email, password: this.password};
			$http.post('/travelmonster/api/user/login', creds).then(function(data, status, headers) {
				console.log(data);
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

	app.controller('SignupFormController', ['$http', 'store', 'auth', '$scope', function($http, store, auth, $uibModalInstance, $scope) {
		var self = this;
		this.firstname = "";
		this.lastname ="";
		this.email = "";
		this.password = "";
		this.cpassword = "";
		this.dateofbirth = "";
		this.country = "";
		this.city = "";
		this.citydetails = {};

		this.signup = function() {
			var creds = {
				firstname: this.firstname, 
				lastname: this.lastname,
				email: this.email, 
				password: this.password,
				dateofbirth: this.dateofbirth,
				country: this.country,
				city: this.city,
				citydetails: this.citydetails
			};

			$http.post('/travelmonster/api/user/register', creds).then(function(data, status, headers) {
				console.log(data);
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

		this.ok = function () {
			self.signup();
    		$uibModalInstance.$close();
  		};

		this.cancel = function () {
			$uibModalInstance.$dismiss('cancel');
		};
	}]);

	app.controller('GuidifyFormController', ['$scope','$http', 'store', 'auth', function($scope, $http, store, auth) {
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
			if(auth.isLoggedIn()) {
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
			}
		};

		this.registerGuide = function() {
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
				if(data) {
					console.log(data);
					store.set('jwt', data.data.jwt);
					auth.setUser();
					vm.successMessage = "Congratulations, you are now one of our awesome guides!";
				} else { console.log('data');}
			});
		};

		this.getAccount();
	}]);

	app.controller('CreateTourController', ['Upload', '$http', '$timeout', function(Upload, $http, $timeout) {
		var vm = this;
		this.name = "";
		this.picture = "";
		this.description = "";
		this.transport = false;
		this.meals = false;
		this.licensed = false;
		this.depth = false;
		this.services = "";
		this.price = "";
		this.numofguests = "";
		//this.places = "";
		this.places = [{name: '', details: {}}];
		this.submit_ready = true;

		this.addPlace = function() {
			vm.places.push({name: '', details: {}});
		};

		this.removePlace = function(item_index) {
			vm.places.splice(item_index, 1);
			console.log(this.places);
		};

		this.createTour = function(form, file) {
			var avail_services = [];
			if(this.transport) {
				avail_services.push("transport");
			}

			if(this.meals) {
				avail_services.push("meals");
			}

			if(this.licensed) {
				avail_services.push("licensed");
			}

			if(this.depth) {
				avail_services.push("depth");
			}

			this.services = avail_services.toString();

			var details = {
				file: file,
				name: this.name,
				description: this.description,
				services: this.services,
				price: this.price,
				numofguests: this.numofguests,
				places: this.places
			};

			if(form.picture.$touched && form.picture.$dirty && file !== null) {
				file.upload = Upload.upload({
					url: '/travelmonster/api/tours/create',
					data: details
				});

				file.upload.then(function(response) {
					$timeout(function() {
						file.result = response.data;
						vm.submit_ready = true;
						//vm.reset();
					});
				}, function(response) {
					if(response.status > 0) {
						vm.errorMsg = response.status + ': ' + response.data;
					}
				}, function(evt) {
					file.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
					vm.submit_ready = false;
				});
			} else {
				$http.post('/travelmonster/api/tours/create', details).then(function(data, status, headers) {
					$timeout(function() {
						console.log(data);
						vm.reset();
					}, function(data, status, headers) {
						if(status > 0) {
							vm.errorMsg = status + ': ' + data;
						}
					});
				});
			}
		};

		this.reset = function() {
			this.name = "";
			this.picture = "";
			this.description = "";
			this.services = "";
			this.price = "";
			this.numofguests = "";
			this.places = [{name: '', details: {}}];
			this.transport = false;
			this.meals = false;
			this.licensed = false;
			this.depth = false;
		};
	}]);

	app.controller('MapController', ['mapDisplay', function(mapDisplay) {

		this.mapOptions = {
			zoom: 4,
			center: new google.maps.LatLng(25,80),
			mapTypeId: google.maps.MapTypeId.ROADMAP
		}
		this.map = new google.maps.Map(document.getElementById('googleMapCanvas'), this.mapOptions);

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

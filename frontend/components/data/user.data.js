app.factory('User', function (DS, $q, ParseData, ParseDataSimplifier) {
	// vars
	var definition = {
		name: 'user',
		defaultAdapter: 'userAdapter',
		beforeInject: _beforeInject,
		afterInject: _afterInject,
		methods: {
			// Instance methods
			logout: _logout,
			updateLinks: _updateLinks
		}
	}

	// Adapter
	DS.adapters.userAdapter = {
		create: _create
	};

	// Constants
	var RELATIONS = ['suggestion'];

	// init
	var User = DS.defineResource(definition);
	User.login = _login;
	User.current;
	var currentUser = Parse.User.current();
	if(currentUser) {
		_onUserConnected(currentUser);
	}

	return User;

	// definition methods

	function _beforeInject(resourceName, parseObject) {
		if(!parseObject.admin) parseObject.admin = false;
		if(!parseObject.beta) parseObject.beta = false;
	}

	function _afterInject(resourceName, parseObject) {
		if(parseObject.hasOwnProperty('email')) {
			// user is logged in
			_updateCurrentUser(parseObject);
		}
	}

	function _updateLinks() {
		ParseData.linkRelationsAfterInject(User, RELATIONS, this);
	}

	// class methods
	function _login(username, password) {
		var deferred = $q.defer();
		//returns Parse.Promise
		Parse.User.logIn(username, password, {
			success: _onUserConnected,
			error: _onUserError
		})
		.then(deferred.resolve, deferred.reject);

		return deferred.promise;
	}

	function _onUserConnected(userData) {
		ParseData.inject('user', userData);
	}

	function _updateCurrentUser(userData) {
		User.current = userData;
		console.log('Welcome', userData.username);
		console.log(userData);
	}

	function _disconnectUser() {
		// cleanup sensitive details
		delete User.current.email;
		delete User.current.username;
		delete User.current.ACL;
		delete User.current.admin;
		delete User.current.createdAt;
		delete User.current.updatedAt;
		User.current = null;
	}

	function _onUserError(user, error) {
		// The login failed. Check error to see why.
		console.log('Login failed:', error);
		$rootScope.$broadcast('alert', {
			message: error.message
		});
	}

	function _getCurrent() {
		return User.current;
	}

	function _create(resourceConfig, attrs, options) {
		var newUser = new Parse.User();
		newUser.set('username', attrs.username);
		newUser.set('password', attrs.password);
		newUser.set('email', attrs.email);
		newUser.set('name', attrs.name);
		return newUser.signUp();
	}

	function _onSignupError(user, error) {
		// The login failed. Check error to see why.
		console.log('signup failed:', error);
	}

	// instance methods

	function _logout() {
		Parse.User.logOut();
		_disconnectUser();
	}



});
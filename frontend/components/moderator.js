app.directive('moderator', function(cardService, $compile, $rootScope) {
	return {
		restrict: 'E', /* E: Element, C: Class, A: Attribute M: Comment */
		templateUrl: 'components/moderator.html',
		replace: true,
		scope: true,
		controller: function($scope, $element) {
			// public vars
			var suggestions = [];
			$scope.index = 0;
			$scope.loading = true;
			$scope.suggestion = null;
			$scope.legalMod = '';
			$scope.allApproved = false;
			$scope.errorMessage;

			Parse.Cloud.run(
				CONFIG.PARSE_VERSION + 'getUnmoderatedSuggestions',
				{}, 
				{
					success: onSuggestionsLoaded,
					error: onSuggestionsError
				}
			);

			// Private methods

			function onSuggestionsLoaded(newSuggestions) {
				if(newSuggestions.length > 0) {
					suggestions = newSuggestions;
					cardService.cache(suggestions);
					$scope.suggestion = suggestions[$scope.index];
					$scope.suggestionText = $scope.suggestion.get('text');
					$scope.allApproved = false;
				} else {
					$scope.allApproved = true;
				}
				$scope.loading = false;
				$scope.$digest();
			}

			function loadNext() {
				if($scope.index + 1 < suggestions.length) {
					$scope.index++;
					$scope.suggestion = suggestions[$scope.index];
					$scope.suggestionText = $scope.suggestion.get('text');
					if(!$rootScope.$$phase)
						$scope.$digest();
				} else {
					$scope.allApproved = true;
				}
			}

			function onSuggestionsError(error) {
				$scope.loading = false;
				$scope.allApproved = true;
				$scope.errorMessage = error.message;
				console.log('couldn\'t find any unapproved suggestions:', error);
				
				$scope.$digest();
			}

			// Public Methods
			$scope.getSansLegal = _getSansLegal;

			$scope.skip = function() {
				console.log('skip:', $scope.suggestion.id);
				loadNext();
			}

			$scope.approve = function() {
				var options = {
					suggestionId: $scope.suggestion.id,
					text: $scope.suggestion.text,
					message: $scope.suggestion.message
				}
				Parse.Cloud.run(CONFIG.PARSE_VERSION + 'approveSuggestion', options)
				.then(loadNext);
			}

			$scope.disapprove = function() {
				var options = {
					suggestionId: $scope.suggestion.id,
					message: $scope.suggestion.message
				}
				Parse.Cloud.run(CONFIG.PARSE_VERSION + 'disapproveSuggestion', options)
				.then(loadNext);
			}

			// Watch
			$scope.$watch('legalMod', function(newValue, oldValue, scope) {
				if($scope.suggestion) {
					var sansLegal = _getSansLegal($scope.suggestionText);
					if($scope.legalMod)
						$scope.suggestionText = sansLegal + ' ' + $scope.legalMod;
					else
						$scope.suggestionText = sansLegal;
				}
			});

			function _getSansLegal(text) {
				if(text)
					return text.replace(/ (®|©|™)/, '');
				else
					return text;
			}

		}
	}
});
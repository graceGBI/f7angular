Demo.angular.controller('MainController', ['$scope', '$compile', '$rootScope', function($scope, $compile, $rootScope) {

    $$(document).on('pageBeforeAnimation', function(e) {
        // Never recompile index page
        if (e.detail.page.name != 'index') {
            // Ajax pages must be compiled first
            $compile(e.target)($scope);
            $scope.$apply();
        }
        // Send broadcast event when switching to new page
        $rootScope.$broadcast(e.detail.page.name + 'PageEnter', e);
    });

    $$(document).on('pageAfterAnimation', function(e) {
        // Send broadcast if a page is left
        var fromPage = e.detail.page.fromPage;
        //console.log(" : " + fromPage.name);
        if (fromPage) {
            $rootScope.$broadcast(fromPage.name + 'PageLeave', e);
            if (fromPage.name != 'index') {
                var prevPage = angular.element(document.querySelector('#'+fromPage.name));
                //if (fromPage.name == "cart") prevPage.remove();
                //prevPage.remove();
            }
        }
    });
    
    $scope.init = function() {
        console.log("Main init !")
    };
    
}]);

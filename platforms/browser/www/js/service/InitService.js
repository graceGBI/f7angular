/*jslint browser: true*/
/*global console, Framework7, Demo, $document*/

Demo.angular.factory('InitService', ['$document', function ($document) {

    var pub = {},
    eventListeners = {
        'ready': []
    };

    pub.addEventListener = function (eventName, listener) {
        eventListeners[eventName].push(listener);
    };

    function onReady() {
        var fw7 = Demo.fw7, i;
        console.log("ready init service");
        fw7.views.push(fw7.app.addView('.view-main', fw7.options));

        for (i = 0; i < eventListeners.ready.length; i = i + 1) {
            eventListeners.ready[i]();
        }
    }

    // Init
    (function () {
        $document.ready(function () {

            if (document.URL.indexOf("http://") === -1 && document.URL.indexOf("https://") === -1) {
                // Cordova
                //console.log("Using Cordova/PhoneGap setting");
                document.addEventListener("deviceready", onReady, false);
            } else {
                // Web browser
                //console.log("Using web browser setting");
                onReady();
            }

        });
    }());

    return pub;

}]);
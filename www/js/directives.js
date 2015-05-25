angular.module('starter.directives', [])

.directive('yaMap',['$compile','mapApiLoad','yaMapSettings','$window','yaSubscriber','$parse','$q','$timeout', '$rootScope',function($compile, mapApiLoad,yaMapSettings,$window,yaSubscriber,$parse,$q,$timeout, $rootScope){
  return {
    restrict:'E',
    scope: {
      yaCenter:'@',
      yaType:'@',
      yaBeforeInit:'&',
      yaAfterInit:'&'
    },
    compile: function(tElement) {
      var childNodes = tElement.children(),
          centerCoordinatesDeferred = null;
      tElement.children().remove();
      return function(scope, element,attrs) {
        var getEvalOrValue = function(value){
          try{
            return scope.$eval(value);
          }catch(e){
            return value;
          }
        };
        var getCenterCoordinates = function(center){
          if(centerCoordinatesDeferred)
            centerCoordinatesDeferred.reject();
          centerCoordinatesDeferred = $q.defer();
          if(!center){
            //устанавливаем в качестве центра местоположение пользователя
            mapApiLoad(function(){
              ymaps.geolocation.get({
                // Выставляем опцию для определения положения по ip
                provider: 'yandex',
                // Карта автоматически отцентрируется по положению пользователя.
                mapStateAutoApply: true
              }).then(function (result) {
                $timeout(function(){
                  centerCoordinatesDeferred.resolve(result.geoObjects.position);
                }, 0);
              });
            });
          }else if(angular.isArray(center)){
            $timeout(function(){
              centerCoordinatesDeferred.resolve(center);
            });
          }else if(angular.isString(center)){
            //проводим обратное геокодирование
            mapApiLoad(function(){
              ymaps.geocode(center, { results: 1 }).then(function (res) {
                var firstGeoObject = res.geoObjects.get(0);
                scope.$apply(function(){
                  centerCoordinatesDeferred.resolve(firstGeoObject.geometry.getCoordinates());
                });
              }, function (err) {
                scope.$apply(function(){
                  centerCoordinatesDeferred.reject(err);
                });
              });
            });
          }
          return centerCoordinatesDeferred.promise;
        };
        var zoom = Number(attrs.yaZoom),
            behaviors = attrs.yaBehaviors ? attrs.yaBehaviors.split(' ') : ['default'];
        var controls = ['default'];
        if(attrs.yaControls){
          controls=attrs.yaControls.split(' ');
        }else if(angular.isDefined(attrs.yaControls)){
          controls=[];
        }
        var disableBehaviors=[], enableBehaviors=[], behavior;
        for (var i = 0, ii = behaviors.length; i < ii; i++) {
          behavior = behaviors[i];
          if(behavior[0]==='-'){
            disableBehaviors.push(behavior.substring(1));
          }else{
            enableBehaviors.push(behavior);
          }
        }

        if(zoom<0){
          zoom=0;
        }else if(zoom>23){
          zoom=23;
        }

        var mapPromise;
        var mapInit = function(center){
          var deferred = $q.defer();
          mapApiLoad(function(){
            scope.yaBeforeInit();
            var options = attrs.yaOptions ? scope.$eval(attrs.yaOptions) : undefined;
            if(options && options.projection){
              options.projection = new ymaps.projection[options.projection.type](options.projection.bounds);
            }
            scope.map = new ymaps.Map(element[0],{
              center: center,
              zoom:zoom,
              controls:controls,
              type:attrs.yaType || 'yandex#map',
              behaviors:enableBehaviors
            }, options);
            $rootScope.yamap = scope.map;
            scope.map.behaviors.disable(disableBehaviors);
            //подписка на события
            for(var key in attrs){
              if(key.indexOf('yaEvent')===0){
                var parentGet=$parse(attrs[key]);
                yaSubscriber.subscribe(scope.map, parentGet,key,scope);
              }
            }
            deferred.resolve(scope.map);
            scope.yaAfterInit({$target:scope.map});
            element.append(childNodes);
            setTimeout(function(){
              scope.$apply(function() {
                $compile(element.children())(scope.$parent);
              });
            });
          });
          return deferred.promise;
        };

        scope.$watch('yaCenter',function(newValue){
          var center = getEvalOrValue(newValue);
          getCenterCoordinates(center).then(
              function(coords){
                if(!mapPromise){
                  mapPromise = mapInit(coords);
                  var isInit = true;
                }
                mapPromise.then(
                    function(map){
                      if(!isInit){
                        map.setCenter(coords);
                      }
                    }
                );
              }
          );
          /*if(_center){
           setCenter(function(){
           scope.map.setCenter(_center);
           });
           }*/
        });
        scope.$watch('yaType',function(newValue){
          if(newValue && mapPromise){
            mapPromise.then(
                function(map){
                  map.setType(newValue);
                }
            );
          }
        });

        scope.$on('$destroy',function(){
          if(scope.map){
            scope.map.destroy();
          }
        });
      };
    },
    controller: 'YaMapCtrl'
  };
}])

.directive('inputMask', function($timeout){
  return {
    restrict: 'A',
    require: 'ngModel',
    link:function ($scope, element, attrs, controller) {

      var $element = $(element[0]);
      //$element.mask($scope.$eval($scope.type));
      $element.inputmask($scope.$eval(attrs.inputMask));
      /* Add a parser that extracts the masked value into the model but only if the mask is valid
       */
      controller.$parsers.push(function (value) {
        var isValid = value.length && value.indexOf("_") == -1;
        return isValid ? value : undefined;
      });
      /* When keyup, update the view value
       */
      element.bind('keyup', function () {
        $scope.$apply(function () {
          controller.$setViewValue(element.val());
        });
      });
    }
  };
});
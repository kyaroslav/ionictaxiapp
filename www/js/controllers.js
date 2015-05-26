angular.module('starter.controllers', ['starter.directives', 'starter.services', 'yaMap','ion-autocomplete'])

.controller('AppCtrl', function($scope, $ionicModal, $timeout, $rootScope, $http, $ionicSlideBoxDelegate, $state, $ionicHistory) {

      $scope.disableSwipe = function() {
        $ionicSlideBoxDelegate.enableSlide(false);
      };

      $scope.resetSlide = function() {
        $ionicSlideBoxDelegate.slide(0);
      }

      $scope.prevSlide = function() {
        $ionicSlideBoxDelegate.previous();
      }

      $scope.nextSlide = function() {
        $ionicSlideBoxDelegate.next();
      }

      $scope.gotoStart = function() {
        $scope.resetSlide();
        $ionicHistory.nextViewOptions({
          disableBack: true
        });
        $state.go('app.map');
      }

})

.controller('MapCtrl', function($scope, $ionicLoading, $http , Settings, $q, $rootScope) {
  $scope.times = [{id: 1, name:'Прямо сейчас'},{id: 2, name:'На время'}];
  $scope.address = {};
  $scope.address.from = '';
  $scope.address.destination = '';
  $scope.address.when = $scope.times[0];
  $scope.address.time = '';
  $scope.address.timeIsDisabled = true;
  $scope.markers = [];

  $scope.user = {};
  $scope.user.name = Settings.getUsername();
  $scope.user.phone = Settings.getPhonenumber();

  $scope.updateTime = function(val) {
    $scope.address.timeIsDisabled = (val == 1) ? true : false;
  }

      Number.prototype.padLeft = function(base,chr){
        var  len = (String(base || 10).length - String(this).length)+1;
        return len > 0? new Array(len).join(chr || '0')+this : this;
      }



      var d = new Date(); //MM/dd/yyyy HH:mm   yyyy-MM-ddTHH:mm:ss
      var dformat = [
            d.getFullYear(),
            (d.getMonth()+1).padLeft(),
            d.getDate().padLeft()
        ].join('-')+
      'T' +
      [ d.getHours().padLeft(),
        d.getMinutes().padLeft(),
        d.getSeconds().padLeft()].join(':');

      $scope.currentTime = dformat;//d.toDateString() + " " + d.toTimeString()

  //настройки положения карты
  $scope.ymap = {
    center: [32.059722,49.444444], zoom: 15
  };

  $scope.centerOnMe = function() {
    $scope.afterInit();
  };

  $scope.afterInit = function(){
    $ionicLoading.show({
      content: 'Поиск текущего местоположения...',
      showBackdrop: false
    });

    navigator.geolocation.getCurrentPosition(
        function(position) {
          $scope.ymap.center = [position.coords.longitude, position.coords.latitude];;
          $scope.geoObjects.push({
            geometry:{
              type:'Point',
              coordinates: $scope.ymap.center
            }
          });

          $rootScope.yamap.setCenter($scope.ymap.center);
          $ionicLoading.hide();
          $scope.$digest();
          $scope.findAddress();
        },
        function(error){
          $ionicLoading.hide();
          alert(error.message);
        }, {
          enableHighAccuracy: true
          ,timeout : 5000
        }
    );

  };

  $scope.updateControls = function(address) {
    $scope.address.from = address.properties.get('name');
    $scope.$digest();
    var gobj = {GeoObject:{name: address.properties.get('name'), description: address.properties.get('description')}};
    $scope.address.from = gobj;
  }

  $scope.findAddress = function() {
    ymaps.geocode($scope.ymap.center, {
      kind: 'house',
      results: 1
    }).then(
        function (res) {
          var newContent = res.geoObjects.get(0) ?
              res.geoObjects.get(0) :
              'Не удалось определить адрес.';

          $scope.updateControls(newContent);
        }, function(err){
          console.log(err);
          $scope.updateControls(err);
        });
  };

  $scope.geoObjects=[];

  $scope.sendEmail = function (address, user) {
    //reference to the Mandrill REST api
    var apiURL = "https://mandrillapp.com/api/1.0/messages/send.json";

    var data = {};
    data.from = typeof (address.from) == 'object' ? address.from.GeoObject.description + ' , ' + address.from.GeoObject.name : address.from;
    data.to = typeof (address.destination) == 'object' ? address.destination.GeoObject.description + ' , ' + address.destination.GeoObject.name : address.destination;
    data.when = address.when;
    data.time = address.time;

    var mailJSON ={
      "key": "<enter mandrill sender access key>",
      "message": {
        "html": "<h1>Заголовок</h1>" +
        "<p><b><i>Откуда:</i></b> "+data.from+"</p>" +
        "<p><b><i>Куда:</i></b> "+data.to+"</p>" +
        "<p><b><i>Когда:</i></b> "+data.when+"</p>" +
        "<p><b><i>Время:</i></b> "+data.time+"</p>" +
        "<p><b><i>Имя:</i></b> "+user.name+"</p>" +
        "<p><b><i>Телефон:</i></b> "+user.phone+"</p>",
        "text": "Example text content",
        "subject": "example subject",
        "from_email": "sender@sending.domain.com",
        "from_name": "Support",
        "to": [
          {
            "email": "<enter your email address>",
            "name": "<enter you name>",
            "type": "to"
          }
        ],
        "important": false,
        "track_opens": null,
        "track_clicks": null,
        "auto_text": null,
        "auto_html": null,
        "inline_css": null,
        "url_strip_qs": null,
        "preserve_recipients": null,
        "view_content_link": null,
        "tracking_domain": null,
        "signing_domain": null,
        "return_path_domain": null
      },
      "async": false,
      "ip_pool": "Main Pool"
    };

    Settings.set('name', $scope.user.name);
    Settings.set('phone', $scope.user.phone);
    $http.post(apiURL, mailJSON).
        success(function(data, status, headers, config) {
          alert('Письмо успешно отправлено.');
        }).error(function(data, status, headers, config) {
          alert('Опшибка при отправке письма.');
        });
  };

  $scope.disableTap = function(elid){
    container = document.getElementsByClassName('pac-container');
    // disable ionic data tab
    angular.element(container).attr('data-tap-disabled', 'true');
    // leave input field if google-address-entry is selected
    angular.element(container).on("click", function(){
      document.getElementById(elid).blur();
    });
  };

  $scope.callbackMethod = function(query) {
    var d = $q.defer();

    var center = $scope.ymap.center;
    var url = 'http://geocode-maps.yandex.ru/1.x/?format=json&kind=house&ll='+center.join(',')+'&spn=0.552069,0.400552&format=json&results=5&lang=ru_RU&geocode=' + query;

    $http.get(url).success(function(data){
      d.resolve(data.response.GeoObjectCollection.featureMember);
    });

    return d.promise;
  };

  $('.phone').inputmask('+7(999)999-99-99');

})

.controller('PlaylistCtrl', function($scope, $http, $stateParams) {


});

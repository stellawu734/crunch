$(document).ready(function() {
	$('select').material_select();

	//initial map
	var map;
	var geocoder;
	var infowindow;
	function myMap() {
		var mapCanvas = document.getElementById("map");
		var mapOptions = {
			center: new google.maps.LatLng(30.2669444,-97.7427778),
			zoom: 12
		};
		map = new google.maps.Map(mapCanvas, mapOptions);
	}
	myMap();

	//autocomplete for currentLoc
	var defaultBounds = new google.maps.LatLngBounds(
		new google.maps.LatLng(30.136290,-97.945014),
		new google.maps.LatLng(30.536753, -97.559441));
	var input = document.getElementById('currentLoc');
	var options = {
		bounds: defaultBounds,
		types: ['address']
	};
	var autocomplete = new google.maps.places.Autocomplete(input, options);
	autocomplete.addListener('place_changed', fillInAddress);

	function fillInAddress() {
	// Get the place details from the autocomplete object.
	var place = autocomplete.getPlace();
	console.log(place);
	}
	// on click, mark startpoint with a marker and recenter to currentLoc

	function codeAddress() {
		geocoder = new google.maps.Geocoder();
		var address = $('#currentLoc').val().trim();
		geocoder.geocode({'address':address},function(results, status){
			if (status =='OK') {  
				var marker = new google.maps.Marker({position:results[0].geometry.location,
					animation:google.maps.Animation.DROP,
					icon:'http://icons.iconarchive.com/icons/david-renelt/little-icon-people/32/Women-icon.png'});
				marker.setMap(map);
				map.setCenter(results[0].geometry.location);  
				map.setZoom(16);
				map.center = results[0].geometry.location;
				//search nearby restaurants by key terms and set markers and infowindows
				var keyTerm = $('#foodCategory').val().trim();
				infowindow = new google.maps.InfoWindow();
				var service = new google.maps.places.PlacesService(map);
				service.nearbySearch({
					location: map.center,
					radius: 20000,
					type: ['restaurant'],
					name: keyTerm
					}, callback);

				function callback(results, status) {
					if (status === google.maps.places.PlacesServiceStatus.OK) {
						for (var i = 0; i < results.length; i++) {
							createMarker(results[i]);
						}
					}
				}

				function createMarker(place) {
					var photos = place.photos;
					if (!photos) {
						return;
					}
					var icon = photos[0].getUrl({'maxWidth': 50, 'maxHeight': 50})
					var placeLoc = place.geometry.location;
					var marker = new google.maps.Marker({
						map: map,
						position: place.geometry.location
					});

					google.maps.event.addListener(marker, 'click', function() {
						getTime(place, function (error, travelTime) {
							if (error) console.log('got an error', error);
							infowindow.setContent(place.name + '<br>' + travelTime + '<br>' + 'Price: ' + place.price_level + '<br>' + 'rating: ' + place.rating);
						});
						infowindow.open(map, this);
					});
				}
			}
		})
	};

	//marker
	$('#search').on('click',function(){
		codeAddress();

		//distance matrix
		var startPoint = $('#currentLoc').val().trim();
		var origins = [startPoint];
		//get restaurant coordinates from yelp callback 'endpoint'

		var endPoint;
		var destinations;
		var travel = $('#travel').val().trim().toUpperCase();


		var distanceMatrix  = new google.maps.DistanceMatrixService();
		var distanceRequest = { origins: origins, destinations: destinations, travelMode: google.maps.TravelMode[travel], unitSystem: google.maps.UnitSystem.IMPERIAL, avoidHighways: false, avoidTolls: false };

		distanceMatrix.getDistanceMatrix(distanceRequest, function(response, status) {
			if (status != google.maps.DistanceMatrixStatus.OK) {
				alert('Error was: ' + status);
			}
			else {
				var origins      = response.originAddresses;
				var destinations = response.destinationAddresses;
				console.log(response);
				console.log('Distance: '+ response.rows[0].elements[0].distance.text);
				console.log('Duration: '+response.rows[0].elements[0].duration.text);
			}
		});
	});
});

function getTime(clicked, callback) {

	var start = $('#currentLoc').val().trim();
	var end = clicked.geometry.location;
	var travel = $('#travel').val().trim().toUpperCase();

	var request = {
		origin: start,
		destination: end,
		drivingOptions: {
			departureTime: new Date(),
			trafficModel: 'pessimistic'
		},
		travelMode: travel,
		unitSystem: google.maps.UnitSystem.IMPERIAL
	};

	var directionsService = new google.maps.DirectionsService();
	directionsService.route(request, function(result, status) {
	// result object can be used to display the directions
	if (status == 'OK') {
	// Return travel time
		callback(null, result.routes[0].legs[0].duration.text);
	} else {
		callback('Status not okay.');
	}
	});
}

getYelp('mexican', 'austin, tx', function(error, data) {
	console.log(data.businesses[0].image_url);
}); 
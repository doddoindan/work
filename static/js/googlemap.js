/**
 * Created by macbook on 22.03.16.
 */
var geocoder;
var map;
var marker;


function initMap(fp) {

  var self = this;

  //if latlng not provided by facebook
  if (fp.location_latitude()==null || fp.location_longitude()==null){
    geocoder = new google.maps.Geocoder();
    geocoder.geocode( { 'address': fp.location_city() + ',' +fp.location_country()}, function(results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        fp.location_latitude(results[0].geometry.location.lat());
        fp.location_longitude(results[0].geometry.location.lng());
        initMap(fp);
      }
    });
  }

  if (fp.location_latitude()==null || fp.location_longitude()==null){
    return;
  }

  var myLatLng = {lat: fp.location_latitude(), lng: fp.location_longitude()};

  var map = new google.maps.Map(document.getElementById('mapCanvas1'), {
    zoom: 17,
    center: myLatLng
  });

  marker = new google.maps.Marker({
    position: myLatLng,
    map: map,
    draggable: true,
    title: 'Your adress',
    icon: 'static/images/gmMarker.png'
  });

  google.maps.event.addListener(marker, 'dragend', function() {
    //updateMarkerStatus('Drag ended');
    //geocodePosition(marker.getPosition());
    var latlng = marker.getPosition();
    map.panTo(latlng);

    fp.location_latitude(latlng.lat());
    fp.location_longitude(latlng.lng());

  });


 /* google.maps.event.addListener(map, 'click', function(e) {
    updateMarkerPosition(e.latLng);
    geocodePosition(marker.getPosition());
    marker.setPosition(e.latLng);
    map.panTo(marker.getPosition());
  });
  */
}



function geocodePosition(pos) {

  geocoder.geocode({
    latLng: pos
  }, function(responses) {
    if (responses && responses.length > 0) {
      updateMarkerAddress(responses[0].formatted_address);
    } else {
      updateMarkerAddress('Cannot determine address at this location.');
    }
  });
}

function updateMarkerStatus(str) {
  return;
  document.getElementById('markerStatus').innerHTML = str;
}

function updateMarkerPosition(latLng) {
  return;
  document.getElementById('info').innerHTML = [
    latLng.lat(),
    latLng.lng()
  ].join(', ');
}

function updateMarkerAddress(str) {
  //document.getElementById('address').innerHTML = str;
}
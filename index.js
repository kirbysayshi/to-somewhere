(function() {

if (
  !('geolocation' in window.navigator)
  && !('watchPosition' in window.navigator.geolocation)
) {
  alert('Your device does not support geolocation');
  return;
}

var arrow = document.querySelector('.arrow-mover');

//window.navigator.geolocation.watchPosition(console.log.bind(console, '1'), console.log.bind(console, '2'))

function positionUpdate(pos) {
  // pos.timestamp
  // pos.coords
  // pos.coords
  //           .accuracy 65
  //           .altitude 13
  //           .altitudeAccuracy 148.5
  //           .heading -1
  //           .latitude 40.73956817437509
  //           .longitude -73.99351832954994
  //           .speed -1
}

function positionFail(err) {

}


var itineraries = [{

  name: '',
  id: '',
  waypoints: [{
    latitude: 0,
    longitude: 0,
    altitude: 0
  }]

}]




/*
(function ghost() {
  var nextTime = (Math.random() * 5000) + 2000;
  var heading = Math.random() * 360;
  arrow.style.transform = ''
    + 'translate3d(0,-50vh,0)'
    + 'rotateZ(' + heading + 'deg)';
  setTimeout(ghost, nextTime)
}())
*/

var ARROW_INC_DEG = 10;
var heading = 0;

document.addEventListener('keydown', function(e) {

  if (e.which == 37) {
    heading -= ARROW_INC_DEG;
  } else if (e.which == 39) {
    heading += ARROW_INC_DEG;
  }

  arrow.style.transform = ''
    + 'translate3d(0,-50vh,0)'
    + 'rotateZ(' + heading + 'deg)';
})



}())

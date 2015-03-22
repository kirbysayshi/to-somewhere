(function() {

if (
  !('geolocation' in window.navigator)
  && !('watchPosition' in window.navigator.geolocation)
) {
  alert('Your device does not support geolocation');
  return;
}

var dbgPanelOrientation = document.querySelector('.debug-panel-orientation');
var dbgPanelHeading = document.querySelector('.debug-panel-heading');
var arrow = document.querySelector('.arrow-mover');

var fsTries = [1000, 2000, 4000, 8000, 16000];

var destination = {
  lat: null,
  lng: null,
  name: null,
  waiting: false
}

var position = {
  lat: null,
  lng: null,
  direction: null,
  headingDelta: 0,
  previousHeading: null
}

window.navigator.geolocation.watchPosition(positionUpdate, positionFail, {
  timeout: 5000,
  enableHighAccuracy: true // use actual gps if possible
})

window.addEventListener("deviceorientation", orientationUpdate, false);

if (!window.DeviceOrientationEvent) {
  alert('No device orientation (compass) capability detected!');
}

function orientationUpdate(e) {
  /*
    (absolute == false||null) alpha: z-axis rotation (axis into the screen)
    (counterclockwise)
    0 = portrait
    90 = left landscape
    180 = reverse portrait

    webkitCompassHeading:
    (clockwise)
    0 = magnetic North
    90 = magnetic East
    180 = magnetic South
  */

  if (e.absolute) {
    position.direction = e.alpha + 90;
  } else if (e.webkitCompassHeading) {
    position.direction = 360 - e.webkitCompassHeading;
  }

  dbgPanelOrientation.innerHTML = ''
    + 'alpha: ' + (e.alpha || 0).toFixed(2) + '<br >'
    + 'beta: ' + (e.beta || 0).toFixed(2) + '<br >'
    + 'gamma: ' + (e.gamma || 0).toFixed(2) + '<br >'
    + 'absolute: ' + e.absolute + '<br >'
    + 'webkitCompassAccuracy: ' + e.webkitCompassAccuracy + '<br >'
    + 'webkitCompassHeading: ' + e.webkitCompassHeading + '<br >'
    + 'position.direction: ' + position.direction + '<br >'
    + 'window.orientation: ' + window.orientation + '<br >'
}

function updateHeading() {
  var diffx = destination.lng - position.lng;
  var diffy = destination.lat - position.lat;

  var dist = Math.sqrt(diffx*diffx + diffy*diffy);

  var diffnormalx = diffx / dist;
  var diffnormaly = diffy / dist;

  var direction = Math.atan2(diffnormaly, diffnormalx) * (180 / Math.PI);
  var heading = (position.direction - direction).toFixed(5) - 270;

  // Prevent CSS reverse spinning wrap-around
  var delta = heading - position.previousHeading;
  if (delta < -180) delta += 360;
  if (delta > 180) delta -= 360;
  position.headingDelta += delta;

  arrow.style.transform = arrow.style.webkitTransform = ''
    + 'translate3d(0,0,0)'
    + 'rotateZ(' + position.headingDelta + 'deg)';

  dbgPanelHeading.innerHTML = ''
    + 'name: ' + destination.name + '<br >'
    + 'pos: ' + (position.lng || 0).toFixed(20) + ', ' + (position.lat || 0).toFixed(20) + '<br >'
    + 'dest: ' + (destination.lng || 0).toFixed(20) + ', ' + (destination.lat || 0).toFixed(20) + '<br >'
    + 'diff: ' + diffx + ', ' + diffy + '<br>'
    + 'dist: ' + dist + '<br >'
    + 'normal: ' + diffnormalx + ', ' + diffnormaly + '<br >'
    + 'atan2 direction: ' + direction + '<br >'
    + 'heading: ' + heading + '<br >'

  position.previousHeading = heading;
}

function positionUpdate(pos) {
  console.log(pos);

  position.lat = pos.coords.latitude;
  position.lng = pos.coords.longitude;

  if (!destination.lat && !destination.lng && !destination.waiting) {
    destination.waiting = true;
    foursquare(pos, function(err, lat, lng, name) {
      destination.waiting = false;
      if (err) {
        if (err.response && err.warning) {
          alert(err.warning.text);
        } else {
          alert(JSON.stringify(err))
        }
        return
      }
      destination.lat = lat;
      destination.lng = lng;
      destination.name = name;
      updateHeading();
    })
  }

  updateHeading();

  // pos.timestamp
  // pos.coords
  // pos.coords
  //           .accuracy 65
  //           .altitude 13
  //           .altitudeAccuracy 148.5
  //           .heading -1 // only when moving
  //           .latitude 40.73956817437509
  //           .longitude -73.99351832954994
  //           .speed -1
}

function positionFail(err) {
  console.log(err);
  alert(err.message);
}

function foursquare(pos, cb) {
  if (fsTries.length === 0) return cb(new Error('Ran out of foursquare retries'));

  var radius = fsTries.shift();

  // fspvp credentials: https://foursquare.com/developers/app/YFJWSRVBCDVQH40VPWTUJFDN3CHAVUAHEWAOC4G1IRCMKI1E
  var url = 'https://api.foursquare.com/v2/venues/explore'
    + '?client_id=YFJWSRVBCDVQH40VPWTUJFDN3CHAVUAHEWAOC4G1IRCMKI1E'
    + '&client_secret=HMYJB4UWWUDDMI0BSLV2OQRODRNHBARBKKCR1XTXROIYUNVB'
    + '&v=20150322'
    + '&ll=' + pos.coords.latitude + ',' + pos.coords.longitude
    + '&llAcc=' + pos.coords.accuracy
    + '&section=trending'
    //+ '&openNow=1'
    + '&radius=' + radius

  console.log(url);
  cb = cb || function() {};

  var req = new XMLHttpRequest();
  req.open('GET', url);
  req.addEventListener('load', function() {
    var data = json(req.response);

    if (!data) return cb(req.response);
    if (data.meta.code !== 200) return cb(data);
    if (!data.response.groups || data.response.groups.length === 0) return foursquare(pos, cb);

    var item = data.response.groups[0].items[0];
    console.log(item);
    if (!item) return foursquare(pos, cb);
    return cb(null, item.venue.location.lat, item.venue.location.lng, item.venue.name);
  })
  req.addEventListener('error', function() {
    console.log('error', arguments);
    cb && cb(arguments);
  }, false)
  req.send();
}

var itineraries = [{

  name: '',
  id: '',
  waypoints: [{
    latitude: 0,
    longitude: 0,
    altitude: 0
  }],
  currentWaypointIndex: 0

}]

function json(txt) {
  var out = null;
  try {
    out = JSON.parse(txt);
  } catch(e) {}
  return out;
}

}())

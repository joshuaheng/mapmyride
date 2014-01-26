var map;
var initialLocation;
var browserSupportFlag =  new Boolean();
var markers = {};
var filtered = [];
var iconBase = 'http://web.engr.illinois.edu/~heng3/hacktech/icons/';
var icons = {
  airbus: {
    icon: iconBase + 'airbus.png'
  },
  blue: {
    icon: iconBase + 'blue.png'
  },
  bronze: {
    icon: iconBase + 'bronze.png'
  },
  brown: {
    icon: iconBase + 'brown.png'
  },
  gold: {
    icon: iconBase + 'gold.png'
  },
  green: {
    icon: iconBase + 'green.png'
  },
  grey: {
    icon: iconBase + 'grey.png'
  },
  illini: {
    icon: iconBase + 'illini.png'
  },
  lavender: {
    icon: iconBase + 'lavendar.png'
  },
  lime: {
    icon: iconBase + 'lime.png'
  },
  navy: {
    icon: iconBase + 'navy.png'
  },
  orange: {
    icon: iconBase + 'orange.png'
  },
  pink: {
    icon: iconBase + 'pink.png'
  },
  red: {
    icon: iconBase + 'red.png'
  },
  ruby: {
    icon: iconBase + 'ruby.png'
  },
  silver: {
    icon: iconBase + 'silver.png'
  },
  teal: {
    icon: iconBase + 'teal.png'
  },
  yellow: {
    icon: iconBase + 'yellow.png'
  }
};
function checkFirstVisit() {
  if(document.cookie.indexOf('mycookie')==-1) {
    // cookie doesn't exist, create it now
    document.cookie = 'mycookie=1';
  }
  else {
    // not first visit, so alert
    //alert('You refreshed!');
    myFireVehicles.remove();
  }
}
function getBusPos(){
	return $.ajax({url:"https://web.engr.illinois.edu/~heng3/hacktech/getVehicles.php"});
}
function addMarker(id,lat,lon,map,color,route_id, direction){
	//console.log(color);
	var marker_pos = new google.maps.LatLng(lat, lon);
	//console.log(marker_pos);
    //marker's position will keep changing based on the bus's details
    var marker = new MarkerWithLabel({
    position: marker_pos,
    icon: icons[color].icon,
    map: map,
    draggable:true,
    title: 'Click to zoom',
    labelContent: route_id + " " + direction,
    labelAnchor: new google.maps.Point(42, 0),
    labelClass: "labels", // the CSS class for the label
  });
    markers[id]=marker;
    //console.log(markers);
}

function updateFirebase(){
	var bus_info = getBusPos();
   	bus_info.success(function(data){
   		var vehicles = data.vehicles;
   		//console.log(vehicles);
   		//for each vehicle, call addmarker
   		for(var key in vehicles){
   			var obj = vehicles[key];
   			myFireVehicles.child(obj.vehicle_id).set({vehicle_id:obj.vehicle_id, route:obj.trip.route_id, direction:obj.trip.direction, lat:obj.location.lat, lon:obj.location.lon});
   		}
   	});
}
function feq (f1, f2) {
  return (Math.abs(f1 - f2) < 0.000001);
 }

//taken from firebase/firebus
// hack to animated/move the Marker class -vikrum
// based on http://stackoverflow.com/a/10906464
google.maps.Marker.prototype.animatedMoveTo = function(toLat, toLng) {
  var fromLat = this.getPosition().lat();
  var fromLng = this.getPosition().lng();
  if(feq(fromLat, toLat) && feq(fromLng, toLng))
    return;
    
  // store a LatLng for each step of the animation
  var frames = [];
  for (var percent = 0; percent < 1; percent += 0.005) {
    curLat = fromLat + percent * (toLat - fromLat);
    curLng = fromLng + percent * (toLng - fromLng);
    frames.push(new google.maps.LatLng(curLat, curLng));
  }
      
  move = function(marker, latlngs, index, wait) {
    marker.setPosition(latlngs[index]);
     if(index != latlngs.length-1) {
      // call the next "frame" of the animation
       setTimeout(function() { 
        move(marker, latlngs, index+1, wait); 
      }, wait);
    }
  }
    
  // begin animation, send back to origin after completion
  move(this, frames, 0, 25);
}
function initialize() {
    var mapOptions = {
    	center: new google.maps.LatLng(40.1102576, -88.2258257),
        zoom: 17
    };
    
    map = new google.maps.Map(document.getElementById("map-canvas"),mapOptions);
}

google.maps.event.addDomListener(window, 'load', initialize);

var myFireVehicles = new Firebase('https://blinding-fire-3873.firebaseio.com');

//retrieves the buses from the server for the first time
myFireVehicles.once('value',function(data){
	var bus_info = getBusPos();
   	bus_info.success(function(data){
   		var vehicles = data.vehicles;
   		//console.log(vehicles);
   		//console.log(vehicles);
   		//for each vehicle, call addmarker
   		for(var key in vehicles){
   			var obj = vehicles[key];
   			console.log(obj);
   			var color = obj.trip.route_id.split(" ")[0].toLowerCase();
        if(color==="air"){
          color = "airbus";
        }
   			//console.log(color);
   			myFireVehicles.child(obj.vehicle_id).set({vehicle_id:obj.vehicle_id, route:obj.trip.route_id, direction:obj.trip.direction, lat:obj.location.lat, lon:obj.location.lon});
   			addMarker(obj.vehicle_id,obj.location.lat,obj.location.lon,map,color,obj.trip.route_id, obj.trip.direction);
   			//console.log(obj.vehicle_id);
   		}
   	});
   
});
	//console.log(markers);

myFireVehicles.on('value',function(data){
	//console.log(data.val());
	//console.log(markers);
	data.forEach(function(s){
		//console.log(s.val());
		var busObj = s.val();
		var newpos = new google.maps.LatLng(busObj.lat, busObj.lon);
		//console.log(busObj.vehicle_id);
		
		if(typeof markers[busObj.vehicle_id] === "undefined" ){
			//continue
		}
		else
			//markers[busObj.vehicle_id].setPosition = newpos;
		markers[busObj.vehicle_id].animatedMoveTo(busObj.lat, busObj.lon);
		//console.log(markers);
	});
});
//console.log(markers);
setInterval("updateFirebase()",10000);
updateFirebase();

//http://stackoverflow.com/questions/4057665/google-maps-api-v3-find-nearest-markers
function find_closest_marker( lat1, lon1 ) {    
    var pi = Math.PI;
    var R = 6371; //equatorial radius
    var distances = [];
    var closest = -1;

    for( i=0;i<filtered.length; i++ ) {  
        var lat2 = filtered[i].location.lat;
        var lon2 = filtered[i].location.lng;

        var chLat = lat2-lat1;
        var chLon = lon2-lon1;

        var dLat = chLat*(pi/180);
        var dLon = chLon*(pi/180);

        var rLat1 = lat1*(pi/180);
        var rLat2 = lat2*(pi/180);

        var a = Math.sin(dLat/2) * Math.sin(dLat/2) + 
                    Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(rLat1) * Math.cos(rLat2); 
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        var d = R * c;

        distances[i] = d;
        if ( closest == -1 || d < distances[closest] ) {
            closest = i;
        }
    }

    // (debug) The closest marker is:
    return filtered[closest];
}

function filterSearch(elem){
  var param = document.getElementById("searchparam").value;
  var bus = param.split(" ");
  console.log(bus);
  if(elem.trip.route_id.split(" ")[0]===bus[0].toUpperCase() && elem.trip.direction.toUpperCase()===bus[1].toUpperCase()){
    return elem;
  }
  else
    return null;
}

function test(){
  var bus_info = getBusPos();
    bus_info.success(function(data){
      var buses = data.vehicles;
      console.log(buses);
      filtered = buses.filter(filterSearch);
      console.log(filtered);
      if(filtered.length == 1){
        var search_pos = new google.maps.LatLng(filtered[0].location.lat, filtered[0].location.lon);
        map.setZoom(17);
        map.panTo(search_pos);
      }
      else if(filtered.length > 1){
        if(navigator.geolocation) {
          browserSupportFlag = true;
          navigator.geolocation.getCurrentPosition(function(position) {
            //this should be used after demoday
            //initialLocation = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
            initialLocation = new google.maps.LatLng(40.1097891,-88.2272609);
            var closestbus = find_closest_marker(40.1097891,-88.2272609);
            var search_pos = new google.maps.LatLng(closestbus.location.lat, closestbus.location.lon);
            map.setZoom(17);
            map.panTo(search_pos);
          }, function() {
            handleNoGeolocation(browserSupportFlag);
          });
        }
        console.log(initialLocation);
      }
      else{
        alert("service not running");
      }
    });
  //var filtered = markers.filter(filterSearch);
  //console.log(filtered);
  return false;
}
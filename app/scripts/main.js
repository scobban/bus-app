'use strict';

// Initialize Firebase
var config = {
    apiKey: "AIzaSyAkF_arn5No5F6gNhWBDwHOpxLQjaGJ66k",
    authDomain: "bus-app-f7cdf.firebaseapp.com",
    databaseURL: "https://bus-app-f7cdf.firebaseio.com",
    projectId: "bus-app-f7cdf",
    storageBucket: "",
    messagingSenderId: "276731095903"
};
firebase.initializeApp(config);

var BusApp = {};

// // check to see if localStorage is 
// // supported AND active on the browser
// // source: https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API
// function storageAvailable(type) {
//     try {
//         var storage = window[type],
//             x = '__storage_test__';
//         storage.setItem(x, x);
//         storage.removeItem(x);
//         return true;
//     }
//     catch(e) {
//         return e instanceof DOMException && (
//             // everything except Firefox
//             e.code === 22 ||
//             // Firefox
//             e.code === 1014 ||
//             // test name field too, because code might not be present
//             // everything except Firefox
//             e.name === 'QuotaExceededError' ||
//             // Firefox
//             e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
//             // acknowledge QuotaExceededError only if there's something already stored
//             storage.length !== 0;
//     }
// }

// // use localStorage check from above
// if (storageAvailable('localStorage')) {
// 	// show the "favorite" link
// }
// else {
// 	// hide the "favorite" link
// }

// // check to see if things are stored in localStorage
// if(!localStorage.getItem('<thing>')) {
// 	// if specified things isn't found, do this:
// 	// thingAction();
// } else {
// 	// else, do this:
// 	// otherThing();
// }

var clearField = function(field) {
    $(field).empty();
}

BusApp.compileItem = function(template, item) {
    var source = template.html();
    var template = Handlebars.compile(source);
    return template(item);
}

BusApp.createOption = function(tagAtt, titleAtt) {
    var template = $("#dropdown-template");
    var output = $("#route");
    var optionObject = {
        tag: tagAtt,
        title: titleAtt
    };
    var compiledOption = BusApp.compileItem(template, optionObject);
    output.append(compiledOption);
}

BusApp.createOption2 = function(tagAtt, titleAtt, nameAtt, forUIAtt) {
    var template = $("#dropdown-template2");
    var output = $("#direction");
    var optionObject = {
        tag: tagAtt,
        title: titleAtt,
        name: nameAtt,
        ui: forUIAtt
    };
    var compiledOption = BusApp.compileItem(template, optionObject);
    output.append(compiledOption);
}

BusApp.createOption3 = function(tagAtt, titleAtt) {
    var template = $("#dropdown-template2");
    var output = $("#stops");
    var optionObject = {
        tag: tagAtt,
        title: titleAtt
    };
    var compiledOption = BusApp.compileItem(template, optionObject);
    output.append(compiledOption);
}

BusApp.createTimes = function(destination, vehicle, route, stop, minutes, time) {
     var template = $("#times-template");
     var output = $("#times");
     var timesObject = {
        destination: destination,
        vehicle: vehicle,
        route: route,
        stop: stop,
        minutes: minutes,
        time: time
     }
    var compiledOption = BusApp.compileItem(template, timesObject);
    output.append(compiledOption);
}

var routeDropdown = $("#route");
var directionDropdown = $("#direction");
var stopsDropdown = $("#stops");

var noResultsMessage = "Times are not currently available."
var errorMessage = "There was an error getting the data. Please refresh and try again."

var urlBase = "https://accesscontrolalloworiginall.herokuapp.com/http://webservices.nextbus.com/service/publicXMLFeed";

function convertTime(eTime) {
    var t = parseInt(eTime);
    var d = new Date(t);
    var h = d.getHours();
    if (h > 12) {
      h = h - 12;
    }
    var m = d.getMinutes();
    return h + ":" + m;
}

function GetRoute() {
    var request = $.ajax({
    	url: urlBase + "?command=routeList&a=mbta",
        dataType: "xml",
        statusCode: {
            404: function() {
                $("#times").append(errorMessage);
            }
        }
    });

    request.done(function(data){
        var routeData = $.xmlToJSON(data);

        var route = routeData.body.route;
        console.log("GetRoute: ", route);

        for(var i = 0; i < route.length; i++) {
            var tag = route[i]["@tag"];
            var title = route[i]["@title"];
            BusApp.createOption(tag, title);
        }

    });

    request.fail(function(data){
        alert("Couldn't load the routes.");
    });

}

var stopData;

function GetDirection(routeNumber) {

    var request = $.ajax({
        url: urlBase + "?command=routeConfig&a=mbta&r=" + routeNumber,
        dataType: "xml",
        statusCode: {
            404: function() {
                $("#times").append(errorMessage);
            }
        }
    });

    request.done(function(data){
        stopData = $.xmlToJSON(data);

        var direction = stopData.body.route.direction;

        var dropdown = $("#direction");

        dropdown.children().hide();

        for(var i = 0; i < direction.length; i++) {
            var dirName = direction[i]["@name"];
            var tag = direction[i]["@tag"];
            var title = direction[i]["@title"];
            var option = "<option value='" + tag + "' data-direction='" + dirName + "' data-title='" + title + "'>" + dirName + " to " + title + "</option>";
            if (dirName == "Inbound") {
                dropdown.prepend(option);
            } else {
                dropdown.append(option);
            }
        }

        if (direction != null) {
            var firstOption = "<option disabled selected>Select Direction</option> ";
            dropdown.prepend(firstOption);
        }

    });

    request.fail(function(data){
        alert("Couldn't load the directions.");
    });
}

function GetTimes(routeNumber, stopTag) {

    clearField("#times");

    var request = $.ajax({
        url: urlBase + "?command=predictions&a=mbta&r=" + routeNumber + "&s=" + stopTag,
        dataType: "xml",
        statusCode: {
            404: function() {
                $("#times").append(errorMessage);
            }
        }
    });

    request.done(function(data){
        var timesData = $.xmlToJSON(data);

        var times = timesData.body.predictions.direction;
        // console.log("GetTimes: ", times);

        if (times === undefined ) {
            $("#times").append(noResultsMessage);
            return;
        }

        for(var i = 0; i < times.prediction.length; i++) {
            console.log(times);
            var epoch = times.prediction[i]["@epochTime"];
            var vehicle = times.prediction[i]["@vehicle"];
            var destination = times["@title"];
            var minutes = times.prediction[i]["@minutes"];
            var newTime = convertTime(epoch);
            BusApp.createTimes(destination, vehicle, routeNumber, stopTag, minutes, newTime);
        }

    });

    request.fail(function(data){
        alert("Couldn't load the times.");
    });

}

$(document).ready(function() {

    GetRoute();
	
    var routeTag;

    $(document).on("click", ".favorite", function(){
        var stop = $(this).parents(".prediction").data("stop");
        var route = $(this).parents(".prediction").data("route");
        var direction = $(this).parents(".prediction").data("destination");
        console.log(route + "." + stop);
        localStorage.setItem("FaveStop", route + "." + stop + "." + direction);
    });

    $(routeDropdown).on("change", function(){

        clearField("#direction");
        clearField("#stops");
        clearField("#times");

        routeTag = $(this).find("option:selected").data("tag");

        GetDirection(routeTag);
    });

    $(directionDropdown).on("change", function(){
        
        clearField("#stops");
        clearField("#times");

        var dropdown = $("#stops");
        var firstOption = "<option disabled selected>Select Stop</option> ";
        dropdown.prepend(firstOption);

        var tag = $(this).val();
        var directionVal = $(this).attr("data-direction");
        var routeData = stopData.body.route;

        console.log(tag, directionVal);

        var stopTag;

        for (var k = 0; k < routeData.direction.length; k++) {
            if (routeData.direction[k]["@tag"] == tag) {
                var direction = routeData.direction[k];
                break;
            }
        }
        for (var m = 0; m < direction.stop.length; m++) {
            for (var p = 0; p < routeData.stop.length; p++) {
                if (routeData.stop[p]["@tag"] == direction.stop[m]["@tag"]) {
                    stopTag = routeData.stop[p]["@tag"];
                    // console.log("STOPTAG: " + stopTag);
                    var stopTitle = routeData.stop[p]["@title"];
                    var option = "<option value='" + stopTag + "' data-direction='" + directionVal + "' data-title='" + stopTitle + "'>" + stopTitle + "</option>";
                    dropdown.append(option);
                }
            }
        }


    });

    $(stopsDropdown).on("change", function(){

        clearField("#times");

        var tag = $(this).val();

        // console.log("RT: " + routeTag + ", ST: " + tag);

        GetTimes(routeTag, tag);

    });


});

// NextBus feed info
// https://www.nextbus.com/xmlFeedDocs/NextBusXMLFeed.pdf

// List the routes of the MBTA
// command=routeList
// http://webservices.nextbus.com/service/publicXMLFeed?command=routeList&a=mbta

// Route Details (route 60 used as example)
// command=routeConfig
// NOTE: '&terse' added to hide unnecessary 'path' content
// http://webservices.nextbus.com/service/publicXMLFeed?command=routeConfig&a=mbta&r=60&s=15291&terse

// Get prediction times (ex. route 39, stop 91391)
// command=predictions
// http://webservices.nextbus.com/service/publicXMLFeed?command=predictions&a=mbta&r=39&s=91391

// Schedule for a route (ex. route 39)
// command=schedule
// http://webservices.nextbus.com/service/publicXMLFeed?command=schedule&a=mbta&r=39

// (?) Messages for a route (ex. route 39) (note: need to prove if this is correct)
// http://webservices.nextbus.com/service/publicXMLFeed?command=messages&a=mbta&r=39
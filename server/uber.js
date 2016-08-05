'use strict';

const rp = require('request-promise');

//Input start & end coordinates, output a promise that will return Uber ride info
function uberRides(coords) {
  console.log('Hit Uber Rides: ', coords);
  const options = {
    uri: `https://api.uber.com/v1/estimates/price?start_latitude=${coords.start.lat}&start_longitude=${coords.start.lng}&end_latitude=${coords.end.lat}&end_longitude=${coords.end.lng}`,
    headers: {
      'Authorization': `Token ${process.env.UBER_TOKEN}`
    },
    json: true
  }
  return rp(options)
}

//Input start & end coordinates, output a promise that will return Uber car ETAs
function uberEtas(coords) {
  console.log('Hit Uber Etas: ', coords);
  const options = {
    uri: `https://api.uber.com/v1/estimates/time?start_latitude=${coords.start.lat}&start_longitude=${coords.start.lng}`,
    headers: {
      'Authorization': `Token ${process.env.UBER_TOKEN}`
    },
    json: true
  }
  return rp(options)
}

//Input Uber's responses from the rides & etas API calls, output an array
// of ride options with all relevant properties combined from the two calls.
function parseUber(apiResponses) {
  let rides = apiResponses[0]['prices'];
  const etas = apiResponses[1]['times'];
  const coords = apiResponses[2];

  rides = rides.map(function(obj) {
    const out = {};
    out.product_id = obj.product_id;
    out.display_name = obj['display_name'];// === 'POOL' : 'uberPOOL';
    out.duration = obj['duration'];
    out.distance = obj['distance'];
    out.high_estimate = obj['high_estimate'] * 100;
    out.low_estimate = obj['low_estimate'] * 100;
    out.avg_estimate = ((obj['high_estimate'] + obj['low_estimate']) * 100 / 2);
    out.price_multiplier = obj['surge_multiplier'];
    return out;
  });
  //add the ETA to the corresponding object
  for (let eta of etas) {
    for (let ride of rides) {
      if (eta.product_id === ride.product_id) {
        ride.eta = eta.estimate;
        delete ride.product_id;
      }
    }
  }
  //Filter out rides that we weren't able to match up ETAs on (ie. UberWAV)
  rides = rides.filter((ride) => !ride.product_id);
  return {
    rides: rides,
    coords: coords
  };
}

function uberRequest(coords) {
  // console.log('uberRequest details triggered: ', coords);
  const rides = uberRides(coords);
  const etas = uberEtas(coords);

  return Promise.all([rides, etas, coords]);
}

module.exports.parseUber = parseUber;
module.exports.uberRequest = uberRequest;

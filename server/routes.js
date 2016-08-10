'use strict';

const lyft = require('./lyft.js');
const uber = require('./uber.js');
const db = require('./db.js');
const genRadius = require('./generate_radius.js');
const expandSearch = require('./expand_search.js');
const nodemailer = require('nodemailer');
const express = require('express');
const router = express.Router();

module.exports = function(app) {
  app.all('/api/uber', (req, res) => {
    console.log('uber hit: ', req.body.data)
    let coords;
    if (req.body) {
      coords = req.body.data;
    }
    //This function sends the response
    uber.uberRequest(coords)
    .then(function(data) {
      res.json(uber.parseUber(data));
    })
    .catch((err) => {
      console.log(err);
    })
  })

  app.all('/api/lyft', (req, res) => {
    console.log('lyft hit: ', req.body.data)
    let coords;
    if (req.body) {
      coords = req.body.data;
    }
    //This function sends the response
    lyft.lyftRequest(coords)
    .then((data) => {
      res.json(lyft.parseLyft(data));
    })
    .catch((err) => {
      console.log(err);
    })
  })

// Will respond with cheapest and fastest ride options based on various bearings/radius around start point
  app.all('/api/expandSearch', (req, res) => {
    let coords;
    if (req.body) {
      coords = req.body.data;
    }
    console.log('Expanded Search activated', coords) // , req.body.data)
    expandSearch.expandSearch(coords)
      .then((data) => {
        // console.log('Expanded Search response data: ', data);
        let optimalPrice = {};
        let optimalTime = {};
        // console.log('Uber Promise List', data);
        for (let i = 0; i < data[0].length; i++) {
          let result = uber.parseUber(data[0][i], true);
          console.log('Parsed Uber Result: ', result);
          optimalPrice = expandSearch.checkIfOptimalPrice(result, optimalPrice);
          optimalTime = expandSearch.checkIfOptimalTime(result, optimalTime);
        }
        for (let j = 0; j < data[1].length; j++) {
          const result = lyft.parseLyft(data[1][j], true);
          console.log('Parsed Lyft Result: ', result);
          optimalPrice = expandSearch.checkIfOptimalPrice(result, optimalPrice);
          optimalTime = expandSearch.checkIfOptimalTime(result, optimalTime);
        }
        res.json({
          minPrice: optimalPrice.ride || null,
          minPrice_coords: optimalPrice.coords || null,
          minTime: optimalTime.ride || null,
          minTime_coords: optimalTime.coords || null
        })
      })
      .catch((err) => {
        console.log('Some Uber call failed', err);
      })


      // .then(function(data) {
      //   res.json(data);
      // })
      // .catch(function(err) {
      //   console.log('At least 1 geoRadius point failed to return');
      // })
  })

  app.all('/api/genRadius', (req, res) => {
    console.log('Generating Radius Of Coordinates', dummyCoords) // , req.body.data)
    // res.json('test');
    let coords;
    if (req.body) {
      coords = req.body.data;
    }
    //This function grabs points around a center
    genRadius.createGeoRadius(dummyCoords)
      .then((data) => {
        res.json(data);
      })
      .catch((err) => {
        console.log('At least 1 geoRadius point failed to return');
      })
  })



  app.post('/email', function(req, res) {
    const emailContent = req.body.data;

    const transporter = nodemailer.createTransport("smtps:driveushelp@gmail.com:driveus123@smtp.gmail.com")
    
    transporter.sendMail(emailContent, function(error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log('Messsage sent: ' + info.response)
      };
    });   
  });


};

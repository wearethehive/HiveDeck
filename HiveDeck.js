// Created by Rich Porter of The Hive https://www.wearethehive.com //

const path = require('path');
const StreamDeck = require('elgato-stream-deck');

// Thes vars can be safely ignored. Fuck with them at your own risk
var osc = require('osc-min'),
    dgram = require('dgram'),
    page = 1,
    osc_cue = "/d3/showcontrol/floatcue",
    transport_cue = "/d3/showcontrol",
    firstrow = [5,4,3,2,1],
    keytranslation = {9:1, 8:2, 7:3, 6:4, 5:5, 14:6, 13:7, 12:8, 11:9, 10:10};
    transport = {9:'/play', 8:'/playsection', 7:'/loop', 6:'/previoussection',
    5:'/nextsection', 14:'/stop', 13:'/returntostart', 12:'/previoustrack',
    11:'/nextrack', 10:'/'};

//These vars need to be changed to match your production environment
var receiveport = 8001, //This is the port this script listens on. Prints to Console
    remoteaddress = "127.0.0.1", //This is the IP Address of the device you're sending to
    remoteport = 7401; //This is the port you're sending OSC Messages to

//Create a Stream Deck Instance
const myStreamDeck = new StreamDeck();

// listen for OSC messages and print them to the console
var udp = dgram.createSocket('udp4', function(msg, rinfo) {

  // save the remote address
  remote = rinfo.address;

  try {
    console.log(osc.fromBuffer(msg));
  } catch (err) {
    console.log('Could not decode OSC message');
  }

});

//Clear all keys
for(var i = 0; i < 15; i++) {
 myStreamDeck.fillColor(i, 0, 0, 0);
}

//Draw page 1
drawpage(1);

//Handles drawing pages.
function drawpage(thepage){
    page = thepage;
    console.log("page: %d", thepage);
    for(var p = 0; p < 15; p++){
      myStreamDeck.fillImageFromFile(p, path.resolve(__dirname, ('images/page' + thepage + '/' + p + '.png')));
      //console.log('Successfully wrote an image to key %d.', p);
    }
}

//Build OSC Message with Float
function OSCmessage(j, oscaddress){
  var x = osc.toBuffer({
    oscType: 'message',
    address: oscaddress,
    args: [{
      type: 'float',
      value: j
    }]
  })
  console.log('Message Sent to Address: %s at %s:%d with a value of: %d',
  oscaddress, remoteaddress, remoteport, j);
  return x;
};

myStreamDeck.on('down', keyIndex => {
	//console.log('key %d down', keyIndex);
  if(keyIndex <= 4){
    drawpage(firstrow[keyIndex]);
  } else if ((keyIndex > 4) && (page == 1)) {
      x = OSCmessage(255, transport_cue + transport[keyIndex]);
      udp.send(x, 0, x.length, remoteport, remoteaddress);
  } else if ((keyIndex > 4) && (page == 2)) {
      y = OSCmessage((keytranslation[keyIndex]), osc_cue);
      udp.send(y, 0, y.length, remoteport, remoteaddress);
  } else if ((keyIndex > 4) && (page > 2)) {
      y = OSCmessage((keytranslation[keyIndex]) + (10 * (page -2)) , osc_cue);
      udp.send(y, 0, y.length, remoteport, remoteaddress);
    } else {
      console.log('ERROR: Cant Decode Keypress');
  }
});

myStreamDeck.on('up', keyIndex => {
	//console.log('key %d up', keyIndex);
});

myStreamDeck.on('error', error => {
	console.error(error);
});


//Listen Port for return OSC Message Handling
udp.bind(receiveport);
console.log('Listening for OSC messages on port %d', receiveport);
console.log('Ready to send OSC messages to %s on port %d', remoteaddress, remoteport  );

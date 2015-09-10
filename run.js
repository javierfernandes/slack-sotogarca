var gm = require('gm');
var fs = require('fs');
var Slack = require('node-slack-upload');
path = require('path');
var garca = require('./garca.js');

console.log("connecting...")

var WebSocket = require('ws'),
    apiToken = "", //Api Token from https://api.slack.com/web (Authentication section)
    authUrl = "https://slack.com/api/rtm.start?token=" + apiToken,
    request = require("request");

var slack = new Slack(apiToken);

request(authUrl, function(err, response, body) {
  if (!err && response.statusCode === 200) {
    var res = JSON.parse(body);
    if (res.ok) {
      connectWebSocket(res.url);
    }
  }
});

function connectWebSocket(url) {
  var ws = new WebSocket(url);

  ws.on('open', function() {
      console.log('Connected');
  });

  ws.on('message', function(message) {
      console.log('received:', message);
      message = JSON.parse(message);

      if (message.type === 'message' && message.text != undefined && message.text.match(/^sotogarca:.*/)) {
	      console.log("received :" + JSON.stringify(message))

        var outputFileName = __dirname + '/algo.png'

        gm(__dirname + '/template.png')
        .fontSize(48)
        .fill("#C63026")
        .drawText(50, 100, garca.preProcessText(message.text.substring(message.text.indexOf(':') + 1)))
        .write(outputFileName, function (err) {
          if (err) 
            ws.send(JSON.stringify({ channel: message.channel, id: 1, text: "Error: " + JSON.stringify(err) , type: "message" }));
          else {
            uploadImage(outputFileName, message)
          }
        });
      }
  });
}

function uploadImage(fileName, message) {
    slack.uploadFile({
        file: fs.createReadStream(fileName),
        title: fileName,
        initialComment: "@sotogarca: " + message.text,
        channels: message.channel
    }, function(err) {
        if (err) {
            console.error(err); 
        }    
        else {   
            console.log('done');   
        }
    });
}



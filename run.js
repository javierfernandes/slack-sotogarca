var gm = require('gm');
var fs = require('fs');
var Slack = require('node-slack-upload');
path = require('path');
var garca = require('./garca.js');
var yandex_speech = require('yandex-speech');

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

var handlers = {
  '^sotogarca:.*' : [ 'garca.png', handleGarca],
  '^cronica:.*' : ['cronica.png', handleCronica ],
  '^comunicado:.*' : ['comunicado.png', handleComunicado ]
}

function connectWebSocket(url) {
  var ws = new WebSocket(url);

  ws.on('open', function() {
      console.log('Connected');
  });

  var cronJob = require("cron").CronJob;
  // 15:30 GMT -> 12:30 ARG
  var job = new cronJob("00 30 15 * * 1-5", function() {
      mollejasPeriodicMessage(ws)
  }, null, true);

  job.start();

  ws.on('message', function(message) {
      message = JSON.parse(message);

      if (message.type === 'message' && message.text != undefined) {
        for (var pattern in handlers) {
          if (handlers.hasOwnProperty(pattern)) {
            // console.log("Checking " + pattern + "...")
            if (message.text.match(pattern)) {
              // console.log("MATCHED " + pattern + " !")
              var templateName = handlers[pattern][0]
              var handler = handlers[pattern][1]

              var outputFileName = __dirname + '/algo.png' // TODO uuid
              var text = parseText(message)

              var img = gm(__dirname + '/' + templateName)
              handler(img, text)
                .write(outputFileName, function (err) {
                if (err) 
                  ws.send(JSON.stringify({ channel: message.channel, id: 1, text: "Error: " + JSON.stringify(err) , type: "message" }));
                else
                  uploadImage(outputFileName, message)
              });
            }
          }
        }

        if (message.type === 'message' && message.text != undefined && message.text.match(/^tts:.*/)) {
           textToSpeech(ws, message)
        }
      } 
  });

}

function parseText(message) {
  return message.text.substring(message.text.indexOf(':') + 1);
}

function textToSpeech(ws, message) {
  var outputFile = 'felizcumple.mp3';
  var text = parseText(message)
  console.log("Text to speech: " + text)
  yandex_speech.TTS({
      "text": text,
      "file": outputFile,
      "lang": 'es_ES'
      }, function(){
          uploadImage(outputFile, message)
      }
  );
}

function mollejasPeriodicMessage(ws) {
  var channel = "C02TUBDTL" // el club
  ws.send(JSON.stringify({ channel: channel, id: 1, text: "Otro día sin mollejas :(" , type: "message" }));
}

function handleGarca(img, text) {
  return img.fontSize(48)
    .fill("#C63026")
    .drawText(50, 100, garca.preProcessText(text, 28))
}

function handleCronica(img, text) {
  return img.fontSize(44)
  .fill("white")
  .font("FreeMono")
  .drawText(20, 100, garca.preProcessText(text.toUpperCase(), 18))
}

function handleComunicado(img, text) {
  return img.fontSize(44)
  .fill("white")
  .font("FreeMono")
  .drawText(20, 100, garca.preProcessText(text.toUpperCase(), 18))
}

function uploadImage(fileName, message) {
    slack.uploadFile({
        file: fs.createReadStream(fileName),
        title: 'Garca !',
        initialComment: '"' + message.text + '" by ' + message.user,
        channels: message.channel
    }, function(err) {
        if (err) {
            console.error(err); 
        }    
        else {
            //todo: delete local file
            console.log('done');   
        }
    });
}



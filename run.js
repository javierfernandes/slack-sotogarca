var gm = require('gm');
var fs = require('fs');
var Slack = require('node-slack-upload');
path = require('path');
var garca = require('./garca.js');
var yandex_speech = require('yandex-speech');
var cronJob = require("cron").CronJob;

var config = JSON.parse(fs.readFileSync(__dirname + '/conf.json', 'utf8'));

console.log("connecting with token: " + config.apiToken)

var WebSocket = require('ws'),
    apiToken = config.apiToken,
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
  '^sotogarca:.*' : [ 'templates/garca.png', handleGarca],
  '^cronica:.*' : ['templates/cronica.png', handleCronica ],
  '^comunicado:.*' : ['templates/comunicado.png', handleComunicado ],
  '^galgo:.*' : ['templates/galgo.png', handleGalgo ],
  '^pepito:.*' : ['templates/jp.png', handlePepito ],
  '^javalopez:.*' : ['templates/javalopez.png', handleJavaLopez ]
}

function connectWebSocket(url) {
  var ws = new WebSocket(url);

  ws.on('open', function() {
      console.log('Connected');
  });


  // automatic programmed messages
  config.autoMessages.forEach(function(messageConf) {
    console.log("Queueing message for channel '" + messageConf + "' and frequency '" + messageConf.cronPattern + "'")
    new cronJob(messageConf.cronPattern, function() {
      sendMessage(ws, messageConf)
    }, null, true).start();  
  })

  // keep presence
  new cronJob("00 */30 * * * *", function() {
      updatePresence(ws)
  }, null, true).start();
  

  ws.on('message', function(message) {
      message = JSON.parse(message);
      console.log("Received " + JSON.stringify(message))

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
  var outputFile = __dirname + '/tts-out.mp3';
  var text = parseText(message)

  yandex_speech.TTS({
      "text": text,
      "file": outputFile,
      "lang": 'es_ES'
      }, function() {
          uploadImage(outputFile, message)
      }
  );
}

function sendMessage(ws, messageConf) {
  ws.send(JSON.stringify({ channel: messageConf.toChannel, id: 1, text: pickRandom(messageConf.messages), type: "message" }));
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

function handleGalgo(img, text) {
  return img.fontSize(44)
  .fill("white")
  .font("FreeMono")
  .drawText(20, 100, garca.preProcessText(text.toUpperCase(), 18))
}

function handlePepito(img, text) {
  return img.fontSize(44)
  .fill("black")
  .drawText(220, 355, garca.preProcessText(text, 8))
}

function handleJavaLopez(img, text) {
  return img.fontSize(66)
    .fill("white")
    .drawText(70, 120, garca.preProcessText("Aguante " + text, 20))
}

function fontSizeFor(text) {
  if (text.length <= 7)
    return 13
  else if (text.length <= 20)
    return 8
  else
    return 6
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

function pickRandom(array) {
    return array[Math.floor(Math.random() * array.length)]
}

function updatePresence(ws) {
  console.log('Updating presence')
  ws.send(JSON.stringify({ type : "manual_presence_change", presence: "active"}))
}


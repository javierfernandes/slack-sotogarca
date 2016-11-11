var gm = require('gm');
var fs = require('fs');
var Slack = require('node-slack-upload');
path = require('path');
var garca = require('./garca.js');
var http = require('http');
var https = require('https');
var url = require("url");
var Q = require('q')

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
  '^jpuber:.*' : ['templates/jppuber.png', handleJPPuber ],
  '^javalopez:.*' : ['templates/javalopez.png', handleJavaLopez ],
  '^fracasado:.*' : ['templates/fracasado.png', handleFracasado ],
  '^borges:.*' : ['templates/borges.png', handleBorges ],
  '^sinasado:.*' : ['templates/sinasado.png', handleSinAsado ],

  // selfies
  '^vaf:.*' : ['templates/vaf-fondo.png', selfie('vaf1') ],
  '^vaf2:.*' : ['templates/vaf2.png', selfie('vaf2') ],
  '^snake:.*' : ['templates/snake.png', selfie('snake') ],
  '^jpipita:.*' : ['templates/jpipita.png', selfie('jpipita') ],
  '^paltabostero:.*' : ['templates/paltabostero.png', selfie('paltabostero') ]
}

registerSelfie('ger')
registerSelfie('soto-acostado')
registerSelfie('migue')
registerSelfie('trioavion')

function registerSelfie(fileName) {
  handlers['^' + fileName + ':.*'] = ['templates/' + fileName + '.png', selfie(fileName) ]
}


function connectWebSocket(url) {
  var ws = new WebSocket(url);

  ws.on('open', function() {
      console.log('Connected');
  });


  // automatic programmed messages
  if (config.autoMessages) {
    config.autoMessages.forEach(function(messageConf) {
      console.log("Queueing message for channel '" + messageConf + "' and frequency '" + messageConf.cronPattern + "'")
      new cronJob(messageConf.cronPattern, function() {
        sendMessage(ws, messageConf)
      }, null, true).start();  
    })
  }

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
              var returnValue = handler(img, text)
              Q(returnValue).then(function(value) {
                value.write(outputFileName, function (err) {
                    if (err)
                        ws.send(JSON.stringify({ channel: message.channel, id: 1, text: "Error: " + JSON.stringify(err) , type: "message" }));
                    else
                        uploadImage(outputFileName, message)
                });
              })
              .catch(function(err) {
                  ws.send(JSON.stringify({ channel: message.channel, id: 1, text: "Error: " + JSON.stringify(err) , type: "message" }));
              })
            }
          }
        }

        if (message.type === 'message' && message.text != undefined && message.text.match(/^tts:.*/)) {
           textToSpeech(ws, message)
        }
      } 
  });

}

var uploadRegExp = /^uploadSelfie\:.*/

function isSelfieUpload(message) {
    return (message.type === "file_created" ||
        message.type === "file_shared" ) && message.file.title.match(uploadRegExp)
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


function handleJPPuber(img, text) {
  return img.fontSize(44)
  .fill("white")
  .drawText(100, 475, garca.preProcessText(text, 40))
}

function handleJavaLopez(img, text) {
  return img.fontSize(120)
    .fill("white")
    .drawText(80, 160, "Aguante")
    .fontSize(140)
    .drawText(60, 300, garca.preProcessText(text, 20))
}

function handleBorges(img, text) {
  return img.fontSize(55)
    .fill("white")
    .drawText(80, 350, garca.preProcessText('"' + text + '"\n Jorge Luis Borges', 34))
}

function handleSinAsado(img, text) {
  return img.fontSize(55)
    .fill("black")
    .drawText(25, 118, text)
}

function selfie(templateFileName) {
    return function(img, text) {
        var outImg = handleSelfie(img, text, '/templates/' + templateFileName + '.png')
	return outImg
    }
}

function handleSelfie(img, text, templateName) {
    var fileUrl = text.replace('<','').replace('>','')
    var parsed = url.parse(fileUrl);
    var fileName = path.basename(parsed.pathname)

    var tempFileName = __dirname + "/temp/" + fileName
    return download(fileUrl, tempFileName).then(function() {
        try {
            return sizeOfImage(img).then(function(size) {
                return gm(tempFileName)
                    .resize(size.width, size.height, "!")
                    .composite(__dirname + templateName)
            })
        }
        catch (ex) {
            console.log(ex, ex.stack.split("\n"))
            throw ex;
        }
    }).catch(function(err) {
        console.log(err, err.stack.split("\n"))
        console.error("Error while downloading", err)
        return img.fontSize(55)
            .fill("black")
            .drawText(25, 118, "ERROR: " + err)
    })
}

function sizeOfImage(img) {
    var d = Q.defer()
    img.size(function (err, size) {
        if (err) {
            d.reject(err)
        }
        else {
            d.resolve(size)
        }
    });
    return d.promise
}

function download(url, dest) {
    var d = Q.defer()
    var file = fs.createWriteStream(dest);
    var request = (url.indexOf('https') == 0 ? https : http).get(url, function(response) {
        response.pipe(file);
        file.on('finish', function() {
            d.resolve()
        });
    }).on('error', function(err) { // Handle errors
        console.error("Error downloading file " + url, err)
        fs.unlink(dest); // Delete the file async. (But we don't check the result)
        if (cb) d.reject(err.message)
    });
    return d.promise
};

function handleFracasado(img, text) {
  var x = 30
  var y = 222
  var i = img.fontSize(44)
    .fill("gray")
    .drawText(x, y, garca.preProcessText(text, 8))
  return i.fontSize(44)
    .fill("orange")
    .drawText(x - 2, y - 3, garca.preProcessText(text, 8))  
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


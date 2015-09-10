var gm = require('gm');
var fs = require('fs');
path = require('path');
var garca = require('./garca.js');


gm(__dirname + '/template.png')
  .fontSize(44)
  // .font("helvetica")
  .fill("#C63026")
  .drawText(50, 100, garca.preProcessText("No hay Mollejas para nadie, y el que se hace el vivo no cobra nada ni este viernes ni el siguiente. Manga de putos"))
  .write(__dirname + '/solarize.png', function(err){
    if (err) return console.dir(arguments)
    console.log(this.outname + ' created :: ' + arguments[3])
  }
) 



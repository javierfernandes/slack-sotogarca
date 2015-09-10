var gm = require('gm');
var fs = require('fs');
path = require('path');


gm(__dirname + '/template.png')
  .fontSize(44)
  // .font("helvetica")
  .fill("#C63026")
  .drawText(50, 100, processText([], "No hay Mollejas para nadie, y el que se hace el vivo no cobra"))
  .write(__dirname + '/solarize.png', function(err){
    if (err) return console.dir(arguments)
    console.log(this.outname + ' created :: ' + arguments[3])
  }
) 

function processText(lines, text) {
	return text
	// if (text.length > 24) {

	// }
	// return text
}

fn = {

	preProcessText :  function(text, maxLineLength) {
	  return fn.processText([], text, maxLineLength).join('\n')
	},

	processText : function(lines, text, maxLineLength) {
	  if (text.length > maxLineLength) {
	    var lastSpaceBeforeLineLimit = text.substring(0, maxLineLength).lastIndexOf(' ')
	    var cuttedLine = text.substring(0, lastSpaceBeforeLineLimit)
	    lines.push(cuttedLine)

	    var remaining = text.substring(lastSpaceBeforeLineLimit + 1) 
	    return fn.processText(lines, remaining, maxLineLength)
	  }
	  else {
	    lines.push(text)
	    return lines
	  }
	}

}


module.exports = fn




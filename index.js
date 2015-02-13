// Process @[toc](|Title)

'use strict';

module.exports = function(md) {

    var TOC_REGEXP = /^@\[toc\](?:\((?:\s+)?([^\)]+)(?:\s+)?\)?)?$/im;
    var TOC_DEFAULT = "Table of Contents";
    var gstate;

    function toc(state, silent) {	
	// trivial rejections
	if (state.src.charCodeAt(state.pos) !== 0x40/* @ */) {
            return false;
        }
        if (state.src.charCodeAt(state.pos + 1) !== 0x5B/* [ */) {
            return false;
        }

	var match = TOC_REGEXP.exec(state.src);
	if (!match){
	    return false;
	}
	match = match.filter(function(m){ return m; });
	if (match.length < 1){
	    return false;
	}
        if (silent) {// don't run any pairs in validation mode
            return false;
        } 

	state.push({
            type: 'toc_open',
            level: state.level++
        });
	var label = TOC_DEFAULT;
	if (match.length > 1){
	    label = match.pop()
	}
	state.push({
	    type: 'toc_body',
	    level: state.level,
	    content: label
	});
        state.push({
            type: 'toc_close',
            level: --state.level
        });

	var pos = state.pos + state.posMax + 1;
	state.pos = pos;

        return true;
    }

    md.renderer.rules.heading_open = function(tokens, index) {
        var level = tokens[index].hLevel;
	var label = tokens[index + 1];
	if (label.type === 'inline'){
            var anchor = label.content.split(' ').join('_') + '_' + label.lines[0];
	    return '<h' + level + '><a id="' + anchor + '"></a>';
	}
	else{
	    return '</h1>';
	}
    };

    md.renderer.rules.toc_open = function(tokens, index){
	return ''
    };

    md.renderer.rules.toc_close = function(tokens, index){
	return ''
    };

    md.renderer.rules.toc_body = function(tokens, index){	
	// Wanted to avoid linear search through tokens here, 
	// but this seems the only reliable way to identify headings
	var headings = [];
	var gtokens = gstate.tokens;
	var size = gtokens.length;
	for (var i = 0; i < size; i++){
	    if (gtokens[i].type !== 'heading_close'){
		continue;
	    }
	    var token = gtokens[i];
	    var heading = gtokens[i-1];
	    if (heading.type === 'inline'){
		headings.push({
		    level: token.hLevel,
		    anchor: heading.content.split(' ').join('_') + '_' + heading.lines[0],
		    content: heading.content
		});
	    }		
	}

	var indent = 0;
	var list = headings.map(function(heading){
	    var res = [];
	    if (heading.level > indent){
		var ldiff = (heading.level - indent);
		for(var i = 0; i < ldiff; i++){
		    res.push('<ul>');
		    indent++;
		}
	    }
	    else if (heading.level < indent){
		var ldiff = (indent - heading.level);
		for(var i = 0; i < ldiff; i++){		    
		    res.push('</ul>');
		    indent--;
		}
	    }
	    res = res.concat(['<li><a href="#', heading.anchor, '">', heading.content, '</a></li>']);
	    return res.join('');
	});

	return '<h3>' + tokens[index].content + '</h3>' + list.join('') + Array(indent+1).join('</ul>');
    }    

    /*
    var last = 0;
    var ck_heading = function(state, a, b){
	var search = state.tokens.slice(last);
	search.map(function(token, index){
	    if (token.type === 'heading_close' && index >= 1){
		var heading = search.slice(index-1, index)[0];
	    }
	});
	last = state.tokens.length - 1;
	return false;
    };
    */

    //md.block.ruler.push('ck_heading', ck_heading);
    //md.inline.ruler.push('ck_heading', ck_heading);
    //md.core.ruler.push('ck_heading', ck_heading);
    md.core.ruler.push('grabState', function(state){
	gstate = state;
    });
    md.inline.ruler.after('emphasis', 'toc', toc);
};


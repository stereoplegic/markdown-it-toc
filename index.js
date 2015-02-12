// Process +++TOC[|Title]+++

'use strict';

module.exports = function(md) {

    var TOC_REGEXP = /^(\+\+\+)TOC.+(\+\+\+)$/;
    var TOC_LABEL_REGEXP = /\[(.+)\]/;
    var TOC_DEFAULT = "Table of Contents";

    function toc(state, silent) {	
	if (!TOC_REGEXP.test(state.src)){
	    return false;
	}
        if (silent) {// don't run any pairs in validation mode
            return false;
        } 

	state.push({
            type: 'toc_open',
            level: state.level++
        });
	var label = TOC_LABEL_REGEXP.exec(state.src);
	if (!label){
	    label = TOC_DEFAULT;
	}
	else{
	    label = label.pop()
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
        var anchor = tokens[index + 1].content.split(' ').join('_');
        return '<h' + level + '><a id="' + anchor + '"></a>';
    };
    md.renderer.rules.toc_open = function(tokens, index){
	return '<div class="_toc">';

    };
    md.renderer.rules.toc_close = function(tokens, index){
	return '</div>';
    };
    md.renderer.rules.toc_body = function(tokens, index){	
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
    
    var headings = [];
    var last = 0;
    var ck_heading = function(state, a, b){
	var search = state.tokens.slice(last);
	search.map(function(token, index){
	    if (token.type === 'heading_close'){
		var heading = search.slice(index-1, index)[0];
		headings.push({
		    level: token.hLevel,
		    anchor: heading.content.split(' ').join('_'),
		    content: heading.content
		});
	    }
	});
	last = state.tokens.length;
	return false;
    };

    md.block.ruler.after('heading', 'ck_heading', ck_heading);
    md.inline.ruler.after('emphasis', 'toc', toc);
};


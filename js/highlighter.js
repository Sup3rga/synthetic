function launchColorizer(){
    var pre = document.querySelectorAll('pre.code');
    // console.log('[pre]',pre);
    var a = new Date().getTime();
    for(var i in pre){
        if(/^[0-9]+$/.test(i)){
            try{
                highlight(pre[i]);
            }catch(e){
                console.error("Can't colorize code number["+i+"]", e);
            }
        }
    }
    // console.log('[A]',(new Date().getTime() - a) / 1000);
}
var colorizer = (function(){
    var tab = [];
    return function(html, startPoint){
        function color(regex, replacement, until, indent){
            var txt = "",
                until = typeof replacement == 'function' ? until : undefined,
                indent = typeof replacement == 'function' ? (until !== undefined && indent == undefined ? true : indent) : undefined,
                replace_with_txt = typeof replacement != 'function';
            // console.log('[html]',html);
            if(html == undefined){
                return;
            }
            var t = html.match(regex),
                e;
            // console.error('[T]',html,t);
            if(t !== null){
                for(var i in t){
                    e = until === undefined ? t[i] : searchUntil(html.indexOf(t[i]), until, indent);
                    tab.push(e.replace(until == undefined ? regex : e, replace_with_txt ? replacement : replacement(e)));
                    html = html.replace(e, "{{"+(tab.length-1)+"}}");
                }
            }
        }
        function paint(){
            var mt,
                i;
            do{
                mt = html.match(/{{[0-9]+}}/g);
                for(var j in mt){
                    i = mt[j].replace(/{{([0-9]+)}}/,'$1');
                    html = html.replace("{{"+i+"}}", tab[i]);
                    delete tab[i];
                }
            }while(/{{[0-9]+}}/.test(html));
        }
        function comaSplit(v){
            var t = [], curr = '',m,
                q = 0, b = 0, s = 0, p = 0, bk = 0, lst = '', hlt = false;
            for(var i in v){
                if(lst != '\\'){
                    if(v[i] == '"' && !s){
                        q = (q + 1) % 2;
                    }
                    if(v[i] == "'" && !q){
                        s = (s + 1) % 2;
                    }
                    if(!s && !q){
                        if(v[i] == '{'){b++;}
                        if(v[i] == '}'){b--;}
                        if(v[i] == '['){bk++;}
                        if(v[i] == ']'){bk--;}
                        if(v[i] == '('){p++;}
                        if(v[i] == ')'){p--;}
                    }
                    if((v[i] == ',' && !s && !q && !p && !bk && !b) || i == v.length - 1){
                        if(curr.length){
                            t.push(curr+(i == v.length - 1 ? v[i] : ''));
                            curr = '';
                            halt = true;
                        }
                    }
                }
                if(!hlt){
                    curr += v[i];
                }
                else{
                    hlt = false;
                }
                lst = v[i];
            }
            return t;
        }
        function colorValue(v){
            var r = '',
                d = /^([\s]+)?([\S\s]+?)([\s]+)?$/.exec(v);
            // console.log('[D]',v,d);
            //function
            if(/^([\s]+?)?@/.test(d[2])){
                // console.log('[HERE]',d[2]);
                return colorizer(v);
            }
            //Array
            else if(/^\[([\s\S]+?)?\]$/.test(d[2])){
                var k = comaSplit(d[2].replace(/^\[|\]$/g, ''));
                r += '[';
                for(var i in k){
                    r += colorValue(k[i].replace(/^,/, ''))+(i < k.length - 1 ? ',' : '');
                }
                r += ']';
                return uvs(d[1])+r+uvs(d[3]);
            }
            //JSON
            else if(/^{([\s\S]+?)?}$/.test(d[2])){
                var k = comaSplit(d[2].replace(/^\{|\}$/g, '')),
                    prt = [];
                r += '{';
                for(var i in k){
                    prt = /^([\s\S]+?):([\s\S]+)$/.exec(k[i]);
                    if(prt == null){
                        r += k[i];
                    }else{
                        r += '<c class="variable">'+prt[1]+'</c>:';
                        r += colorValue(prt[2]);
                    }
                }
                r += '}';
                return uvs(d[1])+r+uvs(d[3]);
            }
            //Function
            else if(/^\(([\s\S]+?)?\)([\s]+?)?{([\s\S]+?)?}?$/.test(d[2])){
                var k = /^\(([\s\S]+?)?\)([\s]+?)?{([\s\S]+?)?}?$/.exec(d[2]);
                r += '('+(k[1] !== undefined ? colorArg(k[1]) : '')+')'+uvs(k[2]);
                r += '{'+(k[3] !== undefined ? colorizer(k[3]) : '')+(/}$/.test(d[2]) ? '}' : '');
                return uvs(d[1])+r+uvs(d[3]);
            }
            //number | boolean
            else if(/^([\d.]+|true|false|null)$/.test(d[2])){
                r = 'value constant';
            }
            //vriable
            else if(/(\$[a-z_](?:[a-z0-9_]+)(?:(?:\.[\w]+|\[(?:[\s\S]+?)\])+)?)/i.test(d[2])){
                r = 'variable';
            }
            //text
            else if(/^("([\s\S]+?)"|'([\s\S]+?)')$/.test(d[2])){
                r = 'value string';
            }
            else if(/^[^'"][\s\S]+[^'"]$/.test(d[2])){
                r = 'value text';
            }
            else{
                return colorizer(v);
            }
            return '<c class="'+r+'">'+v+"</c>";
        }
        function colorArg(v){   
            var arg = comaSplit(v),
                prt, subprt,
                r = '';
            // console.log('[ARG]',v,arg);
            for(var i in arg){
                prt = /^([\s\S]+?)(?:(:|=)(?:([\s\S]+?)))?$/.exec(arg[i]);
                if(prt == null){
                    r += colorizer(arg[i]);
                }else{
                    if(/^([\s\S]+?)(:|=)(?:([\s\S]+?))$/.test(arg[i])){
                        if(/(@(const|unset))([\s]+?)([\s\S]+?)/.test(prt[1])){
                            r += prt[1].replace(/^([\s]+?)?(?:(@const|@unset)([\s]+))?(\$[a-zA-Z_](?:[a-zA-Z0-9_]+)?)([\s]+?)$/, '$1<c class="constraint prefix">$2</c>$3<c class="variable">$4</c>$5');
                        }else{
                            r += colorValue(prt[1]);
                        }
                        r += prt[2];
                        if(prt[3] !== undefined){
                            subprt = /^([\s]+?)?(&lt;[\w]+&gt;)?([\s\S]+)$/.exec(prt[3]);
                            r += uvs(subprt[1])+(subprt[2] !== undefined ? '<c class="constraint">'+subprt[2]+'</c>' : '');
                            r += colorValue(subprt[3]);
                        }
                    }else{
                        r += colorValue(arg[i]);
                    }
                }
            }
            return r;
        }
        function uvs(e){//undefined value to space
            return e === undefined ? '' : e;
        }
        function searchUntil(start, end, indent){
            var r = '', v = html,
                q = 0, b = 0, s = 0, p = 0, bk = 0, 
                i = start,
                lst = '', lst_ch = '',
                hlt = false,
                stop=false;
            do{
                if(lst != '\\'){
                    if(v[i] == '"' && !s){
                        q = (q + 1) % 2;
                    }
                    if(v[i] == "'" && !q){
                        s = (s + 1) % 2;
                    }
                    if(!s && !q){
                        if(v[i] == '{'){b++;}
                        if(v[i] == '}'){b--;}
                        if(v[i] == '['){bk++;}
                        if(v[i] == ']'){bk--;}
                        if(v[i] == '('){p++;}
                        if(v[i] == ')'){p--;}
                    }
                    if((v[i] == end || (v[i] == '\n' && ( (indent && v[i+1] != end) || (!indent && lst_ch != ',') ) ) ) && !s && !q && !p && !bk && !b){
                        r += v[i];
                        stop = true;
                    }
                }
                if(!stop){
                    r += v[i];
                }
                if(/[\S]+/.test(v[i])){
                    lst_ch = v[i];
                }
                lst = v[i];
                i++;
            }while(!stop && v[i] != undefined);
            return r;
        }
        //Comments
        color(/(\/\/(?:[\w\W]+?)?\n)/g, '<c class="comment">$1</c>')
        color(/(\/\*(?:[\s\S]+?)?\*\/)/g, '<c class="comment">$1</c>')
        //Preprocessing Directives
        color(/@from(?:[\S\s]+?);?/g, function(e){
            var r = '';
            if(/@from([\S\s]+?)import([\S\s]+?)(in(to)?([\S\s]+?))?;?/.test(e)){
                r = e.replace(/^(@from)([\S\s]+?)(import)([\S\s]+?)(?:(in(?:to)?)([\S\s]+?))?(;|[\n])?$/, '<c class="directive">$1</c><c class="file">$2</c><c class="directive">$3</c><c class="member">$4</c><c class="directive">$5</c><c class="alias">$6</c>$7');
            }
            if(/@from([\S\s]+?)?choose([\S\s]+?)to +import([\S\s]+?)(in(to)?([\S\s]+?))?;?/.test(e)){
                r = e.replace(/^(@from)([\S\s]+?)(choose)([\S\s]+?)(to +import)([\S\s]+?)(?:(in(?:to)?)([\S\s]+?))?(;|[\n])?$/, '<c class="directive">$1</c><c class="package">$2</c><c class="directive">$3</c><c class="file">$4</c><c class="directive">$5</c><c class="member">$6</c><c class="directive">$7</c><c class="alias">$8</c>$9');
            }
            return r;
        }, ';');
        color(/@import(?:[\s\S]+?);?/g, function(e){
            var r = '';
            if(/@import([\s\S]+?)(?:(in(?:to)?)([\s\S]+?))?;?/.test(e)){
                r = e.replace(/^(@import)([\s\S]+?)(?:(in(?:to)?)([\s\S]+?))?(;|[\n])?$/, '<c class="directive">$1</c><c class="file">$2</c><c class="directive">$3</c><c class="alias">$4</c>$5');
            }
            if(/@import([\s\S]+?)from([\s\S]+?)(?:(in(?:to)?)([\s\S]+?))?;?/.test(e)){
                r = e.replace(/^(@import)([\s\S]+?)(from)([\s\S]+?)(?:(in(?:to)?)([\s\S]+?))?(;|[\n\r])?$/, '<c class="directive">$1</c><c class="file">$2</c><c class="directive">$3</c><c class="package">$4</c><c class="directive">$5</c><c class="alias">$6</c>$7');
            }
            return r;
        }, ';')
        color(/@include([\s\S]+?);?/g, function(e){
            var r = '';
            if(/@include([\s\S]+?)(?:(in(?:to)?)([\s\S]+?))?;?/.test(e)){
                r = e.replace(/^(@include)([\s\S]+?)(?:(in(?:to)?)([\s\S]+?))?(;|[\n])?$/, '<c class="directive">$1</c><c class="file">$2</c><c class="directive">$3</c><c class="alias">$4</c>$5');
            }
            if(/@include([\s\S]+?)from([\s\S]+?)(?:(in(?:to)?)([\s\S]+?))?;?/.test(e)){
                r = e.replace(/^(@include)([\s\S]+?)(from)([\s\S]+?)(?:(in(?:to)?)([\s\S]+?))?(;|[\n])?$/, '<c class="directive">$1</c><c class="file">$2</c><c class="directive">$3</c><c class="package">$4</c><c class="directive">$5</c><c class="alias">$6</c>$7');
            }
            return r;
        }, ';');
        color(/@use([\s\S]+?);?/g, function(e){
            // console.log('[E]',e, /^(@use)([\s]+?)([\S]+)([\s]+?)?\(([\s\S]+)?\)((?:[\s]+?)?;(?:[\s]+?)?)?$/.test(e));
            var k = /^(@use)([\s]+?)([\S]+?)([\s]+?)?(?:\(([\S]+?|[\n \S]+?)?\))?((?:[\s]+)?;?(?:[\s]+)?)?$/g.exec(e),
                is_simple = !/^@use[\s]+?[\S]+([\s]+?)?\(([\S]+?|[\n \S]+?)?\)(([\s]+?)?;?([\s]+?)?)?$/,
                r = '';
            if(k == null){
                return e;
            }
            r += '<c class="directive">'+k[1]+'</c>'+k[2];
            if(/[\w]+\.[\w]+/.test(k[3])){
                r += k[3].replace(/^([a-z_](?:[a-z0-9_]+)?)(?:\.([a-z_](?:[a-z0-9_]+)?))?$/i, '<c class="alias">$1</c>.<c class="'+(is_simple ? 'variable' : 'member')+'">$2</c>');
            }else{
                r += '<c class="'+(is_simple ? 'variable' : 'member')+'">'+k[3]+'</c>';
            }
            r += uvs(k[4]);
            if(is_simple){
                r += uvs(k[6]);
            }else{
                r += '('+(k[5] !== undefined ? colorArg(k[5]) : '')+')'+uvs(k[6]);
            }
            return r;
        }, ';');
        color(/@sspa-phase([\s\S]+?);/g, function(e){
            var r = '',
                k = /(@sspa-phase)([\s]+?)([\S\s]+?);/g.exec(e);
            r += '<c class="directive">'+k[1]+'</c>'+k[2];
            r += k[3].replace(/([0-9]+)(?:([\s]+?)([\S]+))?((?:[\s]+?)?,)?/g, '<c class="value constant">$1</c>$2<c class="value string">$3</c>')+';';
            return r;
        }, ';')
        color(/@require([\s\S]+?);/g, function(e){
            var r = '',
                k = /(@require)([\s]+?)([\S\s]+?);/g.exec(e);
            r += '<c class="directive">'+k[1]+'</c>'+k[2];
            r += k[3].replace(/([\S]+)([\s]+?)?(,)?/g, '<c class="file">$1</c>$2$3')+';';
            return r;
        }, ';');
        //Variable
        color(/(@var([\S\s]+?);)/g, function(e){
            var r = '';
            /^(@var)([\S\s]+?);?$/.exec(e);
            r += '<c class="directive">'+RegExp.$1+'</c>';
            var t = comaSplit(RegExp.$2);
            for(var i in t){
                m = /^([\s\S]+?)(?:=([\s\S]+?))?$/.exec(t[i]);
                r += '<c class="variable">'+m[1]+'<c>'+(m[2] !== undefined ? '='+colorValue(m[2]) : '');
            }
            r += ';';
            return r;
        }, ';', false);        
        //Condition
        color(/@(el)?if([\s]+?)?\(([\s\S]+?)\)([\s]+?)?{([\s\S]+?)?}|@else([\s]+?)?{([\s\S]+?)?}/g, function(e){
            var r = '',
                k;
            if(/^@(el)?if/.test(e)){
                k = /(@(?:el)?if)([\s]+?)?\(([\s\S]+?)\)([\s]+?)?{([\s\S]+?)?}/.exec(e);
                r += '<c class="directive">'+k[1]+'</c>'+uvs(k[2]);
                r += '('+colorizer(k[3])+')'+uvs(k[4]);
                r += '{'+colorizer(uvs(k[5]))+'}';
            }
            if(/^@else/.test(e)){
                k = /(@else)([\s]+?)?{([\s\S]+?)?}/.exec(e);
                r += '<c class="directive">'+k[1]+'</c>'+uvs(k[2]);
                r += '{'+colorizer(uvs(k[3]))+'}';
            }
            return r;
        }, '}')
        //Mixin
        color(/@((public|private)([\s]+?)(unused([\s]+?))?mixin|unused([\s]+?)mixin|mixin)/g, function(e){
            var k = /^(@(?:(?:public|private)(?:[\s]+?)(?:unused(?:[\s]+?))?mixin|unused(?:[\s]+?)mixin|mixin))(?:[\s]+?)([\S]+)(?:(?:[\s]+?)(extends)(?:[\s]+?)([\s\S]+?))?(?:[\s]+?)?\(([\S\s]+?)?\)(?:[\s]+?)?{([\s\S]+?)?}$/.exec(e),
                r = '';
            //Directive
            r += '<c class="directive">'+k[1]+'</c> ';
            //Name
            r += '<c class="function">'+k[2]+'</c> ';
            if(k[3] !== undefined){
                //Extends
                r += '<c class="directive">'+k[3]+'</c> ';
                //Legacy
                var t = k[4].replace(/^([\s]+)?|([\s]+)?$/g, '').split(/(?:[\s]+)?,(?:[\s]+)?/);
                for(var i in t){
                    if(/^[\w]+\.[\w]+$/.test(t[i])){
                        r += t[i].replace(/^([a-z_](?:[a-z_0-9]+)?)(?:\.([a-z_](?:[a-z_0-9]+)?))?$/i, '<c class="alias">$1</c>.<c class="member">$2</c>')
                    }else{
                        r += '<c class="member">'+t[i]+'</c>';
                    }
                    r += (i < t.length - 1 ? ', ' : '');
                }
            }
            //Arg
            r += '('+colorArg(uvs(k[5]))+')';
            //body
            r += '{'+colorizer(uvs(k[6]))+'}';
            return r;
        }, '}');
        //Module
        color(/@module([\s\S]+?){([\n\r\S]+?)?}/g, function(e){
            var r = '',
                k = /^(@module)([\s]+?)([a-zA-Z_](?:[a-zA-Z0-9_]+)?)([\s]+?)?{([\s\S]+?)?}$/.exec(e);
            r += '<c class="directive">'+k[1]+'</c>'+k[2];
            r += '<c class="variable">'+k[3]+'</c>'+uvs(k[4]);
            r += '{'+(k[5] !== undefined ? colorizer(k[5]) : '')+'}';
            return r;
        }, '}');
        //Exception
        color(/@try([\s]+?)?{([\n\r \S]+?)?}|@catch([\s]+?)?\(([\s\S]+?)\)([\s]+?)?{([\s\S]+?)?}/g, function(e){
            var r = '',
                k;
            if(/^@try/.test(e)){
                k = /^(@try)([\s]+?)?{([\s\S]+?)?}$/.exec(e);
                r += '<c class="directive">'+k[1]+'</c>'+uvs(k[2]);
                r += '{'+(k[3] !== undefined ? colorizer(k[3]) : '')+'}';
            }
            if(/^@catch/.test(e)){
                k = /^(@catch)([\s]+?)?\(([\s\S]+?)\)([\s]+?)?{([\s\S]+?)?}$/.exec(e);
                r += '<c class="directive">'+k[1]+'</c>'+uvs(k[2]);
                r += '(<c class="variable">'+k[3]+'</c>)'+uvs(k[4]);
                r += '{'+(k[5] !== undefined ? colorizer(k[5]) : '')+'}';
            }
            return r;
        }, '}');
        //Loop
        color(/@(for|loop|while)([\s\S]+?){([\s\S]+?)?}/g, function(e){
            var r = '',
                k;
            if(/^(@for)([\s]+?)?\(([\s\S]+?)[\s]+?in/.test(e)){
                k = /^(@for)([\s]+?)?\(([\s\S]+?)([\s]+?)(in)([\s]+?)([\s\S]+?)\)([\s]+?)?{([\s\S]+)}/.exec(e);
                r += '<c class="directive">'+k[1]+'</c>'+uvs(k[2]);
                r += '(<c class="variable">'+k[3]+'</c>'+k[4]+'<c class="directive">'+k[5]+'</c>'+k[6]+colorValue(k[7])+')'+uvs(k[8]);
                r += '{'+colorizer(k[9])+'}';
            }
            if(/^(@for)([\s]+?)?\(([\s\S]+?)[\s]+?from[\s\S]+[\s]+?to[\s\S]+/.test(e)){
                k = /^(@for)([\s]+?)?\(([\s\S]+?)([\s]+?)(from)([\s\S]+?)([\s]+?)(to)([\s\S]+?)\)([\s]+?)?{([\s\S]+)}/.exec(e);
                r += '<c class="directive">'+k[1]+'</c>'+uvs(k[2]);
                r += '(<c class="variable">'+k[3]+'</c>'+k[4]+'<c class="directive">'+k[5]+'</c>'+colorValue(k[6])+k[7]+'<c class="directive">'+k[8]+'</c>'+colorValue(k[9])+')'+uvs(k[10])
                r += '{'+colorizer(k[11])+'}';
            }
            if(/^@loop/.test(e)){
                k = /^(@loop)([\s]+?)?\(([\s\S]+?)\)([\s]+?)?{([\s\S]+)?}$/.exec(e);
                r += '<c class="directive">'+k[1]+'</c>'+uvs(k[2]);
                r += '('+colorValue(k[3])+')'+uvs(k[4]);
                r += '{'+colorizer(k[5])+'}';
            }
            if(/^@while/.test(e)){
                k = /^(@while)([\s]+?)?\(([\s\S]+?)\)([\s]+?)?{([\s\S]+)?}$/.exec(e);
                r += '<c class="directive">'+k[1]+'</c>'+uvs(k[2]);
                r += '('+colorValue(k[3])+')'+uvs(k[4]);
                r += '{'+colorizer(k[5])+'}';
            }
            return r;
        }, '}')
        color(/(@break(?:[\s]+?)?;)/g, '<c class="directive">$1</c>');
        //function
        color(/@fn([\s\S]+?)\(([\n\r \S]+?)?\)([\s]+?)?{([\s\S]+?)?}/g, function(e){
            var r = '',
                k = /^(@fn)([\s]+?)([a-zA-Z_](?:[a-zA-Z0-9_]+)?)([\s]+?)?\(([\s\S]+?)?\)([\s]+?)?{([\s\S]+)?}$/.exec(e);
            r += '<c class="directive">'+k[1]+'</c>'+k[2];
            r += '<c class="function">'+k[3]+'</c>'+uvs(k[4]);
            r += '('+(k[5] !== undefined ? colorArg(k[5]) : '')+')'+uvs(k[6]);
            r += '{'+(k[7] !== undefined ? colorizer(k[7]) : '')+'}';
            return r;
        }, '}');
        color(/(@native|@js)/g, '<c class="annotation">$1</c>');
        color(/@return(?:[\n\r\S]+?)?;/g, function(e){
            var r = '',
                k = /^(@return)([\s\S]+);$/.exec(e);
            r += '<c class="directive">'+k[1]+'</c>';
            r += colorValue(uvs(k[2]))+';';
            return r;
        }, ';');
        color(/@([\w]+)([\s]+?)?\((([\S]+)?|([\n \S]+?)?)\);?/g, function(e){
            var r = '',
                k = /^(@[\w]+)([\s]+?)?\(([\n \S]+)?\)([\s]+?)?(;)?$/.exec(e);
            r += '<c class="function">'+k[1]+'</c>'+uvs(k[2]);
            r += '('+colorArg(uvs(k[3]))+')'+uvs(k[4])+uvs(k[5]);
            return r;
        }, ';');
        color(/(\$[a-z_](?:[a-z0-9_]+)?(?:(?:\.[\w]+|\[(?:[\s\S]+?)\])+)?)/ig, '<c class="variable">$1</c>');
        //Text
        color(/(true|false)/g, '<c class="value constant">$1</c>');
        color(/&lt\/?[\w\W]+?&gt;/g, function(e){
            var k = /^(\/?[\S]+)([\s]+?)?([\s\S]+?)?$/.exec(e.replace(/&lt;([\s]+?)?|&gt;/g,'')),
                r = '',
                m;
            r += '<c class="balise">'+k[1]+'</c>'+(k[2] !== undefined ? k[2] : '');
            if(k[3] !== undefined){
                r += k[3].replace(/([\w-]+)([\s]+?)?=([\S]+)/g, '<c class="variable">$1</c>=<c class="value string">$3</c>');
            }
            return '&lt;'+r+'&gt;';
        });
        color(/("[\s\S]+?"|'[\s\S]+?')/g, '<c class="value string">$1</c>')
        //@JS : function
        color(/\b(var|new|if|else +if|else|for|while|do|let|function|break|continue|return|try|catch)\b/g, '<c class="directive">$1</c>')
        color(/[a-z_0-9.]+\((([\S]+)?|([\n \S]+?)?)\)/ig, function(e){
            var r = '',
                k = /([a-z0-9_.]+)\(([\s\S]+?)?\)/i.exec(e),
                fn = k[1].split('.');
            if(fn.length == 1){
                r += '<c class="function">'+k[1]+'</c>';
            }else{
                for(var i in fn){
                    r += '<c class="'+(i == 0 ? 'alias' : 'function')+'">'+fn[i]+'</c>'+(i < fn.length - 1 ? '.' : '');
                }
            }
            r += '('+uvs(k[2])+')';
            return r;
        })
        color(/(sspa|SSPA)([ \n\t]+)?(-&gt;|\.)/g, '<c class="alias" style="font-weight: bolder;">$1</c>$2$3')
        
        color(/(\(|\)|\[|\]|(?:!|=)?={1,2}|(?:<|>)=?|-|\+{1,2}|\/|\*)/g, '<c style="color: #333;">$1</c>');
        //Render color with paint
        if(startPoint !== undefined){
            paint();
        }
        return html;
    }    
})();
function highlight(pre){
    var html = pre.innerHTML.replace(/</g, '&lt;').replace(/>/g, '&gt;'),
        t = html.match(/\n/g),
        p = pre.parentElement,
        fs = pre.style.fontSize.length ? pre.style.fontSize : '1em',
        lh = pre.style.lineHeight.length ? pre.style.lineHeight : '1.8em';
    pre.innerHTML = colorizer(html,0);
    // console.log('l', t,fs,lh)
    if(t !== null && t.length > 1){
        p.innerHTML = '<span style="display: inline-block; width: 20px; text-align: center; height: auto; position: absolute; left:-20px; background-color: #eee; border-radius: 1em 0 0 1em; line-height: '+lh+'; font-size: '+fs+'; font-family: \'Ubuntu mono\'; color: #777; ">'+
        (function(){
            var n = '';
            for(var i = 1; i <= t.length+1; i++){
                n += i+'<br>';
            }
            return n;
        })()+'</span>'+p.innerHTML;
    }
}
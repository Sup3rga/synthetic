var node_env = typeof module == 'object' && 'exports' in module,
    LogicHtml_SRV = (function(){
    
    var modules_included = {},
        directive_mask = {},
        directive_mask_data = {},
        defined_types = [],
        entry_file = null,
        xhr,
        sspa_root = node_env ? '../' : './',
        localMod = typeof location == 'object' ? /^file:\/\//.test(location.href) : false,
        loader = localMod ? document.createElement('iframe') : null,
        directive_mask_count = 0;
    if(node_env){
        xhr = require('fs');
    }
    //var mod = root.replace(/\./g, '').replace(/\//g, '.').replace(/^\.|\.$/g,'')+'.'+file.replace(/\.[a-z]+$/i, '');

    return function(root,filename,avoid_path,pkg){
        var root = root == undefined ? "./" : root;
        var default_extension = "lh";
        var file = null;
        var code = "", 
            code_source = "",
            pkg = pkg == undefined || pkg == null || pkg == "" || pkg == false ? false : true,
            initialized = false,
            have_to_resolve_mixin = false,
            alias = {
                self:{}
            },
            self_var = {

            };
        var mixin = {
        };
        var avoid_path = isset(avoid_path) ? avoid_path : [];
        var reserved_keys = ['from', 'import', 'include', 'use', 'public', 'private ', 'unused'];
        
        if(filename != null){
            setFile(filename, avoid_path);
        }

        /*-------- Outils ------------*/
        function toCamelCase(text,pascal){
            var pascal = set(pascal,false), c = false,
                avoid = [' ', '-', '_', '\''],
                r = '', e = text.toLowerCase();
            foreach(e,function(i,j){
                c = i.toUpperCase() == text[j] ? true : c;
                r += !inArray(i,avoid) ? ( c || (j == 0 && pascal) ? i.toUpperCase() : i ) : '';
                if(inArray(i,avoid))
                    c = true;
                else
                    c = false;
            })
            return r;
        }

        function inArray(e, a, io, l){
            var rep = false,
                l = typeof l == 'bool' || l == 0 || io == 1 ? l : false,
                io = typeof io == 'bool' || io == 0 || io == 1 ? io : false;
            for(var i = 0, j = a.length; i < j; i++){
                if(l){
                    a[i] = a[i].toLowerCase(); e = e.toLowerCase();
                }
                if(e == a[i] || (io && a[i].indexOf(e) != -1)){
                    rep = true;
                    break;
                }
            }
            return rep;
        }

        function print(e){
            function t(el){
                if(typeof el != 'object')
                    return "";
                var j = ["{", "}"], a = ["[", "]"],
                    type = Array.isArray(el) ? false : true,
                    r = type ? j[0] : a[0],
                    run = false;
                for(var i in el){
                    r += (type ? '"'+i+'" : ' : "")+(typeof el[i] == "object" && el[i] != null ? t(el[i]) : ( typeof el[i] == 'string' ? '"'+el[i].replace(/('|")/g, "\\$1")+'"' : el[i] ) )+", ";
                    run = true;
                }
                r = r.substr(0,r.length-(run ? 2 : 0));
                r += type ? j[1] : a[1];
                return r;
            }
            var r = t(e);
            return r.length == 1 ? (type ? {} : []) : JSON.parse(r.replace(/\\:/g, '\\\\:'));
        }

        function isset(str){
            return typeof str != 'undefined' && str != null;
        }
        
        function set(e, v, s){
            return isset(s) ? (e ? isset(v) ? v : null : isset(s) ? s : null) : (isset(e) ? e : isset(v) ? v : null);
        }

        function random_int(min, max){
            return Math.floor(min + Math.random() * (max - min));
        }

        function empty(str){ 
            return str == null || str == undefined || (str != null && str != undefined && (""+str).length == 0)
        }

        function foreach(e, fn){
            var dontstop = true;
            for(var i in e){
                dontstop = (function(){
                    return fn(e[i], i);
                })();
                if(dontstop == false){
                    break;
                }
            }
        }

        function remove(array, element){
            var r = [];
            for(var i in array){
                if(array[i] != element){
                    r.push(array[i]);
                }
            }
            return r;
        }

        function removeComa(e){
            var r = '',
                s = {
                    quote : 0,
                    simple_quote : 0,
                    bracket: 0,
                    brace : 0,
                    parenthese : 0
                },last = '',save = true;
            foreach(e, function(i){
                if(last != '\\') {
                    switch (i){
                        case '"':
                            s.quote = (!s.simple_quote ?  s.quote + 1 : s.quote) % 2;
                            break;
                        case "'":
                            s.simple_quote = (!s.quote ?  s.simple_quote + 1 : s.simple_quote) % 2;
                            break;
                        case '[':
                            s.bracket += (!s.quote && !s.simple_quote ? 1 : 0);
                            break;
                        case ']':
                            s.bracket -= (!s.quote && !s.simple_quote ? 1 : 0);
                            break;
                        case '{':
                            s.brace += (!s.quote && !s.simple_quote ? 1 : 0);
                            break;
                        case '}':
                            s.brace -= (!s.quote && !s.simple_quote ? 1 : 0);
                            break;
                        case '(':
                            s.parenthese += (!s.quote && !s.simple_quote ? 1 : 0);
                            break;
                        case ')':
                            s.parenthese -= (!s.quote && !s.simple_quote ? 1 : 0);
                            break;
                    }
                    save = !(i === ',' && !s.quote && !s.simple_quote && !s.brace && !s.bracket && !s.parenthese);
                }
                if(save){
                    r += i;
                }
                last = i;
            });
            return r;
        }

        function getIndex(t){
            var r = [];
            for(var i in t){
                r.push(i);
            }
            return r;
        }

        function wait(object, fn){
            if(typeof object != 'object' && typeof fn != 'function')
                return;
            return new Promise(function(resolve){
                var index = getIndex(object),
                    i = 0, response = null;
                function t(){
                    if(i < index.length){
                        var promesse = fn(object[index[i]], index[i])
                        if(typeof promesse.then != 'undefined'){
                            promesse.then(function(e){
                                response = e;
                                i++;
                                t();
                            });
                        }
                        else{
                            resolve(response);
                        }
                    }
                    else{
                        resolve(response);
                    }
                }
                t();
            });
        }

        function preg_quote(e){
            return e.replace(/(\$|\.|\\|\/|\*|\+|\?|\[|\]|\(|\)|\||\{|\}|\^)/g, '\\$1')
        }

        function copy(e){
            return print(e);
        }

        function len(e){
            var k = 0;
            for(var i in e){
                k++;
            }
            return k;
        }

        function getPath(relative){
            while(/\/\.\//.test(relative)){
                relative = relative.replace(/\/\.\//g, '/');
            }
            relative = relative.replace(/^\.\//g, '').replace(/\//g, '');
            var tab = root.split('/'),
                complet = [],
                path = [],
                prefix = relative.replace(/^((?:\.\.)+)(.+?)?$/, '$1'),
                suite = relative.replace(/^(?:(?:\.\.)+)?(.+?)?$/, '$1'),
                tab_prefix = prefix.match(/\.\./g);
                tab_prefix = tab_prefix == null ? [] : tab_prefix;
            for(var i in tab){
                if([".", ""].indexOf(tab[i]) == -1){
                    complet.push(tab[i]);
                }
            }
            var diff = complet.length - tab_prefix.length;
            suite = suite.replace(/^\./, '').replace(/\./g, '/');
            //Resolve relative path
            if(diff >= 0){
                path = complet.slice(0,diff);
            }
            else{
                path = tab_prefix.slice(0,-diff);
            }
            //Adding slash
            for(var i in path){
                path[i] = path[i]+'/';
            }
            path.push(suite);
            path = path.join('');
            return path;
        }

    //@Private

        function getDirective(c_code){
            var begin = false,
            keyword = "",
            saveKeyword = false,
            keywords_reserved = reserved_keys,
            directive = "",
            list = {},
            setInside = false,
            quote = 0, simple_quote = 0, bracket = 0, bracket_alt = 0, parenthese = 0;
            for(var i=0, j = c_code.length; i < j; i++){
                var v = c_code[i];
                if(v == ';' && begin && inArray(keyword.toLowerCase(), keywords_reserved) &&
                    quote % 2 == 0 && simple_quote % 2 == 0 && bracket_alt == 0 && bracket == 0 &&
                    parenthese == 0
                ){
                    begin = false;
                    saveKeyword = false;
                    quote = 0; simple_quote = 0; bracket = 0; bracket_alt = 0; parenthese = 0;
                    if(setInside){
                        quote++;
                        setInside = false;
                    }
                    directive = directive.replace(/^(?: +)?(.+?)(?: +)?$/, "$1");
                    if(isset(list[keyword])){
                        list[keyword].push(directive);
                    }
                    else{
                        list[keyword] = [directive];
                    }
                    keyword = '';
                    directive = '';
                }
                if(set(c_code[i-1], '') != '\\' && begin){
                    if(v == '"' && simple_quote % 2 == 0){
                        quote++;
                    }
                    if(v == "'" && quote % 2 == 0){
                        simple_quote++;
                    }
                    if(v == '('){
                        parenthese++;
                    }
                    if(v == ')'){
                        parenthese--;
                    }
                    if(v == '{'){
                        bracket++;
                    }
                    if(v == '}'){
                        bracket--;
                    }
                    if(v == '['){
                        bracket_alt++;
                    }
                    if(v == ']'){
                        bracket_alt--;
                    }
                }
                if(!/[a-z]/i.test(v)){
                    saveKeyword = false;
                    if(!inArray(keyword.toLowerCase(), keywords_reserved)){
                        keyword = '';
                        begin = false;
                        quote = 0; simple_quote = 0; bracket = 0; bracket_alt = 0; parenthese = 0;
                    }
                }
                if(begin && saveKeyword){
                    keyword += v;
                }
                if(!saveKeyword && keyword != ''){
                    directive += v;
                }
                if(v == '@' && !begin){
                    if(quote % 2 == 1){
                        quote--;
                        setInside = true;
                    }
                    begin = true;
                    saveKeyword = true;
                }
            }
            return list;
        }

        function getDelimiter(str){
            var td = ['%', '/', '_', '-'],
                delimiter = "";
            do{
                delimiter = "";
                for(var i = 0, k = td.length - 1, j = random_int(1,k); i < j; i++){
                    delimiter += td[random_int(0, k)];
                }
            }while(new RegExp(delimiter,"").test(str));

            return delimiter;
        }

        function mixin_modules(c_code){
            var begin = false,
                saveKeyword = false,
                save_name = false,
                save_params = false,
                save_body = false,
                body = "",
                mixin_name = "",
                keyword = "",
                params = "",
                list = {}, finalist = {},
                type = '',
                braket_open = 0, parenthese = 0,
                quote = 0;
            for(var i=0, j = c_code.length; i < j; i++){
                var v = c_code[i];
                if(begin){
                    if(v == '}' && !save_params && set(c_code[i-1], '') != '\\'){
                        braket_open--;
                        if(braket_open == 0){
                            if(/^( +)?[a-z0-9_]+ +extends +([a-z0-9_.]+(?:(?:(?: +)?,(?: +)?[a-z0-9_.]+(?: +)?)+)?)( +)?$/i.test(mixin_name)){
                                have_to_resolve_mixin = true;
                            }
                            type = toCamelCase(file.replace(/^(?:(?:_)+)?(.+?)\.lh$/i,'$1'), true);
                            if(!inArray(type, defined_types)){
                                defined_types.push(type);
                            }
                            if(/^[a-z0-9_]+$/i.test(mixin_name)){
                                type += ','+toCamelCase(mixin_name, true);
                                if(!inArray(toCamelCase(mixin_name, true), defined_types)){
                                    defined_types.push(toCamelCase(mixin_name, true));
                                }
                            }
                            list[mixin_name] = {
                                'name' : mixin_name,
                                'type' : type,
                                'params' : params,
                                'body' : body,
                                'prefix' : keyword,
                                'visible': !/private/.test(keyword),
                                'unused' : /unused/.test(keyword)
                            };
                            begin = false;
                            saveKeyword = false;
                            save_name = false;
                            save_params = false;
                            save_body = false;
                            body = "";
                            mixin_name = ""; keyword = "";
                            params = "";
                        }
                    }
                    
                    if(save_body){
                        body += v;
                    }

                    if(v == '{' && !save_params && set(c_code[i-1], '') != '\\'){
                        braket_open++;
                        if(braket_open == 1 && !save_body){
                            save_body = true;
                        }
                    }
                    if(!/[a-z]/i.test(v)){
                        saveKeyword = /^(((public|private)? +)?(unused +)?)?mixin$|^(public|private|unused)$|^((public|private) +)?(unused|mixin)$/.test(keyword);
                        if(!saveKeyword){
                            begin = false;
                            keyword = '';
                        }
                        else if(/^(((public|private)? +)?(unused +)?)?mixin$/.test(keyword)){
                            saveKeyword = false;
                        }
                    }

                    if(/[a-z0-9_]/i.test(v) && !saveKeyword && !empty(keyword) && empty(mixin_name)){
                        save_name = true;
                    }
                    if(v == '"' && save_params && set(c_code[i-1], '') != '\\'){
                        quote++;
                    }
                    if(v == '(' && quote % 2 == 0 && set(c_code[i-1], '') != '\\'){
                        parenthese++;
                        if(parenthese == 1){
                            save_name = false;
                            if(params.length == 0)
                                save_params = true;
                        }
                    }
                    
                    if(save_params){
                        params += v;
                    }

                    if(v == ')' && quote % 2 == 0 && set(c_code[i-1], '') != '\\'){
                        parenthese--;
                        if(parenthese == 0){
                            save_params = false;
                        }
                    }

                    if(save_name){
                        mixin_name += v;
                    }

                    if(begin && saveKeyword){
                        keyword += v;
                    }
                }
                if(v == '@' && !begin && set(c_code[j-1], '') != '\\'){
                    begin = true;
                    saveKeyword = true;
                }
            }
            return list;
        }

        function search_mixin(name, complex){
            var t = name.split('.'),
                exist = false,
                complex = typeof complex == 'boolean' ? complex : false,
                mx = mixin;
            foreach(t, function(v){
                mx = isset(mx[v]) ? mx[v] : null;
            });
            if(complex && t.length == 1){
                foreach(mixin, function(j,i){
                    if(new RegExp("^( +?)?"+name+" +extends +(.+?)( +)?$", "").test(i)){
                        exist = true;
                        return false;
                    }
                });
            }
            if(mx != null && typeof mx.name != 'string'){
                mx = null;
            }
            return complex ? [mx, exist] : mx;
        }

        function getDefaultValueOf(params, asitis){
            var delimiter = getDelimiter(params),
                asitis = set(asitis, false);
            if(asitis){
                return params.replace(/^((?:@(?:const|unset) +)?\$[a-z0-9_]+)(?: +)?(?:(?:=|\:)(?: +)?((?:"|')?(?:.+?)?(?:"|')?))?(?: +)?$/i, "$1"+delimiter+"$2").split(delimiter);
            }
            params = params.replace(/^((?:@(?:const|unset) +)?\$[a-z0-9_]+)(?: +)?(?:=|\:)(?: +)?(?:"|')?(.+?)?(?:"|')?(?: +)?$/i, "$1"+delimiter+"$2").split(delimiter);
            if(params.length > 1){
                params[1] = params[1].replace(/("|')$/, '');
            }
            params[0] = params[0].replace(/("|')$/, '');
            return params;
        }
        var mixin_argument_extractor = getDefaultValueOf;

        function resolve_mixins(){
            var list = mixin,
                contains = false,
                legacies = {};
            foreach(list, function(j,i){
                var insert = true, name = i;
                if(/^( +)?[a-z0-9_]+ +extends +([a-z0-9_.]+(?:(?:(?: +)?,(?: +)?[a-z0-9_.]+(?: +)?)+)?)( +)?$/i.test(i)){
                    var mixins = i.replace(/^(?: +)?([a-z0-9_]+) +extends +([a-z0-9_.]+(?:(?:(?: +)?,(?: +)?[a-z0-9_.]+(?: +)?)+)?)(?: +)?$/i, '$1-$2').split('-');
                    var name = mixins[0];
                    // console.error('[NAME]',name);
                    foreach(mixins[1].split(','), function(mx){
                        mx = mx.replace(/^( +)?|( +)?$/g,'');
                        var supermx = search_mixin(mx, true);
                        // console.log('[MIXIN]',mx,'=>',supermx);
                        j.body = j.body.replace(/^( +)|( +)$/, '');
                        if(isset(legacies[mx]) && legacies[mx] == name){
                            throw new Error('Recursive legacy between mixins '+name+'(...) and '+mx+'(...)');
                        }
                        if(supermx[0] != null){
                            supermx = supermx[0];
                            // console.log('[SELF BODY]',j.body)
                            j.body = supermx.body+j.body;
                            // console.log('[SUPER BODY]',supermx.body);
                            // console.log('[FINAL BODY]', j.body)
                            //attributes legacy settings
                            var arga = mixin_argument_format_decoder(j.params),
                                argb = mixin_argument_format_decoder(supermx.params),
                                types = [],
                                to_replace = [],
                                defined = {}, params = '(';
                            foreach(argb, function(arg){
                                var arg = mixin_argument_extractor(arg,true),
                                    constant = /^@const/.test(arg[0]),
                                    unset = /^@unset/.test(arg[0]);
                                if(constant || unset){
                                    arg[0] = arg[0].replace(/^@(const|unset) +/i, '');
                                }
                                // console.log('[ARG]',arg, supermx.params_alt)
                                if(arg[1] == "" && 'params_alt' in supermx && arg[0] in supermx.params_alt){
                                    arg[1] = supermx.params_alt[arg[0]];
                                    if(constant && to_replace.indexOf(arg[0]) === -1){
                                        to_replace.push(arg[0]);
                                    }
                                }
                                defined[arg[0]] = {
                                    value : removeSemicolon(arg[1]),
                                    constant: constant,
                                    unset : unset
                                }
                            });
                            // console.error('[LEGACY]', name, '=>', supermx.name);
                            // console.log('[TYPES]', supermx.type, '=>', j.type);
                            // console.log('[DEFINED]',supermx.params,'\n\n=>', j.params, arga);
                            function removeSemicolon(e){
                                var quote = 0, simple_quote = 0,
                                    brace = 0, parenthese = 0,
                                    r = '',save = true;
                                foreach(e, function(i,j){
                                    if(set(e[j*1-1], '') != '\\'){
                                        if(i == '"' && simple_quote % 2 == 0 ){quote++;}
                                        if(i == "'" && quote % 2 == 0 ){simple_quote++;}
                                        if(quote % 2 == 0 && simple_quote % 2 == 0){
                                            if(parenthese == 0){
                                                if(i == '{'){brace++;}
                                                if(i=='}'){brace--;}
                                            }
                                            if(i == '('){parenthese++;}
                                            if(i == ')'){parenthese--;}
                                        }
                                    }
                                    save = i != ';' || (i == ';' &&
                                        (quote % 2 || simple_quote % 2 || brace > 0 || parenthese > 0)
                                    ) || set(e[j*1-1], '') == '\\';
                                    if(save){
                                        r += i;
                                    }
                                });
                                return r;
                            }
                            foreach(arga, function(arg){
                                var args = mixin_argument_extractor(arg, true);
                                params += removeSemicolon(arg)+','; //removeSemicolon
                                args[0] = args[0].replace(/^@(const|unset) +/i, '');
                                if(args[0] in defined){
                                    to_replace = remove(to_replace, args[0]);
                                    delete defined[args[0]];
                                }
                                // console.log('[ARG]',args, to_replace)
                                if(to_replace.length){
                                    foreach(to_replace, function(i){
                                        if(/^(?: +)?\[(?: +)?(.+?)?(?: +)?\](?: +)?$/.test(args[1])){
                                            args[1] = removeComa(RegExp.$1);
                                        }
                                        // console.error('[VALUE]',i, args)
                                        // console.log('[DEF]',defined[i].value);
                                        // defined[i].value = defined[i].value.replace(/(\$[a-z_]+(?:[a-z0-9_]+)?)(?: +)?:/ig, '$1:');
                                        defined[i].value = defined[i].value.replace(new RegExp(preg_quote(args[0])+"([^a-zA-Z0-9_:])", "g"), transformDirective(args[1])+"$1");
                                    });
                                }
                            });
                            foreach(defined, function(arg, key){
                                params += (arg.constant ? '@const ' : (arg.unset ? '@unset ' : ''))+key+(arg.value.length ? " : "+arg.value : "")+',';
                            });
                            params = params.replace(/,$/, '')+')';
                            j.params = params;
                            types = supermx.type.split(',');
                            // console.log('[params]',params);
                            // console.log('[BODY]',{arga, argb, defined});
                            j.type = j.type+','+toCamelCase(name, true);
                            foreach(j.type.split(','), function(i){
                                if(!inArray(i, types)){
                                    types.push(i);
                                }
                            });
                            j.type = types.join(',');
                            // console.log('[Final type]', j.type);
                            if(!inArray(toCamelCase(name, true), defined_types)){
                                defined_types.push(toCamelCase(name, true));
                            }
                            j.name = name;
                            delete mixin[i];
                            mixin[name] = j;
                        }
                        else{
                            if(supermx[1]){
                                legacies[name] = mixins[1];
                                insert = false;
                            }
                        }
                    });
                }
                contains = contains || !insert;
            });
            if(contains){
                resolve_mixins();
            }
        }

        function loop_modules(c_code, list){
            var list = Array.isArray(list) ? list : [],
                keyword = '',
                begin = false,
                saveKeyword = false,
                modules = '',
                savemodules = false,
                content = '',
                braket_open = 0,
                quote = 0, simple_quote = 0;
            for(var i=0, j = c_code.length; i < j; i++){
                var v = c_code[i];
                if(set(c_code[i-1], '') != '\\'){
                    if(v == '"' && simple_quote % 2 == 0){
                        quote++;
                    }
                    if(v == "'" && quote % 2 == 0){
                        simple_quote++;
                    }
                    if(v == '{'){
                        braket_open++;
                        saveKeyword = false;
                    }
                    if(v == '}'){
                        braket_open--;
                        if(braket_open == 0 && !empty(modules)){
                            if(keyword == 'loop'){
                                modules = modules.replace(/^(?: +)?\$?(.+?)(?: +)?$/, "$1");
                                list[modules] = {
                                    "content" : content,
                                    "type" : "loop"
                                };
                                if(/\\$(?:loop){(.+?)?}/.test(content)){
                                    list = loop_modules(content, list);
                                }
                            }
                            keyword = '';
                            modules = '';
                            content = '';
                            saveKeyword = false;
                            begin = false;
                            savemodules = false;
                        }
                    }
                }
                if(!/[a-z]/i.test(v)){
                    if(saveKeyword){
                        saveKeyword = false;
                        if(keyword != 'loop'){
                            begin = false;
                            keyword = '';
                        }
                    }
                }
                if(begin){
                    if(!savemodules && !saveKeyword && !empty(keyword) && !empty(modules)){
                        content += v;
                    }
                    if(saveKeyword){
                        keyword += v;
                    }
                    if(savemodules){
                        if(v == '>' && isset(c_code[i+1]) && c_code[i+1] == '>'){
                            savemodules = false;
                            i++;
                        }
                        else{
                            modules += v;
                        }
                    }
                }
                if(v == '$' && !begin && quote % 2 == 0 && simple_quote % 2 == 0 && braket_open == 0){
                    begin = true;
                    saveKeyword = true;
                }
                if(keyword != '' && v == '{' && braket_open == 1){
                    savemodules = true;
                }
            }
            return list;
        }

        function comp_modules(c_code){
            var keyword = '',
                open = false,
                saveKeyword = false,
                modules = '',
                savemodules = false,
                content = '',
                list = [];
            for(var i = 0, j = c_code.length; i < j; i++){
                var v = c_code[i];
                if(open){
                    if(!savemodules && !empty(modules)){
                        content += v;
                    }
                    if(v == '<'){
                        if(code[i+1] == '<' && savemodules){
                            i++;
                        }
                        savemodules = false;
                    }
                    if(savemodules){
                        modules += v;
                    }
                    if(v == '>' && isset(c_code[i+1]) && c_code[i+1] == '>' && !savemodules && empty(modules)){
                        i++;
                        savemodules = true;
                    }
                }
                if(v == ' ' || v == '\n' || v == '\t' || (v == '>' && isset(c_code[i-1]) && c_code[i-1] != '>')){
                    saveKeyword = false;
                    if(keyword == 'comp' || keyword == 'compartiment'){
                        if(open){
                            content = content.replace(/^(?: +)?(.+?)(?: +)?\\$(?:comp(?:artiment)?>)(?: +)?$/, "$1");
                            list[modules] = {
                                "content" : content,
                                "type" : "compartiment"
                            };
                            saveKeyword = false;
                            savemodules = false;
                            content = '';
                            modules = '';
                            open = false;
                        }
                        else{
                            open = true;
                        }
                    }
                    keyword = '';
                }
                if(saveKeyword){
                    keyword += v;
                }
                if(v == '$'){
                    begin = true;
                    saveKeyword = true;
                }
            }
            return list;
        }

        function comment_modules(c_code,list){
            var list = Array.isArray(list) ? list : [],
                keyword = '',
                saveKeyword = false,
                modules = '',
                open = false,
                savemodules = false,
                content = '',
                imbrication = 0;
            for(var i=0, j = c_code.length; i < j; i++){
                var v = c_code[i];
                if(v == '#'){
                    saveKeyword = true;
                }
                if(v == ' '){
                    saveKeyword = false;
                }
                if(savemodules && v != ':'){
                    modules += v;
                }
                if(!savemodules && open && !empty(modules)){
                    content += v;
                }
                if(v == ':'){
                    saveKeyword = false;
                    if(savemodules){
                        savemodules = false;
                    }
                    if(/^#--( +)?module$/i.test(keyword)){
                        imbrication++;
                        if(imbrication == 1){
                            open = true;
                            savemodules = true;
                        }
                    }
                    if(/^#--( +)?end$/i.test(keyword)){
                        imbrication--;
                        if(imbrication == 0){
                            modules = modules.replace(/^(?: +)?(.+?)(?: +)?$/g, "$1");
                            content = content.replace(/^(?: +)?(.+?)(?: +)?#--end( +)?:$/ig, "$1");
                            list[modules] = {
                                "content" : content,
                                "type" :"comment"
                            };
                            if(/#--( +)?module(?: +)?:(.+?)#--( +)?end( +)?:/i.test(content))
                                list = comment_modules(content, list);
                            content = '';
                            modules = '';
                            savemodules = false;
                            open = false;
                        }
                    }
                    keyword = '';
                }
                if(saveKeyword){
                    keyword += v;
                }
            }
            return list;
        }

        function canon_modules(c_code){
            var list = {},
                e = c_code,
                quote = 0, simple_quote  = 0, keyword = '', body = '',
                bracket = 0, begin = 0,
                save_prototype = false, save_body = false;
            foreach(e, function(i,j){
                if(begin){
                    if(i == ' ' && save_prototype){
                        if(!/^module/.test(keyword)){
                            begin = false;
                            keyword = ''; body = '';
                            begin = false; save_body = false; save_prototype = false;
                            simple_quote = 0; quote = 0; bracket = 0;
                        }
                    }

                    if(save_body){
                        body += i;
                    }

                    if(bracket == 1 && save_prototype && keyword.length > 0){
                        save_body = true;
                        save_prototype = false;
                    }

                    if(bracket == 1 && i == '}' && set(e[j*1-1], '') != '\\' && save_body){
                        keyword = keyword.replace(/^module +(.+?)(?: +)?{$/,'$1');
                        body = body.replace(/^(?: +)?(.+?)(?: +?)?}$/, '$1');
                        list[keyword] = {
                            "content" : body,
                            "type" : "canon"
                        };
                        keyword = ''; body = '';
                        begin = false; save_body = false; save_prototype = false;
                        simple_quote = 0; quote = 0; bracket = 0;
                    }
                    if(save_prototype){
                        keyword += i;
                    }
                }
                if(set(e[j*1-1], '') != '\\'){
                    if(i == '"' && simple_quote % 2 == 0){quote++;}
                    if(i == "'" && quote % 2 == 0){simple_quote++;}
                    if(begin){
                        if(i == "{"){bracket++;}
                        if(i == "}"){bracket--;}
                    }
                    if(i == '@' && !begin){
                        begin = true;
                        save_prototype = true;
                        keyword = '';
                    }
                }
            });
            return list;
        }

        function request(filename)  {
            return new Promise(function(res,err){
                function setContent(response){
                    var response = response
                        //remove inline comments
                        .replace(/\/\/(.+?)?((\t|\r)+)?\n/g, '')
                        //remove tabulation
                        .replace(/\n|\t|\r/g, "")
                        //remove comments
                        .replace(/\/\*(.+?)\*\//g, '');
                    res(response);
                }
                if(node_env){
                    xhr.readFile(filename, 'utf-8', function(error,content){
                        if(error){
                            err(error);
                        }else{
                            setContent(content);
                        }
                    });
                }else{
                    xhr = new XMLHttpRequest() || new ActiveXObject("Msxml2.XMLHTTP");
                    xhr.open("GET", filename);
                    try{
                        xhr.send(null);
                        xhr.onreadystatechange = function(){
                            if (xhr.readyState == 4 && xhr.status == 200) {
                                setContent(xhr.responseText);
                            }
                            if(xhr.status == 404 || xhr.status == 500){
                                err("File ["+filename+"] not found");
                            }
                        }
                    }catch(e){
                        err(e.getMessage());
                    }
                }
            });
        }

        function resolvePackageList(){
            return new Promise(function(resolve){
                var packages = {},
                    fichiers = file.replace(/^(?: +)?|\.[a-z]+$/g, '').split(/(?: +)?,(?: +)?/);//file to import
                request(root+'.lpkg').then(function(e){
                    var all = e.split(':'),
                        callables = [],
                        take_all = fichiers.indexOf('*') >= 0;
                    foreach(all,function(i){
                       if(fichiers.indexOf(i) >= 0 || take_all){
                           callables.push(i);
                       }
                    });
                    // console.log('[take]',take_all, file, callables )
                    wait(callables, function(v){
                        return new Promise(function(res){
                            if(!/^ +$/.test(v)){
                                v = v.replace(/^( +)?|( +)?$/g, '');
                                new LogicHtml_SRV(root,v+'.'+default_extension,avoid_path).getModules().then(function(r){
                                    // console.log('[V]',v, r);
                                    packages[v] = r;
                                    code_source += r.code;
                                    res();
                                });
                            }else{
                                res();
                            }
                        });
                    }).then(function(e){
                        resolve(packages);
                    });
                });
            });
        }

        function getModulePath(p,f){
            var p = p == undefined ? root : p, 
                f = f == undefined ? file : f;
            return p.replace(/\./g, '').replace(/\//g, '.').replace(/^\.|\.$/g,'')+'.'+f.replace(/\.[a-z]+$/i, '');
        }

        function setCode(filename, avoid){
            var avoid = Array.isArray(avoid) ? avoid : [],
                append = false;
            return new Promise(function(resolve){
                if(pkg){
                    resolvePackageList().then(function(e){
                        resolve(e);
                    });
                }
                else{
                    var mod_path = getModulePath();
                    if(mod_path in modules_included){
                        var cache = modules_included[mod_path];
                        code = cache.content;
                        mixin = cache.mixin;
                        alias = cache.modules;
                        code_source = code;
                        resolve(code);
                    }
                    else{
                        request(filename).then(function(e){
                            if(!append){
                                for(var i = 0, j = avoid.length; i < j; i++){
                                    avoid_path.push(avoid[i]);
                                }
                                avoid_path.push(filename.replace(/\.[a-z0-9]+$/i, ""));
                                append = true;
                            }
                            code = e;
                            code_source = code;
                            resolve(code);
                        }).catch(function(e){
                            throw new Error(e);
                        });
                    }
                }
            });
        }

        function clear_modules(modules){
            var to_remove = [], r = {};
            foreach(modules, function(v,k){
                foreach(modules, function(j,i){
                    if(i != k && new RegExp(v['content'],"").test(j['content']) > 0){
                        to_remove.push(k);
                    }
                });
            });
            foreach(modules, function(v,k){
                if(!inArray(k, to_remove)){
                    r[k] = v;
                }
            });
            return r;
        }

        function collapse_modules_complement(i, j){
            var content = '';
            if(j['type'] != 'mixin'){
                if(j['type'] == 'loop'){
                    content += "\$loop{\$"+i+" >> "+j['content']+"}";
                }
                else{
                    content += j['content'];
                }
            }
            return content;
        }

        function collapse_modules(modules){
            var content = '';
            foreach(modules, function(j,i){
                if(isset(j['type'])){
                    content += collapse_modules_complement(i, j);
                }
                else{
                    foreach(j, function(v,k){
                        content += collapse_modules_complement(k, v);
                    })
                }
            })
            return content;
        }

        function getRelativePath(decode){
            var source = decode.package != null ? decode.package : decode.file,
                path = getPath(source);
                path = decode.package == null ? path.replace(/(.+?)\/[a-z0-9_]+$/i,'$1') : path;
                path += /\/$/.test(path) ? '' : '/';
                path = /^\./.test(path) ? path : './'+path;
            return {source: source, path: path};
        }
        
        function init_directive(decode,clear, c_code){
            var clear = typeof clear == 'boolean' ? clear : false,
                c_code = typeof c_code == 'boolean' ? c_code : false,
                res = getRelativePath(decode),
                source = res.source,
                path = res.path;
            // console.log('[DECODE]',decode, res);
            //SSPA exception
            if(decode.package+"".toLowerCase() == 'sspa'){
                path = sspa_root+"sspa/";
                source = "sspa";
            }
            var module_path = getModulePath(path,source);
            if(!(module_path in modules_included)){
                var instance = new LogicHtml_SRV(path,decode['file']+'.'+default_extension, avoid_path, decode.package);
                return c_code ? instance.getCode() : instance.getModules(clear);
            }
            else{
                return new Promise(function(resolve){
                    resolve(c_code ? modules_included[module_path].content.replace(/@(import|include|from|use)(.+?);/, '') : modules_included[module_path]);
                });
            }
        }

        function set_env_modules(decode){
            var mod_path, cache;
            if(decode == null){
                mod_path = getModulePath();
                cache = modules_included[mod_path];
                foreach(cache['mixin'],function(j,i){
                    mixin[i] = j;
                });
                foreach(cache['modules'],function(v,k){
                    if(typeof v.content == 'string'){
                        alias.self[k] = v.content;
                    }
                    else{
                        alias[k] = v;
                    }
                });
            }
            else{
                // console.log('[Decode]',decode);
                var r_path = getRelativePath(decode),
                    files = decode.file.split(','),
                    pkgs = decode.package == null ? null : decode.package.replace(/^(?:(?: +)?\.+)?([a-z0-9_.]+)(?:\.+)?$/i, '$1'),
                    mod = decode.modules == null ? [] : decode.modules.split(/(?: +)?,(?: +)?/);
                    pkgs = pkgs == null ? null : pkgs.replace(/\./g, '_');
                //SSPA exception
                if(decode.package+"".toLowerCase() == 'sspa'){
                   r_path.path = "./sspa/";
                }
                if(!('self' in alias)){
                    alias.self = {};
                }
                foreach(files, function(v){
                    v = v.replace(/^( +)?|( +)?$/g, '');
                    mod_path = getModulePath(r_path.path, v);
                    if(['*'].indexOf(v) != -1){
                        foreach(modules_included, function(val,key){
                            if(key.replace(/[a-z0-9_]+$/i, '*') == mod_path){
                                cache = val;
                                key = key.replace(/(?:.+?)?([a-z0-9_]+)$/i, '$1');
                                foreach(cache['mixin'],function(j,i){
                                    var als = decode.alias;
                                    if(j.visible){
                                        if(decode.method == 'include'){
                                            if(als == null)
                                                mixin[i] = j;
                                            else{
                                                if(mixin[als] == undefined){
                                                    mixin[als] = {};
                                                }
                                                mixin[als][i] = j;
                                            }
                                        }
                                        else{
                                            if(decode.modules != null && decode.method == 'from'){
                                                if(inArray(i,mod) || decode.modules =='*'){
                                                    if(als == null){
                                                        mixin[i] = j;
                                                    }
                                                    else{
                                                        if(mixin[als] == undefined){
                                                            mixin[als] = {};
                                                        }
                                                        mixin[als][i] = j;
                                                    }
                                                }
                                            }
                                            else{
                                                if(pkgs != null){
                                                    if(als != null){
                                                        if(mixin[als] == undefined){
                                                            mixin[als] = {};
                                                        }
                                                        if(mixin[als][key] == undefined){
                                                            mixin[als][key] = {};
                                                        }
                                                        mixin[als][key][i] = j;
                                                    }
                                                    else{
                                                        if(mixin[key] == undefined){
                                                            mixin[key] = {};
                                                        }
                                                        mixin[key][i] = j;
                                                    }
                                                }
                                                else{
                                                    if(als != null){
                                                        if(mixin[als] == undefined){
                                                            mixin[als] = {};
                                                        }
                                                        mixin[als][i] = j;
                                                    }
                                                    else{
                                                        mixin[i] = j;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                });
                                foreach(cache['modules'],function(m,k){
                                    var als = decode.alias;
                                    if(decode.method == 'include'){
                                        if(als == null){
                                            alias.self[k] = m.content;
                                        }
                                        else{
                                            if(alias[als] == undefined){
                                                alias[als] = {};
                                            }
                                            alias[als][k] = m.content;
                                        }
                                    }
                                    else{
                                        if(decode.modules != null && decode.method == 'from'){
                                            if(inArray(k,mod) || inArray(decode.modules, ['*', 'all'])){
                                                if(als == null){
                                                    alias[k] = m.content;
                                                }
                                                else{
                                                    if(alias[als] == undefined){
                                                        alias[als] = {};
                                                    }
                                                    alias[als][k] = m.content;
                                                }
                                            }
                                        }
                                        else{
                                            if(pkg != null){
                                                if(als != null){
                                                    if(alias[als] == undefined){
                                                        alias[als] = {};
                                                    }
                                                    if(alias[als][key] == undefined){
                                                        alias[als][key] = {};
                                                    }
                                                    alias[als][key][k] = m.content;
                                                }
                                                else{
                                                    if(alias[key] == undefined){
                                                        alias[key] = {};
                                                    }
                                                    alias[key][k] = m.content;
                                                }
                                            }
                                            else{
                                                if(als != null){
                                                    if(alias[als] == undefined){
                                                        alias[als] = {};
                                                    }
                                                    alias[key][k] = m.content;
                                                }
                                                else{
                                                    alias[k] = m.content;
                                                }
                                            }
                                        }
                                    }
                                });
                            }
                        });
                    }
                    else{
                        cache = modules_included[mod_path];
                        foreach(cache['mixin'],function(j,i){
                            if(!('visible' in j ) || j.visible){
                                var aka = decode.alias;
                                if(['include','from'].indexOf(decode.method) != -1){
                                    if(decode.method == 'include'){
                                        if(aka == null){
                                            mixin[i] = j;
                                        }
                                        else{
                                            if(mixin[aka] == undefined){
                                                mixin[aka] = {};
                                            }
                                            mixin[aka][i] = j;
                                        }
                                    }
                                    else{
                                        if(decode.modules == null || inArray(i,mod) || decode.modules == '*'){
                                            if(aka == null){//S'il n'y a pas d'alias
                                                mixin[i] = j;
                                            }
                                            else{
                                                if(mixin[aka] == undefined){
                                                    mixin[aka] = {};
                                                }
                                                if(i in mixin[aka]){//Si on importe plusieurs fichiers, on évite les conflits
                                                    if(mixin[aka][v] == undefined){
                                                        mixin[aka][v] = {};
                                                    }
                                                    mixin[aka][v][i] = j;
                                                }
                                                else{
                                                    mixin[aka][i] = j;
                                                }
                                            }
                                        }
                                    }
                                }
                                else{
                                    if(aka != null){
                                        if(mixin[aka] == undefined){
                                            mixin[aka] = {};
                                        }
                                        if(files.length > 1){
                                            if(mixin[aka][v] == undefined){
                                                mixin[aka][v] = {};
                                            }
                                            mixin[aka][v][i] = j;
                                        }
                                        else{
                                            mixin[aka][i] = j;
                                        }
                                    }
                                    else{
                                        if(mixin[v] == undefined){
                                            mixin[v] = {};
                                        }
                                        mixin[v][i] = j;
                                    }
                                }
                            }
                        });
                        foreach(cache['modules'],function(m,k){
                            var als = decode.alias;
                            if(decode.method == 'include'){
                                if(als == null){
                                    if(!(k in alias.self)){
                                        alias.self[k] = m.content;
                                    }
                                }
                                else{
                                    if(alias[als] == undefined){
                                        alias[als] = {};
                                    }
                                    alias[als][k] = m.content;
                                }
                            }
                            else{
                                if(decode.modules != null && decode.method == 'from'){
                                    if(inArray(k,mod) || inArray(decode.modules, ['*', 'all'])){
                                        if(als == null){
                                            alias[k] = m.content;
                                        }
                                        else{
                                            if(alias[als] == undefined){
                                                alias[als] = {};
                                            }
                                            alias[als][k] = m.content;
                                        }
                                    }
                                }
                                else{
                                    if([null, false].indexOf(pkg) == -1){
                                        if(als != null){
                                            if(alias[als] == undefined){
                                                alias[als] = {};
                                            }
                                            if(alias[als][v] == undefined){
                                                alias[als][v] = {};
                                            }
                                            alias[als][v][k] = m.content;
                                        }
                                        else{
                                            if(alias[v] == undefined){
                                                alias[v] = {};
                                            }
                                            alias[v][k] = m.content;
                                        }
                                    }
                                    else{
                                        if(als != null){
                                            if(alias[als] == undefined){
                                                alias[als] = {};
                                            }
                                            if(files.length > 1){
                                                if(alias[als][v] == undefined){
                                                    alias[als][v] = {};
                                                }
                                                alias[als][v][k] = m.content;
                                            }
                                            else{
                                                alias[als][k] = m.content;
                                            }
                                        }
                                        else{
                                            if(alias[v] == undefined){
                                                alias[v] = {};
                                            }
                                            alias[v][k] = m.content;
                                        }
                                    }
                                }
                            }
                        });
                    }
                });
                mod_path = getModulePath();
                foreach(alias, function (v,k){
                    if(k != 'self'){
                        modules_included[mod_path].modules[k] = v;
                    }
                });
                // console.log('[MIXIN]',file,'=>',JSON.parse(JSON.stringify(mixin)), files, mod);
            }
            return '';
        }

        function adjustUseDirective(k){
            //Ajustement de l'écriture de l'utilisation des modules avec le mot-clé @use
            var l = [],
                parenthese = 0, quote = 0, simple_quote = 0,
                begin = false, dir = '', save = false,
                wrapped = false;
            if(/^\((.+?)\)$/.test(k)){
                wrapped = true;
                k = k.replace(/^\(|\)$/g, '');
            }
            for(var i = 0, j = k.length; i < j; i++){
                if(set(k[j-1], '') != '\\'){
                    if(!quote && !simple_quote){
                        if(k[i] == '('){
                            parenthese++;
                        }
                        if(k[i] == ')'){
                            parenthese--;
                        }
                    }
                    if(k[i] == '"' && !simple_quote){
                        quote = quote == 1 ? 0 : 1;
                    }
                    if(k[i] == "'" && !quote){
                        simple_quote = simple_quote == 1 ? 0 : 1;
                    }
                }
                if(begin){
                    //Si on rencontre une virugle ou si c'est la fin de la chaine.
                    if((k[i] == ',' && !parenthese && !quote && !simple_quote ) || i == j - 1){
                        if(i == j - 1 && /[a-z0-9_\)]/.test(k[i])){
                            dir += k[i];
                        }
                        if(dir.length > 0){
                            dir = dir.replace(/^(?: +)|(?: +)?$/g, '').replace(/("|')$/g, '');
                            if(l.indexOf(dir) == -1){
                                l.push(dir);
                            }
                            begin = false;
                            dir = '';
                            save = false;
                        }
                    }
                }
                 if(k[i] == ' ' && dir.length > 0 && !save){
                     if(dir == '@use'){
                        save = true;
                     }
                     else{
                         begin = false;
                         dir = '';
                     }
                 }
                 if(save){
                     dir += k[i];
                 }
                if(begin){
                    if(/[a-z0-9_.]/.test(k[i]) && begin && !save){
                        dir += k[i];
                    }
                }
                if(k[i] == '@' && !begin && set(k[j-1], '') != '\\'){
                    begin = true;
                    dir += k[i];
                }
            }
            for(var i = 0, j = l.length; i < j; i++){
                k = k.replace(new RegExp(preg_quote(l[i]), "g"), l[i]+";");
            }
            if(wrapped){
                k = '('+k+')';
            }
            return k;
        }

    //@directive: import
        function import_format_decoder(value){
            var r = {file : null, alias : null, package: null, modules: null, method: "import"},k;
            if(/^([a-zA-Z0-9_]+)(?: +in(?:to)? +([a-zA-Z0-9_]+))?$/.test(value)){
                k = value.replace(/^([a-zA-Z0-9_]+)(?: +in(?:to)? +([a-zA-Z0-9_]+))$/, '$1-$2').split('-');
                r.file = k[0];
                r.alias = k[1] != undefined && k[1].length ? k[1] : null;
            }
            if(/^(([a-zA-Z0-9_]+(?:(?:, +[a-zA-Z0-9_]+)+)?)|\*|all) +from +((?:(?:\.)+)?[a-zA-Z0-9_.]+)(?: +in(?:to)? +([a-zA-Z0-9_]+))?$/.test(value)){
                k = value.replace(/^((?:[a-zA-Z0-9_]+(?:(?:, +[a-zA-Z0-9_]+)+)?)|\*|all) +from +((?:(?:\.)+)?[a-zA-Z0-9_.]+)(?: +in(?:to)? +([a-zA-Z0-9_]+))?$/, '$1-$2-$3').split('-');
                r.file = k[0];
                r.package = k[1];
                r.alias = k[2] != undefined && k[2].length ? k[2] : null;
            }
            return r;
        }

        function import_directive(list){
            var content = '';
            return wait(list, function(v){
                return new Promise(function(resolve){
                    var decode = import_format_decoder(v);
                    init_directive(decode,empty(decode['namespace'])).then(function(result){
                        content = set_env_modules(decode,result);
                        code = code.replace(new RegExp("@import +"+preg_quote(v)+"( +)?;", "g"), content);
                        setModules(code);
                        var res = {content: code};
                        resolve(res);
                    });
                });
            });
        }

    //@directive: from
        function from_format_decoder(value){
            var r = {file : null, alias : null, package: null, modules: null, method: "from", way: "into"},k;
            if(/^(?: +)?([a-zA-Z0-9_]+) +import +(([a-zA-Z0-9_]+(?:(?:, +[a-zA-Z0-9_]+)+)?)|\*|all)(?: +(?:(as|in(?:to)?) +([a-zA-Z0-9_]+)(?: +)?)?)?$/.test(value)){
                k = value.replace(/^(?: +)?([a-zA-Z0-9_]+) +import +((?:[a-zA-Z0-9_]+(?:(?:, +[a-zA-Z0-9_]+)+)?)|\*|all)(?: +(?:(as|in(?:to)?) +([a-zA-Z0-9_]+)(?: +)?)?)?$/i, '$1-$2-$3-$4').split('-');
                r.file = k[0];
                r.way = k[2].length ? k[2] : "into";
                r.modules =  k[1];
                r.alias = k[3].length ? k[3] : null;
            }
            if(/^(?: +)?((?:(?:\.)+)?[a-zA-Z0-9_.]+) +choose +(([a-zA-Z0-9_]+(?:(?:, +[a-zA-Z0-9_]+)+)?)|\*|all)(?: +(?:in(?:to)? +([a-zA-Z0-9_]+)(?: +)?)?)?$/.test(value)){
                k = value.replace(/^(?: +)?((?:(?:\.)+)?[a-zA-Z0-9_.]+) +choose +((?:[a-zA-Z0-9_]+(?:(?:, +[a-zA-Z0-9_]+)+)?)|\*|all)(?: +(?:in(?:to)? +([a-zA-Z0-9_]+)(?: +)?)?)?$/i, '$1-$2-$3').split('-');
                r.file = k[1];
                r.modules =  null;
                r.package = k[0];
                r.alias = k[2].length ? k[2] : null;
                console.log('[1]')
            }
            if(/^(?: +)?((?:(?:\.)+)?[a-zA-Z0-9_.]+) +choose +(([a-zA-Z0-9_]+(?:(?:, +[a-zA-Z0-9_]+)+)?)|\*|all) +to +import +((?:[a-zA-Z0-9_]+(?:(?:, +[a-zA-Z0-9_]+)+)?)|\*|all)(?: +in(?:to)? +([a-zA-Z0-9_]+)(?: +)?)?$/.test(value)){
                k = value.replace(/^(?: +)?((?:(?:\.)+)?[a-zA-Z0-9_.]+) +choose +((?:[a-zA-Z0-9_]+(?:(?:, +[a-zA-Z0-9_]+)+)?)|\*|all) +to +import +((?:[a-zA-Z0-9_]+(?:(?:, +[a-zA-Z0-9_]+)+)?)|\*|all)(?: +in(?:to)? +([a-zA-Z0-9_]+)(?: +)?)?$/i, '$1-$2-$3-$4').split('-');
                r.file = k[1];
                r.package = k[0];
                r.modules = k[2];
                r.alias = k[3].length ? k[3] : null;
            }
            return r;
        }

        function from_directive(list){
            var content = '';
            return wait(list, function(v){
                return new Promise(function(resolve){
                    var decode = from_format_decoder(v);
                    init_directive(decode).then(function(result){
                        content = set_env_modules(decode,result);
                        code = code.replace(new RegExp("@from +"+preg_quote(v)+"( +)?;", "g"), content);
                        setModules(code);
                        var res = {content: code};
                        resolve(res);
                    });
                });
            });
        }

    //@directive: include
        function include_format_decoder(value){
            var r = {file : null, alias : null, package: null, modules : null, method: "include"},k;
            if(/^(?: +)?((?:(?:\.)+)?[a-zA-Z0-9_]+)(?: +in(?:to)? +([a-zA-Z0-9_]+))?$/i.test(value)){
                k = value.replace(/^(?: +)?((?:(?:\.)+)?[a-zA-Z0-9_]+)(?: +in(?:to)? +([a-zA-Z0-9_]+))?$/i, '$1-$2').split('-');
                r.file = k[0];
                r.alias = k[1].length ? k[1] : null;
            }
            if(/^(?: +)?(([a-zA-Z0-9_]+(?:(?:, +[a-z0-9_]+)+)?)|\*|all) +from +((?:(?:\.)+)?[a-zA-Z0-9_]+)(?: +in(?:to)? +([a-zA-Z0-9_]+))?$/.test(value)){
                k = value.replace(/^(?: +)?((?:[a-zA-Z0-9_]+(?:(?:, +[a-z0-9_]+)+)?)|\*|all) +from +((?:(?:\.)+)?[a-zA-Z0-9_]+)(?: +in(?:to)? +([a-zA-Z0-9_]+))?$/i, '$1-$2-$3').split('-');
                r.file = k[0];
                r.package = k[1];
                r.alias = k[2].length && ['*','all'].indexOf(k[1]) == -1 ? k[2] : null;
            }
            return r;
        }

        function include_directive(list){
            var content = '';
            return wait(list, function(v){
                return new Promise(function(resolve){
                    var decode = include_format_decoder(v);
                    init_directive(decode,false,true).then(function(c_code){
                        content = clearCode(c_code);
                        set_env_modules(decode);
                        code = code.replace(new RegExp("@include +"+preg_quote(v)+"( +)?;",""), content);
                        var res = {content: code};
                        resolve(res);
                    });
                });
            });
        }

    //@directive: alias
        function alias_directive(list,c_code){
            var content = '';
            // console.error('[Code]',file, '=>', list);
            foreach(list,function(v){
                var replace = true;
                if(/[a-z0-9_.]+\((.+?)?\)/i.test(v)){
                    content = mixin_directive(v);
                    if(content == v){
                        replace = false;
                    }
                }
                else{
                    var t = v.split(".");
                    content = alias;
                    foreach(t,function(j,i){
                        content = isset(content[j]) ? content[j] : '';
                    });
                    content = typeof content == 'object' ? collapse_modules([content]) : content;
                }
                v = preg_quote(v);
                if(replace){
                    c_code = c_code.replace(new RegExp("@use +"+v+"(?: +)?;","g"), content);
                }
            });
            return c_code;
        }

    //@directive: mixin
        function mixin_prototype_format(value){
            var name = "",
                save_arguments = false,
                brackets_opened = 0,
                quote = 0, simple_quote = 0,
                arguments = "",v;
            for(var i=0, j = value.length; i < j; i++){
                v = value[i];
                if(save_arguments && brackets_opened > 0){
                    arguments += v;
                }
                if(set(value[j-1], '') != '\\'){
                    if(v == '"' && simple_quote % 2 == 0){
                        quote++;
                    }
                    if(v == "'" && quote % 2 == 0){
                        simple_quote++;
                    }
                }
                if(quote % 2 == 0 && simple_quote % 2 == 0){
                    if(v == '('){
                        brackets_opened++;
                        save_arguments = true;
                    }
                    if(v == ')'){
                        brackets_opened--;
                        if(brackets_opened == 0){
                            save_arguments = false;
                            break;
                        }
                    }
                }
                if(/[a-z0-9_]/i.test(v) && !save_arguments){
                    name += v;
                }
            }
            if(arguments == ""){
                arguments = [];
            }
            else{
                arguments = arguments.replace(/\)$/, "");
                arguments = mixin_argument_format_decoder(arguments);
            }
            return [name, arguments];
        }

        function removeParenthese(value){
            value = value.replace(/^( +)?\(/, '');
            var r = '', parenthese = 0;
            foreach(value, function(i,j){
                if(set(value[j*1-1], '') != '\\'){
                    if(i == '('){parenthese++;}
                    if(i == ')'){parenthese--;}
                }
                if(parenthese >= 0){
                    r += i;
                }
            });
            return r;
        }

        function mixin_argument_format_decoder(value){
            var r = [],
                argument = "",
                quote_opened = 0,
                brackets1 = 0, brackets2 = 0,v,
                brackets_opened = 0;
            value = removeParenthese(value);
            for(var i=0, j = value.length; i < j; i++){
                v = value[i];
                if(v == '"' && set(value[i-1], '') != '\\'){
                    quote_opened++;
                }
                if(quote_opened % 2 == 0){
                    if(v == '('){
                        brackets_opened++;
                    }
                    if(v == ')'){
                        brackets_opened--;
                    }
                    if(v == '['){
                        brackets1++;
                    }
                    if(v == '{'){
                        brackets2++;
                    }
                    if(v == ']'){
                        brackets1--;
                    }
                    if(v == '}'){
                        brackets2--;
                    }
                }
                if((v == "," && quote_opened % 2 == 0 && 
                    brackets_opened == 0 && brackets1 == 0 && brackets2 == 0) || i == j - 1){
                    if(!empty(argument)){
                        argument += v;
                        argument = argument.replace(/^(?: +)?((?:")?(?:.+?)(?:")?)(?: +)?$/, "$1");
                        argument = argument.replace(/( +)?,$/, "");
                        // console.log('[arg..t]',argument);
                        if(/@use +(.+?)?/.test(argument)){
                            argument = adjustUseDirective(argument);
                        }
                        r.push(argument);
                        argument = "";
                        quote_opened = 0;
                    }
                }
                else{
                    argument += v;
                }
            }
            return r;
        }

        function transform_mixin_argument(list){
            var r = [];
            foreach(list, function(j,i){
                var last = j, directive = [];
                do{
                    if(/@use +(.+?);/.test(j)){
                        directive = getDirective(j);
                        foreach(directive.use, function(k){
                            directive_mask_count++;
                            var name = k.replace(/^(?: +)?([a-z0-9_.]+)(?:.+?)$/i, '$1'),
                                result_mixin = search_mixin(name);
                            // console.warn('[NAME]',name);
                            if(result_mixin == null){
                                throw new Error('[File : '+file+'] :: Mixin '+name+'(...) was not found ! ');
                            }
                            directive_mask_data[directive_mask_count] = result_mixin;
                            // console.warn('[NAME]',k)
                            j = j.replace(new RegExp("@use +"+preg_quote(k)+"(?: +)?;"), '{{'+directive_mask_count+'}}');
                            directive_mask[directive_mask_count] = transformDirective('@use '+k+';',false,false);
                        });
                    }
                    if(last == j)
                        break;
                }while(/@use +(.+?);/.test(j));
                r[i] = j;
            });
            return r;
        }

        function decodeAssertion(e){
            var limit = getDelimiter(e),
                declaration = e.replace(/^(?:<(.+?)>)?([\s\S]+)$/i, '$1'+limit+'$2').split(limit),
                final = ["", ""];
            declaration[0] = declaration[0].replace(/^( +)?|( +)?$/g, '')
            final[0] = declaration[0];
            if(declaration.length < 2){
                declaration[1] = "";
            }
            else{
                for(var i = 1, j = declaration.length; i < j; i++){
                    final[1] += declaration[i];
                }
                declaration = final;
            }
            if(!/^[a-z0-9_]+$/i.test(declaration[0]) || !/^[A-Z]/.test(declaration[0])){
                if(declaration[0].length > 0){
                    declaration[1] = e;
                    declaration[0] = "";
                }
            }
            return declaration;
        }

        function setValue(mixin_name, arg, base, final){
            var r = null,
                declaration = decodeAssertion(base);
            base = declaration[1];
            if(/^( +)?\$[a-z0-9_]+( +)?$/i.test(final))
                return final;
            function testType(type, val, name, args, var_type){
                var res,
                    var_type = inArray(var_type, ['primitive', 'array']) ? var_type : 'primitive';
                switch(type){
                    case 'String':
                        if(val.length > 0){
                            switch(var_type){
                                case 'primitive':
                                    if(!/^('(.+?)?'|"(.+?)")$/.test(val)){
                                        throw new Error("The parameter "+args+" of "+name+"(...) must be a string ! [ "+val+" ] is not a string.");
                                    }
                                break;
                                case 'array':
                                    if(!/^( +)?\[( +)?('(.+?)?'|"(.+?)")((( +)?,( +)?('(.+?)?'|"(.+?)"))+)?( +)?\]( +)?$/.test(val)){
                                        throw new Error("The parameter "+args+" of "+name+"(...) must be an array of string ! [ "+val+" ] is not an array of string.");
                                    }
                                break;
                            }
                            var old = var_type == 'array' ? false : val;
                            res = var_type == 'array' ? val : val.replace(/^(?: +)?('|")|('|")(?: +)?$/g, '');
                            if(old){
                            if(/^(?: +)?"(.+?)"(?: +)?$/.test(old)){
                                res = res.replace(/'/g, "\\'");
                            }
                            else{
                                res = res.replace(/'/g, '\\"');
                            }
                        }
                        }else{
                            res = val;
                        }
                        break;
                    case 'Any':
                        res = val;
                        if(/^(?: +)?"(.+?)"(?: +)?$/.test(res)){
                            res = res.replace(/'/g, "\\'");
                        }
                        if(/^(?: +)?'(.+?)'(?: +)?$/.test(res)){
                            res = res.replace(/'/g, '\\"');
                        }
                        break;
                    case 'Number':
                        if(val.length > 0){
                            switch(var_type){
                                case 'primitive':
                                    if(!/^( +)?[0-9]+(\.[0-9]+)?( +)?$/.test(val)){
                                        throw new Error("The parameter "+args+" of "+name+"(...) must be a strings ! [ "+val+" ] is not a strings.");
                                    }
                                    break;
                                case 'array':
                                    if(!/^( +)?\[( +)?[0-9]+(\.[0-9]+)?((( +)?,( +)?[0-9]+(\.[0-9]+)?)+)?( +)?\]( +)?$/.test(val)){
                                        throw new Error("The parameter "+args+" of "+name+"(...) must be an array of numbers ! [ "+val+" ] is not an array of numbers.");
                                    }
                                    break;
                            }
                            res = val;
                        }
                        else{
                            res = 0;
                        }
                        break;
                    case 'Boolean':
                        if(val.length > 0){
                            switch(var_type){
                            case 'primitive':
                                if(!/^( +)?(false|null|0|true|1)( +)?$/.test(val)){
                                    throw new Error("The parameter "+args+" of "+name+"(...) must be a boolean ! [ "+val+" ] is not a boolean.");
                                }
                                break;
                            case 'array':
                                if(!/^( +)?\[( +)?(false|null|0|true|1)((( +)?,( +)?(false|null|0|true|1))+)?( +)?\]( +)?$/.test(val)){
                                    throw new Error("The parameter "+args+" of "+name+"(...) must be an array of booleans ! [ "+val+" ] is not an array of booleans.");
                                }
                                break;
                        }
                        }
                        res = !/^(?: +)?(false|null|0|)(?: +)?$/.test(val);
                        break;
                    default:
                        if(!inArray(type, defined_types)){
                            throw new Error("Undefined type to cast argument "+args+" of "+name+"(...). The type ["+type+"] is not defined");
                        }else{
                            if(val.length > 0){
                                function check(index){
                                    // console.log('[Directive]',index,'=>',directive_mask_data)
                                    var mx = directive_mask_data[index.replace(/^(?: +)?{{([0-9]+)}}(?: +)?$/, '$1')];
                                    if(mx == null){
                                        throw new Error("Undefined Mixin given at parameter "+arg+" defined as default in mixin "+name+"(...)");
                                    }
                                    if(!inArray(type, mx.type.split(/(?:(?: +)?,(?: +)?)/))){
                                        // console.log('[MIXIN]',mx.name, '=>', mx.type)
                                        throw new Error("The parameter "+args+" of "+name+"(...) must be " +
                                        (var_type == 'array' ? "an array of "+type+" ! [ "+val+" ] is not an array of "+type+". " :
                                            "a "+type+". "
                                        )+
                                        "The mixin "+mx.name+"(...) is not a "+type);
                                    }
                                }
                                switch(var_type){
                                    case 'primitive':
                                        if(!/^( +)?{{[0-9]+}}( +)?$/.test(val)){
                                            throw new Error("The parameter "+args+" of "+name+"(...) must be a "+type+" ! [ "+val+" ] is not a "+type+".");
                                        }
                                        check(val);
                                        break;
                                    case 'array':
                                        if(!/^( +)?\[( +)?({{[0-9]+}}|\$[a-z_]+([a-z0-9_]+)?)((( +)?,( +)?({{[0-9]+}}|\$[a-z_]+([a-z0-9_]+)?))+)?( +)?\]( +)?$/i.test(val)){
                                            throw new Error("The parameter "+args+" of "+name+"(...) must be an array of "+type+" ! [ "+val+" ] is not an array of "+type+".");
                                        }
                                        var list = val.match(/{{[0-9]+}}|\$[a-z_]+([a-z0-9_]+)?/g);
                                        foreach(list, function(index){
                                            if(/{{[0-9]+}}/.test(index)){
                                                check(index);
                                            }
                                        });
                                    break;
                                }
                            }
                            res = val;
                        }
                        break;
                }
                return res;
            }
            function escapeQuote(e){
                var k = e.split(/(?:'(.+?)')|(?:"(.+?)")/),
                    v = '';
                for(var i in k){
                    if(k[i] != undefined){
                        v += (k[i].replace(/('|")/g, "\\$1"))+'"';
                    }
                }
                return v = v.replace(/"$/, '');
            }
            //if Array
            if(/^( +)?\[(.+?)?\]( +)?$/.test(base)){
                if(!/^( +)?(<Array>)?\[(.+?)\]( +)?$|^\$[a-z_]+/.test(final) && final != undefined && final != null && final != ""){
                    throw new Error("The parameter "+arg+" of "+mixin_name+"(...) must be an array ![ "+final+" ] is not an array.");
                }
                else{
                    if(declaration[0].length > 0){
                        r = testType(declaration[0], final, mixin_name, arg, 'array');
                    }
                    else{
                        r = final;
                    }
                    r = escapeQuote(r);
                }
            }
            //if JSON
            else if(/^( +)?{(.+?)}( +)?$/.test(base)){
                if(!/^( +)?{(.+?)}( +)?$/.test(final) && final != undefined && final != null && final != ""){
                    throw new Error("The parameter "+arg+" of "+mixin_name+"(...) must be a JSON ![ "+final+" ] is not a JSON.");
                }
                else{
                    r = final;
                }
                r = escapeQuote(r);
            }
            //OTHER
            else{
                final = /^( +|""|'')$/.test(final) ? "" : final;
                // console.log('[VAL]',final)
                if(declaration[0].length){
                    r = testType(declaration[0], final, mixin_name, arg);
                }
                else{
                    //if Number
                    if(/^( +)?[0-9]+(\.[0-9]+)?( +)?$/.test(base)){
                        r = testType('Number', final, mixin_name, arg);
                    }
                    //if Boolean
                    if(/^( +)?(true|false)( +)?$/.test(base)){
                        r = testType('Boolean', final, mixin_name, arg)
                    }
                    //Other
                    else {
                        if(/^(?: +)?"(.+?)"(?: +)?$/.test(final)){
                            final = final.replace(/'/g, "\\'");
                        }
                        if(/^(?: +)?'(.+?)'(?: +)?$/.test(final)){
                            final = final.replace(/"/g, '\\"');
                        }
                        r = final.replace(/^(?: +)?('|")|('|")(?: +)?$/g, '');
                    }
                }
            }
            // console.log('[Final]', final, '=>', r);
            return r+"";
        }

        function mixin_directive(prototype){
            var r = prototype;
            var c_mixin = search_mixin(r.replace(/(\((?:[\s\S]+)?\))$/i, ''));
            // console.log('[Mixin]', c_mixin);
            if(c_mixin != null){
                if(c_mixin.unused){
                    throw new Error("Error from trying unused mixin. mixin "+c_mixin.name+"(...) can't be used !");
                }
                r = mixin_prototype_format(r);
                // console.log('[R]',r);
                // console.log('[r]',c_mixin.name,'=>',c_mixin);
                var given_params = transform_mixin_argument(r[1]),
                    params = mixin_argument_format_decoder(c_mixin['params']);
                r = c_mixin['body'].replace(/^(?: +)?(.+?)(?: +)?$/g, '$1');
                var rp = [];
                if(!isset(c_mixin.params_alt)){
                    updateMixin(c_mixin);
                }
                // console.error('[NAME]', c_mixin.name, '=>', params);
                // console.log('[GIVEN]',given_params);
                var effective_params = {}, k = 0, total_arg = 0, sorted_params = {};
                foreach(given_params, function(i){
                    var p = mixin_argument_extractor(i,true),
                        simple = /^\$[a-z_]+([a-z0-9_]+)?$/i.test(i);
                    // console.log('[P]',p)
                    effective_params[p.length > 1 && !simple ? p[0] : k] = p.length > 1 && !simple ? p[1] : i;
                    k++;
                });

                foreach(params,function(v,k){
                    v =  mixin_argument_extractor(v,true);
                    var constant = /^@const/.test(v[0]),
                        unset = /^@unset/.test(v[0]);
                    if(constant || unset){
                        v[0] = v[0].replace(/^@(const|unset) +/, '');
                    }
                    // console.log('[V]',v);
                    v[1] = isset(c_mixin.params_alt[v[0]]) ? c_mixin.params_alt[v[0]] : set(v[1], "");
                    if(isset(effective_params[v[0]]) || isset(effective_params[k])){
                        if(constant){
                            throw new Error('Error from trying to modify a constant value. Argument name : [ '+v[0]+' ] of mixin '+c_mixin.name+'(...) is a constant.')
                        }
                        rp[v[0]] = setValue(c_mixin.name, v[0], v[1], effective_params[isset(effective_params[k]) ? k : v[0]]);
                    }
                    else{
                        if(unset){
                            throw new Error('Error ! The argument [ '+v[0]+' ] of mixin '+c_mixin.name+'(...) must be set.')
                        }
                        var cast = v[1].replace(/^<([a-zA-Z0-9_]+)>/, '$1');
                        if(inArray(cast, defined_types) || inArray(cast, ['String', 'Any', 'Number', 'Boolean'])){
                            v[1] = v[1].replace(/^<[a-zA-Z0-9_]+>/, '');
                        }
                        rp[v[0]] = decodeAssertion(v[1])[1];
                        var inQuote = /^(?: +)?('|")([\s\S]+)?('|")(?: +)?$/.test(rp[v[0]]);
                        rp[v[0]] = rp[v[0]].replace(/^(?: +)?('|")|('|")(?: +)?$/g, '');
                        if(inQuote){
                            rp[v[0]] = rp[v[0]].replace(/('|")/g, '\\$1');
                        }
                    }
                    if(constant){
                        sorted_params[v[0]] = rp[v[0]];
                    }
                    total_arg++;
                });
                foreach(rp, function(v,k){
                   if(!(k in sorted_params)) {
                       sorted_params[k] = v;
                   }
                });
                rp = sorted_params;
                foreach(effective_params, function(j,i){
                   if((!(i in rp) && !/^[0-9]+$/.test(i)) || (/^[0-9]+$/.test(i) && i*1 >= total_arg) ){
                       throw new Error(/^[0-9]+$/.test(i) ? "Number of parameters for "+c_mixin.name+"(...) exceed with "+i+" parameter"+(i>1 ? 's':'') : "params : "+i+" is undefined for mixin "+c_mixin.name+"(...)");
                   }
                });
                // console.log('[RP]',rp);
                // console.log('[R]',r);
                foreach(rp, function(v,k){
                    if(/^\[(.+?)?\]$/.test(v)){
                        v = removeComa(RegExp.$1);
                        // console.log(directive_mask_data);
                        // console.log('[NAME]',k,'=>', v,'\n\n', r,'\n\n')
                    }
                    if(/^<Array>\[(.+?)?\]$/.test(v)){
                        v = '['+RegExp.$1+']';
                    }
                    // v = v.replace(/("|')/g, '\\$1')//.replace(/\\\\("|')/g, '\\$1');
                    // r = r.replace(/(\$[a-z_]+(?:[a-z0-9_]+)?)(?: +)?:/ig, '$1:');
                    // console.log('[V]',v);
                    if(/@use /.test(r)){
                        r = transformDirective(r);
                    }
                    r = r.replace(new RegExp(preg_quote(k)+"([^a-zA-Z0-9_])", "g"), v+"$1");
                });
                // console.log('[r]',r);
                // console.error('[****]', c_mixin.name)
                // console.log(unmask(r));
                // console.error('[----]')
            }
            else{
                r = '';
            }
            return r;
        }

    //@Extras

        function exceptUseArray(list){
            var r = {}, u = {};
            foreach(list, function(j,i){
                if(i != 'use')
                    r[i] = j;
                else
                    u[i] = j; 
            });
            return {use : u, except: r};
        }

        function resolveIncludes(c_code){
            list = exceptUseArray(getDirective(c_code));
            if(len(list.except) == 0){
                return new Promise(function(e){
                    e({content: ""});
                })
            }
            return wait(list.except, function(v,k){
                return new Promise(function(res){
                    var response;
                    switch(k){
                        case 'import':
                            response = import_directive(v);
                        break;
                        case 'include':
                            response = include_directive(v);
                        break;
                        case 'from':
                            response = from_directive(v);
                        break;
                    }
                    response.then(function(e){
                        res(e);
                    });
                });
            });
        }

        function transformDirective(c_code, deleteComment, laxist){
            var occurence = 0,
            laxist = isset(laxist) ? laxist : false,
            deleteComment = isset(deleteComment) ? deleteComment : true,
            last_code = c_code;
            function t(){
                var list = exceptUseArray(getDirective(c_code));
                foreach(list.use,function(v,k){
                    if(k == 'use'){
                        // console.log('[V]',v[0]);
                        c_code = alias_directive(v,c_code);
                    }
                });
                if(c_code != last_code){
                    last_code = c_code;
                    occurence = 0;
                }
                else{
                    occurence++;
                }
                if(!laxist){
                    if(occurence > 2){
                        console.log('[CODE]',c_code);
                        throw new Error("Error while parsing the file due of one or more directive not completed white semicolon character : <;>");
                    }
                    if(/@use +(.+?);/.test(c_code)){
                        t();
                    }
                }
                if(!/@use +(.+?);/.test(c_code) && deleteComment){
                    c_code = c_code.replace(/#--( +)?module( +)?:(.+?):|#--( +)?end( +)?:/ig,"");
                }
            }
            t();
            return c_code;
        }

        function updateMixin(v){
            var params = mixin_argument_format_decoder(v.params.replace(/^(?:\()?|(.+?)(?:\))?$/, "$1"));
            if(!('params_alt' in v)){
                v.params_alt = {};
            }
            foreach(params, function(j){
                j = mixin_argument_extractor(j,true);
                if(/@use (.+?);/.test(j[1])){
                    var el = transformDirective(j[1], true);
                    v.params_alt[j[0].replace(/^@(const|unset)( +)?/, '')] = el;
                    foreach(getDirective(j[1]).use, function(i){
                        v.params = v.params.replace(new RegExp('@use +'+preg_quote(i),""), '');
                    });
                }
            });
            if(/@use (.+?);/.test(v.body)){
                v.body = transformDirective(v.body, true, true);
            }
        }

        function updateSelf(){
            if(have_to_resolve_mixin){
                resolve_mixins();
            }
            foreach(alias.self, function(v,k){
                var p = transformDirective(v);
                alias.self[k] = p;
            });
            var index = getIndex(mixin),
                list, k = 0, total = index.length;
                list = copy(index);
            foreach(list, function(k){
                // console.log('[K]',k, mixin);
                var v = mixin[k];
                // console.error('[V]',v);
                if(typeof v.params == 'string'){
                    updateMixin(v);
                }
                else{
                    index = remove(index, k);
                }
            });
        }

        function process(code){
            return new Promise(function(resolve){
                if(/@(import|from|include)(.+?);/.test(code)){
                    resolveIncludes(code).then(function(e){
                        code = e.content;
                        updateSelf();
                        resolve(code);
                    });
                }
                else{
                    updateSelf();
                    resolve(code);
                }
            });
        }

        function clearCode(e){
            return e.replace(/#--( +)?module( +)?:(.+?):(.+?)?#--( +)?end( +)?:/ig,"")
                    .replace(/@mixin(.+?)}/i, '');
        }

        function unmask(e){
            var k;
            do{
                k = e.match(/{{[0-9]+}}/g);
                foreach(k, function (i){
                    var j = i.replace(/{{([0-9]+)}}/, '$1');
                    e = e.replace(i, directive_mask[j]);
                });
            }while(/{{[0-9]+}}/.test(e));
            return e;
        }

        function setModules(e){
            var list = {};
            if(/\$(?:loop){(.+?)?}/.test(e)){
                list = loop_modules(e);
            }
            if(/<\$(?:comp(?:artiment)?)(.+?)?\$(?:comp(?:artiment)?)>/i.test(e)){
                foreach(comp_modules(e),function(v,k){
                    list[k] = v;
                })
            }
            if(/#--( +)?module( +)?:(.+?)?#--end( +)?:/i.test(e)){
                foreach(comment_modules(e),function(v,k){
                    list[k] = v;
                });
            }
            if(/@module( +)?(.+?)?{(.+?)?}/i.test(e)){
                foreach(canon_modules(e),function(v,k){
                    list[k] = v;
                });
            }
            if(/@(((private|public) +(unused)?|unused|private|public) +)?mixin +(.+?)?\((.+?)?\){(.+?)?}/.test(e)){
                foreach(mixin_modules(e),function(v,k){
                    var reg = new RegExp("@"+preg_quote(v.prefix)+" +"+preg_quote(v.name)+"( +)?"+preg_quote(v.params)+"( +)?{"+preg_quote(v.body)+"( +)?}", "i");
                    code = code.replace(reg, '');
                    mixin[k] = v;
                });
            }
            var modules = {};
            foreach(list,function(v,k){
                if(/^[a-z0-9_]+$/i.test(k)){
                    modules[k] = v;
                }
            });
            var s_code = code;
            code = code.replace(/#--( +)?module( +)?:(.+?):(.+?)?#--( +)?end( +)?:/ig,"");
            modules = clear_modules(modules);
            var mod = getModulePath();
            if(!(mod in modules_included)){
                modules_included[mod] = {modules: modules, mixin: mixin, content : s_code};
                set_env_modules(null,{modules: modules, mixin: mixin});
            }
            return {'modules': clear_modules(modules), 'mixin' : mixin};
        }

        function getAlias(){
            var r = {},
                as = alias;
            foreach(as.self, function(v,k){
                r[k] = v;
            });
            return r;
        }

        function mixinToExport(mx){
            var r = {};
            foreach(mx, function(v,k){
                if(typeof v.name != 'string' || v.visible == true){
                    r[k] = v;
                }
            });
            return r;
        }

        function getModules(clear){
            return new Promise(function(res){
                function t(){
                    if(!initialized){
                        setTimeout(t,100);
                        return; 
                    }
                    var p = getAlias();
                    if(file == entry_file){
                        entry_file = null;
                    }
                    res({modules: p, mixin: mixinToExport(mixin), code: code_source});
                }
                t();
            });
        }
        this.getModules = getModules;

        function setRoot(n_root){
            root = c_root;
            return this;
        }
        this.setRoot = setRoot;

        function setFile(filename, avoid){
            var avoid = Array.isArray(avoid) ? avoid : [];
            file = filename;
            if(entry_file == null){
                entry_file = file;
            }
            return new Promise(function(res){
                setCode(root+filename).then(function(e){
                    if(pkg){
                        initialized = true;
                        res(e);
                    }
                    else{
                        // console.log('[CODE]',code);
                        setModules(code);
                        process(code).then(function(e){
                            initialized = true;
                            var mod = getModulePath();
                            modules_included[mod].mixin = mixin;
                            res(code);
                        });
                    }
                });
            });
        }
        this.setFile = setFile;

        function get(filename, finalize, avoid){
            var preload = filename == null,
                finalize = typeof finalize == 'boolean' ? finalize : true;
            filename = filename == null && file != null ? file : filename;
            if(typeof filename != 'string')
                throw new Error("Invalid filename given");
            return new Promise(function(resolve){
                if(!preload){
                    setFile(filename, avoid).then(function(){
                        if(finalize){
                            code = unmask(transformDirective(code));
                        }
                        else{
                            code = unmask(code);
                        }
                        if(file == entry_file){
                            entry_file = null;
                        }
                        resolve(code);
                    });
                }
                else if(finalize){
                    function t(){
                        if(initialized){
                            code = unmask(transformDirective(clearCode(code)));
                            if(file == entry_file){
                                entry_file = null;
                            }
                            resolve(code);
                        }
                        else{
                            setTimeout(t,100);
                        }
                    }
                    t();
                }
            });
        }
        this.get = get;

        this.getCode = function(){
            return new Promise(function(res){
                function t(){
                    if(initialized){
                        res(code_source);
                    }
                    else{
                        setTimeout(t,100);
                    }
                }
                t();
            });
        }

        this.getAllModules = function(){
            return {
                types: defined_types,
                modules : modules_included,
                directive_mask : directive_mask,
                directive_mask_data : directive_mask_data,
                directive_mask_count : directive_mask_count
            };
        }

        this.setAllModules = function(e){
            e.types = 'types' in e ? e.types : [];
            e.modules = 'modules' in e ? e.modules : {};
            directive_mask = 'directive_mask' in e ? e.directive_mask : {};
            directive_mask_data = 'directive_mask_data' in e ? e.directive_mask_data : {};
            directive_mask_count = 'directive_mask_count' in e ? e.directive_mask_count : 0;
            defined_types = e.types;
            modules_included = e.modules;
        }
    }
})();
if(node_env){
    module.exports = LogicHtml_SRV;
}
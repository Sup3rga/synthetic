/*
* @author   : Superga
* @date     : Thursday, Febuary 25, 2021
* @logs     :
*       - Step 1    : 2021-02-25 12:22:01 : Begin implementation
* */

var node_env = typeof module == 'object' && 'exports' in module;
var Synthetic = (function(){

    var keyword_data = function(eos,arg,has,block,prev){
            var prev = prev == undefined ? [] : prev,
                arg = arg == undefined ? false : arg,
                block = block == undefined ? false : block,
                has = has == undefined ? false : has;
            return {
                EOS : eos,
                inside_brace : eos == '}',
                inside_parenthese : eos == ')',
                hasArgument: arg,
                hasBlock: block,
                previousStatement: prev,
                hasNextStatement : has
            }
        },
        //Definition des comportements des mots-clés
        keywords = {
            "var" : keyword_data(';'),
            "fn" : keyword_data('}',true, false, true),
            "loop" : keyword_data('}',true, false, true),
            "while" : keyword_data('}',true, false, true),
            "for" : keyword_data('}',true, false, true),
            "if" : keyword_data("}", true, true, true),
            "elif" : keyword_data("}", true, true, true,['if','elif']),
            "else" : keyword_data("}", false, true, true,['if','elif']),
            "try" : keyword_data("}", false, true),
            "catch" : keyword_data("}", true, false, true,['try']),
            "out" : keyword_data(")", true),
            "module" : keyword_data("}", false, false, true),
            "break" : keyword_data(";"),
            "return" : keyword_data(";")
        },
        pass_blank = function(endChar){
            var endChar = $js.set(endChar, ' '),
                s = $js.getSymbols(),
                last = '',
                blank = endChar == ' ';
            $js.countSymbols(s,code_source[cursor])
            while(! (cursor >= code_source.length - 1 ||
                    ([endChar, '\n','\t'].indexOf(code_source[cursor]) && blank) ||
                    (code_source[cursor] == endChar && $js.checkSymbols(s) && !blank ) ) ){
                cursor++;
                if(last != '\\'){
                    $js.countSymbols(s,code_source[cursor]);
                }
                last = code_source[cursor];
            }
        },
        //End Of Statements (fin de l'instruction) par defaut
        EOS = -1,
        strict = false,
        iteration = 0,
        predefined_fn_name = [
            'len','input','upper','lower',
            'split', 'sort', 'out','print', "concat",
            'match', 'replace'
        ],
        declared_fn = {},
        code_source = '',
        cursor = 0,
        global_variables = {},
        registred_modules = {};
    //Mechanics of Synthetic
    var
    Read = function(pointer){
        var pointer = $js.extend({
            hasString : false, //Si la lecture se fait en prenant compte des chaines
            hasBreak : false, //Si la lecture se fait en prenant compte de l'instruction @break (pour les boucles)
            hasReturn : false, //Si la lecture se fait en prenant compte de l'instruction @return
            endChar : EOS, //Caractère de fin de lecture
            level : 0, //Niveau du block de lecture
            parent: 0 //Le niveau de ligne de son block parent direct
        }, $js.set(pointer, {}));
        pointer.endChar = Array.isArray(pointer.endChar) ? pointer.endChar : [pointer.endChar];
        var code = '', //Code Compilé
        stop = false,
        begin = false,
        char = '',
        last_char = '',
        begin_point = 0,
        key = '',
        point = null,
        tt,
        last_key = '',
        last_reason = true, saveString = true,
        string = '', result = ',',
        save = true,
        s = $js.getSymbols(),
        endChar = pointer.endChar.indexOf(EOS) >= 0 && pointer.endChar.length == 1 ? code_source.length - 1 : pointer.endChar; //Definition de la caractère de fin de lecture
        // console.log('[BEGIN] at',cursor,'=>', endChar);
        // console.warn('[BEGIN]',cursor,'=>', $js.copyObject(pointer))
        do{
            char = code_source[cursor];
            char = char == '\n' ? '' : char;
            if(char == undefined){
                break;
            }
            if(begin){
                key += char;
            }
            if(last_char != '\\'){ //Si le caractère actuel n'a pas été échappé
                // console.log('[BEFORE]', pointer.level,'---',char, '=>', $js.copyObject(s))
                $js.countSymbols(s,char); //On compte les symboles
                // console.log('[AFTER]', pointer.level,'---',char, '=>', $js.copyObject(s))
                if(begin && key.length && !/[a-z_0-9]/i.test(char) && save){
                    key = key.substr(0,key.length - 1);
                    // console.warn('[Sym]',pointer.level,'--> ',key,'/',char,'=>',$js.copyObject(s));
                    if(key in keywords){
                        code += Check($js.extend({
                            string : string.replace(new RegExp('@'+$js.preg_quote(key)+'$', ''),'')
                        }, pointer));
                        string = '';
                        // console.warn({key,last_key,cursor,char, code: code_source.substr(cursor, 20)})
                        if(s.quote == 0 && s.simple_quote == 0){
                            if(keywords[key].hasArgument){
                                s.parenthese -= (char == '(' ? 1 : 0);
                            }
                            if(keywords[key].hasBlock && !keywords[key].hasArgument){
                                s.brace -= (char == '{' ? 1 : 0);
                            }
                        }
                        point = Point($js.extend(pointer,{
                            key : key,
                            start : begin_point,
                            last_key : last_key,
                            last_reason : last_reason
                        }));
                        if(key == 'break'){
                            if(pointer.hasBreak){
                                code += point.code;
                                save = false;
                            }else{
                                $js.printStackTrace("Error from declaration of @break statement out of unbreakable block. Check for <<..."+code_source.substr(cursor - 50 >= 0 ? cursor - 50 : 0, 50)+"...>>")
                            }
                        }
                        if(key == 'return' && !pointer.hasReturn){
                            $js.printStackTrace("Error from declaration of @return statement out of function. Check for <<..."+code_source.substr(cursor - 50 >= 0 ? cursor - 50 : 0, 50)+"...>>");
                        }
                        char = code_source[cursor];
                        // console.error('[Char]',pointer.level,'=>',char,$js.copyObject(s));
                        $js.countSymbols(s,char);
                        // console.log('[Copy]',$js.copyObject(s));
                        code += save ? point.code : '';
                    }
                    last_reason = point != null ? point.reason : true;
                    last_key = key;
                    key = '';
                    begin = false;
                }
                if(char == '@' && !begin && save){
                    begin_point = cursor;
                    begin = true;
                }
            }
            if(saveString && char != undefined){
                string += char;
            }
            tt = $js.checkSymbols(s);
            // console.log('[T]', char, '=>',pointer.level, tt,save, string, $js.copyObject(s))
            stop = typeof endChar == 'number' ? cursor >= endChar : endChar.indexOf(char) > -1 && tt;
            if((stop || char == undefined) && save){
                code += Check($js.extend({
                    string : string
                }, pointer));
            }
            last_char = char;
            cursor++;
        }while(!stop);
        return code;
    },
    Point = function(data){
        var code = '',
            res,
            reason = $js.set(data.last_reason, false),
            data = $js.extend({
                key : null,
                start : 0,
                level : 0
            }, $js.set(data,{})),
            last_key = data.last_key;
        data.last_key = '';
        switch(data.key){
            case "var":
                code = Var(data);
                break;
            case "out":
                code = Out(data);
                break;
            case "if":
            case "elif":
            case "else":
                if(keywords[data.key].previousStatement.length && !$js.inArray(last_key, keywords[data.key].previousStatement)){
                    $js.printStackTrace("Error from declare @"+data.key+" without @if or @elif. check for << ..."+code_source.substr(cursor - data.key.length - 1, 100)+"... >>")
                }
                if(($js.inArray(data.key, ['elif', 'else']) && !reason) || data.key == 'if'){
                    // console.log('[KEY]',data.key,'=>', reason, $js.copyObject(data));
                    res = Condition(data);
                    code = res.code;
                    reason = res.reason;
                }else{
                    code = '';
                    pass_blank('}');
                    cursor++;
                }
                break;
            case "fn":
                Fn(data);
                break;
            case "loop":
            case "for":
            case "while":
                code = Loop(data);
                break;
            case "break":
                code = "@"+data.key+';';
                break;
            case "return":
                var s = $js.getSymbols(), i,
                    save = true, c = $js.getCursorSupplement();
                code = '@'+data.key+'';
                do{
                    i = code_source[cursor];
                    i = i == '\n' ? '' : i;
                    if(i == undefined){
                        break;
                    }
                    if(c.last_char != '\\'){
                        $js.countSymbols(s,i);
                        c.stop = ($js.checkSymbols(s) && i == ';') || ($js.checkSymbols(s, ['brace']) && i == '}' && s.brace == -1)
                        if(c.stop && i == '}'){
                            cursor--;
                            i = ';';
                        }
                    }
                    if(save){
                        code += i;
                    }
                    c.last_char = i;
                    cursor++;
                }while(!c.stop);
                break;
            case "module":
                Module(data);
                break;
        }
        return {
            code : code,
            reason : reason
        };
    },
    Check = function(data){
        var code = '',
            data = $js.extend({
                string : null,
                hasString: false
            },data,{});
        // console.log('[DATA]',$js.copyObject(data))
        $js.foreach($js.extractCallables(data.string),function(i){
            data.string = data.string
                .replace(i, FnReader($js.extend(data,{
                    code : i
                })).code);
        });
        if(!data.hasString){
            data.string = data.string.replace(/(?: +)?(;|\)|}|,)(?: +)?$|^(?: +)?(;|\(|{|,)(?: +)?/g, '');
        }else if(/^\((.+?)\)$/.test(data.string)){
            data.string = RegExp.$1;
        }
        function saveCalculation(e){
            var begin = false,
                calcul = '', r = '',
                s = $js.getSymbols(),
                m = $js.getMarker();
            $js.foreach(e, function(i,j){
                if(!$js.isEscaped(e, j)){
                    if(begin){
                        $js.countSymbols(s,i);
                    }
                    if(i == '$' && !begin){
                        begin = true;
                        m.begin = parseInt(j);
                    }
                    if((i == ';' || j == e.length - 1) && $js.checkSymbols(s)){
                        calcul += $js.clearSpace(j == e.length - 1 && i != ';' ? i : '');
                        if($js.is.logic(calcul)){
                            r = Reason($js.extend(data,{
                                logic: calcul
                            }));
                            data.string = data.string.replace(calcul, r);
                        }
                        if($js.is.arithmetic(calcul)){
                            r = Arithmetic(data);
                            data.string = data.string.replace(calcul+(i == ';' ? ';' : ''), r);
                        }
                        calcul = '';
                        begin = false;
                        m = $js.getMarker();
                        s = $js.getSymbols();
                    }
                }
                if(begin){
                    calcul += i;
                }
            });
        }
        if($js.is.simpleIf(data.string)){
            data.string = Condition($js.extend(data,{
                ternary : data.string
            })).code;
        }
        if($js.is.arithmetic(data.string,true)){
            saveCalculation(data.string);
            if($js.is.arithmetic(data.string)){
                data.string = Arithmetic(data);
            }
        }
        if(!data.hasString && !/^( +)?$/.test(data.string.replace(/\n|\t|\r/g, '')) && data.string != undefined){
            $js.printStackTrace("Syntax error ! at "+cursor+". Check for << "+data.string+" >>")
        }else if(data.string != undefined){
            code = data.string;
            if(!/^( +)?$/.test(code)){
                // console.log('[CHECK]',code, $js.copyObject(data))
                code = VarReader($js.extend(data,{
                    code : code,
                    fromVar: true
                }));
                if($js.isJson(code) && typeof code == 'object'){
                    code = $js.protect($js.stringify(code));
                }
            }else{
                code = data.hasString ? code : '';
            }
        }

        return code;
    },
    Finalize = function(code,level,index,name,complexe){
        var start = code_source.indexOf(code), mask,
            complexe = $js.set(complexe,false),
            out_code = '',
            name = typeof name == 'string' ? name : null,
            cursor_index = cursor;
        function finalize(e,all){
            var all = $js.set(all,false);
            if($js.is.number(e)){
                e = parseFloat(e);
            }
            else if($js.is.boolean(e)){
                e = $js.toBoolean(e);
            }
            else if($js.is.array(e) && typeof e == 'string'){
                e = toArray(e);
            }
            else if($js.is.json(e) && typeof e == 'string'){
                e = toJson(e);
            }
            else if($js.is.variable(e)){
                e = VarReader({
                    code : e,
                    level : level,
                    parent : index
                });
            }
            else if($js.is.simpleIf(e)){
                e = Condition({
                    ternary: e,
                    level: level,
                    start: index
                }).code;
            }
            else if($js.is.computable(e) || $js.is.arithmetic(e)){
                e = Arithmetic({
                    string : e,
                    level : level,
                    parent: index
                });
            }
            else if($js.is.logic(e)){
                e = Reason({
                    logic : e,
                    level : level,
                    parent: index
                });
            }
            else if($js.is.fn(e,true)){
                new Fn({
                    code : e,
                    anonymous: name,
                    level: level,
                    parent: index
                });
                e = ''
            }
            else if($js.is.callable_fn(e)){
                var r = new FnReader({
                    code : e,
                    anonymous : name,
                    level: level,
                    parent: index
                });
                e = r.return_code;
                out_code = r.code;
            }
            return !all ? e : {code: out_code, return_code : e};
        }
        /*
        * @toArray()
        * */
        function toArray(e){
            var s = $js.getSymbols(),
                r = [], item = '',
                e = e.replace(/^\[|\]$/g, '');
            $js.foreach(e, function(i,j){
                if(!$js.isEscaped(e,j)){
                    $js.countSymbols(s,i);
                    if((i == ',' || j == e.length - 1) && $js.checkSymbols(s)){
                        if(j == e.length - 1){
                            item += i;
                        }
                        r.push(finalize($js.clearSpace(item.replace(/^,/, ''))));
                        item = '';
                    }
                }
                item += i;
            });
            return r;
        }
        /*
        * @toJson()
        * */
        function toJson(e){
            e = e.replace(/^\{|\}$/g, '');
            var s = $js.getSymbols(),
                saveItem = true,
                r = {}, item = '', value = '';
            $js.foreach(e, function(i,j){
                if(!$js.isEscaped(e,j)){
                    $js.countSymbols(s,i);
                    if($js.checkSymbols(s)){
                        if(i == ':'){
                            saveItem = false;
                        }
                        if((i == ',' || j == e.length - 1) && !saveItem){
                            saveItem = true;
                            if(j == e.length - 1){
                                value += i;
                            }
                            item = $js.clearSpace(item.replace(/^,/, ''));
                            value = $js.clearSpace(value.replace(/^:/, ''));
                            r[item] = finalize(value);
                            item = '';
                            value = '';
                        }
                    }
                }
                if(saveItem){
                    item += i;
                }else{
                    value += i;
                }
            });
            return r;
        }
        return finalize(code,complexe);
    },
    Var = function(data){
        var data = $js.extend({
            index : cursor,
            level : 0
        }, $js.set(data,{}));
        var code = '';
        /*
        * @decode :
        * */
        var saveName = true, saveValue = false,
            name = '',value = '', is_fn,
            s = $js.getSymbols(),
            stop = false,
            i = '',
            last_char = '';
        pass_blank();
        do{
            if(saveName && !saveValue && !name.length){
                pass_blank();
            }
            i = code_source[cursor];
            i = i == '\n' ? '' : i;
            if(!/[a-zA-Z0-9_]/i.test(i) && name.length){
                saveName = false;
            }
            if(saveValue){
                value += i;
                if(last_char != '\\'){
                    $js.countSymbols(s,i);
                }
            }
            if(!saveName && !saveValue && i != ' ' && i != '=' && name.length == 0){
                $js.printStackTrace("Error from declaration of variable in this field : << "+code+" >>");
            }
            if(i == '=' && !saveName){
                saveValue = true;
                cursor++;
                value = Read({
                    hasString: true,
                    endChar : [',', keywords.var.EOS]
                });
                value = value.replace(new RegExp('^=( +)?|('+keywords.var.EOS+"|,)$", "g"), '');
                is_fn = $js.is.fn(value,true);
                value = Finalize(value,data.level,data.start,name, true);
                cursor--;
                code = value.code;
                value = value.return_code;
                if(!is_fn){
                    if(data.level > 0){
                        global_variables[data.level][data.parent][name] = value;
                    }
                    else{
                        global_variables[name] = value;
                    }
                    name = ''; value = '';
                    saveValue = false;
                    saveName = true;
                    s = $js.getSymbols();
                }
                i = code_source[cursor];
                stop = i == keywords.var.EOS;
            }
            if(saveName && i != ','){
                name += i;
            }
            last_char = i;
            cursor++;
        }while(!stop);
        // cursor--;
        return code;
    },
    VarReader = function(data){
        var begin = false,
            data = $js.extend({
                code : '',
                fromVar: false,
                update : null
            },data),
            save = false,
            decoded = '',
            parent = data.parent,
            terminaison = ['length','toUpper', 'toLower'],
            code = data.code,variable = '',
            s = $js.getSymbols();
        // console.log('[DATA]',$js.copyObject(data), '=>', $js.copyObject(global_variables))
        /*
        * __foreach__ : reach for variable
        * */
        $js.foreach(data.code, function(i,j){
            j = parseInt(j);
            save = begin;
            if(!$js.isEscaped(code, j)){
                if(begin){
                    $js.countSymbols(s, i);
                }
                if(i == '$' && !begin){
                    begin = true;
                }
            }
            if(save){
                variable += i;
            }
            if(begin && variable.length){
                if(
                    (
                        !$js.is.variable('$'+variable) &&
                        ($js.checkSymbols(s) || s.bracket == -1 ||
                            (s.simple_quote && i == "'") ||
                            (s.quote && i == '"')
                        )
                    ) ||
                    j == data.code.length - 1
                ){
                    //On procède au enregistrement
                    if(
                        ( !/\.(to(Upper|Lower)Case(?: +)?\((?:.+?)?\)|split(?: +)?\((.+?)?\)|match(?: +)?\((.+?)?\))$/.test(variable)
                        &&
                        !/[a-z0-9_\]]$/i.test(variable) )
                        ||
                        s.bracket == -1
                    ){
                        variable = variable.substr(0,variable.length-1);
                    }
                    while(!$js.is.variable('$'+variable) && variable.length){
                        variable = variable.substr(0,variable.length-1);
                    }
                    if(!/^( +)?$/.test(variable)){
                        convert(variable);
                    }
                    begin = false;
                    variable = '';
                    s = $js.getSymbols();
                }
            }
        });

        /*
        * @replaceSuite()
        * */
        function replaceSuite(v,i,g,e){
            var stop = false,
                r = $js.copyObject(g);
            $js.foreach(v, function(j,k){
                j = $js.clearSpace(j);
                if($js.isJson(r) && j in r){
                    r = r[j];
                    if(k == v.length - 1){
                        if(typeof r == 'string'){
                            r = $js.protect(r);
                        }
                        stop = true;
                        return false;
                    }
                }else if($js.inArray(j, terminaison)){
                    r = $js.setCombinaison(j, r);
                }else if(/^(to(?:Upper|Lower))Case(?: +)?\((.+?)?\)$/.test(j)){
                    r = $js.setCombinaison(RegExp.$1, r, null);
                }else if(/^(split)(?: +)?\((.+?)?\)$/.test(j)){
                    r = $js.setCombinaison(RegExp.$1, r, RegExp.$2);
                }else if(/^(match)(?: +)?\((.+?)?\)$/.test(j)){
                    r = $js.setCombinaison(RegExp.$1, r, RegExp.$2);
                }else if(i == 0){
                    console.log('[REPLACE]',$js.copyObject(data), $js.copyObject(global_variables))
                    $js.printStackTrace("Undefined variable "+e+" used inside "+data.code,{
                        begin : data.start,
                        end : data.start + 100
                    },code_source.substr(data.start, code_source.length > data.start + 100 ? 100 : code_source.length - data.start));
                }
            });
            return {
                r : r,
                global : g,
                stop: stop
            };
        }
        function update(path,g,new_value,n){
            $js.foreach(g,function(i,j){
                if(j == path[n]){
                    if($js.isJson(i) && n < path.length - 1){
                        g[j] = update(path,i,new_value,n+1);
                    }else{
                        g[j] = new_value;
                    }
                }
            });
            return g;
        }
        /*
        * @replace :
        * */
        function replace(e){
            var v = e.split('.'), result = null, next_target = null, r,index,
                hasKeyword = /super|upper/.test(v[0]),
                hasSuper = v[0] == 'super',
                level = hasSuper ? 0 : data.level;
            if(hasKeyword){
                if(!hasSuper){
                    next_target = data.parent;
                    do{
                        if(next_target in global_variables[level]){
                            next_target = global_variables[level][data.parent]['-1'];
                        }
                        level--;
                        v.shift();
                    }while(level > 0 && v[0] == 'upper');
                }else{
                    v.shift();
                }
            }
            if(!hasSuper && hasKeyword && level > 0){

            }
            for(var i = level; i >= 0; i--){
                if(i == 0){
                    result = replaceSuite(v,i,global_variables,e);
                    if(data.update != undefined && result.stop){
                        global_variables = update(v,global_variables,data.update,0);
                    }
                    r = result.r;
                    break;
                }else{
                    if(i in global_variables){
                        index = next_target == null ? data.parent : next_target;
                        if (v[0] in $js.set(global_variables[i][data.parent], {}) || (next_target != null && v[0] in $js.set(global_variables[i][next_target], {}))) {
                            result = replaceSuite(v, i, global_variables[i][index], e);
                            r = result.r;
                            if (data.update != undefined && result.stop) {
                                global_variables[i][index] = update(v,global_variables[i][index],data.update,0);
                            }
                            if (result.stop) {
                                break;
                            }
                        } else if (index in global_variables[i]) {
                            next_target = global_variables[i][index]['-1'];
                        }
                    }
                }
            }
            return r;
        }
        /*
        * @decodeVar()
        * */
        function decodeVar(e){
            var variable = '',
                annotation = '',
                saveAnnotation = false,
                vs = $js.getSymbols();
            $js.foreach(e, function(i){
                $js.countSymbols(vs);
                if(i == '[' && $js.checkSymbols(vs, ['bracket']) && !saveAnnotation){
                    saveAnnotation = true;
                }
                if(saveAnnotation){
                    annotation += i;
                }else{
                    variable += i;
                }
                if(i == ']' && $js.checkSymbols() && saveAnnotation){
                    saveAnnotation = false;
                    annotation = annotation.replace(/^\[|\]$/g, '');
                    annotation = Finalize(annotation, data.level, data.start);
                    if(/^(?: +)?("(?:.+?)"|'(?:.+?)'|(?:.+?))(?: +)?$/.test(annotation)){
                        variable += "."+((RegExp.$1).replace(/^("|')|("|')$/g, ''))
                    }else{
                        variable += annotation;
                    }
                }
            });
            decoded = variable;
            return variable;
        }
        /*
        * @convert :
        * */
        function convert(e){
            var result = replace(decodeVar(e));
            if(typeof result == 'function'){
                result = result();
            }
            if(!data.fromVar && typeof result == 'object' && result != undefined && result != null){
                result = $js.stringify(result);
            }
            if(($js.inArray(typeof result, ['string','number']) || result == null) ){
                code = code.toString().replace('$'+e, result);
                code = Finalize(code, data.level, data.parent);
            }else{
                code = data.fromVar ? result : code.toString().replace('$'+e, result);
            }
        }
        return code;
    },
    Out = function(data){
        pass_blank();
        data.hasString = true;
        data.endChar = ')';
        data.level++;
        var before = cursor;
        $js.addLevelVariable(global_variables,data.level,data.start,data.parent);
        data.parent = data.start;
        var result = Read(data).replace(/^\(|\)$/g, '');
        // console.log('[CURSOR]',cursor,'=>',code_source[cursor])
        while($js.is.simpleIf(result)){
            result = Condition($js.extend(data,{
                ternary : result
            })).code;
        }
        return result;
    },
    Reason = function(data){
        var data = $js.extend({
            logic : null
        },data);
        var operands = $js.logicSplit(data.logic,
            /^((<|>|=|!)=|&&|\|\|)$/,
            /[<>]/,
            /^((<|>|=|!)=|&&|\|\||<|>)$/
        ), result = true;
        // console.log('[logic]',data.logic, '=>', operands);
        function resolve(a, b, o){
            var r = false;
            switch(o){
                case "==":
                    r = a == b;
                    break;
                case "!=":
                    r = a != b;
                    break;
                case ">":
                    r = a > b;
                    break;
                case ">=":
                    r = a >= b;
                    break;
                case "<=":
                    r = a <= b;
                    break;
                case "<":
                    r = a < b;
                    break;
                case "&&":
                    r = a && b;
                    break;
                case "||":
                    r = a || b;
                    break;
            }
            return r;
        }
        function executeWith(reg){
            var prev, next, res = [];
            $js.foreach(operands, function(i,j){
                if(reg.test(i)){
                    var t = [operands[j*1-1],operands[j*1+1]],
                        neg = false;
                    for(var k in t){
                        neg = /^!/.test(t[k]);
                        t[k] = t[k].toString().replace(/^!/, '').replace(/^(?: +)?\(|\)(?: +)?$/g, '');
                        t[k] = Finalize(t[k],data.level, data.start);
                        if(neg){
                            t[k] = !$js.toBoolean(t[k]);
                        }
                    }
                    prev = t[0]; next = t[1];
                    operands[j*1+1] = resolve(prev,next,i);
                    operands[j] = '';
                    operands[j*1-1] = '';
                }
            });
            $js.foreach(operands, function(i){
                if(i !== ''){
                    res.push(i);
                }
            });
            operands = res;
        }
        function execute(){
            executeWith(/^(<|>)(=)?|((!|=)=)$/);
            executeWith(/^&&|\|\|$/);
            result = operands[0];
        }
        if(operands.length == 1){
            result = Finalize(operands[0],data.level,data.start);
        }else{
            execute();
        }
        return result == undefined ? false : $js.toBoolean(result);
    },
    Arithmetic = function(data){
        var code = replaceCombination(data.string);
        var operands = $js.logicSplit( code,
            /^((\+|\-|\*|\/)=|\+\+|\-\-)$/,
            /[+/*=-]/,
            /^((\+|\-|\*|\/)=|\+\+|\-\-|[+/*-]|=)$/
        ), result = 0, res = [], prev, next, with_update = false;
        executeWith(/^(\*|\/)$/);
        executeWith(/^(\+|\-)$/);
        executeWith(/^((\+|\-|\*|\/)=?|\+\+|\-\-|=)$/,true);
        result = operands[operands.length - 1];
        function updateVariable(variable, value){
            with_update = true;
            VarReader($js.extend(data,{
                code : variable,
                update : value
            }));
        }
        function executeWith(reg, update){
            var update = $js.set(update, false),
                variable = '';
            $js.foreach(operands, function(i,j){
                if(reg.test(i)){
                    j = j*1;
                    if(update){
                        variable = operands[j-1];
                    }
                    operands[j+1] = separate(i,j);
                    if(update){
                        if($js.is.variable(variable)){
                            updateVariable(variable, operands[j+1]);
                        }else{
                            $js.printStackTrace("Error Syntax : << "+code+" >>");
                        }
                    }
                    operands[j] = '';
                    operands[j-1] = '';
                }
            });
            clear();
        }
        function clear(){
            res = [];
            $js.foreach(operands, function(i){
                if(i !== ''){
                    res.push(i);
                }
            });
            operands = res;
        }
        function replaceCombination(e){
            var s = $js.getSymbols(),
                ignore = false, k = 0,
                r = '';
            $js.foreach(e, function(i,j){
                j = j*1;
                if(!$js.isEscaped(e,j)){
                    $js.countSymbols(s,i);
                    if($js.inArray(i+($js.set(e[j+1], '') == i ? i : ''), ['++','--']) && $js.checkSymbols(s)){
                        ignore = true;
                        k = 0
                        r += i+'= 1';
                    }
                }
                if(!ignore){
                    r += i;
                }else{
                    if(k > 1){
                        ignore = false;
                    }
                    k++;
                }
            });
            return r;
        }
        function separate(i,j){
            prev = operands[j*1-1];
            next = operands[j*1+1];
            if(prev == undefined || next == undefined){
                $js.printStackTrace("Logic error while parsing : "+code);
            }
            var t = [prev,next];
            for(var k in t){
                t[k] = Finalize($js.removeParentheses(t[k]), data.level, data.parent);
            }
            prev = t[0]; next = t[1];
            return calculate(prev,next,i);
        }
        function calculate(a,b,s){
            var r = 0;
            switch(s){
                case '+':
                    r = a + b;
                    break;
                case '-':
                    r = a - b;
                    break;
                case '*':
                    r = a * b;
                    break;
                case '/':
                    r = a / b;
                    break;
                case '+=':
                    r = a += b;
                    break;
                case '-=':
                    r = a -= b;
                    break;
                case '/=':
                    r = a /= b;
                    break;
                case '*=':
                    r = a *= b;
                    break;
                case '--':
                    r = --a;
                    break;
                case '++':
                    r = ++a;
                    break;
                case '=':
                    r = b;
                    break;
            }
            return r;
        }
        return with_update ? '' : result;
    },
    Condition = function(data){
        var data = $js.extend({
            ternary: null,
            last_reason : true
        },data),
        simplified = data.ternary != null,
        string = data.ternary,
        code = '',
        reason = data.last_reason;
        delete data.ternary;
        if(!simplified){
            var saveArg = data.key != 'else',
                saveStatement = !saveArg,
                c = $js.getCursorSupplement(),
                s = $js.getSymbols(),
                arg = '',statement = '';
            if(!saveArg){
                reason = !reason;
            }
            do{
                c.char = code_source[cursor];
                c.char = c.char == '\n' ? '' : c.char;
                if(saveArg){
                    arg = Read({
                        hasString : true,
                        endChar : ')',
                        parent : data.parent,
                        start : data.start
                    });
                    c.char = code_source[cursor];
                    reason = Reason($js.extend(data,{
                        logic : arg.replace(/^( +)?\(|\)( +)?$/g, ''),
                        start: data.parent
                    }));
                    saveStatement = true;
                    saveArg = false;
                }
                if(saveStatement){
                    if(reason){
                        data.hasString = false;
                        data.endChar = '}';
                        data.level++;
                        $js.addLevelVariable(global_variables,data.level,data.start,data.parent);
                        data.parent = data.start;
                        code = Read(data).replace(/^( +)?\{|\}( +)?$/g, '');
                        break;
                    }else{
                        pass_blank('}');
                        cursor++;
                        break;
                    }
                }
                c.last_char = c.char;
                cursor++;
            }while(!c.stop);
        }else{
            code = string;
            var condition = '',
                part = ['_', '_'], nbr_ask = 0,
                savePart = false, saveIf = true,
                s = $js.getSymbols();
            $js.foreach(code, function(i,j){
                if(!$js.isEscaped(code, j)){
                    $js.countSymbols(s,i);
                    if($js.checkSymbols(s)){
                        if(i == '?'){
                            nbr_ask++;
                            if(!savePart){
                                savePart = true;
                            }
                        }
                        if(i == ':'){
                            nbr_ask--;
                            if(savePart && saveIf && nbr_ask == 0){
                                saveIf = false;
                            }
                        }
                    }
                }
                if(!savePart){
                    condition += i;
                }else{
                    if(saveIf){
                        part[0] += i;
                    }else{
                        part[1] += i;
                    }
                }
            });
            part[0] = $js.clearSpace(part[0].replace(/^(?: +)?_\??/g, ''));
            part[1] = $js.clearSpace(part[1].replace(/^(?: +)?_:?/g, ''));
            condition = $js.clearSpace(condition);
            code = Reason($js.extend(data,{logic: condition})) ? part[0] : part[1];
            code = Finalize(code, data.level, data.start);
        }
        return {
            code : code,
            reason : reason
        }
    },
    Fn = function(data){
        var data = $js.extend({
            anonymous: null
        },data),
        name = data.anonymous == null ? '' : data.anonymous,
        params = '', body = '', code = '',
        saveName = data.anonymous == null, start = data.start == undefined ? 0 : data.parent,
        saveParams = !saveName, fn,
        c = $js.getCursorSupplement(),i,
        s = $js.getSymbols();
        if(data.anonymous == null){
            //Decode structure en nom, arguments, et corps de fonction
            do{
                i = code_source[cursor];
                i = i == '\n' ? '' : i;
                if(c.last_char != '\\'){
                    $js.countSymbols(s,i);
                    if(i == '(' && saveName && $js.checkSymbols(s, ['parenthese']) && s.parenthese == 1){
                        saveParams = true;
                        saveName = false;
                    }
                    if(i == '{' && saveParams && $js.checkSymbols(s, ['brace']) && s.brace == 1){
                        saveParams = false;
                        saveName = false;
                        start = cursor;
                    }
                    c.stop = i == '}' && !saveParams && !saveName && $js.checkSymbols(s);
                }
                if(saveName){
                    name += i;
                }
                if(saveParams){
                    params += i;
                }
                if(!saveParams && !saveName){
                    body += i;
                }
                c.last_char = i;
                code += i;
                cursor++;
            }while(!c.stop);
        }else{
            var struct = $js.decodeFn(data.code, data.anonymous, false);
            name = struct.name; params = struct.params; body = struct.body;
            start = code_source.indexOf(body);
        }
        name = $js.clearSpace(name);
        body = $js.clearSpace(body.replace(/^{|}$/g, ''));
        params = $js.clearSpace(params.replace(/^(?: +)?\(|\)(?: +)?$/g, ''));
        var args = $js.decodeFnArg(params, false);
        fn = {
            name : name,
            args : args,
            params : params,
            start : start,
            body : body,
            parent : data.parent,
            level: data.level + (data.anonymous == null ? 1 : 0),
            code : code
        };
        $js.addLevelVariable(declared_fn, data.level + 1, start, data.parent);
        if(data.level == 0){
            declared_fn[name] = fn;
        }else{
            declared_fn[data.level + 1][start][name] = fn;
        }
    },
    Loop = function(data){
        var arg = '', saveArg = true,
            s = $js.getSymbols(),i,
            code = '', start = 0, arg_xy = {x: 0, y: 0},
            level = data.level + 1,
            index = data.start,
            c = $js.getCursorSupplement();
        $js.addLevelVariable(global_variables, level, index, data.parent);
        do{
            i = code_source[cursor];
            i = i == '\n' ? '' : i;
            if(saveArg){
                arg_xy.x = cursor;
                arg = Read({
                    endChar: ')',
                    hasString: true,
                    level: data.level,
                    parent : data.parent,
                    start: index
                });
                arg_xy.y = cursor-1;
                break;
            }
            c.last_char = i;
            cursor++;
        }while(!c.stop);
        arg = data.key == 'while' ? code_source.substr(arg_xy.x, arg_xy.y - arg_xy.x).replace(/{( +)?/, '') : arg;
        start = cursor;
        function getRegExp(){
            var variable = "\\$[a-zA-Z_]+(?:[a-zA-Z0-9_]+)?",
                number = "[0-9]+",
                fn = "@[a-z$_]+(?:[a-z0-9_$.]+)?\\((?:[\\s\\S]+)?\\)",
                complex_var = "(?:"+variable+"|"+number+")(?:(?:(?: +)?(?:\\-|\\+|\\*|\\/)(?: +)?(?:"+variable+"|"+number+"))+)?",
                duo = "("+complex_var+"|"+number+"|"+fn+")";
            return {
                forin : new RegExp("^"+variable+"(?:(?: +)?,(?: +)?"+variable+")? +in +(.+?)$", ""),
                forfrom : new RegExp("^("+variable+") +from +"+duo+" +to +"+duo+"$", "")
            };
        }
        function testArg(arg){
            if(!($js.isJson(arg) || typeof arg == 'string')){
                $js.printStackTrace("Error from non iterable data given at @"+data.key+" argument. check for << "+code+" >>");
            }
        }
        function pass(){
            pass_blank('}');
            cursor++;
        }
        function checkIfhasBreak(e){
            var r = false,
                key = '',
                begin = false,
                c = '';//Code
            s = $js.getSymbols();
            $js.foreach(e,function(i,j){
                if(!/^[a-z]$/.test(i) && begin){
                   begin = false;
                   if(key == 'break'){
                       r = true;
                       c = c.replace(/@break$/, '');
                       return false;
                   }
                   key = '';
                }
                if(begin){
                    key += i;
                }
               if(!$js.isEscaped(e,j)){
                   if(i == '@' && !begin){
                       begin = true;
                   }
               }
               c += i;
            });
            return {
                has : r,
                code : c
            };
        }
        function finalize(){
            data.level = level;
            data.parent = data.start;
            data.endChar = '}';
            data.hasString = false;
            data.hasBreak = true;
            cursor = start;
            // console.log('[FIN]',$js.copyObject(data))
            var compilation = Read(data),
                stop = false,
                c;
            if(/@/.test(compilation)){
                c = checkIfhasBreak(compilation);
                compilation = c.code;
                stop = c.has;
            }
            code += compilation;
            return stop;
            // console.log('[CODE]',code, $js.copyObject(global_variables));
        }
        function decodeLoop(){
            var total = 0, ran = false;
            arg = $js.is.variable(arg) ? VarReader({
                code : arg,
                level : data.level,
                parent : data.parent,
                fromVar: true
            }): Finalize(arg,data.level,data.parent);
            testArg(arg);
            $js.foreach(arg, function(i,j){
                global_variables[level][index].i = typeof i == 'string' ? $js.removeQuote(i) : i;
                if($js.isJson(i)){
                    global_variables[level][index] = $js.extend(global_variables[level][index],i);
                }
                ran = true;
                global_variables[level][index].j = $js.removeQuote($js.is.interger(j) ? parseInt(j) : j);
                global_variables[level][index].k = total;
                total++;
                return !finalize();
            });
            if(!ran){
                pass();
            }
        }
        function decodeForIn(){
            var args = arg.replace(/^(\$[a-zA-Z_]+(?:[a-zA-Z0-9_]+)?(?:(?: +)?,(?: +)?\$[a-zA-Z_]+(?:[a-zA-Z0-9_]+)?)?) +in +(.+?)$/, '$1 __ $2').split(' __ '),
                obj = $js.is.variable(args[1]) ?VarReader({
                    code : args[1],
                    level : data.level,
                    parent : data.parent,
                    fromVar: true
                }) : Finalize(args[1], data.level, data.parent),
                vars = args[0].split(/(?: +)?,(?: +)?/), ran = false,
                variable_1 = vars[0].replace(/^\$/, ''),
                variable_2 = $js.set(vars[1], '').replace(/^\$/, '');
            testArg(obj);
            $js.foreach(obj, function(i,j){
                ran = true;
                global_variables[level][index][variable_1] = $js.removeQuote(variable_2.length ? j : i);
                if(variable_2.length){
                    global_variables[level][index][variable_2] = $js.removeQuote(i);
                }
                return !finalize();
            });
            if(!ran){
                pass();
            }
        }
        function decodeForFrom(){
            var regexp = getRegExp(), ran = false,
                args = arg.replace(regexp.forfrom, '$1 __ $2 __ $3').split(' __ '),
                variable = args[0].replace(/^\$/, '');
            for(var i = 1; i < args.length; i++){
                args[i] = Finalize(args[i],data.level,data.parent);
                if(! ( $js.is.interger(args[i]) || $js.is.variable(args[i]) ) ){
                    $js.printStackTrace("Data Error ! Argument >> "+(i == 1 ? "? from" : "from ?")+" << must be a integer. check for << "+code+" >>");
                }
            }
            args = $js.rangeOfInt(args[1],args[2]);
            $js.foreach(args, function(i){
                global_variables[level][index][variable] = $js.removeQuote(i);
                ran = true;
                return !finalize();
            });
            if(!ran){
                pass();
            }
        }
        function chooseFor(){
            var found = false,
                regexp = getRegExp();
            if(regexp.forin.test(arg)){
                found = true;
                decodeForIn();
            }
            if(regexp.forfrom.test(arg)){
                found = true;
                decodeForFrom();
            }
            if(!found){
                $js.printStackTrace("Syntax Error. check for : << "+code+" >>")
            }
        }
        function decodeWhile(){
            var ran = false;
            while(Reason($js.extend(data,{
                logic : arg,
                start : data.parent
            }))){
                ran = true;
                if(finalize()){
                    break;
                }
            }
            if(!ran){
                pass();
            }
        }
        arg = arg.replace(/^( +)?\(|\)( +)?$/g, '');
        switch (data.key){
            case "loop":
                decodeLoop();
                break;
            case "for":
                chooseFor();
                break;
            case "while":
                decodeWhile();
                break;
        }
        // console.log('[CURSOR]',cursor, '=>',code_source[cursor])
        // cursor++;
        return code;
    },
    NativeFn = function(name, arg, code,data){
        var result = '',
            built = [];
        $js.foreach(arg, function(i){
            built.push(i.value);
        });
        var fns = {
            len : function(){
                result = $js.len(built[0]);
            },
            upper: function(){
                result = built[0].toString().toUpperCase();
            },
            lower: function(){
                result = built[0].toString().toLowerCase();
            },
            split : function(){
                if(built[1] == undefined){
                    built.push('');
                }
                result = $js.setCombinaison('split', built[0], built[1]);
            },
            sort : function(){
                if(!Array.isArray(built[0])){
                    $js.printStackTrace("Cannot sort << "+built[0]+" >> check for : << "+code+" >>");
                }
                result = built[0].sort();
            },
            out: function(){
                result = '';
            },
            print: function(){
                $js.foreach(built, function(i){
                    i = $js.isJson(i) && typeof i == 'object' ? $js.stringify(i) : i;
                    result += $js.removeQuote(i);
                });
            },
            concat: function(){
                $js.foreach(built, function(i){
                    i = $js.isJson(i) && typeof i == 'object' ? $js.stringify(i) : i;
                    result += $js.removeQuote(i);
                });
            },
            replace: function(){
                var search = built[0],
                    needle = built[1],
                    string = built[2],
                    byregexp = /^(?: +)?\/(.+?)?\/([a-z]+)?(?: +)?$/i.test(search),
                    quantifier = '', regexp = '';
                if(byregexp){
                    regexp = RegExp.$1;
                    quantifier = RegExp.$2;
                    search = new RegExp(regexp,quantifier);
                }
                if(/^(?: +)?'(.+?)?'(?: +)?$/.test(needle)){
                    needle = RegExp.$1;
                }
                if(/^(?: +)?"(.+?)?"(?: +)?$/.test(needle)){
                    needle = RegExp.$1;
                }
                result = string.toString().replace(search, needle);
            },
            match: function(){
                var search = built[0],
                    string = built[1],
                    quantifier = '', regexp = '';
                if(/^(?: +)?\/(.+?)?\/([a-z]+)?(?: +)?$/i.test(search)){
                    regexp = RegExp.$1;
                    quantifier = RegExp.$2;
                    search = new RegExp(regexp,quantifier);
                }else{
                    throw new Error(search+' is not a regular expression !');
                }
                result = search.test(string);
            }
        }
        fns[name]();
        this.get = function(){
            return result;
        }
    },
    FnReader = function(data){
        var code = data.code.replace(/^@|;?$/g, ''),
            fn = {}, isNativeCode = true, exist = true,
            struct = null,
            code_final = '',
            return_code = '',
            name = code.replace(/^([a-zA-Z_$]+([a-zA-Z0-9_$.]+)?)(?:.+?)$/, '$1'),
            arg = $js.decodeFnArg(code.replace(name,'').replace(/^(?: +)?\(|\)(?: +)?$/g, '')),
            splitted_name = name.split('.');
        $js.foreach(arg, function(i,j){
            var isFn = $js.is.fn(i.value, true),
                check = !(isFn && !/^\$/.test(j));
            arg[j].value = i.value.length && check ? Finalize(i.value, data.level, data.parent) : i.value;
            if(isFn && /^\$/.test(j)){
                arg[j].value = '';
            }
        });
        if($js.inArray(name, predefined_fn_name)){
            return_code = new NativeFn(name, arg, code, data).get();
            if(!('anonymous' in data)){
                code_final = return_code;
            }
        }
        else{
            /*
              * @finderSuite()
              * */
            function finderSuite(v,i,r){
                var stop = false;
                $js.foreach(v, function(j,k){
                    j = $js.clearSpace(j);
                    if($js.isJson(r) && j in r){
                        r = r[j];
                        if(k == v.length - 1){
                            if(typeof r == 'string'){
                                r = $js.protect(r);
                            }
                            stop = true;
                            return false;
                        }
                    }else if(i == 0){
                        r = null;
                    }
                });
                return {
                    r : r,
                    stop: stop
                };
            }
            /*
            * @finder :
            * */
            function finder(e){
                var v = e.split('.'), result = null, next_target = null, r,index;
                for(var i = data.level; i >= 0; i--){
                    if(i == 0){
                        result = finderSuite(v,i,declared_fn,e);
                        r = result.r;
                        break;
                    }else{
                        if(i in declared_fn){
                            index = next_target == null ? data.index : next_target;
                            if(v[0] in $js.set(declared_fn[i][data.index],{}) || (next_target != null && v[0] in $js.set(declared_fn[i][next_target],{}) ) ){
                                result = finder(v,i,declared_fn[i][index],e);
                                r = result.r;
                                if(result.stop){
                                    break;
                                }
                            }else if(index in declared_fn[i]){
                                next_target = declared_fn[i][index]['-1'];
                            }
                        }
                    }
                }
                return r;
            }
            /*
            * @fnBuilder()
            * */
            function fnBuilder(struct,fromNative){
                var definedParams = struct.params.split(/(?: +)?,(?: +)?/),
                    fromNative = $js.set(fromNative, false),
                    body = 'var arg = Array.isArray(arg) ? arg : [];',
                    builtParams = [];
                // console.error('[PARAMS]',definedParams,name,arg)
                $js.foreach(definedParams,function(i,j){
                    if(!/^( +)?$/.test(i)){
                        var p = $js.decodeArgs(i);
                        i = p[0];
                        p[1] = p[1].length ? Finalize(p[1], data.level,data.parent) : undefined;
                        p[1] = typeof p[1] == 'string' ? '"'+$js.removeQuote(p[1]).replace(/"/, '\\"')+'"' : p[1];
                        body += 'var '+i+' = arg['+j+'] == undefined ? '+p[1]+' : arg['+j+'];\n';
                        builtParams.push($js.set(arg[(fromNative ? '' : '$')+i in  arg ? (fromNative ? '' : '$')+i : j],{}).value);
                    }
                });
                body += struct.body;
                fn = new Function(["arg"], body);
                return {
                    fn : fn,
                    params : builtParams
                }
            }
            /*
            * @getReturnCode()
            * */
            function getReturnCode(e,fn){
                var r = '',//return
                    key = '',
                    begin = false,
                    saveReturn = false,
                    c = '',//Code
                    s = $js.getSymbols();
                $js.foreach(e,function(i,j){
                    if(!/^[a-z]$/.test(i) && begin){
                        begin = false;
                        if(key == 'return'){
                            saveReturn = true;
                        }
                        if(i == ';' && saveReturn && $js.checkSymbols(s)){
                            return false;
                        }
                        key = '';
                    }
                    if(begin && !saveReturn){
                        key += i;
                    }
                    if(saveReturn){
                        r += i;
                    }else{
                        c += i;
                    }
                    if(!$js.isEscaped(e,j)){
                        if(begin){
                            $js.countSymbols(s,i);
                        }
                        if(i == '@' && !begin && !saveReturn){
                            begin = true;
                        }
                    }
                });
                c = $js.clearSpace(c.replace(/@return$/, ''));
                r = $js.clearSpace(r.replace(/;$/, ''));
                var is_fn = $js.is.fn(r,true);
                if(r.length > 0){
                    r = (is_fn && typeof data.anonymous == 'string') || !is_fn ?Finalize(r,is_fn ? data.level : fn.level,fn.start,data.anonymous == undefined ? null : data.anonymous) : '';
                }
                code_final = c;
                return_code = r;
            }
            fn = finder(name);
            if(fn == null){
                var chk = eval('typeof '+splitted_name[0]+' != undefined'),ps = 0;
                if(chk){
                    //Les fonctions existant dans la structure de javascript
                    fn = eval(splitted_name[0]);
                    $js.foreach(splitted_name,function(i){
                        if(ps > 0){
                            fn = fn[i];
                        }
                        ps++;
                    });
                    if(typeof fn != 'function'){
                        exist = false;
                    }else{
                        struct = $js.decodeFn(fn.toString().replace(/^function +/, ''));
                        fn = fnBuilder(struct);
                        code_final = fn.fn(fn.params);
                    }
                }else{
                    exist = false;
                }
                if(!exist){
                    $js.printStackTrace("Reference error ! \""+name+"\" is not a function. check for << "+data.code+" >>");
                }
            }else{
                //Les fonction déclarés dans le code
                var isNativeCode = !/^@js(?: +)?;/i.test(fn.body);
                fn.body = fn.body.replace(/^@(js|native)(?: +)?;(?: +)?/i, '');
                if(!isNativeCode){
                    fn = fnBuilder(fn,true);
                    code_final = code_final = fn.fn(fn.params);
                }else{
                    var paramsGiven = {},
                        globals = $js.copyObject(global_variables);
                    $js.foreach(fn.args, function(i,j){
                        paramsGiven[j.replace(/^\$/, '')] = j in arg ? arg[j].value : $js.set($js.set(arg[i.position], {}).value, i.value);
                        if($js.is.fn(paramsGiven[j.replace(/^\$/, '')], true)){
                            Finalize(paramsGiven[j.replace(/^\$/, '')], fn.level, fn.start,j.replace(/^\$/, ''));
                            paramsGiven[j.replace(/^\$/, '')] = '';
                        }
                    });
                    $js.addLevelVariable(global_variables, fn.level, fn.start, fn.parent);
                    if(fn.level == 0){
                        global_variables = $js.extend(global_variables, paramsGiven);
                    }else{
                        global_variables[fn.level][fn.start] = $js.extend(global_variables[fn.level][fn.start], paramsGiven);
                    }
                    var cursor_index = cursor;
                    cursor = fn.start;
                    code_final = Read({
                        hasReturn : true,
                        endChar : '}',
                        level : fn.level,
                        parent: fn.start,
                        hasString: false,
                        hasBreak: false
                    });
                    cursor = cursor_index;
                    getReturnCode(code_final,fn);
                    //Suppression des données volatiles
                    if(data.level == 0){
                        $js.foreach(global_variables, function(i,j){
                            var k = $js.isJson(i) ? $js.stringify(i) : i,
                                v = $js.set(paramsGiven[j], '');
                            v = $js.isJson(v) ? $js.stringify(v) : v;
                            if(k == v){
                                global_variables[j] = globals[j];
                            }
                        });
                    }else{
                        $js.foreach(global_variables[fn.level][fn.start], function(i,j){
                            var k = $js.isJson(i) ? $js.stringify(i) : i,
                                v = $js.set(paramsGiven[j], '');
                            v = $js.isJson(v) ? $js.stringify(v) : v;
                            if(k == v){
                                global_variables[fn.level][fn.start][j] = globals[j];
                            }
                        });
                    }
                }
            }
        }
        return {
            code : code_final,
            return_code : return_code
        }
    },
    Module = function(data){
        var list = {},
            keyword = '', body = '',
            begin = 0, s = $js.getSymbols(),
            save_prototype = true, save_body = false,
            s = $js.getSymbols(),i,
            c = $js.getCursorSupplement();
        do{
            i = code_source[cursor];
            i = i == '\n' ? '' : i;
            if(i == undefined){
                break;
            }
            if(c.last_char != '\\'){
                $js.countSymbols(s, i);
                if(i == '{' && $js.checkSymbols(s, ['brace']) && s.brace == 1 && save_prototype){
                    save_prototype = false;
                    save_body = true;
                }
                if(i == '}' && $js.checkSymbols(s) && save_body){
                    body = $js.clearSpace(body.replace(/^{/, ''));
                    keyword = $js.clearSpace(keyword.replace(/@module +/, ''));
                    registred_modules[keyword] = body;
                    save_body = false;
                    save_prototype = false;
                    begin = false;
                    c.stop = true;
                    body = ''; keyword = '';
                }
            }
            if(save_prototype){
                keyword += i;
            }
            if(save_body){
                body += i;
            }
            c.last_char = i;
            cursor++;
        }while(!c.stop);
        this.read = function(){
            return {
                code : '',
                variables : global_variables,
                modules : list
            }
        }
    };

    return function(execution){
        var execution = $js.set(execution, 'laxist').toString().toLowerCase();
        //Check if execution is well given
        if(!/^(use +)?(strict|laxist)$/.test(execution)){
            throw new Error("Execution mode unrecognized !");
        }
        //Define if execution will be strict
        strict = execution == 'laxist' ? false : true;
        /*
        * @readCode
        * */
        function readCode(code){
            return Read();
        }
        /*
        * @compile  : public
        * @params   :
        *   - code  : code to compile
        *   - scope : defined variables in JSON structure for replace
        * @return   : text
        * */
        this.compile = function(code, scope){
            code_source = code == undefined ? "" : code.toString();
            global_variables = $js.setObject(scope);
            declared_fn = {};
            cursor = 0;
            registred_modules = {};
            return readCode(code).toString().replace(/\\(@|:|\$|;|'|")/g, '$1');
        }
        this.getRegistredModules = function(){
            return registred_modules;
        }
    }
})(),
//@Alias $js == Synthetic
$js = Synthetic;

/*
    @set(e, v, s): fonction cachée permettant d'initialiser une variable effective au cas
    où sa valeur serait indéfinie
    @params:
        e   : [Any] variable à tester | ou condition (si le troisième paramètre est activé)
        v   : [Any][optional] valeur par défaut à retourner | valeur vraie à retourner si e == true
                    et le troisième paramètre est activé
        s   : [Any][optional] valeur à retourner si e == false
    @return : [Any]
*/
$js.set = function(e, v, s){
    return $js.isset(s) ? (e ? $js.isset(v) ? v : null : $js.isset(s) ? s : null) : ($js.isset(e) ? e : $js.isset(v) ? v : null);
}
/*
* @setArray : function for default array definition
* */
$js.setArray = function(e){
    return Array.isArray(e) ? e : [];
}
/*
* @setObject : function for default object definition
* */
$js.setObject = function(e){
    return typeof e == 'object' && e != null && e != undefined ? e : {};
}
$js.inArray = function(e, a, io, l){
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
/*
    @copyObject(e): fonction cachée permettant de copier un objet JSON sans prendre en compte
    sa référence, ainsi la copie sera totalement indépendante de l'originale
    @params:
        e   : [JSON | Object] objet à copier

    @return : [JSON | Object] objet copié
*/
$js.copyObject = function(e){
    return JSON.parse(JSON.stringify(e));
}
$js.preg_quote = function(e){
    return e.toString().replace(/(\$|\.|\\|\/|\*|\+|\?|\[|\]|\(|\)|\||\{|\}|\^)/g, '\\$1');
}
/*
    @foreach(e, fn): fonction cachée permettant de parcourir une valeur itérable
    @params:
        e   : [JSON | Object] valeur itérable
        fn  : [Function] fonction callback qui sera appelée à chaque tour avec deux arguments: (valeur, index)
    @return : [null]
*/
$js.foreach = function(e, fn){
    var dontstop = true;
    for(var i in e){
        dontstop = fn(e[i], i);
        if(dontstop == false){
            break;
        }
    }
}
/*
    @isset(str): fonction cachée permettant de vérifier l'existence d'une variable
    @params:
        e   : [Any] variable à vérifier
    @return : [Boolean]
*/
$js.isset = function(str){
    return typeof str != 'undefined' && str != null;
}
/*
    @len(m): fonction cachée permettant de calculer la longueur d'une chaine de caractère,
                mais surtout celle d'une valeur itérable ne possédant pas l'attribut length
    @params:
        e   : [String | Object ] valeur itérable
    @return : [Int]
*/
$js.len = function(m){
    var l = 0;
    if ($js.isJson(m)) {
        for(var i in m){l++;}
    }else{
        m = m == null || m == undefined ? '' : m.toString();
        l = m.length;
    }
    return l;
}
/*
    @isJson(m): fonction cachée permettant de vérifier si une valeur parsé ou stringifié
                respecte la syntaxe d'un objet JSON
    @params:
        m     : [String | Object] valeur itérable
    @return   : [Boolean]
*/
$js.isJson = function(m,objectOnly){
    var objectOnly = $js.set(objectOnly,false)
    if (typeof m == 'object' && m != null) {
        try{ m = JSON.stringify(m); }
        catch(err) { return false; } }

    if (typeof m == 'string' && !objectOnly) {
        try{ m = JSON.parse(m); }
        catch (err) { return false; }
    }

    if (typeof m != 'object' || m == null) { return false; }
    return true;

}
/*
* @stringify()
* */
$js.stringify = function(e){
    var r = '',
        array = Array.isArray(e),
        bracket = [array ? '[' : '{', array ? ']' : '}'],
        l = $js.len(e), k = 0;
    r += bracket[0];
    $js.foreach(e, function(i,j){
        var v = (k > 0 ? ',' : '');
        if($js.isJson(i)){
            r += v+(array ? '' : j+':')+$js.stringify(i);
        }else{
            if(array){
                r+= v+i;
            }else{
                r+= v+j+':'+i;
            }
        }
        k++;
    });
    r += bracket[1];
    return r;
}
/*
    @extends(model,options,ref): fonction cachée permettant d'étendre le contenu d'un objet
                                 itérable
    @params:
        model   : [JSON | Object] valeur itérable de base
        options : [JSON | Object] valeur itérable qui sera ajouté à la valeur de base
        ref     : [Boolean] valeur booléenne qui, si est vrai rendra le résulta final indépendant
                  des deux valeurs précédentes
    @return     : [JSON | Object]
*/
$js.extend = function(model, options, ref){
    var ref = $js.set(ref, false),
        e = ref ? model : $js.copyObject(model),
        r = e;
    for(var i in options){
        r[i] = options[i];
    }
    return r;
}
/*
* @checkSymbols()
* */
$js.checkSymbols = function(symbols, avoid){
    var avoid = $js.setArray(avoid),
        r = true;
    $js.foreach(symbols, function(i, j){
        if(!$js.inArray(j, avoid)){
            r = i == 0 && r;
        }
    });
    return r;
}
/*
* @countSymbols
* */
$js.countSymbols = function(structure, char){
    switch(char){
        case "'":
            structure.simple_quote = (structure.quote == 0 ? structure.simple_quote + 1 : structure.simple_quote) % 2;
            break;
        case '"':
            structure.quote = (structure.simple_quote == 0 ? structure.quote + 1 : structure.quote) % 2;
            break;
        case "{":
            if(structure.quote == 0 && structure.simple_quote == 0){
                structure.brace++;
            }
            break;
        case "}":
            if(structure.quote == 0 && structure.simple_quote == 0){
                structure.brace--;
            }
            break;
        case "[":
            if(structure.quote == 0 && structure.simple_quote == 0){
                structure.bracket++;
            }
            break;
        case "]":
            if(structure.quote == 0 && structure.simple_quote == 0){
                structure.bracket--;
            }
            break;
        case "(":
            if(structure.quote == 0 && structure.simple_quote == 0){
                structure.parenthese++;
            }
            break;
        case ")":
            if(structure.quote == 0 && structure.simple_quote == 0){
                structure.parenthese--;
            }
            break;
    }
}
/*
* @printStackTrace
* */
$js.printStackTrace = function(message, scope, code){
    throw new Error(message+(scope == undefined ? "" : " began at "+scope.begin+" ended at "+scope.end)+(code == undefined ? ""  : ". Please check for : ..."+code+"..."));
}
/*
* @getSymbols
* */
$js.getSymbols = function(){
    return {
        parenthese : 0,
        quote : 0,
        simple_quote : 0,
        bracket : 0,
        brace : 0
    };
}
/*
* @getMarker
* */
$js.getMarker = function(){
    return {
        begin : 0,
        end : 0
    };
}
/*
* @isEscaped
* */
$js.isEscaped = function(code, index){
    return $js.set(code[index*1 - 1], '') == '\\';
}
/*
* @clearSpace
* */
$js.clearSpace = function(e){
    return e.toString().replace(/^( +)?|( +)?$/g, '');
}
/*
* @is.{}
* */
$js.is = {
    interger : function(e){
        return /^-?[0-9]+$/.test(e);
    },
    number : function(e){
        return /^-?[0-9]+(\.[0-9]+)?$/.test(e);
    },
    array: function(e){
        return /^\[((.+?)((,(.+?))+)?)?\]$/.test(e);
    },
    json : function(e){
        return /^{((.+?):(.+?)((,(.+?):(.+?))+)?)?}$/.test(e)
    },
    fn : function(e,anonymous){
        var anonymous = $js.set(anonymous,false),
            reg = "^"+(anonymous ? "" : "@fn +[a-zA-Z_]+([a-zA-Z0-9_]+)?")+"\\(([\\s\\S]+)?\\)(?: +)?{(.+?)?}(?: +)?$";
        return new RegExp(reg,"i").test(e);
    },
    callable_fn : function(e){
        return /^@[a-z$_]+([a-z0-9_$.]+)?\(([\s\S]+)?\);?$/i.test(e);
    },
    variable : function(e){
        return /^!?\$[a-z_]+([a-z0-9._]+)?((\.[a-z0-9_]+|\[(.+?)\])+)?(?:(\.[a-zA-Z]+\((.+?)?\))+)?$/i.test(e);
    },
    complex_argument : function(e){
        return /^(\$[a-z_]+(?:[a-z0-9_]+)?)(?: +)?:(?: +)?(?:.+?)?$/i.test(e);
    },
    simpleIf: function(e){
        var r = false,
            s = $js.getSymbols();
        $js.foreach(e, function(i){
            $js.countSymbols(s,i);
            if($js.checkSymbols(s) && i == '?'){
                r = true;
                return false;
            }
        });
        return r;
    },
    logic : function(e,has){
        var variable = '\\$[a-zA-Z_]+([a-zA-Z0-9._]+)?((\\.[a-zA-Z0-9_]+|\\[(.+?)\\])+)?',
            number = '[\\d]+(\\.[\\d]+)?',
            string = '[^$][^\\d]+',
            space = '(?: +)?',
            equals = '(!|=)==?',
            logic = '&&|\\|\\|',
            sign = '(<|>)(=)?',
            comparaison = '('+variable+'|'+number+')('+space+'('+sign+'|'+logic+'|'+equals+')'+space+'('+variable+'|'+number+'))+',
            identity = '('+variable+'|'+number+'|'+string+')('+space+'('+equals+')'+space+'('+variable+'|'+number+'|'+string+'))+';
        return new RegExp((has? '' : '^')+comparaison+'|'+identity+(has ? '' : '$'), "").test(e);
    },
    arithmetic: function(e,has){
        var has = $js.set(has,false),
            variable = "(?:\\$[a-zA-Z_]+([a-zA-Z0-9._]+)?((\\.[a-zA-Z0-9_]+|\\[(.+?)\\])+)?|[0-9]+(\\.[0-9]+)?)",
            reg = new RegExp((has ? '' : '^')+"(?: +?)?("+variable+"(\\+\\+|\\-\\-)|"+variable+"(?: +)?((\\+|\\-|\\/|\\*)=?|=)(?: +)?(.+?))(?: +?)?"+(has ? '' : '$'), "");
        return reg.test(e);
    },
    computable : function(e){
        var r = false,
            s = $js.getSymbols();
        $js.foreach(e, function(i,j){
            $js.countSymbols(s,i);
            if(
                $js.checkSymbols(s) &&
                ( /^(\+|\-|\*|\/)$/.test(i) || /^((\+|\-|\*|\/)=)$/.test(i+$js.set(e[j*1+1], '')) )
            ){
                r = true;
                return false;
            }
        });
        var variable = "(\\$[a-zA-Z_]+([a-zA-Z0-9._]+)?((\\.[a-zA-Z0-9_]+|\\[(.+?)\\])+)??|[0-9]+(\\.[0-9]+)?)",
            sign = "((\\+|\\-|\\*|\\/)(=)?|(\\+\\+|\\-\\-))",
            duo = variable+sign+variable;
        r = r && new RegExp("^"+duo+"(("+sign+duo+")+)?$", "").test(e);
        return r;
    },
    boolean : function(e){
        return /^!?(false|true)$/.test(e);
    }
}
/*
* @has.{}
* */
$js.has = {

}
/*
* @toBoolean()
* */
$js.toBoolean = function(e){
    var neg = /^!/.test(e),
        reverse = neg ? e.replace(/^(!+)(.+?)$/, '$1') : '';
    e = e.toString().replace(/^!/, '');
    var r = /^(0|null|false|undefined|)$/.test(e) || (typeof e == 'boolean' && e == false) ? false : true;
    if(neg){
        for(var i in reverse.split('')){
            r = !r;
        }
    }
    return r;
}
/*
* @protect
* */
$js.protect = function(e){
    var s = $js.getSymbols(),
        e = e.toString(),
        r = '', dontCatch = false;
    $js.foreach(e, function(i,j){
        dontCatch = false;
       if(!$js.isEscaped(e,j)){
           $js.countSymbols(s,i);
           if( (/(\$|@|:|;)/.test(i) && $js.checkSymbols(s) ) ||
               (i == "'" && s.quote == 0) ||
               (i == '"' && s.simple_quote == 0)
           ){
               r += '\\'+i;
               dontCatch = true;
           }
       }
       if(!dontCatch){
           r += i;
       }
    });
    return r;
}
/*
* @logicSplit()
* */
$js.logicSplit = function(code,nextReg, signReg, signFullReg){
    var operands = [],
        ignoreNext = false, k = 0, after = 1,
        operand = '', sign = '',
        hasNext = false,
        s = $js.getSymbols();
    $js.foreach(code, function(i,j){
        if(!$js.isEscaped(code) && !ignoreNext){
            $js.countSymbols(s,i);
            sign = i+$js.set(code[j*1+1], '');
            hasNext = nextReg.test(sign);
            if($js.checkSymbols(s) && (signReg.test(i) || hasNext || j == code.length -1) ){
                ignoreNext = true;
                after = 0; k = 1;
                if(hasNext){
                    k = 0;
                    after = 1;
                }else{
                    sign = i;
                }
                if(j == code.length -1){
                    operand += i;
                }
                if(operand.length){
                    operands.push($js.clearSpace(operand));
                    if(signFullReg.test(sign)){
                        operands.push(sign);
                    }
                    operand = '';
                    sign = '';
                }else{
                    $js.printStackTrace("Error while parsing "+code+" check for << "+code+" >>");
                }
            }
        }
        if(!ignoreNext){
            operand += i;
        }
        if(ignoreNext){
            if(k > after){
                ignoreNext = false;
            }else{
                k++;
            }
        }
    });
    return operands;
}
/*
* @getIndexes()
* */
$js.getIndexes = function(e){
    var r = [];
    if(!$js.isJson(e)){
        return [];
    }
    $js.foreach(e, function(i,j){
        r.push(j);
    });
    return r;
}
/*
* @getIndexesLessThan()
* */
$js.getIndexesLessThan = function(e, number){
    var r = [], object = {};
    if(!$js.is.interger(number)){
        return r;
    }
    var indexes = $js.getIndexes(e);
    $js.foreach(indexes,function(i){
       if($js.is.interger(i) && i * 1 <= number){
           r.push(i);
           object[i] = e[i];
       }
    });
    return {
        indexes: r,
        object : object
    };
}
/*
* @addLevelVariable()
* */
$js.addLevelVariable = function(variables, level, index, previous){
    if(level > 0){
        if(! (level in variables) ){
            variables[level] = {};
        }
        if(! (index in variables[level])){
            variables[level][index] = {};
        }
        variables[level][index]['-1'] = previous;
    }
}
/*
*  @range()
* */
$js.rangeOfInt = function(min, max){
    var r = [],
        m = Math.min(min,max),
        x = Math.max(min,max),
        inc = min < max;
    for(var i = m; i <= x; inc ? i++ : i--){
        r.push(i);
    }
    return r;
}
/*
* @setDefaultData
* */
$js.setDefaultData = function(data){
    data.accept_break = $js.set(data.accept_break, false);
    data.accept_return = $js.set(data.accept_return, false);
    data.previous_scope = $js.set(data.previous_scope, null);
    data.current_scope_outter = $js.set(data.current_scope_outter, null);
}
/*
* @removeQuote
* */
$js.removeQuote = function(e){
    return typeof e == 'string' ? e.toString().replace(/^('|")?|('|")?$/g, '') : e;
}
/*
* @removeParentheses()
* */
$js.removeParentheses = function(e){
    return /^\((.+?)\)$/.test(e) ? $js.clearSpace(e.replace(/^\(|\)$/g, '')) : e;
}
/*
* @decodeArg()
* */
$js.decodeArgs = function(e){
    var r = ['', ''];
    r[0] = e.replace(/^(\$[a-zA-Z_]+(?:[a-zA-Z0-9_]+)?)(?: +)?:(?: +)?(?:.+?)?$/i, '$1');
    r[1] = e.replace(r[0], '').replace(/^( +)?:( +)?/, '');
    return r;
}
/*
* @decodeFn()
* */
//To Remove
$js.decodeFn = function(code,anonymous,clear){
    var name = anonymous == null ? '' : anonymous,
        params = '', body = '',
        clear = $js.set(clear, true),
        saveName = anonymous == null,
        saveParams = !saveName,
        s = $js.getSymbols();
    //Decode structure en nom, arguments, et corps de fonction
    $js.foreach(code,function(i,j){
        if(!$js.isEscaped(code,j)){
            $js.countSymbols(s,i);
            if(i == '(' && saveName && $js.checkSymbols(s, ['parenthese']) && s.parenthese == 1){
                saveParams = true;
                saveName = false;
            }
            if(i == '{' && saveParams && $js.checkSymbols(s, ['brace']) && s.brace == 1){
                saveParams = false;
                saveName = false;
            }
        }
        if(saveName){
            name += i;
        }
        if(saveParams){
            params += i;
        }
        if(!saveParams && !saveName){
            body += i;
        }
    });
    if(clear){
        name = $js.clearSpace(name);
        body = $js.clearSpace(body.replace(/^{|}$/g, ''));
        params = $js.clearSpace(params.replace(/^(?: +)?\(|\)(?: +)?$/g, ''));
    }
    return {
        name : name,
        params : params,
        body : body
    }
}
/*
* @decodeFnArg()
* */
$js.decodeFnArg = function(params, checkArg,clear){
    var args = {}, fn = {}, pos = 0,
        clear = $js.set(clear, true),
        checkArg = $js.set(checkArg, true),
        s = $js.getSymbols(), arg = '';
    //Decode la déclaration des variables-paramètres
    $js.foreach(params,function(i,j){
        if(!$js.isEscaped(params,j)){
            $js.countSymbols(s,i);
            if((i == ',' || j == params.length - 1) && $js.checkSymbols(s)){
                if(j == params.length - 1){
                    arg += i;
                }
                arg = $js.clearSpace(arg.replace(/^,( +)?/, ''))
                var arg_code = arg, val = '';
                arg = $js.decodeArgs(arg,clear);
                if(checkArg){
                    if(!$js.is.variable(arg[0])){
                        arg[1] = arg[0];
                        arg[0] = pos;
                    }
                    if(!$js.is.complex_argument(arg[0]) && arg[1] == ''){
                        val = arg[1];
                        arg[1] = arg[0];
                        arg[0] = pos;
                    }
                }
                args[arg[0]] = {
                    position: pos,
                    value : arg[1],
                    code : arg_code
                };
                arg = '';
                pos++;
            }
        }
        arg += i;
    });
    return args;
}
/*
* @setCombinaison()
* */
$js.setCombinaison = function (type, code, arg){
    var arg = $js.set(arg, null),
        isReg = /(?: +)?\/(.+?)\/([a-zA-Z]+)?(?: +)?/.test(arg),
        reg = RegExp.$1,
        mode = RegExp.$2;
    switch(type){
        case 'length':
            code = $js.len(code);
            break;
        case 'toUpper':
            code = code.toString().toUpperCase();
            break;
        case 'toLower':
            code = code.toString().toLowerCase();
            break;
        case 'split':
            code = code.toString().split(isReg ? new RegExp(reg, mode) : arg);
            break;
        case 'match':
            code = code.match(isReg ? new RegExp(reg, mode) : arg);
            break;
    }
    return code;
}
/*
* @catchStatement()
* */
//To Remove
$js.catchStatement = function(code, previousKey, lastKey){
    var statements = [],
        begin = false,
        type = '', params = '', statement = '',
        saveParams = false,
        saveStatement = false,
        s = $js.getSymbols();

    $js.foreach(code, function(i,j){
        if(!$js.isEscaped(code, j)){
            $js.countSymbols(s,i);
            if(i == '@' && !begin){
                begin = true;
            }
            if(begin){
                if(i == '(' && !saveParams && $js.checkSymbols(s, ['parenthese']) && s.parenthese == 1){
                    saveParams = true;
                    saveStatement = false;
                }
                if(i == '{' && !saveStatement && $js.checkSymbols(s, ['brace']) && s.brace == 1){
                    saveStatement = true;
                    saveParams = false;
                }
                if(i == '}' && $js.checkSymbols(s)){
                    type = $js.clearSpace(type.replace(/^}(?: +)??/, ''));
                    params = $js.clearSpace(params.replace(/^(?: +)?\(|\)(?: +)?$/g, ''));
                    statement = $js.clearSpace(statement.replace(/^(?: +)?\{/g, ''));
                    statements.push({
                        type : type,
                        reason : params,
                        statement : statement
                    })
                    if(type == lastKey && params.length > 0){
                        $js.printStackTrace("Error from declaration of @else statement with argument, where : << "+code+" >>");
                    }
                    if($js.inArray(type, previousKey) && params.length == 0){
                        $js.printStackTrace("Error from declaration of "+type+" statement without argument, where : << "+code+" >>");
                    }
                    type = '';
                    params = '';
                    statement = '';
                    saveParams = false;
                    saveStatement = false;
                }
            }
        }
        if(begin){
            if(!saveParams && !saveStatement){
                type += i;
            }
            if(saveStatement){
                statement += i;
            }
            if(saveParams){
                params += i;
            }
        }
    });
    return statements;
}
/*
* @getCursorSupplement
* */
$js.getCursorSupplement = function(){
    return {
        char : '',
        last_char : '',
        stop : false
    }
}
/*
* @extractCallables
* */
$js.extractCallables = function(e){
    var r = [], begin = false, fn = '',
        s = $js.getSymbols();
    $js.foreach(e,function(i,j){
       if(!$js.isEscaped(e,j)){
           if(begin){
              $js.countSymbols(s,i);
           }
           if(i == '@' && !begin){
               begin = true;
               fn = '';
           }
           if(i == ')' && $js.checkSymbols(s) && begin){
               r.push(fn+i);
               begin = false;
               fn = '';
           }
       }
       if(begin){
           fn += i;
       }
    });
    return r;
}
/*@toObject*/
$js.toObject = function(e){
    function finalize(e){
        if($js.is.number(e)){
            e = parseFloat(e);
        }
        else if($js.is.boolean(e)){
            e = SSPA.toBoolean(e);
        }
        else if($js.is.array(e) && typeof e == 'string'){
            e = toArray(e);
        }
        else if($js.is.json(e) && typeof e == 'string'){
            e = toJson(e);
        }
        return e;
    }
    /*
    * @toArray()
    * */
    function toArray(e){
        var s = $js.getSymbols(),
            r = [], item = '',
            e = e.replace(/^\[|\]$/g, '');
        SSPA.foreach(e, function(i,j){
            if(!$js.isEscaped(e,j)){
                $js.countSymbols(s,i);
                if((i == ',' || j == e.length - 1) && $js.checkSymbols(s)){
                    if(j == e.length - 1){
                        item += i;
                    }
                    r.push($js.removeQuote(finalize($js.clearSpace(item.replace(/^,/, '')))));
                    item = '';
                }
            }
            item += i;
        });
        return r;
    }
    /*
    * @toJson()
    * */
    function toJson(e){
        e = e.replace(/^\{|\}$/g, '');
        var s = $js.getSymbols(),
            saveItem = true,
            r = {}, item = '', value = '';
        $js.foreach(e, function(i,j){
            if(!$js.isEscaped(e,j)){
                $js.countSymbols(s,i);
                if($js.checkSymbols(s)){
                    if(i == ':'){
                        saveItem = false;
                    }
                    if((i == ',' || j == e.length - 1) && !saveItem){
                        saveItem = true;
                        if(j == e.length - 1){
                            value += i;
                        }
                        item = $js.clearSpace(item.replace(/^,/, ''));
                        value = $js.clearSpace(value.replace(/^:/, ''));
                        r[$js.removeQuote(item)] = $js.removeQuote(finalize(value));
                        item = '';
                        value = '';
                    }
                }
            }
            if(saveItem){
                item += i;
            }else{
                value += i;
            }
        });
        return r;
    }
    return finalize(e);
}

if(node_env){
    module.exports = Synthetic;
}
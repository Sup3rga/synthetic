/**
 * SYNTHETIC 7
 * @author: Superga
 * @version: 7
 * @description: all in one
 * @Goals: - Remove '@' identifier
 *         - Remove separate execution
 */
var node_env = typeof module == 'object' && 'exports' in module;
if(node_env){
    var xhr = require("fs");
}
var sampleSourceCode = 
"nom = 5";
var _empty = function(){},
    EMPTY = new _empty(),
    NULL = new _empty();
//Default Extension
var defExt = 'lh';
//Module Database
var moduleDB = {};
//Source code Database
var sourceDB = {};
//Instance Database
var instanceDB = {};
//Package database
var packageDB = {};
//ExeCode : final render of source code;
var exeCode = '';
//Reserved Key
var reservedKeys = [
    'if', 'import', 'from', 'include', 'into', 'in', 'to', 'if', 'elif',
    'else', 'while', 'loop', 'return', 'break','try','catch', 'mixin', 'use',
    'extends', 'with', 'require', 'sspa-phase', 'private','unused', 'const', 
    'unset', 'export','upper','root','external', 'async', 'return', '@js', 'label'
],
lazyKeys = ['import', 'from', 'include'],
baseType = ['Any', 'String', 'Number', 'JSON', 'Array', 'Boolean', 'RegExp', 'Function', 'External'],
breakableKeys = ['return', 'break'],
callAsMethodKeys = ['mixin', 'function'],
nativeFunctions = ['out', 'print','split', 'typeof', 'replace', 'lower', 'maj', 'len'],
types = baseType,
operators = ['+','-','*','/','%','~'],
signs = ['+','-','*','/','%','~','<','>', '&&', '||','=','!'],
_signs = signs.slice(0, 10),
reservedNames = (function(){
    var r = reservedKeys,
        t = ['type','label'];
    for(var i in t){
        r.push(t[i]);
    }
    return r;
})();
//@delete
var _null = 0;
//End of statements
var EOS = [' ', '\n', '\t', ';','(','[','{','.'];
//Avoid File
var avoidFiles = [];

//Class of Synthetic
var Synthetic = function(root, _ncall){
    //Si on est à la base de la compilation
    this._ncall = _ncall === undefined || typeof _ncall != 'number' ? 0 : _ncall;
    //Root Path
    this.root = undefined || root === null || typeof root != 'string'  ? './' : root;
}
var $js = Synthetic,
    $sy = Synthetic.prototype;
//Prototypage

//Real path
$sy.realpath = '';
$sy.currentFile = '';
//Current Code
$sy.currentCode = '';
//var current Render
$sy.currentRender = '';
//Cursor at 0
$sy.cursor = 0;
//CurrentLine : current line of code
$sy.currentLine = 1;
//Current Scope:
$sy.currentScope = 0;
//current modules
$sy.currModules = {'0,0': {}};
//definedModules
$sy.definedModules = [];
//scopeAxis
$sy.scopeAxis = {0 : [0]};
//ExportableModules
$sy.exportableModules = [];
//Exported Modules
$sy.exportedModules = {};
//visibilityToggler
$sy.visibilityToggler = {
    primitive : false,
    structure : false
};
//current keyword
$sy.currentKeyword = {0 : null};
//current reason
$sy.currentReason = {0: false};
//break block in scope
$sy.scopeBreak = {0: false};
$sy.scopeBreakEnter = {0: false};
//currentType
$sy.currentType = null;
//breakLevel
$sy.breakLevel = -1;
//anonymousFn
$sy.anonymousFn = [];
//anonymousFnManager
$sy.anonymousFnManagerAdd = function(e){
    this.anonymousFn.push(e);
};
$sy.anonymousFnManagerGet = function(){
    return this.anonymousFn.pop();
};
//Asynchronous loop
$sy.asyncLoop = function(value, fn, beginAt){
    var curr = typeof fn == 'number' ? fn : beginAt == undefined ? 0 : beginAt,
        fn = typeof value == 'function' ? value : fn,
        value = typeof value != 'function' && value !== undefined ? value : this.currentCode,
        close = null, terminate = false, i,
        br = false,
        j = value.length;
    return new Promise(function(res){
        if(value === null || value === undefined){
            return;
        }
        function stop(){
            i = j;
            br = true;
        }
        function finish(){
            terminate = true;
            br = true;
            res();
        }
        function restart(n){
            var n = n === undefined ? curr + 1 : n;
            br = false;
            curr = n;
            if(curr < j && close != false && !terminate){
                loop();
            }else if(!terminate){
                res();
            }
        }
        function loop(){
            for(i = curr; i < j; i++){
                close = fn(value[i], i, stop, restart,finish);
                if(close == false){
                    br = true;
                    res();
                    break;
                }
                if(close == true){
                    break;
                }
                if(i == j - 1){
                    res();
                }
            }
        }
        if(curr <= value.length-1){
            loop();
        }else{
            res();
        }
    });
}
$sy.syncLoop = function(value, fn, beginAt){
    var curr = typeof fn == 'number' ? fn : beginAt == undefined ? 0 : beginAt,
        fn = typeof value == 'function' ? value : fn,
        value = typeof value != 'function' && value !== undefined ? value : this.currentCode,
        close = null, terminate = false,
        br = false,
        i;
    function upt(_n){
        i = _n;
    }
    function finish(){
        i = value.length;
    }
    for(i = curr, j = value.length; i < j; i++){
        if(fn(value[i], i, upt, finish) != undefined){
            break;
        }
    }
}
//UrlParser for url understanding
$sy.urlParser = function(relative, _root){
    relative = relative.replace(/\.\.\//g, '..');
    while(/\/\.\//.test(relative)){
        relative = relative.replace(/\/\.\//g, '/');
    }
    var _root = $js.set(_root, this.root),
        tab = _root.split('/'),
        complet = [],
        path = [],
        sub = [],
        prefix = relative.replace(/^((?:\.\.)+)(.+?)?$/, '$1'),
        suite = relative.replace(/^(?:(?:\.\.)+)?(.+?)?$/, '$1'),
        tab_prefix = prefix.match(/\.\./g);
        tab_prefix = tab_prefix == null ? [] : tab_prefix;
    for(var i in tab){
        if([".", ""].indexOf(tab[i]) == -1){
            if(/(\.)+/.test(tab[i])){
                sub = tab[i].split(/(\.\.)/);
                for(var j in sub){
                    if([".", ""].indexOf(sub[j]) == -1){
                        complet.push(sub[j]);
                    }
                }
            }else{
                complet.push(tab[i]);
            }
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
};
//Packager
$sy.packager = function(content, index){
    var data = content.split(/(\[(?:files|packages)\])/),
        r = {},
        k = '';
    data.shift();
    for(var i in data){
        k = data[i].toLowerCase() == '[files]' ? 'files' : (data[i].toLowerCase() == '[packages]' ? 'packages' : /\[(\S+)\]/.test(data[i]) ? '' : k);
        if(k.length && ['[files]','[packages]'].indexOf(data[i]) < 0){
            r[k] = (function(){
                data[i] = data[i].replace(/(\n|\t| )/g, '').split(':');
                var r = [];
                for(var j in data[i]){
                    if(data[i][j].length > 0){
                        r.push(data[i][j]);
                    }
                }
                return r;
            })();
        }
    }
    packageDB[index] = r;
    return r;
};
//fileAccessChecker: check if user can access to a specific file
$sy.fileAccessChecker = function(){
    var $this = this,
        filepath = realpath.substr($this.root.length, $this.realpath.length),
        filepatharr = filepath.split('/'),
        file = filepatharr[filepatharr.length - 1].replace(/\.lh$/i, ''),
        nextPath = '',
        hasNext = true,
        lastpkg;
    filepatharr.pop();
    return new Promise(function(res,rej){
        if(filepatharr.length){
            $this.asyncLoop(filepatharr, function(e,i,st,rs){
                nextPath += (i > 0 ? '/' : '')+e;
                if(lastpkg == undefined || ('packages' in lastpkg && lastpkg.packages.indexOf(e) >= 0)){
                    hasNext = true;
                }else{
                    hasNext = false;
                    return false;
                }
                st();
                $this.fileReader($this.root+nextPath+'/.lpkg', false).then(function(e){
                    lastpkg = packager(e, $this.root+nextPath+'/.lpkg');
                    rs();
                });
            }).then(function(){
                if(hasNext && 'files' in lastpkg && lastpkg.files.indexOf(file) >= 0){
                    res();
                }else{
                    rej();
                }
            });
        }else{
            res();
        }
    });
};
//fileReader : to read file content
$sy.fileReader = function(filename, check){
    var check = check === undefined ? false : check,
        $this = this;
    // console.error('[basename]',filename,check);
    if(!/\.lpkg/.test(filename)){
        filename = $this.urlParser(filename);
        filename = new RegExp("\\.("+defExt+"|lpkg)$","i").test(filename) ? filename : filename+'.'+defExt;
        $this.realpath = filename;
    }
    // console.log('[filename]',filename);
    return new Promise(function(resolve,err){
        function call(){
            //Si ce fichier a déjà été appelé
            if(filename in sourceDB){
                resolve(sourceDB[filename]);
            }
            if(node_env){
                xhr.readFile(filename, 'utf-8', function(error,content){
                    if(error){
                        err(error);
                    }else{
                        resolve(clear(content));
                    }
                });
            }else{
                var rawFile = new XMLHttpRequest();
                rawFile.open("GET", filename, false);
                rawFile.onreadystatechange = function (){
                    if(rawFile.readyState === 4){
                        if(rawFile.status === 200 || rawFile.status == 0){
                            var allText = rawFile.responseText;
                            resolve(clear(allText));
                        }
                    }
                }
                rawFile.send(null);
                // xhr = new XMLHttpRequest() || new ActiveXObject("Msxml2.XMLHTTP");
                // xhr.open("GET", filename, false);
                // try{
                //     xhr.send(null);
                //     xhr.onreadystatechange = function(){
                //         console.log('[TEXT]', xhr.responseText);
                //         if (xhr.readyState == 4 && xhr.status == 200) {
                //             resolve(clear(xhr.responseText));
                //         }
                //         if(xhr.status == 404 || xhr.status == 500){
                //             err("File ["+filename+"] not found");
                //         }
                //     }
                // }catch(e){
                //     err(e.getMessage());
                // }
            }
        }
        function clear(content){
            content =  content.replace(/\/\/([\S ]+)?\n|\/\/([\S ]+)?$/g, '\n');
            m = content.match(/\/\*([\S\s]+?)?\*\//g);
            var n = 0;
            for(var i in m){
                n = m[i].match(/\n/g);
                content = content.replace(m[i], n.join(''));
            }
            sourceDB[filename] = content;
            $this.currentCode = content;
            return content;
        }
        if($this._ncall > 0 && check){
            $this.fileAccessChecker().then(function(){
                call();
            }).catch(function(){
                $this.debugging(filename+" is not visible !");
            });
        }else{
            call();
        }
    });
};
//debugger
$sy.debugging = function(string, custom){
    var line = $js.set(line, this.currentLine),
        custom = $js.set(custom, false);
    throw new Error(this.realpath+(custom ? " :: " :" :: Error at line "+line+" expected expressions >> ")+string);
};
//parent scope finder
$sy.parentScopeFinder = function(line, level,stringify){
    var last = {x: 0, y: 0},
        $this = this,
        stringify = $js.set(stringify, false),
        lines = [];
        line = parseInt(line);
        level = parseInt(level);
    // console.warn('[Axis]',line,level,$js.copyObj(scopeAxis))//, $js.copyObj(currModules));
    for(var i in $this.scopeAxis){
        i = parseInt(i);
        if(i > level){
            break;
        }else{
            //On sauvegarde le dernier level parent
            last.x = i;
        }
    }
    lines = $this.scopeAxis[last.x];
    lines.sort(function(a,b){
        if(a > b)
            return 1;
        else
            return -1;
    });
    for(var i in lines){
        if(lines[i] > line){
            break;
        }else{
            //On sauvegarde la derniere line parente 
            last.y = lines[i];
        }
    }
    // if(_null > 10){
    //     debugging();
    // }
    // _null++;
    return stringify ? last.y+','+last.x : last;
};
//parents scope finder
$sy.parentScopeList = function(line, level){
    var r = [],
        line = $js.set(line, this.currentLine),
        level = $js.set(level, this.currentScope),
        $this = this,
        e = {x : level, y: line},
        inc = 0;
    do{
        e = $this.parentScopeFinder(line, level - inc);
        r.push(e.y+','+e.x);
        inc++;
    }while(e.x > 0);
    if(e.y > 0 && e.x == 0){
        r.push('0,0');
    }
    // console.log('[R____] (',line,',',level,')',r, $js.copyObj(scopeAxis));
    return r;
};
//module grabber
$sy.moduleGrabber = function(modules, alias, choices, line, level){
    var choices = !Array.isArray(choices) ? [] : choices,
        line = $js.set(line,0),
        $this = this,
        level = $js.set(level,0),
        xy = level == 0 ? {x: 0, y: 0} : $this.parentScopeFinder(line, level),
        key = xy.y+','+xy.x;
    if(!(key in $this.currModules)){
        $this.currModules[key] = {};
    }
    if(alias !== undefined){
        if(!(alias in $this.currModules[key])){
            $this.currModules[key][alias] = {
                label : 'alias'
            };
        }
        $this.definedModules.push(alias);
        if(choices.length){
            for(var i in choices){
                if(choices[i] in modules){
                    $this.currModules[key][alias][choices[i]] = modules[choices[i]];
                }else{
                    $this.debugging("Can't import module [ "+choices[i]+" ]");
                }
            }
        }else{
            for(var i in modules){
                $this.currModules[key][alias][i] = modules[i];
            }
        }
    }else{
        if(choices.length){
            for(var i in choices){
                if(choices[i] in modules){
                    $this.currModules[key][choices[i]] = modules[choices[i]];
                }else{
                    $this.debugging("Can't import module [ "+choices[i]+" ]");
                }
            }
        }else{
            for(var i in modules){
                $this.definedModules.push(i);
                $this.currModules[key][i] = modules[i];
            }
        }
    }
};
//Module saver
$sy.moduleSaver = function(line, level, meta, currLine){
    var $this = this,
        key = $this.parentScopeFinder(line,level),
        n_key = line+','+level,
        currLine = $js.set(currLine, key.y);
    // console.warn('[Saving]',meta,line,level,key,n_key, $js.copyObj(currModules))
    if(reservedNames.indexOf(meta.name) >= 0 || nativeFunctions.indexOf(meta.name) >= 0){
        $this.debugging("Error at line "+currLine+", ["+meta.name+"] is reserved. Can't use it !", true);
    }
    if(types.indexOf(meta.name) >= 0){
        $this.debugging("Error at line "+currLine+", ["+meta.name+"] is a defined type. Can't use it as label !", true);
    }
    key = key.y+','+key.x;
    if(!(key in $this.currModules)){
        $this.currModules[key] = {};
    }
    if(!(n_key in $this.currModules) && meta.label != 'variable'){
        $this.currModules[n_key] = {};
        // if(!(level in scopeAxis)){
        //     scopeAxis[level] = [];
        // }
        // scopeAxis[level].push(line);
    }
    $this.definedModules.push(meta.name);
    if(meta.visible){
        $this.exportedModules[meta.name] = meta;
    }else if(meta.name in $this.exportedModules){
        delete $this.exportedModules[meta.name];
    }
    $this.currModules[key][meta.name] = meta;
};
//module Target scope
$sy.moduleTargetScope = function(name, scopeList){
    var mod = Array.isArray(name) ? name : name.split('.'),
        targetScope = null,
        key = null,
        $this = this,
        alias = mod[0];
    if(!Array.isArray(scopeList)){
        return targetScope;
    }
    for(var j in scopeList){
        if(scopeList[j] in $this.currModules && alias in $this.currModules[scopeList[j]]){
            targetScope = $this.currModules[scopeList[j]];
            key = scopeList[j];
            break;
        }
    }
    return {
        targetScope : targetScope,
        key : key
    };
};
//Scope pointer
$sy.scopePointer = function(name, scopeList){
    var n = this.currentScope, k = 0,
        names = Array.isArray(name) ? name : name.split('.'),
        _root = false, r = [],
        $this = this,
        scopeList = $js.set(scopeList, $this.parentScopeList()),
        i;
    for(i in names){
        if(names[i] == 'root'){
            _root = true;
            k++;
        }
        else if(names[i] == 'upper'){
            k++;
            n--;
            if(n == 0){
                n = 0;
            }
        }else{
            break;
        }
    }
    if(_root && k > 1 || k >= scopeList.length){
        $this.debugging("invalid syntax !");
    }
    if(_root){
        scopeList = ['0,0'];
    }else{
        scopeList = scopeList.slice(k,scopeList.length);
    }
    names = names.slice(k, names.length);
    return {scopeList: scopeList, name: names};
}
//Module finder
$sy.moduleFinder = function(name, scopeList, withIndex){
    var $this = this,
        pointer = $this.scopePointer(name, scopeList);
    scopeList = pointer.scopeList;
    name = pointer.name;
    // console.log('[Finder]',name,pointer,$js.copyObj(currModules));
    var mod = name,
        alias = mod[0],
        r = null,
        isNativeUtils = nativeFunctions.indexOf(alias) >= 0,
        withIndex = $js.set(withIndex, false),
        scopeList = isNativeUtils ? ['0,0'] : scopeList,
        target = isNativeUtils ? {key: '0,0'} : $this.moduleTargetScope(name, scopeList),
        targetScope = target.targetScope;
    if(isNativeUtils){
        key = '0,0';
        r = {
            arg: {},
            body: "[Native code]",
            cursor: 26,
            label: "function",
            level: 1,
            line: 1,
            type: "Any",
            visible: true
        }
    }
    else if(targetScope != null){
        r = targetScope[alias];
        // console.log('Target',mod,r)
        if(mod.length > 1){
            for(var j = 1, k = mod.length; j < k; j++){
                if(mod[j] in r){
                    // if(j < k - 1){
                    // if(r[mod[j]].label == 'alias'){
                    //     r = r[mod[j]];
                    // }
                    if(r[mod[j]].label == 'variable'){
                        r = r[mod[j]].value;
                    }else{
                        r = r[mod[j]];
                        // r = null;
                    }
                    // }else{
                    //     if(r[mod[j]].label != 'alias'){
                    //         r = r[mod[j]];
                    //     }else{
                    //         r = null;
                    //     }
                    // }
                }
            }
        }
    }
    return withIndex ? {r: r, index : target.key} : r;
};
//Module Value Index
$sy.moduleValueIndex = function(name,withRoot,line,scope){
    var $this = this,
        line = $js.set(line,$this.currentLine),
        withRoot = $js.set(withRoot, false),
        scope = $js.set(scope, $this.currentScope),
        _index = $this.indexExtractor(name,$this.currentLine,$this.currentScope,true),
        _val = $this.moduleFinder(_index.path, $this.parentScopeList()),
        r;
    if(_val !== null){
        r = _val.value;
        if(_index.path.length){
            for(var i = 1; i < _index.path.length; i++){
                try{
                    r = r[_index.path[i]];
                }catch(e){
                    r = undefined;
                    break;
                }
            }
        }
    }
    return withRoot ? {root: _val, value: r} : r;
}
//Module remover
$sy.moduleRemover = function(name, scopeList){
    var alias = Array.isArray(name) ? name[0] : name.split('.')[0],
        targetScope = $this.moduleTargetScope(name, scopeList);
    delete $this.currModules[targetScope.key][alias];
};
//Mixin legacy manager
$sy.mixinLegacyManager = function(meta, start){
    var legacy = meta.legacy,
        $this = this,
        scope = $this.parentScopeList(meta.line, meta.level, true),
        newLegacies = [], finals = {},
        mixin;
    for(var i in legacy){
        //On cherche le mixin
        if(newLegacies.indexOf(legacy[i]) < 0){
            mixin = $this.moduleFinder(legacy[i], scope);
            if(mixin == null){
                $this.debugging("Error from line "+start+", mixin [ "+legacy[i]+" ] is undefined", true);
            }else if(mixin.label != 'mixin'){
                $this.debugging("Error from line "+start+", can't inherit function [ "+legacy[i]+" ]", true);
            }else if(mixin.legacy.indexOf(meta.name) >= 0){
                $this.debugging("Error from line "+start+", circular legacy between [ "+mixin.name+" ] and [ "+legacy[i]+" ] ", true);
            }else{
                //S'il existe, on procède à la copie des données
                //Copie des attributs
                    //Gestion des contraintes final
                for(var i in mixin.attr){
                    if(mixin.attr[i].final){
                        finals[i] = mixin.attr[i];
                    }
                    if(!(i in meta.attr)){
                        meta.attr[i] = mixin.attr[i];
                    }
                }
                for(var i in finals){
                    if(i in meta.attr && !meta.attr[i].final){
                        $this.debugging("Error at line "+currentLine+", can't override final argument "+i, true);
                    }
                }
                //Copie du corps
                meta.body = mixin.baseBody + meta.body;
                //Copie des héritages
                newLegacies = $js.merge(newLegacies, mixin.legacy);
            }
        }
    }
    meta.legacy = $js.uniqueArray($js.merge(meta.legacy, newLegacies));
};
//toRegExp : transformer des chaines en objet d'expression regulière
$sy.toRegExp = function(string){
    var r = /^\/([\S]+?)\/([a-z]+)?$/.exec(string);
    r = new RegExp(r[1], r[2]);
    return r;
};
//valueFinalizer
$sy.valueFinalizer = function(string, meta){
    string = $js.clearSpace(string);
    var r = string,
        $this = this;
    // console.error('[R]',string)
    //number
    if($js.is.number(string)){
        r = parseFloat(string);
    }
    else if($js.is.boolean(string)){
        r = $js.toBoolean(string);
    }
    else if($js.is.anonymousFn(string)){
        var n = string.match(/\n/g);
        n = Array.isArray(n) ? n.length + 1 : 1;
        $this.currentLine -= n;
        $this.fn('', {
            type: '',
            name: '',
            cursor: cursor - string.length,
            anonymous: true
        });
        r = EMPTY;
    }
    else if($js.is.variable(string)){
        var index = $this.indexExtractor(string,$this.currentLine,$this.currentScope,true);
        var mod = $this.index(string);
        if(mod == null){
            return r;
        }
        index.path.shift();
        r = !$js.isJson(mod) ? mod : $this.valueIndexation(mod.value, index.path);
    }
    else if($js.is.callable(string)){
        console.log('[Call]',string);
    }
    return r;
};
//Value checker: vérifier si la valeur donnée répond bien à la contrainte définie
$sy.valueChecker = function(constraint, value, line){
    var _value = value,
        $this = this,
        line = $js.set(line, $this.currentLine),
        _isfn = !$js.is.anonymousFn(value);
    // console.warn('[val]',value)
    if(constraint != 'Any' && !_isfn && value != EMPTY){
        ifmodule = null;
        if(!/^([\d]+|(false|true))$/.test(value) && typeof value == 'string'){
            ifmodule = $this.moduleFinder(value,$this.parentScopeList($this.currentLine,$this.currentScope));
            //Si le nom est une référence à un module, on modifie la valeur d'entrée
            if(ifmodule != null){
                switch(ifmodule.label){
                    case 'mixin':
                        //code later
                    break;
                    case 'function':
                        //code later
                        console.log('[ERR]')
                    break;
                    case 'variable':
                        value = ifmodule.value;
                    break;
                }
            }
        }
        switch(constraint){
            case 'Number':
                if( (ifmodule != null && ['Any',constraint].indexOf(ifmodule.type) < 0) || !$js.is.number(value) ){
                    debugging("Error from line "+line+", ["+_value+"] is not a type of "+constraint,true)
                }
            break;
            case 'String':
                if( (ifmodule != null && ['Any',constraint].indexOf(ifmodule.type) < 0) || !$js.is.string(value) ){
                    debugging("Error from line "+line+", ["+_value+"] is not a type of "+constraint,true)
                }
            break;
            case 'Boolean':
                if( (ifmodule != null && ['Any',constraint].indexOf(ifmodule.type) < 0) || !$js.is.boolean(value) ){
                    debugging("Error from line "+line+", ["+_value+"] is not a type of "+constraint,true)
                }
            break;
            case 'JSON':
                if( (ifmodule != null && ['Any',constraint].indexOf(ifmodule.type) < 0) || !$js.isJson(value) ){
                    debugging("Error from line "+line+", ["+_value+"] is not a type of "+constraint,true)
                }
            break;
            case 'Array':
                if( (ifmodule != null && ['Any',constraint].indexOf(ifmodule.type) < 0) || !Array.isArray(value) ){
                    debugging("Error from line "+line+", ["+_value+"] is not a type of "+constraint,true)
                }
            break;
            case 'Function':
            case 'External':
                if(( (ifmodule != null && ['Any',constraint].indexOf(ifmodule.type) < 0) || (!$js.is.anonymousFn(value) && ['function', 'external'].indexOf($js.set(value.label,'')) < 0 ) ) ){
                    debugging("Error from line "+line+", ["+_value+"] is not a type of "+constraint,true)
                }
            break;
            default:
                //Code later
            break;
        }
    }
    // console.error('[Val]',constraint,value);
    return value;
};
//Value modifier
$sy.valueModifier = function(meta, value, index, sign){
    var index = $js.set(index,''),
        sign = $js.set(sign, '+='),
        scope = this.parentScopeFinder(meta.line, meta.level,true),
        string = 'this.currModules["'+scope+'"].'+meta.name+'.value'+index+' '+sign+' '+value;
    try{
        eval(string);
    }catch(e){
        this.debugging("Error at line "+this.currentLine+", can't modify value of "+meta.name+index, true);
    }
};
//Value Indexation
$sy.valueIndexation = function(value, index){
    var r = value;
    if(!Array.isArray(index) || [undefined,null].indexOf(value) >= 0){
        return r;
    }
    for(var i in index){
        try{
            r = r[index[i]];
        }catch(e){
            r = null;
            break;
        }
    }
    return r;
}
//Value finder
$sy.valueFinder = function(statementBreak, _inc, _cursor,renderMode,untilEnd,constraintType){
    var r = [],
        $this = this,
        statementBreak = Array.isArray(statementBreak) ? statementBreak : [statementBreak],
        _inc = Array.isArray(_inc) ? _inc : [_inc],
        renderMode = $js.set(renderMode,false),
        untilEnd = $js.set(untilEnd, false),
        constraintType = $js.set(constraintType, 'Any'),
        _cursor = $js.set(_cursor, $this.cursor),
        _options = $js.extend({
            statementBreak : null,
            _inc: null,
            _cursor: null,
            renderMode: null,
            untilEnd: null,
            constraintType: null,
            _finalize: true
        },$js.isJson(statementBreak) && !Array.isArray(statementBreak) ? statementBreak : {
            statementBreak : statementBreak,
            _inc: _inc,
            _cursor: _cursor,
            renderMode: renderMode,
            untilEnd: untilEnd,
            constraintType: constraintType
        }),
        _s = {
            ')': 'parenthese','(': 'parenthese',
            ']': 'bracket', '[': 'bracket',
            '}' : 'brace', '{' : 'brace',
            '"': 'quote', "'": "simple_quote"
        },
        meta = typeof meta != 'object' || meta == null || meta == undefined ? undefined : meta,
        start = $this.cursor, 
        _in_fn_arg = false, _fn_cursor = -1, _has_fn = false,
        __sign,
        val = '', tmp_cur, tmp_line, _hasCallback = false, _tmp = '',
        //Array and JSON utils
         _val_t = [], _val_d = {}, _hint = -1, _dict_string,
         _dict_key = null, _dict_num_key = 0, _dict_last_cursor,
        //------------------------------------
        s = $js.getSymbols(), asking = 0, resp = 0,
        priority = {
            0: [], //Pour les signes  ? et :
            1: [], //Pour les signes : * et / et %
            2: [], //Pour les signes : + et -
            3: [], //Pour les signes : && , ||
            4: [] //Pour les signes : <, >
        },
        _reverses = {"}" : "{", "]" : "[", ")" : "(", "'" : "'", '"' : '"'},
        _rv_sym = [], _n_sym = [],
        _sym =  [],
        _render = '', _val = '',
        _sym_chk = false,
        _char = [];
    _options._inc = _options._inc.length ?_options. _inc : [0];
    for(var i in _options.statementBreak){
        if(_options.statementBreak[i] in _s){
            _sym.push(_s[_options.statementBreak[i]]);
            _n_sym.push(_options.statementBreak[i]);
            _rv_sym.push(_reverses[_options.statementBreak[i]]);
            _options._inc[i] = _options._inc[i] == undefined ? _options._inc[_options._inc.length - 1] : _options._inc[i];
        }else{
            _char.push(_options.statementBreak[i]);
        }
    }
    if(_sym.length == 0){
        _sym = null;
    }
    if(_char.length == 0){
        _char = null;
    }
    // console.warn('[sym]',{_sym, _char,_n_sym}, renderMode, untilEnd)
    return new Promise(function(res){
        function _clearVal(){
            if($js.isJson(val)){
                return;
            }
            val = /^\(([\s\S]+?|)\)$/.test(val) ? val.replace(/^\(|\)$/g, '') : val;
            //_rv_sym.join('').replace(/(\[|\])/, '\\$1')
            val = _sym == null ? val : val.replace(new RegExp("["+_n_sym.join('').replace(/(\[|\])/, '\\$1')+"]$", "g"), "");
            val = _char == null ? val : val.replace(new RegExp("["+_char.join('').replace(/(\[|\])/, '\\$1')+"]$", ""), "");
            val = $js.clearSpace(val);
        }
        // console.log('[CODE]',renderMode);
        $this.asyncLoop(function(char,i,st,rs,finish){
            if(char == '\n'){
                $this.currentLine++;
            }
            //Si on est en mode rendu, on prend en compte seulement les ( )
            if(renderMode === true){
                val += char == '\\' && $this.currentCode[i-1] != '\\' ? '' : char;
                if($this.currentCode[i-1] != '\\'){
                    //On évite les contraintes des quotes
                    $js.countSymbols(s,char, ['quote', 'simple_quote']);
                    // console.warn('[--->]',char, s.parenthese, _inc[0]);
                    //À chaque caractère blanc, on met à jour le rendu
                    if(/[\s]/.test(char)){
                        _render += val;
                        val = '';
                    }
                    //S'il y a une nouvelle parenthese ouvert, on vérifie si c'est une appelation de fonction ou une espace d'exécution
                    if(char == '(' && s.parenthese == 1){
                        val = val.replace(/\($/, '');
                        _val = $js.clearSpace(val);
                        // console.log('[Val]',_val+'->'+char);
                        st();
                        if(_val.length && /^@/.test(_val)){
                            $this.callable(_val.replace(/^@/, ''))
                            .then(function(_e){
                                // console.log('[Fin]', {val,_val,_e})
                                _e = $js.is.string(_e,true) ? $js.unQuote(_e) : _e;
                                val = val.replace(_val, _e);
                                s.parenthese--;
                                rs($this.cursor);
                            });
                        }else{
                            // console.log('[REJECT]',_val);
                            $this.cursor++;
                            $this.valueFinder(")", -1)
                            .then(function(_e){
                                $this.cursor++;
                                s.parenthese--;
                                val += $js.is.string(_e,true) ? $js.unQuote(_e) : _e;
                                rs($this.cursor);
                            });
                        }
                        return true;
                    }
                    if(char == ')' && s.parenthese == 0){
                        val = val.replace(/\)$/, '');
                    }
                    if(char == ')' && s.parenthese == _inc[0]){
                        _render += val.replace(/\)$/, '');
                        r.push(_render)
                        return false;
                    }
                }
            }
            else{
                $js.countSymbols(s,char);
                // console.log('[char]',char, $js.copyObj(s))
                if($this.scopeBreak[$this.currentScope]){
                    _tmp = $js.clearSpace(val);
                    if($this.scopeBreakEnter[$this.currentScope]){
                        if(r.length && char == '\n'){
                            if(_tmp.length){
                                if(_options._finalize){
                                    r.push(_tmp);
                                }else{
                                    r.push(_tmp);
                                }
                            }
                            return false;
                        }
                    }else if(char == '}' && s.brace == -1 && $js.checkSymbols(s, ['brace'])){
                        if(_tmp.length){
                            if(_options._finalize){
                                r.push(_tmp);
                            }else{
                                r.push(_tmp);
                            }
                        }
                        return false;
                    }
                }
                for(var k in _sym){
                    _sym_chk = _sym_chk || s[_sym[k]] == _options._inc[k];
                }
                //@crochet : Array
                //Si c'est un crochet, on convertit en tableau
                if( ($js.checkSymbols(s, ['bracket']) && s.bracket == 1 && char == '[' && _options.statementBreak.indexOf(char) < 0) || _options.renderMode == '['){
                    if($js.clearSpace(val).length){
                        r.push(val);
                        val = '';
                    }
                    if(['Any', 'Array'].indexOf(_options.constraintType) < 0 && _options._finalize){
                        $this.debugging("Type error at line "+$this.currentLine,true);
                    }
                    st();
                    $this.cursor++;
                    $this.valueFinder([",","]"], -1)
                    .then(function(_e){
                        if($this.currentCode[$this.cursor] == ']'){
                            s.bracket--;
                        }
                        if(_e == EMPTY){
                            _e = $this.anonymousFnManagerGet();
                            _e.type = "Any";
                        }
                        _val_t.push($this.anonymousFnManagerGet());
                        _options.renderMode = $this.currentCode[$this.cursor] == ']' ? false : '[';
                        if(!_options.renderMode){
                            val = '';
                            if(r.length){
                                r[r.length - 1] = $this.valueIndexation(r[r.length - 1], _val_t)
                            }else{
                                r.push(_val_t);
                            }
                            _val_t = [];
                            $this.cursor++;
                            _hint = [']', ','];
                        }
                        rs($this.cursor);
                    });
                    return true;
                }
                //@accollade : JSON
                //Si c'est une accollade, on convertit en dictionnaire
                if( ($js.checkSymbols(s, ['brace']) && s.brace == 1 && char == '{' && _options.statementBreak.indexOf(char) < 0) || _options.renderMode == '{'){
                    if($js.clearSpace(val).length){
                        // console.log('[Ok]',val);
                        _has_fn = /^\((|[\s\S]+?)\)$/.test(val);
                        if(_has_fn){
                            val += char;
                        }else{
                            r.push(val);
                            val = '';
                        }
                    }
                    if(!_has_fn){
                        // console.log('[_enter_dict]',val)
                        if(['Any', 'JSON'].indexOf(_options.constraintType) < 0){
                            $this.debugging("Type error at line "+currentLine,true);
                        }
                        st();
                        $this.cursor++;
                        // console.warn('[ARRAY]',char);
                        _dict_last_cursor = $this.cursor;
                        $this.valueFinder($js.merge([",","}"], _dict_key == null ? [':'] : []), -1)
                        .then(function(_e){
                            // console.log('[DICT]',_e, currentCode[cursor], _dict_last_cursor, cursor);
                            _dict_string = $js.clearSpace($this.currentCode.substr(_dict_last_cursor, $this.cursor - _dict_last_cursor));
                            if($this.currentCode[$this.cursor] == ':'){
                                _dict_key = _dict_string;
                            }
                            if(['}', ','].indexOf($this.currentCode[$this.cursor]) >= 0){
                                if(/^[a-z0-9_]+$/i.test(_dict_string) && _dict_key == null){
                                    _dict_key = _dict_string;
                                }
                                if(_e == EMPTY){
                                    _e = $this.anonymousFnManagerGet();
                                    _e.type = "Any";
                                }
                                _val_d[_dict_key] = _e;
                                _dict_key = null;
                            }
                            _options.renderMode = $this.currentCode[$this.cursor] == '}' ? false : '{';
                            if(!_options.renderMode){
                                s.brace--;
                                $this.cursor++;
                                _hint = ['}',':', ','];
                                r.push(_val_d);
                                val = '';
                                _val_d = {};
                            }
                            rs($this.cursor);
                            // console.log('[key]',_dict_key,renderMode,_dict_string, cursor);
                        });
                        return true;
                    }
                }
                //Dès qu'on voit une parenthèse on le traite comme une sous-branche
                if(char == '(' && val.length == 0 && $js.checkSymbols(s, ['parenthese']) && s.parenthese == 1){
                    st();
                    _fn_cursor = $this.cursor;
                    $this.cursor++;
                    $this.valueFinder(')', -1).then(function(e){
                        val = char+e;
                        rs($this.cursor);
                    });
                    return true;
                }
                //Si c'est un callable (function, mixin, methode) on le traite
                else if(val.length && char == '(' && $js.checkSymbols(s, ['parenthese']) && s.parenthese == 1){
                    st();
                    $this.callable(val)
                    .then(function(e){
                        if(_options.constraintType != 'Any' && !_options._finalize){
                            e = $this.valueChecker(_options.constraintType,e);
                        }
                        val = e;
                        s.parenthese--;
                        rs($this.cursor);
                    });
                    return true;
                }
                else{
                    if(typeof val == 'object'){
                        if(/[\S]/.test(char)){  
                            if(_hint.indexOf(char) >= 0){
                                _hint = [];
                            }else{
                                val += char;
                            }
                        }
                    }else{
                        //S'il y avait une parenthèse, on procède à l'enregistrement d'une fonction anonyme
                        if(char == '{' && typeof val == 'string' && val.length && _fn_cursor >= 0){
                            //Si le type de contrainte n'est pas vague, alors on déclenche une alerte
                            if(_options.constraintType != 'Any'){
                                $this.debugging("Type error at line "+$this.currentLine, true);
                            }
                            else{
                                st();
                                $this.fn('', {
                                    type: '',
                                    name: '',
                                    cursor: _fn_cursor,
                                    anonymous: true
                                })
                                .then(function(){
                                    s.brace--;
                                    r.push($this.anonymousFnManagerGet());
                                    val = '';
                                    // console.log('[FN]',e, cursor, r);
                                    rs($this.cursor);
                                });
                                // console.log('[Val]',val, _fn_cursor, cursor, currentCode.substr(_fn_cursor, 20));
                                return true;
                            }
                        }
                        else{
                            val += char;
                        }
                    }
                }
                //Si c'est un signe, on enregistre la position ou on déclenche une erreur
                if($js.checkSymbols(s) && (signs.indexOf(char) >= 0 || signs.indexOf(char+$this.currentCode[i+1]) >= 0)){
                    __sign = signs.indexOf(char+$this.currentCode[i+1]) >= 0 ? char+$this.currentCode[i+1] : char;
                    if(val.substr(0,val.length - __sign.length).length > 0){
                        if(char == '!' && !$js.is.sign($this.currentCode[i+1])){
                            //La valeur actuelle doit avoir un seul caractère
                            $this.debugging("Error at line "+$this.currentLine+", invalid syntax",true);
                        }
                        if(_options._finalize){
                            r.push(val.substr(0,val.length - __sign.length));
                        }else{
                            r.push(val.substr(0,val.length - __sign.length));
                        }
                        val = __sign;
                    }
                    if(char == '!' && !$js.is.sign($this.currentCode[i+1])){
                        if($js.clearSpace(val).length == 1){
                            priority[1].push(r.length);
                            r.push(char);
                        }
                    }
                    else if(r.length == 0 || $js.is.sign(r[r.length - 1]) ){
                        // console.log('[R]',r);
                        //S'il n'y avait pas d'éléments précédent ou l'élément précédent est un signe, on signale une erreur
                        $this.debugging("Error at line "+$this.currentLine+", invalid syntax",true);
                    }
                    else if(/[<>=!]=|&&|\|\|/.test(char+$this.currentCode[i+1])){
                        priority[/&&|\|\|/.test(char+$this.currentCode[i+1]) ? 3 : 4].push(r.length);
                        r.push(char+$this.currentCode[i+1]);
                        cursor += 2;
                        char = $this.currentCode[$this.cursor];
                        val = '';
                        rs($this.cursor);
                    }
                    else if(_signs.indexOf($this.currentCode[i+1]) < 0){
                        priority[(/\*|\/|%/.test(char) ? 1 : 2)].push(r.length);
                        r.push(char);
                    }else{
                        $this.debugging("Error at line "+$this.currentLine+", invalid syntax",true);
                    }
                    val = '';
                }
                //@push [VAL]
                //Si on voit un espace blanc on passe aux interprétation
                if(/[\s]/.test(char)){
                    // console.warn('[**here]',val,s, r);
                    if($js.checkSymbols(s) && !_options.untilEnd){
                        val = $js.clearSpace(val);
                        if($js.len(val)){
                            val = /^\(([\s\S]+?|)\)$/.test(val) ? val.replace(/^\(|\)$/g, '') : val;
                            tmp_cur = $this.cursor;
                            if(val == '@js'){
                                st();
                                tmp_line = $this.currentLine;
                                $this['@js'](val)
                                .then(function(e){
                                    val = e == EMPTY ? $this.anonymousFnManagerGet() : e;
                                    r.push(val);
                                    // if(r[r.length - 1] == EMPTY){
                                    if(['Any', 'Function'].indexOf(_options.constraintType) < 0 && _options._finalize){
                                        $this.debugging("Type Error at line "+tmp_line,true);
                                    }
                                    finish();
                                    // }
                                    val = '';
                                    rs($this.cursor);
                                });
                                return true;
                            }
                            else if($js.is.variable(val) && callAsMethodKeys.indexOf($this.getLabel(val)) >= 0){
                                st();
                                $this.callable(val)
                                .then(function(e){
                                    val = e;
                                    r.push(val);
                                    val = '';
                                    rs($this.cursor);
                                });
                                return true;
                            }
                            else{
                                if(val == 'fn'){
                                    _hasCallback = true;
                                    st();
                                    $this.fn('', {
                                        type: '',
                                        name: '',
                                        cursor: $this.cursor,
                                        anonymous: true
                                    })
                                    .then(function(){
                                        r.push($this.anonymousFnManagerGet());
                                        while(/[\s]/.test($this.currentCode[$this.cursor])){
                                            $this.cursor++;
                                        }
                                        rs($this.cursor);
                                    });
                                    return true;
                                }
                                else{
                                    if($js.is.anonymousFn(val) && r.length){
                                        var t = val.match(/\n/g);
                                        $this.debugging("Error at line "+($this.currentLine - (Array.isArray(t) ? t.length : 0))+", can't concatenate expression !", true);
                                    }
                                    $this.cursor = tmp_cur;
                                }
                                if(_options._finalize){
                                    r.push(val);
                                }else{
                                    r.push(val);
                                }
                                val = '';
                            }
                        }
                    }
                }
                //@Ternary [SIGN]
                //Si c'est un signe de questionnement : operateur ternaire
                else if($js.checkSymbols(s) && /(\:|\?)/.test(char) && (_char == null || _char.indexOf(char) < 0 ) ){
                    // console.log('[E]',s,_sym,_char,val,r, statementBreak)
                    _in_fn_arg = char == ':' && _options.statementBreak.indexOf(")") >= 0 && asking == 0 && r.length;
                    if(char == '?'){
                        asking++;
                    }else{
                        if(asking > resp){
                            resp++;
                        }else if(!_in_fn_arg){
                            $this.debugging(":");
                        }
                    }
                    if(!_in_fn_arg){
                        priority[0].push(r.length);
                        val = '';
                        r.push(char);
                    }else{
                        // console.warn('[Ok]',val);
                        r[r.length - 1] += val;
                        val = '';
                    }
                }
                //@END [Val]
                //Si on rencontre un caractère de fin d'instruction
                else if( 
                    (_sym != null && _n_sym.indexOf(char) >= 0 && $js.checkSymbols(s, _sym) && _sym_chk) || 
                    (_char != null && _char.indexOf(char) >= 0 && $js.checkSymbols(s))
                ){
                    // console.warn('[char]',statementBreak, _char);
                    if(typeof val == 'object'){
                        r.push(val);
                    }else{
                        // val = $js.clearSpace(val.replace(new RegExp($js.preg_quote(statementBreak)+"$", ""), ''));
                        _clearVal();
                        // console.error('[Ok-->]>'+val+'<', statementBreak,r, $js.len(val));
                        if($js.len(val)){
                            if(!$js.is.sign(r[r.length - 1]) && !/^(\:|\?)$/.test(r[r.length-1]) && val.length && _options.statementBreak.indexOf(',') < 0){
                                // console.warn('[append]');
                                r[r.length - 1] += val;
                            }else{
                                // console.warn('[push]',val);
                                if(_options._finalize){
                                    r.push(typeof val == 'object' ? val : $this.valueFinalizer(val, _options.constraintType));
                                }else{
                                    r.push(val);
                                }
                            }
                        }
                    }
                    return false;
                }
                else if(!$js.is.sign(char)){
                    // console.log('[S]',char, r)
                    if(r.length && !$js.is.sign(r[r.length - 1]) && !/[:?]/.test(r[r.length - 1]) && $js.checkSymbols(s) && !untilEnd){
                        // console.log('[__Value]',val, '>'+char+'<', r, renderMode);
                        $this.cursor--;
                        finish();
                        return false;
                    }
                }
                else if(char == '=' && !$js.is.sign($this.currentCode[i - 1]) && $this.currentCode[i + 1] != '=' && $js.checkSymbols(s)){
                    $this.debugging("assignment into value : "+$js.clearSpace($this.currentCode.substr(start, $this.cursor-start + 4)+"..."));
                }
            }
            $this.cursor++;
            if($this.cursor >= $this.currentCode.length){
                val = _options.renderMode ? val : $js.clearSpace(val);
                if($js.len(val)){
                    if(_options.renderMode){
                        _render += val.replace(/\)$/, '');
                        r.push(_render);
                    }else{
                        // console.warn('[USH]',val, _val_t, cursor);
                        // val = /^\(([\s\S]+?|)\)$/.test(val) ? val.replace(/^\(|\)$/g, '') : val;
                        _clearVal();
                        //On vérifie s'il y avait enregistrement de tableau ou de dictionnaire
                        if(/(\]|})$/.test(val)){
                            if(_val_t.length){
                                val = _val_t;
                            }else{
                                if($js.len(_val_d)){
                                    val = _val_d;
                                }
                            }
                        }
                        // console.error('[here]',val);
                        if(_options._finalize){
                            r.push(val);
                        }else{
                            r.push(val);
                        }
                    }
                }
                return false;
            }
        }, _options._cursor)
        .then(function(){
            // console.warn('[R]',r,cursor,'/',currentScope);
            var a,b,j;
            function find(i,reverse){
                while(r[i] === NULL && (reverse ? i >= 0 : i < r.length) ){
                    if(reverse){
                        i--;
                    }else{
                        i++;
                    }
                }
                return i;
            }
            function callCalculator(j){
                if(r[j] == '!'){
                    a = find(j+1);
                    b = null;
                    r[a] = $this.calculator(r[a],r[b],r[j]);
                    r[j] = NULL;
                }
                else if(r[j] == '||'){
                    a = find(j-1,true);
                    b = find(j+1);
                    r[b] = r[a];
                    r[j] = NULL; r[a] = NULL;
                }
                else{
                    a = find(j-1,true);
                    b = find(j+1);
                    r[b] = $this.calculator(r[a],r[b],r[j]);
                    r[j] = NULL; r[a] = NULL;
                }
            }
            function iterate(min, max){
                var min = $js.set(min, 0),
                    max = $js.set(max, r.length - 1);
                for(var k = 1; k < 5; k++){
                    if(priority[k].length){
                        for(var i in priority[k]){
                            if(priority[k][i] >= min && priority[k][i] < max){
                                callCalculator(priority[k][i]);
                            }
                        }
                    }
                }
            }
            if(r.length > 1){
                //S'il y a un ternaire dans la valeur
                if(priority[0].length){
                    var tern = priority[0],
                        last = -1, reason = false, latest = -1,
                        next = -1, _resp = 0, current = -1;
                    for(var i = 0; i < tern.length; i++){
                        if(r[tern[i]] == '?'){
                            iterate(last + 1, tern[i]);
                            reason = r[tern[i] - 1];
                            r[tern[i] - 1] = NULL;
                            r[tern[i]] = NULL;
                            next = -1;
                            if(i < tern.length){
                                _resp = 0;
                                //On cherche s'il y a une valeur vérifiant l'échec de la condition après :
                                for(var j = i + 1; j < tern.length; j++){
                                    if(r[tern[j]] == ':'){
                                        _resp++;
                                        //On tient à ce que les ? correspondent aux : par leurs nombres d'occurence
                                        if(_resp == asking){
                                            next = tern[j];
                                            break;
                                        }
                                    }
                                }
                                if(next >= 0){
                                    //Si la raison du ternaire est vraie
                                    if(reason){
                                        //On vide les éléments avant la borne minimale et après la borne maximale
                                        for(var j = 0; j < r.length; j++){
                                            if(j <= tern[i]){
                                                r[j] = NULL;
                                            }
                                            if(j >= next){
                                                r[j] = NULL
                                            }
                                        }
                                        current = tern[i];
                                    }else{
                                        //Sinon on supprime seulement les éléments avant la borne maximale
                                        for(var j = 0; j <= next; j++){
                                            r[j] = NULL;
                                        }
                                        current = next;
                                        next = latest;
                                    }
                                    if(asking <= 1){
                                        iterate(current, next);
                                    }
                                    //On stocke l'ancienne borne maximale pour une prochaine ternaire
                                    latest = next;
                                }
                            }
                            //On a fini de traiter le ternaire
                            asking--;
                            //On stocke la dernière position du ? pour une prochaine condition ternaire
                            last = tern[i];
                        }
                    }
                }else{
                    iterate();
                }
                r = $js.pop(r,NULL);
            }
            res($js.unQuote($this.valueChecker(_options.constraintType, r.length ? r[0] : '')));
        });
    });
};
//Calculator
$sy.calculator = function(a,b,s){
    var r;
    if($js.is.string(a,true)){
        a = $js.unQuote(a);
    }
    else{
        a = this.valueFinalizer(a);
    }
    if($js.is.string(b,true)){
        b = $js.unQuote(b);
    }
    else{
        b = this.valueFinalizer(b);
    }
    switch(s){
        case '+':
        case '+=':
            r = a + b;
        break;
        case '-':
        case '-=':
            r = a - b;
        break;
        case '*':
        case '*=':
            r = a * b;
        break;
        case '/':
        case '/=':
            r = a / b;
        break;
        case '~':
        case '~=':
            r = Math.ceil(a / b);
        break;
        case '%':
            r = a % b;
        break;
        case '<':
            r = a < b;
        break;
        case '>':
            r = a > b;
        break;
        case '<=':
            r = a <= b;
        break;
        case '>=':
            r = a >= b;
        break;
        case '==':
            r = a == b;
        break;
        case '!=':
            r = a != b;
        break;
        case '!':
            r = !a;
        break;
        case '&&':
            r = a && b;
            r = typeof r != 'boolean' ? (r == 0 ? false : true) : r;
        break;
        case '||':
            r = a || b;
            r = typeof r != 'boolean' ? (r == 0 ? false : true) : r;
        break;
    }
    return r;
};
//Index transformer
$sy.indexTransformer = function(e, line, level){
    var $this = this,
        line = $js.set(line,$this.currentLine),
        level = $js.set(level, $this.currentScope),
        isPoint = e[0] == '.', start = false,
        r = '[', _val = '', s = $js.getSymbols();
    //On var parcourir la chaine
    function add(){
        _val = $js.clearSpace(_val.replace(/^(\.|\[)/, ''));
        if(_val.length){
            if(isPoint){
                _val = '"'+_val+'"';
            }else{
                for(var i = 0; i < s.bracket; i++){
                    _val += ']';
                }
                _val = $this.valueFinalizer(_val); 
                _val = $js.is.string(_val, true) ? '"'+_val+'"' : _val;
            }
            r += _val+"][";
        }
    }
    for(var i in e){
        $js.countSymbols(s, e[i]);
        if($js.checkSymbols(s) || ($js.checkSymbols(s, ['bracket']) && s.bracket == 1) ){
            //Si on rencontre un point sans qu'il n'y a pas de valeur, on déclenche une alerte
            if(isPoint && start && !_val.length){
                $this.debugging(e);
            }
            //si le caractère est . ou [
            if(['.', '[', ']'].indexOf(e[i]) >= 0){
                add();
                // bien.ok[].cool[][]
                start = true;
                isPoint = e[i] == '.';
                _val = '';
            }
        }
        //Si on est en mode point et on rencontre un caractère non underscore-alphanumérique
        if(isPoint && !/[a-z0-9_]/.test(e[i]) && e[i] != '.'){
            $this.debugging(e);
        }
        if(e[i] != ']'){
            _val += e[i];
        }
        if(i == e.length - 1){
            add();
        }
    }
    r = r.replace(/\[$/, '');
    return r;
};
//Index Extractor
$sy.indexExtractor = function(e, line, level, complete){
    var $this = this,
        line = $js.set(line,$this.currentLine),
        _e =  e.replace(/^(upper\.|super\.)+/g, ''),
        complete = $js.set(complete, false),
        level = $js.set(level, $this.currentScope),
        ext = /^(\$?[a-z_](?:[a-z0-9_]+)?)((?:\.|\[)[\s\S]+?)?(\-\-|\+\+)?$/i.exec(e),
        _ext = /^(\$?[a-z_](?:[a-z0-9_]+)?)((?:\.|\[)[\s\S]+?)?(\-\-|\+\+)?$/i.exec(_e), 
        _r = [ext[1]],
        r = undefined, _rr = undefined;
    if(ext[2] !== undefined){
        _rr = $this.indexTransformer(ext[2], line, level);
        if(_ext[2] !== undefined){
            r = $this.indexTransformer(_ext[2], line, level);
        }
        if(complete){
            _r = $js.merge(_r, $js.pop(_rr.split(/\[(?:[\s]+?)?|(?:[\s]+?)?\]/), ""));
            for(var i in _r){
                if($js.is.string(_r[i],true)){
                    _r[i] = $js.unQuote(_r[i]);
                }
            }
        }
    }
    return complete ? {path: _r, r : r} : r;
};
//last line
$sy.lastLine = function(i,e,line){
    var _i = 1, _dec = 0,
        line = $js.set(line,$this.currentLine),
        e = $js.set(e, $this.currentCode),
        i = $js.set(i,$this.cursor);
    while(/[\s]/.test(e[i - _i])){
        if(e[i - _i] == '\n'){
            _dec++;
        }
        _i++;
    }
    return line - _dec;
};
//utils
$sy.out = function(arg){
    for(var i in arg){
        if(i != 'end'){
            this.currentRender += arg[i].replace(/\\n/g, '\n');
        }
    }
};
$sy.print = function(arg){
    this.out(arg);
    arg.end = $js.set(arg.end, '\n');
    arg.end = arg.end.replace(/\\n/g, '\n');
    this.currentRender += arg.end;
};
$sy.typeof = function(arg){
    var r = [],
        $this = this;
    for(var i in arg){
        r.push($this.getType(arg[i]));
    }
    return r.length > 1 ? r : r[0];
};
$sy.len = function(arg){
    var r = [];
    for(var i in arg){
        r.push($js.len(arg[i]));
    }
    return r.length > 1 ? r : r[0];
};
$sy.lower = function(arg){
    var r = [];
    for(var i in arg){
        r.push(arg[i].toString().toLowerCase());
    }
    return r.length > 1 ? r : r[0];
};
$sy.maj = function(arg){
    var r = [];
    for(var i in arg){
        r.push(arg[i].toString().toUpperCase());
    }
    return r.length > 1 ? r : r[0];
};
$sy.replace = function(arg){
    var replacement = $js.set(arg[1], '').toString(),
        pattern = $js.set(arg[0], '').toString(),
        r = [];
    pattern = $js.is.regexp(pattern) ? toRegExp(pattern) : pattern;
    for(var i in arg){
        if(i > 1){
            r.push(arg[i].replace(pattern, replacement));
        }
    }
    return r.length > 1 ? r : r[0];
};
$sy.split = function(arg){
    var element = $js.set(arg[1], '').toString(),
        pattern = $js.set(arg[0], '').toString();
    return element.split(pattern);
};
$sy.cast = function(type, value,line){
    var line = $js.set(line,this.currentLine);
    if(type == 'Any'){
        return value;
    }
    switch(type){
        case 'Boolean':
            value = $js.toBoolean(value);
            break;
        case 'Number':
            value = parseFloat(value);
            value = isNaN(value) ? 0 : value;
            break;
        case 'String':
            value = [undefined, null].indexOf(value) >= 0 ? '' : value.toString();
            break;
        default:
            debugging("Error from line "+line+", Can't cast [ "+value+" ] to "+type, true);
            break;
    }
    return value;
}
//create empty scope
$sy.createEmptyScope = function(line,level){
    var $this = this,
        line = $js.set(line,$this.currentLine),
        level = $js.set(level, $this.currentScope),
        n_key = line+','+level;
    if(!(n_key in $this.currModules)){
        $this.currModules[n_key] = {};
        if(!(level in $this.scopeAxis)){
            $this.scopeAxis[level] = [];
        }
        $this.scopeAxis[level].push(line);
    }
}
//createScope
$sy.createScope = function(line,level,vars,buildOnly){
    var buildOnly = $js.set(buildOnly, false),
        el, r = {};
    this.createEmptyScope(line,level);
    for(var i in vars){
        el = {
            label: 'variable',
            visible: false,
            value: vars[i].value,
            name: i,
            type: vars[i].type,
            line: line,
            level: level
        };
        if(buildOnly){
            r[i] = el;
        }else{
            this.moduleSaver(line,level, el, line);
        }
    }
    return r;
}
//Interpretor
$sy.cls = function(string,all){
    var all = all !== undefined;
    return all ? string.replace(/[\n\t]/g, '') : string.replace(/^[\n ]+/g, '');
};
$sy.setVisibilityForNext = function(primitive){
    var primitive = $js.set(primitive, true),
        $this = this;
    if($this.currentScope == 0){
        if(primitive){
            if($this.visibilityToggler.structure){
                $this.debugging("Error at line "+$this.currentLine+", consecutive visibility was set.",true);
            }else{
                $this.visibilityToggler.primitive = true;
            }
        }else{
            if($this.visibilityToggler.primitive){
                $this.debugging("Error at line "+$this.currentLine+", consecutive visibility was set.",true);
            }else{
                $this.visibilityToggler.structure = true;
            }
        }
    }else{
        $this.debugging("Error at line "+$this.currentLine+", can't set visibility for wrapped statement",true);
    }
};
$sy.unsetVisibilityForPrevious = function(){
    if(this.visibilityToggler.primitive){
        this.visibilityToggler.primitive = false;
    }
    if(this.visibilityToggler.structure){
        this.visibilityToggler.structure = false;
    }
},
$sy.fireVisibilityError = function(primitive,reverse){
    var primitive = $js.set(primitive,true),
        reverse = $js.set(reverse, false);
    if( ( primitive && this.visibilityToggler.structure ) || 
        (!primitive && this.visibilityToggler.primitive) ||
        (reverse && (this.visibilityToggler.structure || this.visibilityToggler.primitive)) 
    ){
        this.debugging("Error at line "+this.currentLine+", invalid syntax given !", true);
    }
};
$sy.fireTypeError = function(){
    if(this.currentType != null){
        this.debugging("Error at line "+this.currentLine+", invalid syntax given !", true);
    }
};
$sy.meta = function(options){
    return $js.extend({
        type: null, // le type de valeur: par exemple : Any, Number, String
        label: null, //le type de notation: par exemple : mixin, variable
        name: null, //le nom du notation: par exemple : nomVariable
        line: null, //la ligne de position actuelle de la notation
        level: 0, //L'étendue actuelle de la notation
        cursor: this.cursor, //Le niveau de lecture du code
        visible: false, //Le module sera visible ou pas
        origin: this.realpath //Le chemin absolu dans lequel se trouve le module
    },$js.setObject(options))
};
$sy.rootPath = function(){
    return this.realpath.replace(new RegExp("[a-zA-Z0-9_]+\\."+defExt,""), "");
};
$sy.index = function(name){
    var _index = this.moduleValueIndex(name,true),
        isWrappedModule = false,
        definedAttr = ['type', 'label','name', 'line', 'level'];
    if($js.isJson(_index.value)){
        isWrappedModule = true;
        for(var i in definedAttr){
            if(!(definedAttr[i] in _index.value)){
                isWrappedModule = false;
                break;
            }
        }
    }
    return !isWrappedModule ? _index.root : _index.value;
};
$sy.fromIndexGet = function(name, index){
    var el = this.index(name);
    return el == null ? undefined : $js.set(el[index], undefined);
};
$sy.getType = function(name){
    var el = this.index(name);
    return el == null ? undefined : el.type;
};
$sy.getLabel = function(name){
    var el = this.index(name);
    return el == null ? undefined : el.label;
};
$sy.touchRender = function(result,render){
    if(typeof result == 'object' && [undefined, null].indexOf(result) < 0 && render.length == 0){
        render = result;
    }
    else{
        render += $js.set(result, '');
    }
    return render;
};
$sy.directive = function(key,pattern){
    var suite = key, endIt = false,
        saves = $js.set(saves,{}),
        $this = this,
        _len = $js.set(_len,1),
        _val = '', _key = '', _hasAlias, r = [];
    return new Promise(function(res){
        $this.asyncLoop(function(char){
            suite += char;
            if(new RegExp(pattern+"(;|\\n)$", "").test(suite)){
                return false;
            }
            $this.cursor++;
            if($this.cursor >= $this.currentCode.length){
                if(new RegExp(pattern+"(;|\\n)?$", "").test(suite)){
                    return false;
                }else{
                    $this.debugging("invalid syntax");
                }
            }
        },$this.cursor)
        .then(function(){
            res(suite);
        });
    });
};
$sy.import = function(){
    var $this = this;
    return new Promise(function(res){
        $this.directive('import', "^import[\\s]+?([a-zA-Z_]([.a-zA-Z0-9_]+)?((([\\s]+?)?,([\\s]+?)?[a-zA-Z_]([.a-zA-Z0-9_]+)?)+)?)(?:[\\s]+?in[\\s]+?([a-zA-Z0-9_]+?))?")
        .then(function(string){
            $this._import(string).then(function(){
                res();
            })
        });
    });
};
$sy._import = function(string){
    string = this.cls(string);
    var $this = this;
    $this.currentKeyword[$this.currentScope] = 'import';
    var k = /^import[\s]+?([\s\S]+?)(?:[\s]+?in[\s]+?([a-zA-Z0-9_]+?))?(;|[\n])?$/.exec(string),
        files = this.cls(k[1],true).split(/(?: +)?,(?: +)?/),
        alias = k[2], path,
        $this = this,
        rootpath = this.rootPath();
    this.fireTypeError();
    return new Promise(function(res){
        $this.asyncLoop(files, function(file, i, st, rs){
            st();
            file = $js.clearSpace($js.unQuote(file));
            path = $this.urlParser(file, rootpath);
            if(path in moduleDB){
                path = moduleDB[path].modules;
                $this.moduleGrabber(path, alias == undefined ? e : alias);
                rs();
            }else{
                new Synthetic(rootpath).compileFile(file).then(function(e){
                    file = file.split('.');
                    file = file[file.length - 1];
                    $this.moduleGrabber(e.modules, alias == undefined ? file : alias);
                    rs();
                });
            }
            return true;
        }).then(function(){
            res();
        });
    });
};
$sy.from = function(string){
    var $this = this;
    return new Promise(function(res){
        $this.directive('from', "^from[\\s]+?([a-zA-Z_]([.a-zA-Z0-9_]+)?)[\\s]+?import[\\s]+?([a-zA-Z_]([a-zA-Z0-9_]+)?((([\\s]+?)?,([\\s]+?)?[a-zA-Z_]([a-zA-Z0-9_]+)?)+)?)(?:[\\s]+?in[\\s]+?([a-zA-Z0-9_]+?))?")
        .then(function(string){
            $this._from(string).then(function(){
                res();
            })
        });
    });
};
$sy._from = function(string){
    string = this.cls(string);
    var $this = this;
    $this.currentKeyword[$this.currentScope] = 'from';
    var k = /^from[\s]+?([\s\S]+?)[\s]+?import[\s]+?([\s\S]+?)(?:[\s]+?in[\s]+?([a-zA-Z0-9_]+?))?(;|[\n])?$/.exec(string),
        files = this.cls(k[1],true).split(/(?: +)?,(?: +)?/),
        modules = k[2],
        alias = k[3],
        $this = this,
        rootpath = this.rootPath();
    this.fireTypeError();
    return new Promise(function(res){
        $this.asyncLoop(files, function(file, i, st, rs){
            st();
            new Synthetic(rootpath).compileFile(file).then(function(e){
                file = file.split('.');
                file = file[file.length - 1];
                if(modules !== undefined){
                    modules = modules.split(/(?:[\s]+?)?,(?:[\s]+?)?/);
                }
                $this.moduleGrabber(e.modules, alias == undefined ? undefined : alias, modules);
                // console.log('[Obj]',$js.copyObj(currModules))
                rs();
            });
        }).then(function(){
            res();
        });
    });
};
$sy._include = function(string){
    string = this.cls(string);
    var k = /^include[\s]+?([\s\S]+?)(?:[\s]+?in[\s]+?([a-zA-Z0-9_]+?))?(;|[\n])?$/.exec(string),
        files = this.cls(k[1],true).split(/(?: +)?,(?: +)?/),
        alias = k[2],
        $this = this,
        rootpath = this.root();
    this.fireTypeError();
    return new Promise(function(res){
        $this.asyncLoop(files, function(e, i, st, rs){
            st();
            new Synthetic(e,rootpath).then(function(e){
                $this.moduleGrabber(e.modules, alias == undefined ? e : alias);
                rs();
            });
        }).then(function(){
            res();
        });
    });
};
$sy.mixin = function(string,unused){
    string = this.cls(string);
    unused = $js.set(unused, false);
    currentKeyword[currentScope] = 'mixin';
    var meta = this.meta({
        visible : !this.visibilityToggler.structure,
        unused : false,
        legacy: [],
        attr: {},
        methods: {},
        hasBrace: true,
        body: "",
        baseBody: ""
    }),
    $this = this,
    beginLine = this.currentLine,
    code = '',
    attr = '', lskey = '', lsval,
    body = '',
    set = false,
    attrset = false,
    bodyset = false,
    s = $js.getSymbols(),
    permission = ['Array'],
    key = '';
    this.fireTypeError();
    this.fireVisibilityError(false);
    this.unsetVisibilityForPrevious();
    return new Promise(function(res){
        function setAttr(){
            if(/^(final)?(?:[\s]+)?(const|unset)?(?:[\s]+)?(?:([a-zA-Z_](?:[a-zA-Z0-9_]+)?)[\s]+?)?(\$[a-z_](?:[a-z0-9_]+)?)$/.test(attr.replace(/^\(?([\s]+)?|([\s]+?)?(:|,|\))$/g, ''))){
                lskey = /^(final)?(?:[\s]+)?(const|unset)?(?:[\s]+)?(?:([a-zA-Z_](?:[a-zA-Z0-9_]+)?)[\s]+?)?(\$[a-z_](?:[a-z0-9_]+)?)$/.exec(attr.replace(/^\(?([\s]+)?|([\s]+?)?(:|,|\))$/g, ''));
                if(lskey != null){
                    // console.log('[key]',lskey);
                    attr = {
                        const: lskey[2] == 'const',
                        unset: lskey[2] == 'unset',
                        final: lskey[1] != undefined,
                        exigence: $js.set(lskey[3], 'Any'),
                        generic: [],
                        value: ''
                    };
                    if(['const', 'unset'].indexOf(attr.exigence) >= 0){
                        $this.debugging("Error at line "+$this.currentLine+", [ "+attr.exigence+" ] was given as type instead of exigence !");
                    }
                    lskey = lskey[4];
                    meta.attr[lskey] = attr;
                    attr = '';
                }
            }
        }
        function pushAttr(_line){
            var _line = $js.set(_line, $this.currentLine);
            attr = attr.replace(/^\(([\s]+)?|([\s]+)?(?:,|\))$/g, '');
            if((lskey == null || lskey.length == 0) && attr.length == 0){
                if(lskey == null){
                    $this.debugging("Error at line "+_line+", invalid syntax occurred.",true);
                }else{
                    return;
                }
            }
            lsval = /^(?:<([a-z_](?:[a-z0-9_]+)?(?:(?:(?:[ \n]+?)?\|(?:[ \n]+?)?[a-z_](?:[a-z0-9_]+)?)+)?)>)?(?:[\s]+?)?([\s\S]+)?$/i.exec(attr);
            if(permission.indexOf(meta.attr[lskey].exigence) >= 0 && lsval[1] !== undefined){
                meta.attr[lskey].generic = lsval[1].split(/(?:[\s]+?)?\|(?:[\s]+?)?/);
                for(var i in meta.attr[lskey].generic){
                    if(types.indexOf(meta.attr[lskey].generic[i]) < 0){
                        $this.debugging("Error at line "+_line+", type [ "+meta.attr[lskey].generic[i]+" ] is not defined",true);
                    }
                }
            }else if(lsval[1] !== undefined){
                $this.debugging("Error at line "+_line+", invalid syntax occurred. This is only for "+permission+" attributes constraint type",true);
            }
            lsval[2] = $js.set(lsval[2], '');
            $this.valueChecker(meta.attr[lskey].exigence, lsval[2], _line);
            meta.attr[lskey].value = lsval[2];
            attr = '';
            lskey = '';
        }
        $this.asyncLoop(function(char,i){
            if(char == '\n'){
                $this.currentLine++;
            }
            if(char == '(' && !set && $this.currentCode[i - 1] != '//'){
                if(unused){
                    key = /^(?:(unused))?(?:[\s]+?)?(mixin)[\s]+?([a-zA-Z_](?:[a-zA-Z0-9_]+)?)(?:[\s]+?(extends)[\s]+?([\s\S]+?))?(?:[\s]+?)?$/.exec(code);
                }else{
                    key = /^(?:(unused)[\s]+?(mixin))?(?:[\s]+?)?([a-zA-Z_](?:[a-zA-Z0-9_]+)?)(?:[\s]+?(extends)[\s]+?([\s\S]+?))?(?:[\s]+?)?$/.exec(code);
                }
                if(key == null){
                    $this.debugging("Error from line "+beginLine+", invalid mixin declaration !", true);
                }
                meta.unused = unused ? unused : key[1] !== undefined;
                meta.label = "mixin";
                meta.name = key[3];
                meta.type = key[3];
                meta.legacy = key[4] !== undefined ? key[5].toString().split(/(?: +)?,(?: +)?/) : [];
                set = true;
            }
            code += char;
            if(set){
                if(!attrset){
                    attr += char;
                }
                if(attrset){
                    if(meta.line == null && /[\S]/.test(char) && char != '{'){
                        meta.line = $this.currentLine;
                        meta.hasBrace = false;
                        $this.currentScope++;
                        meta.level = $this.currentScope;
                    }
                    body += char;
                }
                if($this.currentCode[i-1] != '\n'){
                    $js.countSymbols(s, char);
                    if($js.checkSymbols(s,['parenthese']) && s.parenthese == 1 && !attrset){
                        if(char == ':'){
                            setAttr();
                        }
                        if(char == ','){
                            setAttr();
                            pushAttr();
                        }
                    }
                    if($js.checkSymbols(s, ['brace']) && s.brace == 1 && attrset && !bodyset && char == '{'){
                        meta.line = $this.currentLine + 1;
                        $this.currentScope++;
                        meta.level = $this.currentScope;
                    }
                    if($js.checkSymbols(s)){
                        if(!attrset && char == ')'){
                            setAttr();
                            pushAttr($this.lastLine(i));
                            attrset = true;
                        }
                        if(!meta.hasBrace && $this.currentLine > meta.line){
                            meta.body = body;
                            bodyset = true;
                            $this.currentScope--;
                        }
                        if(attrset && char == '}' && !bodyset){
                            meta.body = body.replace(/^{|}$/g, '');
                            bodyset = true;
                            $this.currentScope--;
                        }
                    }
                }
            }
            $this.cursor++;
            if(bodyset){
                return false;
            }
        }, $this.cursor)
        .then(function(){
            //Appelation du gestionnaire d'héritage si le mixin est héritant
            meta.baseBody = meta.body;
            if(meta.legacy.length){
                $this.mixinLegacyManager(meta, beginLine);
            }
            $this.moduleSaver(meta.line, meta.level, meta, beginLine);
            res();
        });
    });
};
$sy.unused = function(string){
    return this.mixin(string, true);
};
$sy.private = function(){
    var $this = this;
    return new Promise(function(res){
        $this.setVisibilityForNext(false);
        res();
    });
};
$sy.export = function(){
    this.fireTypeError();
    var $this = this;
    return new Promise(function(res){
        $this.setVisibilityForNext();
        res();
    });
};
$sy.variable = function(string,options){
    string = this.cls(string);
    var $this = this,
        scope = $this.parentScopeList(this.currentLine, this.currentScope),
        options = $js.extend({
            ended: false
        }, $js.setObject(options)),
        ide = {line: $this.currentLine, scope: $this.currentScope},
        clearName = string.replace(/^(\$?[a-z_](?:[a-z0-9_]+)?)([\s\S]+|)$/, '$1'),
        render = '', name = string,
        s = $js.getSymbols(),
        assignement = false, values = '', sign = '', _value = '',
        _val = name, _mod, _index,
        meta = this.meta({
            label: 'variable',
            visible: $this.visibilityToggler.primitive,
            value: null,
            name: name,
            type: $this.currentType == null ? 'Any' : $this.currentType,
            line: ide.line,
            level: ide.scope
        }),
        endPlease = options.ended && $this.currentCode[cursor] != ';',
        exist = $this.moduleFinder(clearName, scope);
        this.fireVisibilityError();
        this.unsetVisibilityForPrevious();
    // console.log('*** VAR', clearName, exist, currentScope, currentLine);
    if(!exist != null){
        currentType = null;
    }
    // console.log('[Exist]',exist,clearName, string);
    return new Promise(function(res){
        function achieveAssignement(){
            // values = valueFinalizer($js.clearSpace(values).replace(/^\(|\)$/g, ''));
            // values = $this.valueChecker(exist.type, values, $this.currentLine);
            $this.valueModifier(exist,values,$this.indexExtractor(string),sign);
        }
        $this.asyncLoop(function(char,i,st,rst,finish){
            if(exist == null && endPlease){
                return false;
            }
            if(char == '\n'){
                $this.currentLine++;
            }
            if(/(\-\-|\+\+)$/.test(string)){
                if(exist != null){
                    if($this.currentType != null){
                        $this.debugging("Error at line "+ide.line+", invalid syntax expected !", true)
                    }
                    var k = $this.indexExtractor(string);
                    $this.valueModifier(exist, /(\+\+)$/i.exec(string) ? 1 : -1, k, '+=');
                    return false;
                }else{
                    $this.debugging("Error at line "+ide.line+", "+clearName+" is undefined", true); 
                }
            }
            if(exist == null){
                if(char == '='){
                    st();
                    meta.cursor = $this.cursor;
                    $this.cursor++;
                    // console.error('****', meta);
                    $this.valueFinder(';').then(function(val){
                        // console.warn('[Val]',val, meta.cursor, cursor)
                        // val = valueFinalizer(val, meta);
                        if(val != EMPTY){
                            val = $this.valueChecker(meta.type, val, ide.line);
                            meta.value = val;
                        }else{
                            var t = meta.type,
                                n = meta.name,
                                v = meta.visible;
                            meta = $this.anonymousFnManagerGet();
                            meta.type = t;
                            meta.name = n;
                            meta.visible = v;
                            // console.log('[val]',val)
                        }
                        finish();
                    });
                    return true;
                }
                else if(char == ';'){
                    return false;
                }
                else if(!/[\s]/.test(char)){
                    $this.debugging(char);
                }
            }else{
                $js.countSymbols(s, char);
                _val += char;
                if(
                    (char == '=' && signs.indexOf($this.currentCode[i-1]) < 0 && $this.currentCode[i+1] != '=') ||
                    (/^(\+|\-|\*|\/|%)=$/.test(char+$this.currentCode[i+1]))
                ){
                    assignement = true;
                    sign = char == '=' ? '=' : char+$this.currentCode[i+1];
                    $this.cursor++;
                    if(char != '='){
                        $this.cursor++;
                    }
                    // console.warn('assignment',assignement, sign, currentCode.substr(cursor, 20));
                    st();
                    $this.valueFinder(';').then(function(val){
                        if(val == EMPTY){
                            var t = exist.type,
                                n = exist.name,
                                v = exist.visible;
                            exist = $this.anonymousFnManagerGet();
                            exist.type = t;
                            exist.name = n;
                            exist.visible = v;
                            $this.moduleSaver(exist.line, exist.level, exist);
                            finish();
                            return;
                        }else{
                            values = val;
                        }
                        achieveAssignement();
                        finish();
                    });
                    return true;
                }
                else if(['--','++'].indexOf(char+$this.currentCode[i+1]) >= 0){
                    if(baseType.indexOf(exist.type) >= 0){
                        $this.valueModifier(exist, (char+$this.currentCode[i+1] == '++' ? 1 : -1), undefined, '+=');
                        $this.cursor++;
                        return false;
                    }else{ 
                        $this.debugging("Error at line "+ide.line+", can't increment non primitive type variable [ "+exist.name+" ]", true);
                    }
                }
                //Sinon, si ce n'est pas un espace blanc ou un point-virgule, on lève une alerte
                else if(!/[\s;.]/.test(char) && $js.checkSymbols(s, ['parenthese']) && (s.parenthese <= 1)){
                    // console.log('[Val]',_val)
                    if(!$js.is.variable(_val)){
                        _val = $js.clearSpace(_val.replace(/\($/, ''));
                        st();
                        $this.callable(_val)
                        .then(function(e){
                            render = $this.touchRender(e, render);
                            finish();
                        });
                        return true;
                    }
                }
            }
            $this.cursor++;
            if($this.cursor >= $this.currentCode.length){
                if(exist != null){
                    return false;
                }
            }
        }, $this.cursor)
        .then(function(){
            // console.log('[VAR]',meta, cursor, currentCode.substr(cursor - 40, 30));
            if(meta != null && exist == null){
                $this.moduleSaver(ide.line, ide.scope, meta);
            }
            // console.log('[obj]',$js.copyObj($this.currModules));
            res();
        });
    });
};
$sy.fn = function(string, options){
    string = this.cls(string);
    var options = $js.extend({
        name: null,
        type: null,
        cursor: this.cursor,
        anonymous: false
    }, $js.setObject(options)),
    $this = this,
    meta = this.meta({
        arg: {},
        visible: $this.visibilityToggler.primitive,
        label: 'function',
        body: "",
        hasBrace: false,
        type: options.type,
        name: options.name
    }),
    name = '',
    saveName = options.name == null, 
    saveArg = !saveName, saveType = options.type != null, 
    saveBody = false, hasBrace = false, _saveBody = false,
    argPos = 0, 
    //Argument utils
    _cursor, last_attr = null, last_char, _attr_cursor = -1,
    _last_type = null, _arg_line = null,
    //------------------------------------
    s = $js.getSymbols(), start = $this.cursor - string.length,
    ide = {line: $this.currentLine, level: $this.currentScope};
    $this.currentType = null;
    // console.log('[FN___]',meta,options,{saveArg, saveType, saveBody,saveName});
    $this.cursor = options.cursor;
    this.fireVisibilityError();
    this.unsetVisibilityForPrevious();

    return new Promise(function(res){

        function _saveArg(_val){
            if(val == undefined){
                return;
            }
            val = $js.clearSpace(val);
            if(!($js.isJson(val) || Array.isArray(val) || (typeof val != 'object' && ( val.length > 0 || (last_attr != null && last_attr.length) ) ) )){
                return;
            }
            if(_last_type == null){
                _saveType();
            }
            if(types.indexOf(_last_type) < 0){
                $this.debugging("Error from line "+ide.line+", Invalid type [ "+_last_type+" ] given for argument [ "+last_attr+" ]",true);
            }
            // console.log('[ARG]',{val,last_attr, _val})
            meta.arg[last_attr] = {
                type: _last_type,
                index: argPos,
                value: $this.cast(_last_type, val, _arg_line)
                //$js.setToString(valueChecker([], _val, ide.line))
            }
            // console.log('[ATTR]',meta,_val)
            last_attr = null;
            _arg_line = null;
            _last_type = null;
            argPos++;
        }
        function _saveType(){
            if(!last_attr.length){
                last_attr = null;
                return;
            }
            last_attr = /^(?:([a-z_](?:[a-z0-9_]+)?)(?:[\s]+?))?([a-z_](?:[a-z0-9_]+)?)$/i.exec(last_attr);
            _last_type = $js.set(last_attr[1],'Any');
            last_attr = last_attr[2];
        }
        $this.asyncLoop(function(char,i,st,rs,fn){
            $js.countSymbols(s, char);
            // console.log('[char]', char, $js.copyObj(s));
            // console.log('[char]',char,currentLine, s.parenthese)
            if(char == '\n'){
                $this.currentLine++;
            }
            if($js.checkSymbols(s, ['parenthese']) && s.parenthese == 1){
                //On finit d'enregistre le nom de la fonction si ce n'est encore fait
                if(char == '(' && saveName){
                    saveName = false;
                    saveArg = true;
                    meta.name = $js.clearSpace(name);
                    //Si le nom est mal formulé, on lève une alerte
                    if(/^[a-z_]([a-z0-9_]+)?$/.test(meta.name)){
                        $this.debugging("invalid function name : "+$this.currentCode.substr(start, cursor - start));
                    }
                    name = '';
                }
                if(saveArg){
                    st();
                    if(char == '('){
                        $this.cursor++;
                    }
                    _cursor = $this.cursor;
                    // console.warn('[SAVE]')
                    if(_arg_line == null){
                        _arg_line = $this.currentLine;
                    }
                    $this.valueFinder($js.merge([",",")"], last_attr == null ? [":"] : []),-1,null,false,true, (_last_type == null ? 'Any' : _last_type))
                    .then(function(e){
                        name = e;
                        last_char = $this.currentCode[$this.cursor];
                        // console.log('[E]',name,'/',last_char, '/', currentCode.substr(cursor,7),{cursor,_cursor, _attr_cursor})
                        if(last_char == ':'){
                            if(last_attr == null){
                                _cursor = _attr_cursor >= 0 ? _attr_cursor : _cursor;
                                last_attr = $js.clearSpace($this.currentCode.substr(_cursor, $this.cursor - _cursor));
                                _saveType();
                                _attr_cursor = -1;
                                $this.cursor++;
                            }
                            else{
                                $this.debugging(last_char);
                            }
                        }
                        else if([',',')'].indexOf(last_char) >= 0){
                            if(last_attr == null){
                                _cursor = _attr_cursor >= 0 ? _attr_cursor : _cursor;
                                last_attr = $js.clearSpace($this.currentCode.substr(_cursor, $this.cursor - _cursor));
                                _attr_cursor = -1;
                                val = '';
                            }else{
                                val = e;
                            }
                            _saveArg($js.clearSpace($this.currentCode.substr(_cursor, $this.cursor - _cursor)));
                            if(last_char == ')'){
                                s.parenthese--;
                                saveBody = true;
                                saveArg = false;
                            }
                            $this.cursor++;
                        }
                        // console.warn('[END]', cursor, currentCode.substr(cursor, 10),s)
                        rs($this.cursor);
                    });
                    return true;
                }
            }
            if(meta.name != null && !saveArg && meta.type != null && !/[ {\n]/.test(char) && !saveType && !saveBody){
                $this.debugging("Error from line "+ide.line+", can't modify the return type of function "+meta.name, true);
            }
            //On enregistre le type si ce n'est pas encore fait
            if($js.checkSymbols(s,['brace']) && s.brace == 1 && !saveName && !saveArg && !_saveBody){
                if(char == '{'){
                    //On dit qu'il y a une accolade
                    hasBrace = true;
                    meta.hasBrace = hasBrace;
                    meta.line = $this.currentLine;
                    meta.level = $this.currentScope + 1;
                    meta.cursor = $this.cursor + 1;
                    name = '';
                    saveBody = true;
                }
            }
            if($js.checkSymbols(s)){
                //On enregistre les arguments
                if(char == ')' && saveArg){
                    pushArg(name);
                    saveArg = false;
                    saveType = !saveType ? true : false;
                    saveBody = true;
                    name = '';
                }
                //On enregistre le bloc d'exécution de la fonction
                if(char == '}' && saveBody){
                    name = name.replace(/^{/,'')
                    meta.body = name;
                    $this.cursor++;
                    return false;
                }
                //S'il n'y a pas d'accolade de bloc, on vérifie si on peut arrêter l'enregistrement
                if(!hasBrace && saveBody){
                    if(/[\S]/.test(char) && char != '{' && !_saveBody && char != ')'){
                        name = '';
                        _saveBody = true;
                        meta.line = $this.currentLine;
                        meta.level = $this.currentScope + 1;
                        meta.cursor = $this.cursor;
                    }
                    if(_saveBody && char == '\n'){
                        meta.body = name;
                        return false;
                    }
                }
            }
            name += char;
            $this.cursor++;
            if($this.cursor >= $this.currentCode.length){
                // console.log('[FINISH]', $js.copyObj(s), cursor,ide,'/',string)
                return false;
            }
        }, $this.cursor)
        .then(function(){
            if(options.anonymous){
                $this.anonymousFnManagerAdd(meta);
            }else{
                $this.moduleSaver(ide.line, ide.level, meta, ide.line);
                // console.log('[meta]',$js.copyObj(currModules))
            }
            res();
        });
    });
};
$sy.return = function(string){
    var functionRunning = false,
        $this = this,
        levelReturn = $this.currentScope;
    for(var i = $this.currentScope; i >= 0; i--){
        if($this.currentKeyword[i] == 'function'){
            functionRunning = true;
            levelReturn = i;
        }
    }
    // console.log('[CK]',currentKeyword, currentScope);
    $this.currentKeyword[$this.currentScope] = 'return';
    if(!functionRunning){
        $this.debugging("return expression !");
    }
    $this.breakLevel = levelReturn;
    return new Promise(function(res){
        $this.valueFinder(["}",";"], [-1])
        .then(function(_val){
            if(_val == EMPTY){
                _val = $this.anonymousFnManagerGet();
            }
            res(_val);
        });
    });
};
$sy.creatable = function(string){
    string = this.cls(string);
    var s = $js.getSymbols(),
        $this = this,
        ide = {
            line: $this.currentLine,
            level: $this.currentScope
        };
    return new Promise(function(res){
        // console.trace('[Res]',string);
        $this.asyncLoop(function(char,i,st,rs,fn){
            if(char == '\n'){
                $this.currentLine++;
            }
            // console.log('[char]',char);
            $js.countSymbols(s,char);
            if($js.checkSymbols(s) || ($js.checkSymbols(s,['parenthese']) && s.parenthese == 1) ){
                if(['=',';'].indexOf(char) >= 0){
                    st();
                    $this.variable(string,{
                        ended: char == ';'
                    })
                    .then(function(){
                        fn();
                    });
                    return true;
                }
                else if(char == '('){
                    st();
                    $this.fn('',{
                        type: $this.currentType == null ? 'Any' : $this.currentType,
                        name: string
                    })
                    .then(function(){
                        fn();
                    });
                    return true;
                }
                else if(!/[\s]/.test(char)){
                    if($this.currentLine - ide.line == 0){
                        $this.debugging(char);
                    }else{
                        st();
                        $this.variable(string,{
                            ended: true
                        })
                        .then(function(){
                            fn();
                        });
                        return true;
                    }
                }
            }else{
                $this.debugging(char);
            }
            $this.cursor++;
            if($this.cursor >= $this.currentCode.length){
                st();
                $this.variable(string,{
                    ended: true
                })
                .then(function(){
                    fn();
                });
                return true;
            }
        },$this.cursor)
        .then(function(){
            // console.warn('[cursor]',cursor, currentCode.substr(cursor, 10), $js.copyObj(currModules))
            res();
        });
    });
};
$sy.jsFunctionBuilder = function(body, arg){
    var head = '';
    for(var i in arg){
        if($js.isJson(arg[i].value)){
            arg[i].value = JSON.stringify(arg[i].value);
        }else{
            arg[i].value = /([\d]+|true|false)/.test(arg[i].value) ? arg[i].value : '"'+arg[i].value+'"';
        }
        head += 'var '+i+' = '+arg[i].value+';\n';
    }
    body = head + body;
    return new Function([], body);
};
$sy.functionCaller = function(meta, args){
    var $this = this,
        _cursor = $this.cursor,
        _currentLine = $this.currentLine,
        _currentScope = $this.currentScope;
    $this.cursor = meta.cursor;
    $this.currentKeyword[$this.currentScope] = 'function';
    $this.currentLine = meta.line;
    $this.currentScope = meta.level;
    $this.scopeBreak[$this.currentScope] = true;
    $this.scopeBreakEnter[$this.currentScope] = !meta.hasBrace;
    function restoreAll(){
        $this.cursor = _cursor;
        $this.scopeBreak[$this.currentScope] = false;
        $this.scopeBreakEnter[$this.currentScope] = false;
        $this.currentLine = _currentLine;
        $this.currentScope = _currentScope;
        $this.currentKeyword[$this.currentScope] = null;
    }
    return new Promise(function(res){
        for(var i in args){
            if(i in meta.arg){
                meta.arg[i].value = $this.valueChecker(meta.arg[i].type, args[i], _currentLine);
            }
        }
        var r = null, 
            isJs = /^([\s]+?)?@js(([\s]+?)?;)?/.test(meta.body);
        //Si c'est une exécution javascript
        if(isJs){
            r = $this.jsFunctionBuilder(meta.body.replace(/^(?:[\s]+?)?@js(?:(?:[\s]+?)?;)?/, ''), r);
            _code = $this.valueChecker(meta.type, r());
            restoreAll();
            $this.breakLevel = -1;
            res(_code);
        }
        //Sinon on passe à l'exécution native synthetic
        else{
            if(meta.origin != $this.realpath){
                instanceDB[meta.origin].call(meta,args)
                .then(function(_e){
                    $this.currentRender += _e.render;
                    restoreAll();
                    res(_e.return);
                });
            }
            else{
                r = $this.createScope(meta.line, meta.level, meta.arg, isJs);
                // console.log('[args]',meta,args, $js.copyObj(currModules), {currentLine, currentScope});
                $this.compiler(undefined, meta.cursor + meta.body.length)
                .then(function(_code){
                    _code = $this.valueChecker(meta.type, _code);
                    restoreAll();
                    delete $this.currModules[meta.line+','+meta.level];
                    $this.breakLevel = -1;
                    // console.warn('[code call]', _code, currentRender,meta, currModules);
                    res(_code);
                });
            }
        }
    });
};
$sy.callable = function(string){
    string = this.cls(string);
    var isNativeUtils = nativeFunctions.indexOf(string) >= 0,
        $this = this,
        el = isNativeUtils ? null : $this.index(string),
        label = isNativeUtils ? 'function' : el.label,
        origin = isNativeUtils ? $this.realpath : el.origin;
        // console.error('[String]',string,label,cursor,currentCode[cursor]);
    if(label == undefined){
        return this.creatable(string);
    }
    if(label == 'variable'){
        if($this.currentCode[$this.cursor] == '('){
            $this.debugging("Error at line "+$this.currentLine+", [ "+string+" ] is not callable !",true);
        }else{
            $this.currentKeyword[$this.currentScope] = 'variable';
            return this.variable(string);
        }
    }else{
        var val = string,
            args = {}, 
            saveArg = true, 
            name = null,
            code = '', last_char,
            renderMode = false,
            mod = null, hasArg = false, saveArg = false, hasParenthese = false,
            continueWithoutParenthese = false,
            s = $js.getSymbols(), argPos = 0, argsByPos = {},
            _cursor, _alt, last_attr = null;
        return new Promise(function(res){
            function setArgs(){
                var k = 0;
                for(var i in mod.arg){
                    argsByPos[k] = i;
                    k++;
                }
            }
            function _saveArg(){
                if(val == undefined){
                    return;
                }
                val = $js.clearSpace(val);
                if(!($js.isJson(val) || Array.isArray(val) || (typeof val != 'object' && val.length > 0) )){
                    return;
                }
                var k = last_attr == null ? $js.set(argsByPos[argPos], argPos) : last_attr;
                last_attr = null;
                val = val == EMPTY ? $this.anonymousFnManagerGet() : val;
                args[k] = typeof val != 'object' && $js.is.string(val,true) ? $js.unQuote(val) : val;
                argPos++;
            }
            function _saveName(){
                name = val;
                renderMode = name == 'out';
                mod = $this.index(name);
                // console.warn('[Name]',name,mod);
                hasArg = ['mixin','function'].indexOf(mod.label);
                if(!hasArg){
                    return false;
                }
                setArgs();
                val = '';
            }
            if(name != null){
                _saveName();
            }
            $this.asyncLoop(function(char,i,st,rs,fn){
                // console.log('[char]',char);
                if(char == '\n'){
                    $this.currentLine++;
                }
                val += char;
                // console.log('[char-->]',char,val);
                $js.countSymbols(s, char);
                
                if(name != null && !hasParenthese && /[\S]/.test(char) && char != '('){
                    st();
                    _cursor = $this.cursor;
                    if(renderMode){
                        $this.debugging("Error at line "+$this.lastLine(i)+", the function [ out ] must have parentheses !");
                    }
                    // console.log('[Name]',name, cursor, currentCode.substr(cursor, 20));
                    $this.valueFinder(";").then(function(e){
                        val = e;
                        if(name == 'typeof'){
                            val = $js.clearSpace($this.currentCode.substr(_cursor, $this.cursor-_cursor));
                        }
                        _saveArg();
                        fn();
                    });
                    return true;
                }
                if(hasParenthese){
                    st();
                    // console.log('[Cursor]',cursor, currentCode.substr(cursor, 30));
                    _cursor = $this.cursor;
                    $this.valueFinder($js.merge([",",")"], last_attr == null || nativeFunctions.indexOf(name) >= 0 ? [":"] : []),-1,undefined,false,true).then(function(e){
                        val = e;
                        // console.log('[Val]',val, currentCode.substr(_cursor, cursor-_cursor))
                        last_char = $this.currentCode[$this.cursor];
                        $this.cursor++;
                        if(last_char == ':'){
                            last_attr = $js.clearSpace(val);
                            rs($this.cursor);
                        }else{
                            if(name == 'typeof'){
                                val = $this.currentCode.substr(_cursor, $this.cursor-_cursor-1);
                            }
                            _saveArg();
                        }
                        if(last_char == ','){
                            rs($this.cursor);
                        }
                        if(last_char == ')'){
                            fn();
                        }
                    });
                    return true;
                }
                if($js.checkSymbols(s) || ($js.checkSymbols(s,['parenthese']) && s.parenthese == 1) ){
                    if(/[\s]/.test(char)){
                        // console.log('[val]',val);
                        val = $js.clearSpace(val);
                        if(val.length){
                            if(name == null){
                                _saveName();
                            }
                        }
                    }
                    else if(char == '(' && !saveArg){
                        val = $js.clearSpace(val.replace(/\($/, ''));
                        // console.log('[Val]',val)
                        hasParenthese = true;
                        if(val.length){
                            if(name == null){
                                _saveName();
                                if(renderMode){
                                    st();
                                    $this.cursor++;
                                    $this.valueFinder(")", -1,undefined,true)
                                    .then(function(e){
                                        val = e;
                                        _saveArg();
                                        $this.cursor++;
                                        fn();
                                    });
                                    return true;
                                }
                            }
                        }
                        saveArg = true;
                        val = '';
                    }
                }
                $this.cursor++;
                if($this.cursor >= $this.currentCode.length){
                    console.log('[val]',val);
                    return false;
                }
            },$this.cursor)
            .then(function(){
                // console.error('[FN]',name,mod,args)
                if(isNativeUtils){
                    code = $js.set($this[name](args),'');
                    // console.log('[Arg]',args,code, currentRender);
                    res(code);
                }else{
                    // console.log('[MOD]',mod)
                    $this.currentKeyword[$this.currentScope] = mod.label;
                    $this[mod.label+'Caller'](mod, args)
                    .then(function(_render){
                        code = $js.set(_render,'');
                        res(code);
                    });
                }
            });
        });
    }
};
$sy.external = function(string){
    string = this.cls(string);
    this.currentKeyword[this.currentScope] = 'external';
    var ide = {
        line: this.currentLine,
        level: this.currentScope
    },
    $this = this,
    meta = this.meta({
        type: 'External',
        label: 'external',
        visible: true,
        arg: [],
        body: ""
    }),
    val = '', s = $js.getSymbols(), 
    saveBody = false, _saveBody = false,
    finishBody = false, saveArg = false,
    hasBrace = false;
    return new Promise(function(res){
        $this.asyncLoop(function(char){
            if(char == '\n'){
                $this.currentLine++;
            }
            val += char;
            $js.countSymbols(s,char);
            if($js.checkSymbols(s, ['parenthese']) && s.parenthese == 1){
                if(meta.name == null && char == '('){
                    meta.name = $js.clearSpace(val.replace(/\($/, ''));
                    saveArg = true;
                    val = '';
                }
                if(char == ',' && char != '(' && saveArg){
                    val = $js.clearSpace(val.replace(/,$/,''));
                    if(val.length){
                        meta.arg.push(val);
                    }else{
                        $this.debugging("Error at line "+$this.currentLine+", invalid argument declared !");
                    }
                    val = '';
                }
            }
            if($js.checkSymbols(s, ['brace']) && s.brace == 1 && char == '{' && !saveBody && !_saveBody){
                saveBody = true;
                hasBrace = true;
                meta.line = $this.currentLine;
                meta.level = $this.currentScope + 1;
                val = '';
            }
            if($js.checkSymbols(s)){
                if(char == ')' && saveArg){
                    saveArg = false;
                    saveBody = true;
                    val = $js.clearSpace(val.replace(/\)$/, ''));
                    if(val.length){
                        meta.arg.push(val);
                    }
                    val = '';
                }
                if(char == '}' && saveBody && !_saveBody){
                    meta.body = val.replace(/^{|}$/g, '');
                    return false;
                }
                //S'il n'y a pas d'accolade de bloc, on vérifie si on peut arrêter l'enregistrement
                if(!hasBrace && saveBody){
                    if(/[\S]/.test(char) && char != '{' && !_saveBody && char != ')'){
                        val = char;
                        meta.line = $this.currentLine;
                        meta.level = $this.currentScope + 1;
                        _saveBody = true;
                    }
                    if(_saveBody && char == '\n'){
                        meta.body = val;
                        return false;
                    }
                }
            }
            $this.cursor++;
        },$this.cursor)
        .then(function(){
            $this.moduleSaver(meta.line, meta.level, meta, ide.line);
            res();
        });
    });
};
$sy.async = function(string){
    string = this.cls(string);
    this.currentKeyword[this.currentScope] = 'async';
    var ide = {
        line: this.currentLine,
        level: this.currentScope
    },
    $this = this,
    meta = this.meta({
        type: 'Any',
        label: 'async',
        visible: true,
        body: ""
    }),
    val = '', _val = '', s = $js.getSymbols(), 
    saveBody = false, _saveBody = false,
    finishBody = false, saveArg = false,
    hasBrace = false;
    return new Promise(function(res){
        $this.asyncLoop(function(char,i){
            if(char == '\n'){
                $this.currentLine++;
            }
            val += char;
            $js.countSymbols(s,char);
            if($js.checkSymbols(s, ['brace']) && s.brace == 1 && char == '{' && !_saveBody){
                if(!saveBody){
                    if(meta.name == null){
                        val = $js.clearSpace(val.replace(/{$/, ''));
                        if(val.length){
                            meta.name = val;
                        }else{
                            $this.debugging("Error at line "+$this.lastLine(i)+", async name not defined !");
                        }
                        meta.line = $this.currentLine;
                        meta.level = $this.currentScope + 1;
                        val = '';
                    }
                    saveBody = true;
                    hasBrace = true;
                }
            }
            if($js.checkSymbols(s)){
                if(char == '\n' && meta.name == null){
                    _val = $js.clearSpace(val.replace(/{$/, ''));
                    if(_val.length){
                        meta.name = _val;
                        saveBody = true;
                        meta.line = $this.currentLine;
                        meta.level = $this.currentScope + 1;
                        val = '';
                    }
                }
                if(char == '}' && saveBody && !_saveBody){
                    meta.body = val.replace(/^{|}$/g, '');
                    return false;
                }
                //S'il n'y a pas d'accolade de bloc, on vérifie si on peut arrêter l'enregistrement
                if(!hasBrace && saveBody){
                    if(/[\S]/.test(char) && char != '{' && !_saveBody && char != ')'){
                        val = char;
                        meta.line = $this.currentLine;
                        meta.level = $this.currentScope + 1;
                        _saveBody = true;
                    }
                    if(_saveBody && char == '\n'){
                        meta.body = val;
                        return false;
                    }
                }
            }
            $this.cursor++;
        },$this.cursor)
        .then(function(){
            $this.moduleSaver(meta.line, meta.level, meta, ide.line);
            res();
        });
    });
};
$sy["@js"] = function(string){
    return new Promise(function(res){
        var s = $js.getSymbols(),
            $this = this,
            val = '', saveArg = false;
        $this.asyncLoop(function(char,i,st,rs,fn){
            if(char == '\n'){
                $this.currentLine++;
            }
            val += char;
            $js.countSymbols(s,char);
            if(saveArg){
                st();
                $this.valueFinder([',', ')'], -1)
                .then(function(e){
                    val = val.substr(0,val.length - 1) + $js.setToString(e) + $this.currentCode[$this.cursor];
                    if($this.currentCode[$this.cursor] == ')'){
                        $this.cursor++;
                        fn();
                    }else{
                        rs($this.cursor);
                    }
                });
                return true;
            }
            if($js.checkSymbols(s, ['parenthese']) && s.parenthese == 1 && char == '('){
                saveArg = true;
            }
            if($js.checkSymbols(s)){
                if(char == '\n'){
                    return false;
                }
            }
            $this.cursor++;
        },$this.cursor)
        .then(function(){
            try{
                val = eval(val);
            }catch(e){
                val = undefined;
            }
            res(val);
        });
    });
};
$sy.if = function(string,elif){
    string = this.cls(string);
    var arg = null,
        elif = $js.set(elif, false),
        $this = this,
        hasBrace = false, _last_scope, _pass = false,
        s = $js.getSymbols();
    $this.currentKeyword[$this.currentScope] = elif ? 'elif' : 'if';
    return new Promise(function(res){
        // console.log('[string]',string,currentKeyword, '>'+currentCode.substr(cursor, 10));
        $this.asyncLoop(function(char,i,st,rs,fn){
            if(char == '\n'){
                $this.currentLine++;
            }
            $js.countSymbols(s,char);
            if(arg === null && /[\S]/.test(char) && $js.checkSymbols(s,['parenthese']) && (s.parenthese == 1 || s.parenthese == 0)){
                if(char == '('){
                    $this.cursor++;
                }
                if(elif && $this.currentReason[$this.currentScope]){
                    _pass = true;
                }else{
                    st();
                    $this.valueFinder([char == "(" ? ")" : "{"], char == '(' ? -1 : 1, undefined,false,true)
                    .then(function(e){
                        arg = $js.is.boolean(e) ? e : $js.toBoolean(e);
                        $this.currentReason[$this.currentScope] = arg && (elif ? !$this.currentReason[$this.currentScope] : true);
                        if(char == '('){
                            s.parenthese--;
                        }
                        if($this.currentCode[$this.cursor] == '{'){
                            hasBrace = true;
                        }
                        $this.cursor++;
                        rs($this.cursor);
                    });
                    return true;
                }
            }
            if(arg === null && _pass && ( ($js.checkSymbols(s) && char == ')') || ($js.checkSymbols(s, ['brace']) && s.brace == 1) )){
                arg = false;
                $this.cursor++;
                hasBrace = char == '{';
                char = $this.currentCode[$this.cursor];
            }
            if(arg !== null){
                if(/[\S]/.test(char) && $js.checkSymbols(s, ['brace']) && (s.brace == 1 || s.brace == 0) ){
                    _last_scope = $this.currentScope;
                    if(char == '{'){
                        $this.cursor++;
                        hasBrace = true;
                    }
                    $this.currentScope++;
                    $this.scopeBreak[$this.currentScope] = true;
                    $this.scopeBreakEnter[$this.currentScope] = !hasBrace;
                    $this.createEmptyScope();
                    // console.warn('[Run If]', cursor, currentScope, hasBrace, currentCode.substr(cursor, 20));
                    $this.compiler(undefined,undefined,!hasBrace,arg)
                    .then(function(){
                        $this.scopeBreak[$this.currentScope] = false;
                        $this.scopeBreakEnter[$this.currentScope] = false;
                        $this.currentScope = _last_scope;
                        if(hasBrace){
                            $this.cursor++;
                        }
                        // console.warn('[Ok]', currentScope,'/', cursor, currentCode[cursor], hasBrace, currentCode.substr(cursor, 20));
                        fn();
                    });
                    return true;
                }
            }
            $this.cursor++;
        },$this.cursor)
        .then(function(){
            res();
        });
    });
};
$sy.elif = function(string){
    if(['if', 'elif'].indexOf($this.currentKeyword[$this.currentScope]) < 0){
        $this.debugging("elif without previous if or elif");
    }
    return this.if(string,true);
};
$sy.else = function(string){
    string = this.cls(string);
    var arg = null,
        $this = this,
        hasBrace = false, _last_scope,
        s = $js.getSymbols();
    if(['if', 'elif'].indexOf($this.currentKeyword[$this.currentScope]) < 0){
        $this.debugging("else without if or elif");
    }
    $this.currentKeyword[$this.currentScope] = 'else';
    return new Promise(function(res){
        $this.asyncLoop(function(char,i,st,rs,fn){
            if(char == '\n'){
                $this.currentLine++;
            }
            $js.countSymbols(s,char);
            if(/[\S]/.test(char) && $js.checkSymbols(s, ['brace']) && (s.brace == 1 || s.brace == 0) ){
                _last_scope = $this.currentScope;
                if(char == '{'){
                    $this.cursor++;
                    hasBrace = true;
                }
                arg = !$this.currentReason[$this.currentScope];
                $this.currentScope++;
                $this.scopeBreak[$this.currentScope] = true;
                $this.scopeBreakEnter[$this.currentScope] = !hasBrace;
                $this.createEmptyScope();
                $this.compiler(undefined,undefined,!hasBrace,arg)
                .then(function(){
                    $this.scopeBreak[$this.currentScope] = false;
                    $this.scopeBreakEnter[$this.currentScope] = false;
                    $this.currentScope = _last_scope;
                    if(hasBrace){
                        $this.cursor++;
                    }
                    // console.warn('[Ok]', currentScope,'/', cursor, currentCode[cursor], hasBrace, currentCode.substr(cursor, 20));
                    fn();
                });
                // console.log('[R]', cursor, currentCode[cursor], currentReason[currentScope])
                return true;
            }
            $this.cursor++;
        },$this.cursor)
        .then(function(){
            res();
        });
    });
};

//Methods
$sy.call = function(meta, arg, type){
    var type = $js.set(type, 'function'),
        $this = this;
    return new Promise(function(res){
        $this[type+'Caller'](meta, arg)
        .then(function(e){
            res({return : e, render: $this.currentRender});
        })
    });
}

//Compiler : to compile source code
$sy.compiler = function(e,end,breakEnter,save){
    // console.log('[Code]',e);
    var code = '',
        $this = this,
        end = $js.set(end, e === undefined ? $this.currentCode.length : e.length),
        save = $js.set(save, true),
        breakEnter = $js.set(breakEnter,null),
        stop = false,
        render = '',
        _currLine = $this.currentLine,
        s = $js.getSymbols(),
        key  = '',
        lazycode = '',
        currentLazyKey = '';
    // console.log('[Start]',{start: $this.cursor, end: end, breakEnter, save});
    return new Promise(function(res){
        $this.asyncLoop(e, function(char,i,st,rs,fn){
            if(char == '\n'){
                $this.currentLine++;
            }
            $js.countSymbols(s,char);
            // console.log('[***Char]',char,s.brace, s.parenthese, breakEnter);
            //Si on n'est pas dans la block
            if($this.breakLevel >= 0 && $this.currentScope <= $this.breakLevel){
                fn();
            }
            //Si on enregistre les informations des codes ou pas
            if(!save){
                if(breakEnter === true){
                    if($js.checkSymbols(s) && char == '\n'){
                        return false;
                    }
                }else if(breakEnter === false && $js.checkSymbols(s, ['brace']) && s['brace'] == -1){
                    return false;
                }
            }
            else{
                if(breakEnter === false && $js.checkSymbols(s, ['brace']) && s['brace'] == -1){
                    // console.error('END')
                    return false;
                }
                if(EOS.indexOf(char) >= 0 && code.length > 0){
                    key = code.replace(/^[\t \n]/g, '');
                    // console.log('[KEY]',key, s.brace, breakEnter, $js.copyObj(s));
                    //Verifier si c'est un mot-clé:
                    if(reservedKeys.indexOf(key) >= 0){
                        //Si l'actuel clé est définit dans l'interpréteur
                        if(key in $this){
                            st();
                            code = '';
                            // console.error('[KEY]',key,char);
                            $this[key](code).then(function(result){
                                render = $this.touchRender(result, render);
                                if(char == '(' && $this.currentCode[$this.cursor] != ')'){s.parenthese--;}
                                if(char == '[' && $this.currentCode[$this.cursor] != ']'){s.bracket--;}
                                if(char == '{' && $this.currentCode[$this.cursor] != '}'){s.brace--;}
                                key = '';
                                code = '';
                                //Si c'est un mot-clé interrupteur
                                if(breakableKeys.indexOf(key) >= 0 || breakEnter === true){
                                    fn();
                                }else{
                                    rs($this.cursor);
                                }
                            });
                            return true;
                        }else{
                            code += char;
                        }
                    }
                    else{
                        // if(!currentLazyKey.length && !/^([\n\t ]+|)$/.test(code)){
                        if(types.indexOf(key) >= 0){
                            $this.currentType = key;
                            code = '';
                            key = '';
                        }
                        else if($this.definedModules.indexOf(key) >= 0 || nativeFunctions.indexOf(key) >= 0){
                            // console.log('[Key]',key,'=>',currentScope,render,cursor);
                            st();
                            $this.callable(key)
                            .then(function(result){
                                render = $this.touchRender(result, render);
                                code = '';
                                key = '';
                                if(breakEnter === true){
                                    fn();
                                }else{
                                    rs($this.cursor);
                                }
                            })
                            return true;
                        }
                        else if(/^[a-z_]([a-z0-9_]+)?$/i.test(key)){
                            st();
                            // console.log('[Key]',key,'/', code, '/',$this.currentCode.substr($this.cursor, 20))
                            $this.creatable(key)
                            .then(function(){
                                // console.log('[END]',$this.currentCode.substr($this.cursor, 10))
                                code = '';
                                key = '';
                                if(breakEnter === true){
                                    fn();
                                }else{
                                    rs($this.cursor);
                                }
                            })
                            return true;
                        }
                        else{
                            if(/[\s;]/.test(code)){
                                code = '';
                            }
                            else{
                                $this.debugging(code);
                            }
                        }
                    }
                }
                else{
                    code += char;
                    if(currentLazyKey.length){
                        lazycode += char;
                    }
                }
            }
            // console.log('[Cursor]',cursor,render);
            if(!stop){
                $this.cursor++;
                if($this.cursor >= end){
                    if(currentLazyKey.length && save){
                        st();
                        $this[currentLazyKey](lazycode).then(function(result){
                            if(typeof result == 'object' && [undefined, null].indexOf(result) < 0 && render.length == 0){
                                render = result;
                            }
                            else{
                                render += $js.set(result, '');
                            }
                            fn();
                        });
                        return true;
                    }else{
                        return false;
                    }
                }
            }
        }, $this.cursor)
        .then(function(){
            // console.log('[Ok]',{render, cursor, currentRender,breakLevel})
            res(render);
        });
    });
};
//Compile File : Fonction pour compiler les fichiers
$sy.compileFile = function(file){
    var $this = this;
    $this.currentFile = file;
    if($this._ncall == 0){
        //Reset all cache
        avoidFiles = [];
        moduleDB = {};
        sourceDB = {};
        exeCode = '';
        types = baseType;
    }
    //Execution
    return new Promise(function(resolve){
        $this.fileReader(file, $this._ncall > 0).then(function(e){
            $this.compiler(e)
            .then(function(){
                moduleDB[$this.realpath] = $this.exportedModules;
                instanceDB[$this.realpath] = $this;
                resolve({
                    modules: $this.exportedModules,
                    source: $this.currentCode,
                    code : $this.currentRender
                });
            });
        });
    });
}


//Extras Functions

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
/**
 * 
 * @param {*} m 
 */
$js.len = function(m){
    var l = 0;
    if(Array.isArray(m)){
        l = m.length;
    }
    if ($js.isJson(m)) {
        for(var i in m){l++;}
    }else{
        m = m == null || m == undefined ? '' : m.toString();
        l = m.length;
    }
    return l;
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
* @isEscaped
* */
$js.isEscaped = function(code, index){
    return $js.set(code[index*1 - 1], '') == '\\';
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
/**
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
        return /^\[(([\s\S]+?)((,([\s\S]+?))+)?)?\]$/.test(e);
    },
    json : function(e){
        return /^{(([\s\S]+?):([\s\S]+?)((,([\s\S]+?):([\s\S]+?))+)?)?}$/.test(e)
    },
    boolean : function(e){
        return /^!?(false|true)$/.test(e);
    },
    regexp: function(e){
        return /^\/[\S]+\/$/.test(e);
    },
    arithmetic: function(e){
        return /^([\S ]+)(([\s]+?)?(([+%\/<>-]|==)=?)([\s]+?)?[\S ]+)+$/.test(e);
    },
    anonymousFn : function(e){
        return /^\((|[\s\S]+?)?\)([\s]+?)?{(|[\s\S]+?)}$/.test(e); 
    },
    sign: function(e){
        return /^([<>=!]=?|(\+|\-|\*|\/|~)|&&|\|\|)$/.test(e);
    },
    variable: function(e){
        return /^\$?[a-z_]([a-z0-9_]+)?((\.[a-z0-9_]+|\[[\s\S]+?\])+)?$/i.test(e);
    },
    string : function(e,strict){
        var strict = $js.set(strict, false);
        return new RegExp("^("+(!strict ? "[\\s\\S]+" : "('([\\s\\S]+?|)'|\"([\\s\\S]+?|)\")")+")$", "i").test(e);
    },
    callable: function(e){
        return /^\$?[a-z_]([a-z0-9_]+)?((\.[a-z0-9_]+|\[[\s\S]+?\])+)?([\s]+?)?\((|[\s\S]+?)\)$/i.test(e);
    }
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
$js.countSymbols = function(structure, char, ignore){
    var ignore = Array.isArray(ignore) ? ignore : [];
    switch(char){
        case "'":
            if(ignore.indexOf('simple_quote') < 0){
                structure.simple_quote = (structure.quote == 0 ? structure.simple_quote + 1 : structure.simple_quote) % 2;
            }
            break;
        case '"':
            if(ignore.indexOf('quote') < 0){
                structure.quote = (structure.simple_quote == 0 ? structure.quote + 1 : structure.quote) % 2;
            }
            break;
        case "{":
            if(structure.quote == 0 && structure.simple_quote == 0 && ignore.indexOf('brace') < 0){
                structure.brace++;
            }
            break;
        case "}":
            if(structure.quote == 0 && structure.simple_quote == 0 && ignore.indexOf('brace') < 0){
                structure.brace--;
            }
            break;
        case "[":
            if(structure.quote == 0 && structure.simple_quote == 0 && ignore.indexOf('bracket') < 0){
                structure.bracket++;
            }
            break;
        case "]":
            if(structure.quote == 0 && structure.simple_quote == 0 && ignore.indexOf('bracket') < 0){
                structure.bracket--;
            }
            break;
        case "(":
            if(structure.quote == 0 && structure.simple_quote == 0 && ignore.indexOf('parenthese') < 0){
                structure.parenthese++;
            }
            break;
        case ")":
            if(structure.quote == 0 && structure.simple_quote == 0 && ignore.indexOf('parenthese') < 0){
                structure.parenthese--;
            }
            break;
    }
}
/*
    @copyObject(e): fonction cachée permettant de copier un objet JSON sans prendre en compte
    sa référence, ainsi la copie sera totalement indépendante de l'originale
    @params:
        e   : [JSON | Object] objet à copier

    @return : [JSON | Object] objet copié
*/
$js.copyObj = function(e){
    return JSON.parse(JSON.stringify(e));
}
/**
 * 
 * @param {*} e
 * @description: enlève les doublons dans un tableau 
 */
$js.uniqueArray = function(e){
    var r = [];
    if(!Array.isArray(e)){
        return e;
    }
    for(var i in e){
        if(r.indexOf(e[i]) < 0){
            r.push(e[i]);
        }
    }
    return r;
}
/**
 * 
 * @param {*} array 
 * @param {*} value 
 * @param {*} greedy 
 */
$js.pop = function(array, value, greedy){
    var r = [],
        greedy = $js.set(greedy, true);
    for(var i in array){
        if(array[i] !== value){
            r.push(array[i]);
        }else if(!greedy){
            break;
        }
    }
    return r;
}
/**
 * @description : fusionner deux tableaux
 */
$js.merge = function(base,options){
    var r = base,
        t = options;
    for(var i in t){
        r.push(t[i]);
    }
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
        e = ref ? model : $js.copyObj(model),
        r = e;
    for(var i in options){
        r[i] = options[i];
    }
    return r;
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
* @clearSpace
* */
$js.clearSpace = function(e){
    return typeof e == 'object' && [undefined, null].indexOf(e) < 0 ? e : e.toString().replace(/^([\s]+)?|([\s]+)?$/g, '');
}
/**
 * 
 * @param {*} e 
 */
$js.preg_quote = function(e){
    return e.toString().replace(/(\$|\.|\\|\/|\*|\+|\?|\[|\]|\(|\)|\||\{|\}|\^)/g, '\\$1');
}
/**
 * 
 * @param {*} e 
 */
$js.unQuote = function(e){
    return $js.is.string(e,true) ? e.replace(/^("|')|("|')$/g, '') : e;
}
/**
 * 
 * @param {*} e 
 */
$js.setToString = function(e){
    if(typeof e != 'object' || e == null || e == undefined){
        e = /([\d]+|true|false)/.test(e) ? e : '"'+e+'"';
    }
    return e;
}

var compile = new Synthetic('./', true);
var date = new Date().getTime(), d2;
compile.compileFile('dev.main').then(function(e){
    d2 = new Date().getTime();
    // t2 = performance.now();
    console.log('[CODE]',e.code);
    console.log('[Time]', d2 - date, '/');
});
var node_env = typeof module == 'object' && 'exports' in module,
    dom_env = window === undefined || 'document' in window;
if(node_env){
    var xhr = require("fs");
}
var _empty = function(){},
    EMPTY = new _empty(),
    NULL = new _empty(),
    MIXINOBJECT = new _empty();
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
    'extends', 'with', 'require', 'slimPhase', 'private','unused', 'const',
    'unset', 'export','upper','root','external', 'async', 'return', '@js', 'label',
    'for', 'while', 'loop', 'override', 'switch','case','default', 'strict_mode',
    'final', 'invoke', 'reset'
],
lazyKeys = ['import', 'from', 'include'],
baseType = ['Any', 'String', 'Number', 'JSON', 'Array', 'Boolean', 'RegExp', 'Function', 'External'],
breakableKeys = ['return', 'break'],
callAsMethodKeys = ['mixin', 'function'],
privatisableKeys = ['mixin', 'unused', 'final'],
finalizableKeys = ['mixin'],
typeCreatorKeys = ['mixin'],
typeBehinAcceptionKeys = ['with'],
nativeFunctions = [
    'out', 'print','split', 'typeof', 'replace', 'lower', 'maj', 'len',
    'tap', 'push','pop','shift', 'delete', 'sort','reverse', 'revSort',
    'filter', 'round','max','min', 'floor','ceil','abs', 'pow', 'join',
    'str', 'int', 'float', 'bool', 'timer', 'jsExec', 'platform', 'raise'
],
nativeFunctionTypes = {
  "int" : 'Number', "max" : 'Number', "min" : "Number", "float" : "Number",
  "len" : "Number", "floor": "Number", "ceil": "Number", "abs": "Number",
  "pow" : "Number", "round" : "Number", "bool" : "Boolean", "str": "String",
  "maj" : "String", "lower": "String", "replace" : "String", "typeof" : "String",
  "out": "Any", "print" : "Any", "timer": "Any", "jsExec": "Any", "raise": "Any",
  "pop": "Any", "shift": "Any", "split": "Array", "sort": "Array", "reverse": "Array",
  "revSort": "Array", "filter": "Array", "join": "String", "platform": "String", "tap" : "String",
  "push": "Any", "delete" : "Any"
},
ObjectIDS = [],
tagHistory = {},
nativeFunctionRef = ['push','typeof','pop','shift','delete','sort','reverse','revSort'], //Pour les fonctions natives nécessitant des références au lieu des valeurs
nativeFunctionRefPrime = ['push', 'pop','shift'], //Pour les fonctions natives nécessitant des références au lieu des valeurs pour le premier argument seulement
types = baseType,
operators = ['+','-','*','/','%','~'],
signs = ['+','-','*','/','%','~','<','>', '&&', '||','=','!'],
//Slim stuffs
singleTags = ['br','hr','input','area','meta','img','link','param','slimAction'],
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
var EOS = [' ', '\n', '\t', ';','(','[','{','.', ':','+','-','/','=','~','*','%', '<'];
//plugins
var plugins = {};

//Class of Synthetic
var Synthetic = function(root, _ncall, _pathList, _initWithDOM){
//Si on est à la base de la compilation
    this._ncall = _ncall === undefined || typeof _ncall != 'number' ? 0 : _ncall;
//Initialiser avec DOM mod
    this._initWithDOM = _initWithDOM == undefined ? true : initWithDOM;
//Root Path
    this.root = undefined || root === null || typeof root != 'string'  ? './' : root;
//OriginPathRoot
    this.originPathList = _pathList == undefined ? [] : _pathList;
//Real path
    this.realpath = '';
    this.currentFile = '';
//Current Code
    this.currentCode = '';
//Cursor at 0
    this.cursor = 0;
//CurrentLine : current line of code
    this.currentLine = 1;
//Current Scope:
    this.currentScope = 0;
//current modules
    this.currModules = {'0,0': {}};
//definedModules
    this.definedModules = [];
//scopeAxis
    this.scopeAxis = {0 : [0]};
//Exported Modules
    this.exportedModules = {};
//visibilityToggler
    this.visibilityToggler = {
        primitive : false,
        structure : false
    };
//next const
    this.nextConst = {0:false};
//current strict mode
    this.nextFinal = {0 : false};
//current unset mode
    this.nextUnset = {0 : false};
//current keyword
    this.currentKeyword = {0 : null};
//current override
    this.currentOverride = {0 : false};
//current reason
    this.currentReason = {0: false};
//current trying
    this.currentTrying = {0: null};
//break block in scope
    this.scopeBreak = {0: false};
    this.scopeBreakEnter = {0: false};
//currentType
    this.currentType = {0 : null};
//currentTypeData
    this.currentTypeData = {0:{
            _hasValueConstraint : false,
            _wrappable: false,
            _keyConstraints : ['Any'],
            _valueConstraints : ['Any']
        }
    };
//breakLevel
    this.breakLevel = -1;
//anonymousFn
    this.anonymousFn = [];
//current Function in use
    this.currentFunctionInUse = {0: null};
//current Callback Root
    this.currentCallbackRoot = {0: null};
//current strict mode
    this.currentStrictMode = {0: null};
//current generic
    this.currentGeneric = [];

//Slim stuff
//var current Render
    this.currentRender = null;
//mixin defined
    this.mixinDefined = [];
//current Mixin in use
    this.currentMixinInUse = {0: null};
//current rendering scope
    this.currentRenderScope = 0;
//current tag id
    this.currentTagId = 0;
//current DOM Element
    this.currentDOMElement = {0: !dom_env ? null : {
        attr: {},
        index: 0,
        parent: 0,
        dom : this._initWithDOM ? document.querySelector('slim-app') : null
    }};
//current layer
    this.mainLayer = null;
//current SDOM (synthetic document object methode) Element
    this.SDOMElements = {};
//current acting invokation
    this.currentInvokation = {0: null};
//current invokation data
    this.currentInvokationData = {0: []};
}

var $js = Synthetic,
    $sy = Synthetic.prototype;
//Prototypage
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
    var _normal = typeof value == 'function' || value === undefined,
        $this = this,
        curr = typeof fn == 'number' ? fn : beginAt === undefined ? (_normal ? $this.cursor : 0) : beginAt,
        fn = typeof value == 'function' ? value : fn,
        value = typeof value != 'function' && value !== undefined ? value : this.currentCode,
        terminate = false,
        i,j = value.length;
    function upt(_n,_other){
        var _other = $js.set(_other,false),
            _n = $js.set(_n, $this.cursor);
        i = _n;
        if(!_other){
            $this.cursor = i;
        }
    }
    function finish(){
        i = value.length;
        terminate = true;
    }
    i = curr;
    while(i < j){
        if(value[i] == '\n' && _normal){
            $this.currentLine++;
        }
        if(fn(value[i], i, upt, finish) !== undefined){
            break;
        }
        if(!terminate){
            i++;
            if(_normal){
                $this.cursor++;
                i = $this.cursor;
            }
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
$sy.fileAccessChecker = function(filename){
    // console.log('%c[ROOT]', filename,'<>', this.realpath);
    var $this = this,
        filepath = $this.realpath.substr($this.root.length, $this.realpath.length),
        filepatharr = filepath.split('/'),
        file = filepatharr[filepatharr.length - 1].replace(/\.lh$/i, ''),
        nextPath = '',
        hasNext = true,
        lastpkg;
    filepatharr.pop();
    if(filepatharr.length){
        $this.syncLoop(filepatharr, function(e,i){
            nextPath += (i > 0 ? '/' : '')+e;
            if(lastpkg == undefined || ('packages' in lastpkg && lastpkg.packages.indexOf(e) >= 0)){
                hasNext = true;
            }
            else{
                hasNext = false;
                return false;
            }
            var e = $this.fileReader($this.root+nextPath+'.lpkg', false);
            lastpkg = $this.packager(e, $this.root+nextPath+'.lpkg');
        });
        if(!(hasNext && 'files' in lastpkg && lastpkg.files.indexOf(file) >= 0)){
            $this.debugging(filename+" is not visible !");
        }
    }
};
//fileReader : to read file content
$sy.fileReader = function(filename, check, inside){
    var check = check === undefined ? false : check,
        inside = $js.set(inside, false),
        $this = this;
    if(!/\.lpkg/.test(filename)){
        filename = $this.urlParser(filename);
        filename = new RegExp("\\.("+defExt+"|lpkg)$","i").test(filename) ? filename : filename+'.'+defExt;
        $this.realpath = filename;
        $this.originPathList.push(filename);
    }
    function call(){
        //Si ce fichier a déjà été appelé
        if(filename in sourceDB){
            return  sourceDB[filename];
        }
        if(node_env){
            var content =  xhr.readFileSync(filename, 'utf-8');
            return clear(content);
        }
        else{
            var rawFile = new XMLHttpRequest(),
                allText = 'Cool';
            rawFile.open("GET", filename, false);
            rawFile.onreadystatechange = function (){
                if(rawFile.readyState === 4){
                    if(rawFile.status === 200 || rawFile.status == 0){
                        allText = clear(rawFile.responseText);
                    }
                }
            }
            rawFile.send(null);
            return allText;
        }
    }
    function clear(content){
        content =  content.replace(/\/\/([\S ]+)?\n|\/\/([\S ]+)?$/g, '\n');
        var m = content.match(/\/\*([\S\s]+?)?\*\//g);
        var n = 0;
        for(var i in m){
            n = m[i].match(/\n/g);
            content = content.replace(m[i], n.join(''));
        }
        content += '\n';
        if(!inside){
            sourceDB[filename] = content;
            $this.currentCode = content;
        }
        return content;
    }
    if($this._ncall > 0 && check){
        $this.fileAccessChecker(filename)
    }
    return call();
};
//debugger
$sy.debugging = function(string, custom){
    var line = $js.set(line, this.lastLine(this.cursor)),
        custom = $js.set(custom, false);
    throw new Error(this.realpath+(custom ? " :: " :" :: Error at line "+line+" occured expressions >> ")+string);
};
//parent scope finder
$sy.parentScopeFinder = function(line, level,stringify){
    var last = {x: 0, y: 0},
        $this = this,
        stringify = $js.set(stringify, false),
        lines = [],
        line = parseInt(line);
        level = parseInt(level);
    // console.warn('[Axis]',line,level,$js.copyObj(scopeAxis))//, $js.copyObj(currModules));
    // console.log('[PARENT]', $this.getCurrentCallbackRoot());
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
        inc = 0,
        //Pour restreindre l'étendue au parent d'un callback
        parallele = $this.getCurrentCallbackRoot(),
        _p_line = parallele != null ? parallele[0] : null,
        _p_level = parallele != null ? parallele[1] : null,
        _p_inject = false, _p_level_up = false,
        _p_inc = 0;
    // console.log('[parallele]',_p_line, level)
    do{
        if(parallele != null){
            _p_level_up = e.x <= _p_level;
        }
        // console.log('[**]',!_p_inject && parallele != null && _p_inc > 0 ? _p_line : line, level, '/', _p_line, _p_inc,!_p_inject && parallele != null);
        e = $this.parentScopeFinder(!_p_inject && parallele != null && _p_level_up && _p_inc > 0 ? _p_line : line, level - inc);
        if(r.indexOf(e.y+','+e.x) < 0){
            r.push(e.y+','+e.x);
        }
        if(_p_level_up){
            _p_inject = _p_inc > 0;// && e.x < _p_level;
            _p_inc++;
        }
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
        }
        else{
            for(var i in modules){
                $this.currModules[key][alias][i] = modules[i];
            }
        }
    }
    else{
        if(choices.length && choices[0] != '*'){
            for(var i in choices){
                if(choices[i] in modules){
                    $this.currModules[key][choices[i]] = modules[choices[i]];
                    $this.definedModules.push(choices[i]);
                    if(modules[choices[i]].label == 'mixin'){
                        $this.mixinDefined.push(choices[i]);
                    }
                }
                else{
                    $this.debugging("Can't import module [ "+choices[i]+" ]");
                }
            }
        }
        else{
            for(var i in modules){
                $this.definedModules.push(i);
                if(modules[i].label == 'mixin'){
                    $this.mixinDefined.push(i);
                }
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
    // console.log('[Parent]', key, {line,level})
    // console.log('%c[Save] %c'+meta.name+"%c in %c"+$this.realpath, 'color: lightgreen', 'background-color: yellow; color: gray', 'color: green; background-color: white', 'background-color: gray; color: #333');
    // console.warn('[Saving]',meta,line,level,key,n_key, $js.copyObj(currModules))
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
    }
    else if(meta.name in $this.exportedModules){
        delete $this.exportedModules[meta.name];
    }
    if(typeCreatorKeys.indexOf(meta.label) >= 0){
        types.push(meta.name);
        if(meta.label == 'mixin'){
            $this.mixinDefined.push(meta.name);
        }
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
        $this.debugging("invalid syntax or unavailable scope reached !");
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
    // console.log('[Finder]',name,pointer,$js.copyObj(this.currModules));
    var mod = name,
        alias = mod[0],
        r = null,
        isNativeUtils = nativeFunctions.indexOf(alias) >= 0,
        withIndex = $js.set(withIndex, false),
        scopeList = isNativeUtils ? ['0,0'] : scopeList,
        target = isNativeUtils ? {key: '0,0'} : $this.moduleTargetScope(name, scopeList),
        targetScope = target.targetScope;
    // console.log('[target]', targetScope)
    if(isNativeUtils){
        key = '0,0';
        r = {
            arg: {},
            body: "[Native code]",
            cursor: 26,
            label: "function",
            level: 1,
            line: 1,
            type: $js.set(nativeFunctionTypes[name], "Any"),
            visible: true
        }
    }
    else if(targetScope != null){
        r = targetScope[alias];
        // console.log('%cTarget', 'background-color: lightgreen; color: #333',$js.copyObj(r),mod)
        if(mod.length > 1 && r.label == 'alias'){
            for(var j = 1, k = mod.length; j < k; j++){
                if(mod[j] in r){
                    if(r[mod[j]].label == 'variable'){
                        r = r[mod[j]].value;
                    }
                    else{
                        r = r[mod[j]];
                    }
                }
            }
        }
        if($js.isInternalObject(r) && r.label == 'mixin-place'){
            // r = {};
        }
        // console.warn('[Warn]', $js.copyObj(r))
    }
    return withIndex ? {r: r, index : target.key} : r;
};
//Module Value Index : pour récupérer la valeur d'un objet même avec les indexs
$sy.moduleValueIndex = function(name,withRoot,line,scope){
    // console.log('[Name]',name);
    var $this = this,
        withRoot = $js.set(withRoot, false),
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
//toRegExp : transformer des chaines en objet d'expression regulière
$sy.toRegExp = function(string){
    var r = /^\/([\S]+?)\/([a-z]+)?$/.exec(string);
    r = new RegExp(r[1], r[2]);
    return r;
};
//getTypeFrom
$sy.getPrimitiveTypeFrom = function(e){
    var r = 'String';
    if($js.is.boolean(e)){
        r = 'Boolean';
    }
    else if($js.is.number(e)){
        r = 'Number';
    }
    else if($js.is.array(e) || Array.isArray(e)){
        r = 'Array';
    }
    else if($js.is.json(e) || $js.isJson(e)){
        r = 'JSON';
    }
    else if($js.is.anonymousFn(e)){
        r = 'Function';
    }
    return r;
}
//valueFinalizer: ***
$sy.valueFinalizer = function(string, constraint){
    string = $js.clearSpace(string);
    var r = string,
        constraint = $js.set(constraint, 'Any'),
        $this = this;
    // console.error('[String]', string, constraint)
    constraint = Array.isArray(constraint) ? constraint : [constraint];
    $this.setCurrentTypeData();
    if($js.is.number(string)){
        // console.log('[NUM]',string, constraint)
        if(/*$this.getCurrentTypeData()._hasValueConstraint &&*/ !$js.hasCommonValues(['Any', 'Number'], constraint)){
            $this.debugging("can't cast [ "+string+" ] as "+constraint.join(' or as '));
        }
        r = parseFloat(string);
    }
    else if($js.is.boolean(string)){
        //@replace
        if(!$js.hasCommonValues(['Any', 'Boolean'], constraint)){
            $this.debugging("can't cast [ "+string+" ] as "+constraint.join(' or as '));
        }
        r = $js.toBoolean(string);
    }
    else if($js.is.anonymousFn(string)){
        var n = string.match(/\n/g);
        n = Array.isArray(n) ? n.length + 1 : 1;
        $this.currentLine -= n;
        r = $this.fn('', {
            type: '',
            name: '',
            cursor: cursor - string.length,
            anonymous: true
        });
        $this.currentTypeData[$this.currentScope]._hasValueConstraint = false;
        // r = EMPTY;
    }
    else if($js.is.variable(string)){
        var index = $this.indexExtractor(string,$this.currentLine,$this.currentScope,true);
        var mod = $this.index(string);
        if(mod == null){
            if($this.isExecutionStrict()){
                $this.debugging(string+" is not defined !");
            }
            //@replace
            if(!$js.hasCommonValues(['Any', $this.getPrimitiveTypeFrom(string)], constraint)){
                $this.debugging("can't cast [ "+string+" ] as "+constraint.join(' or as '));
            }
            return r;
        }
        while(['root','upper'].indexOf(index.path[0]) >= 0){
            index.path.shift();
        }
        var _td = $this.getCurrentTypeData(),
            isAbstractMixin = $js.isInternalObject(mod) && mod.label == 'mixin-place',
            _modType = $js.merge(["Any"], isAbstractMixin ? mod.type : [mod.type, $this.getPrimitiveTypeFrom(mod.value)]);
        // @experimental
        if(['JSON', 'Array'].indexOf(mod.type) >= 0 && mod.typeData != null){
            $js.merge(_modType, mod.typeData._valueConstraints, true);
        }
        // console.log('[FIN-MOD]', string, mod.type, constraint,$js.hasCommonValues(constraint, [mod.type, "Any"]),[mod.type, "Any"])
        // @experimental
        // if($js.isJson(mod.typeData) && $js.hasCommonValues(constraint, $js.merge([mod.type], mod.typeData._valueConstraints))){
        //
        // }
        // else
        if(!$js.hasCommonValues(constraint, _modType)){
            //si le type est une fonction et le module est une function
            if(!$js.hasCommonValues(constraint, ['Function']) || !$js.isFunction(mod)){
                $this.debugging("can't cast [ "+string+" ] as "+constraint.join(' or as '));
            }
        }
        else if(_td._hasValueConstraint && constraint.length == 1 && !isAbstractMixin){
            //si le module n'a pas de type de donnée
            //on vérifie si les contraintes d'intégrité correspondent
            if(mod.typeData == null ||
                (
                    ["JSON", "Array"].indexOf(constraint[0]) >= 0 &&
                    (
                        (mod.typeData._wrappable && !_td._wrappable) ||
                        !$js.hasCommonValues(_td._keyConstraints, mod.typeData._keyConstraints, true) ||
                        !$js.hasCommonValues(_td._valueConstraints, mod.typeData._valueConstraints, true)
                    )
                )
            ){
                // @experimental
                if(mod.typeData != null || !$js.hasCommonValues(_td._valueConstraints, [mod.type, $this.getPrimitiveTypeFrom(mod.value)])){
                    $this.debugging("can't cast [ "+string+" ] as "+constraint.join(' or as ')+" with integrity constraints !");
                }
            }
        }
        index.path.shift();
        r = !$js.isJson(mod) || isAbstractMixin || ['mixin', 'function','external'].indexOf(mod.label) >= 0 ? mod : (index.path === undefined ? ($js.isInternalObject(mod) ? mod.value : mod) : $this.valueIndexation(mod.value, index.path));
    }
    else if($js.is.callable(string)){
        console.log('[Call]',string);
    }
    else{
        // console.log('[const]',$this.currentTypeData)
        //@replace
        if(!$js.hasCommonValues(constraint,['Any', $this.getPrimitiveTypeFrom(string)])){
            $this.debugging("can't cast [ "+string+" ] as "+constraint.join(' or as '));
        }
    }
    // console.log('[-->R',r);
    return r;
};
//Value checker: vérifier si la valeur donnée répond bien à la contrainte définie
$sy.valueChecker = function(constraint, value, line){
    var _value = value,
        $this = this,
        line = $js.set(line, $this.currentLine),
        _isfn = $js.is.anonymousFn(value);
    // console.warn('[val]',value, constraint, _isfn, $this.currentLine)
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
                    $this.debugging("Error from line "+line+", ["+_value+"] is not a type of "+constraint,true)
                }
            break;
            case 'String':
                if( (ifmodule != null && ['Any',constraint].indexOf(ifmodule.type) < 0) || !$js.is.string(value) ){
                    $this.debugging("Error from line "+line+", ["+_value+"] is not a type of "+constraint,true)
                }
            break;
            case 'Boolean':
                if( (ifmodule != null && ['Any',constraint].indexOf(ifmodule.type) < 0) || !$js.is.boolean(value) ){
                    $this.debugging("Error from line "+line+", ["+_value+"] is not a type of "+constraint,true)
                }
            break;
            case 'JSON':
                if( (ifmodule != null && ['Any',constraint].indexOf(ifmodule.type) < 0) || !$js.isJson(value) ){
                    $this.debugging("Error from line "+line+", ["+_value+"] is not a type of "+constraint,true)
                }
            break;
            case 'Array':
                if( (ifmodule != null && ['Any',constraint].indexOf(ifmodule.type) < 0) || !Array.isArray(value) ){
                    $this.debugging("Error from line "+line+", ["+_value+"] is not a type of "+constraint,true)
                }
            break;
            case 'Function':
            case 'External':
                if(( (ifmodule != null && ['Any',constraint].indexOf(ifmodule.type) < 0) || (!$js.is.anonymousFn(value) && ['function', 'external'].indexOf($js.set(value.label,'')) < 0 ) ) ){
                    $this.debugging("Error from line "+line+", ["+_value+"] is not a type of "+constraint,true)
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
        pathVal = 'this.currModules["'+scope+'"].'+meta.name+'.value'+index;
    if(sign != '='){
        var val = eval(pathVal);
        value = this.calculator(val, value, sign, meta.typeData);
        sign = '=';
    }
    else{
        if(typeof value == 'object' && value.label == 'function'){
            var type = value.type;
            if(index != ''){
                type = this.getPrimitiveTypeFrom(eval(pathVal));
                type = type == 'String' ? 'Any' : type;
            }
            value.type = type;
            value.typeData = meta.typeData;
        }
    }
    value = $js.isJson(value) ? JSON.stringify(value,'',' ') : $js.setToString(value);
    // console.log('[Val]',value);
    var string = pathVal+' '+sign+' '+value;
    try{
        eval(string);
    }catch(e){
        console.log('[Error]',e);
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
//Get Value constraint
$sy.getValueConstraint = function(constraint){
    var _key = [],
        _value = [], _imbricable = false,
        _switch = false,
        _v = '', _coma = 0, _added = 0,
        $this = this;
    if(['Array','JSON'].indexOf(constraint) < 0){
        $this.debugging("action "+constraint+"<T,..?> not allowed for [ "+constraint+" ] type !");
    }
    function clear(e){
        return e.replace(/^([\s]+?)?(,|\|)([\s]+?)?|^([\s]+?)|([\s]+?)?>$|([\s]+?)$/g, '');
    }
    function push(){
        _v = clear(_v);
        if(_v != '...' && types.indexOf(_v) < 0 && $this.currentGeneric.indexOf(_v) < 0){
            $this.debugging("[ "+_v+" ] is not a defined type !");
        }
        if(_v == '...'){
            if(constraint == 'JSON'){
                if(!_key.length){
                    _key.push('Any');
                }
            }
            _imbricable = true
            _coma = 1;
        }
        else if(!_switch && constraint != 'Array'){
            if(_v == 'Any') {
                $this.debugging("[ Any ] can't be a key constraint !")
            }
            _key.push(_v);
        }
        else{
            _value.push(_v);
        }
        _v = '';
        _added++;
    }
    $this.syncLoop(function(char){
        if(!/[a-z0-9_ ,<>\|.]/i.test(char)){
            $this.debugging(char);
        }
        if(char == ','){
            if(_coma > 2 || (_added == 0 && !/[\S]/.test(_v))){
                $this.debugging(char);
            }
            else if(constraint == 'Array' && clear(_v).length && !/\.{3}/.test(_v)){
                $this.debugging("constraint syntax not allowed for Array type !");
            }
            push();
            _switch = true,
            _coma++;
        }
        if(char == '|'){
            if(/\.{3}/.test(_v)){
                $this.debugging(_v+" is not allowed here !");
            }
            else if((_added == 0 && !/[\S]/.test(_v)) || (constraint == 'JSON' && _key.length == 0 && clear(_v).length == 0)){
                $this.debugging(char);
            }
            push();
        }
        _v += char;
       if(char == '>'){
           push();
           return false;
       }
    });
    if(_value.length == 0 && _key.length){
        _value = _key;
    }
    if(!($this.currentScope in $this.currentTypeData)){
        $this.currentTypeData[$this.currentScope] = {};
    }
    // console.log({_key, _value,_imbricable})
    $this.currentTypeData[$this.currentScope]._hasValueConstraint = true;
    $this.currentTypeData[$this.currentScope]._wrappable = _imbricable;
    $this.currentTypeData[$this.currentScope]._keyConstraints = _key;
    $this.currentTypeData[$this.currentScope]._valueConstraints = _value;
    return $this.currentTypeData[$this.currentScope];
}
//Get current type
$sy.getCurrentType = function(_scope){
    var _scope = $js.set(_scope, this.currentScope);
    return _scope in this.currentType ? this.currentType[_scope] : null;
}
//Get current typeData
$sy.getCurrentTypeData = function(_scope){
    var _scope = $js.set(_scope, this.currentScope);
    return _scope in this.currentTypeData ? $js.copyObj(this.currentTypeData[_scope]) : {
        _hasValueConstraint: false,
        _keyConstraints: ["Any"],
        _valueConstraints: ["Any"],
        _wrappable: false
    };
}
//Get current typeData
$sy.getCurrentCallbackRoot = function(_scope){
    var _scope = $js.set(_scope, this.currentScope);
    return _scope in this.currentCallbackRoot ? $js.copyObj(this.currentCallbackRoot[_scope]) : null
}
//Set Current typeData
$sy.setCurrentTypeData = function(_scope){
    var _scope = $js.set(_scope, this.currentScope);
    if(!(_scope in this.currentTypeData)){
        this.currentTypeData[_scope] = this.getCurrentTypeData(_scope);
    }
}
//Get current override
$sy.getCurrentOverride = function(_scope){
    var _scope = $js.set(_scope, this.currentScope);
    return _scope in this.currentOverride ? $js.copyObj(this.currentOverride[_scope]) : false;
}
//Get set current invokation
$sy.setCurrentInvokationData = function(_actions,_scope){
    var _scope = $js.set(_scope, this.currentScope);
    if(!(_scope in this.currentInvokationData)){
        this.currentInvokationData[_scope] = [];
    }
    this.currentInvokationData[_scope].push(_actions);
}
//Get get current invokation
$sy.getCurrentInvokationData = function(_scope){
    var _scope = $js.set(_scope, this.currentScope);
    if(!(_scope in this.currentInvokationData)){
        this.currentInvokationData[_scope] = [];
    }
    return this.currentInvokationData[_scope];
}
//Get current invokation
$sy.getCurrentInvokation = function(_scope){
    var _scope = $js.set(_scope, this.currentScope);
    return _scope in this.currentInvokation ? this.currentInvokation[_scope] : null;
}
//Get current override
$sy.isConstForNext = function(_scope){
    var _scope = $js.set(_scope, this.currentScope);
    return _scope in this.nextConst ? $js.copyObj(this.nextConst[_scope]) : false;
}
//Get current override
$sy.isFinalForNext = function(_scope){
    var _scope = $js.set(_scope, this.currentScope);
    return _scope in this.nextFinal ? $js.copyObj(this.nextFinal[_scope]) : false;
}
//Get current override
$sy.isUnsetForNext = function(_scope){
    var _scope = $js.set(_scope, this.currentScope);
    return _scope in this.nextUnset ? $js.copyObj(this.nextUnset[_scope]) : false;
}
//is running in strict mode
$sy.isExecutionStrict = function(_scope){
    var _scope = $js.set(_scope, this.currentScope),
        r = false;
    if(_scope in this.currentStrictMode){
        for(var i in this.currentStrictMode){
            if(i > _scope){
                break;
            }
            r = this.currentStrictMode[i];
        }
    }
    return r;
}
//get currentMixinRendering
$sy.getCurrentMixinRender = function(_scope, _all){
    var _scope = $js.set(_scope, this.currentScope),
        r = null,
        _all = $js.set(_all, false),
        before, after,
        i;
    for(var i in this.currentMixinInUse){
        if(this.currentMixinInUse[i]){
            if(i <= _scope){
                before = this.currentMixinInUse[i];
            }
            else{
                after = this.currentMixinInUse[i];
            }
        }
    }
    r = before == null ? after : before;
    // for(var i = _scope; i >= 0; i--){
    //     if(i in this.currentMixinInUse && this.currentMixinInUse[i] != null){
    //         r = this.currentMixinInUse[i];
    //         break;
    //     }
    // }
    return _all ? {r : r, scope: i} : r;
}
//get currentDOM
$sy.getCurrentDOM = function(_scope){
    var _scope = $js.set(_scope, this.currentRenderScope);
    return _scope in this.currentDOMElement ? this.currentDOMElement[_scope] : this.currentDOMElement[0];
}
$sy.getAbstractionArguments = function(mixin){
    var _args = {};
    for(var i in mixin.attr){
        _args[mixin.attr[i].index] = mixin.attr[i].name;
    }
    this.passBlank();
    if(this.currentCode[this.cursor] != '('){
        this.debugging(this.currentCode[this.cursor]);
    }
    return this.getMixinArgument(mixin,_args);
}
//get mixin abstraction
$sy.getMixinAbstraction = function(meta, _finalize, _path){
    var __s = $js.getSymbols(),
        _path = $js.set(_path, meta.name),
        _id = $js.newId(), //on crée une nouvel id pour authentifier l'objet
        _c,
        _finalize = $js.set(_finalize, true),
        $this = this,
        _mixin, _args = {},
        e = {
            label: 'mixin-place',
            cursor: this.cursor,
            line: this.currentLine,
            mixiname: meta.name,
            pathname: _path,
            level: this.currentScope,
            type: $js.merge([meta.type], meta.legacy),
            objid: _id,
            origin: this.realpath,
            arg : {}
        },
        _mixin = this.index(_path);
    ObjectIDS.push(_id);
    if(_mixin == null){
        this.debugging("mixin [ "+meta.name+" ] is undefined !");
    }
    // console.warn('[Name]',meta.name,'==>',_path, '/', _finalize)
    if(_finalize){
        e.arg = this.getAbstractionArguments(_mixin);
    }
    // console.log('[Code]',this.currentCode.substr(this.cursor, 20))
    e.cursor = this.cursor;
    return e;
}
//Value finder
$sy.valueFinder = function(statementBreak, _inc, _cursor,renderMode,untilEnd,constraintType,_finalize){
    var r = [],
        $this = this,
        statementBreak = $js.isJson(statementBreak) ? statementBreak : [statementBreak],
        _inc = Array.isArray(_inc) ? _inc : [$js.set(_inc,0)],
        renderMode = $js.set(renderMode,false),
        untilEnd = $js.set(untilEnd, false),
        _finalize = $js.set(_finalize, true),
        constraintType = $js.set(constraintType, 'Any'),
        _cursor = $js.set(_cursor, $this.cursor), _scope,
        _options = $js.extend({
            statementBreak : statementBreak,
            _inc: _inc,
            _cursor: _cursor,
            renderMode: renderMode,
            untilEnd: untilEnd,
            constraintType: constraintType,
            _wrappable: true,
            _passAfter: [],
            _hasValueConstraint : $this.getCurrentTypeData()._hasValueConstraint,
            _keyConstraints : $this.getCurrentTypeData()._keyConstraints,
            _valueConstraints : $this.getCurrentTypeData()._valueConstraints,
            _finalize: _finalize,
            _allowTypage : false,
            _mixinSetting: false,
            _getRef : false,
            _mixinArgFinalize: true
        },$js.isJson(statementBreak) && !Array.isArray(statementBreak) ? statementBreak : {}),
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
        _render = '', _val = '', _hasPendingExternal = false,
        _sym_chk = false, _removeLastParentheses = false,
        _char = [];
    _options._inc = _options._inc.length ?_options. _inc : [0];
    _options.constraintType = Array.isArray(_options.constraintType) ? _options.constraintType : [_options.constraintType];
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
    $this.syncLoop(function(char,i){
        //Si on est en mode lecture laxiste, on prend en compte seulement les ( )
        if(renderMode === true){
            val += char == '\\' && $this.currentCode[i-1] != '\\' ? '' : char;
            if($this.currentCode[i-1] != '\\'){
                //On évite les contraintes des quotes
                $js.countSymbols(s,char, ['quote', 'simple_quote']);
                //À chaque caractère blanc, on met à jour le rendu
                if(/[\s]/.test(char)){
                    _render += val;
                    val = '';
                }
                //S'il y a une nouvelle parenthese ouvert, on vérifie si c'est une appelation de fonction ou une espace d'exécution
                if(char == '(' && s.parenthese == 1){
                    val = $js.clearSpace(val.replace(/\($/, ''));
                    _len = val.length;
                    _val = $js.clearSpace(val);
                    if(_val.length && /^@/.test(_val) && $this.currentCode[$this.cursor - _len - 1] != '\\'){
                        var _e = $this.callable(_val.replace(/^@/, ''))
                        // console.log('[Fin]', {val,_val,_e})
                        _e = $js.is.string(_e,true) ? $js.unQuote(_e) : _e;
                        val = val.replace(_val, _e);
                        s.parenthese--;
                    }
                    else{
                        // console.log('[REJECT]',_val);
                        $this.cursor++;
                        var _e = $this.valueFinder(")", -1);
                        s.parenthese--;
                        val += $js.is.string(_e,true) ? $js.unQuote(_e) : _e;
                    }
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
            if($this.currentCode[i-1] != '\\'){
                $js.countSymbols(s,char);
            }
            // console.log('[char]',char, $js.copyObj(s), _options.statementBreak)
            if($this.scopeBreak[$this.currentScope]){
                _tmp = $js.clearSpace(val);
                if($this.scopeBreakEnter[$this.currentScope]){
                    if(r.length && char == '\n'){
                        if(_tmp.length){
                            if(_options._finalize){
                                r.push($this.valueFinalizer(_tmp, _options.constraintType));
                            }else{
                                r.push(_tmp);
                            }
                        }
                        return false;
                    }
                }
                else if(char == '}' && s.brace == -1 && $js.checkSymbols(s, ['brace'])){
                    if(_tmp.length){
                        if(_options._finalize){
                            r.push($this.valueFinalizer(_tmp, _options.constraintType));
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
            //@generic : si le typage est autorisé
            if(char == '<' && _options._allowTypage){
                var _v = $js.clearSpace(val);
                if(!_v.length || ['Any','JSON','Array'].indexOf(_v) >= 0){
                    $this.cursor++;
                    $this.getValueConstraint(_v);
                    return;
                }
            }
            //@crochet : Array
            //Si c'est un crochet, on convertit en tableau
            if( _options._finalize && ($js.checkSymbols(s, ['bracket']) && s.bracket == 1 && char == '[' && _options.statementBreak.indexOf(char) < 0) || _options.renderMode == '['){
                if($js.clearSpace(val).length){
                    r.push(val);
                    val = '';
                }
                if(_options._hasValueConstraint && !_options._wrappable){
                    $this.debugging("Can't contains another Array !");
                }
                //@alerte: s'il n'y a pas de contrainte d'intégrité et que la structure n'est ni apte en type ou capable d'envelopper d'autre structure
                else if(!_options._hasValueConstraint && (!_options._wrappable || !$js.hasCommonValues(_options.constraintType,['Array','Any']) ) ){
                    // console.log('[const]',_options.constraintType)
                    $this.debugging("Type error at line "+$this.currentLine,true);
                }
                // console.log('[OPT]',_options);
                if(char == "[" && _val_t.length == 0){
                    $this.cursor++;
                }
                var _e = $this.valueFinder({
                    statementBreak: [",","]"],
                    _inc: [-1],
                    constraintType: !_options._hasValueConstraint ? ['Any'] : _options._valueConstraints,
                    untilEnd: true,
                    _wrappable: _options._hasValueConstraint ? $this.getCurrentTypeData()._wrappable : true
                });
                // console.log('%c[_Array]','color: lightgreen',_e,char,'/',$this.currentCode[$this.cursor], $js.copyObj(s));
                if(char == '['){ s.bracket--; }
                if(char == '('){ s.parenthese--;}
                if(char == '"'){ s.quote--;}
                if(char == "'"){ s.simple_quote--;}
                if($this.currentCode[$this.cursor] == ']'){
                    // s.bracket--;
                }
                if(_e == EMPTY){
                    _e = $this.anonymousFnManagerGet();
                    _e.type = "Any";
                }
                if($js.len(_e)){
                    _val_t.push(_e);
                }
                _options.renderMode = $this.currentCode[$this.cursor] == ']' ? false : '[';
                if(!_options.renderMode){
                    val = '';
                    if(r.length && !$js.is.sign(r[r.length- 1]) && ['?',':'].indexOf(r[r.length- 1]) < 0){
                        r[r.length - 1] = typeof r[r.length - 1] == 'object' ? r[r.length - 1] : $this.valueFinalizer(r[r.length - 1]);
                        r[r.length - 1] = $this.valueIndexation(r[r.length - 1], _val_t);
                    }
                    else{
                        r.push(_val_t);
                    }
                    _val_t = [];
                    // $this.cursor++;
                    _hint = [']', ','];
                }
                return;
            }
            //@accollade : JSON
            //Si c'est une accollade, on convertit en dictionnaire
            if( _options._finalize && ($js.checkSymbols(s, ['brace']) && s.brace == 1 && char == '{' && _options.statementBreak.indexOf(char) < 0) || _options.renderMode == '{'){
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
                //Si on avait répéré un couple de parenthèse avant ça, on considère que c'est une function
                if(_removeLastParentheses){
                    if(
                        !$js.hasCommonValues(['Any', 'Function', 'External'], _options.constraintType) ||
                        (!_hasPendingExternal && $js.hasCommonValues(_options.constraintType, ['External']) && !$js.hasCommonValues(_options.constraintType, ['Function'])) ||
                        (_hasPendingExternal && !$js.hasCommonValues(_options.constraintType, ['External'])) ||
                        (!_hasPendingExternal && _options.constraintType[0] == 'External' && _options.constraintType.length == 1)
                    ){
                        $this.debugging("Type error ! "+(_hasPendingExternal ? "Function type" : "External type")+" expected !");
                    }
                    var _f;
                    $this.cursor = _fn_cursor;
                    if(_hasPendingExternal){
                        _f = $this.external('', true,false);
                        _hasPendingExternal = false;
                    }
                    else{
                        _f = $this.fn('', {
                            name: '',
                            cursor: _fn_cursor,
                            anonymous: true
                        });
                    }
                    // console.log('[F]',_f);
                    r[r.length - 1] = _f;
                    val = '';
                    s.brace--;
                    _removeLastParentheses = false;
                    return;
                }
                // console.log('[Ok]', char, _fn_cursor, _removeLastParentheses,r)
                if(!_has_fn){
                    // console.log('[_enter_dict]',val, _options.constraintType, _options._wrappable)
                    if(_options._hasValueConstraint && !_options._wrappable){
                        $this.debugging("Can't contains another JSON !");
                    }
                    else if(!_options._wrappable && !$js.hasCommonValues(_options.constraintType,['JSON','Any'])){
                        // console.log('[constraint]',$js.copyObj(_options), $this.currentCode.substr($this.cursor, 20))
                        $this.debugging("Type error at line "+$this.currentLine,true);
                    }
                    $this.cursor++;
                    // console.warn('[ARRAY]',char);
                    _dict_last_cursor = $this.cursor;
                    // console.log('[DICT]',_dict_key, $js.copyObj($this.currentTypeData), $this.cursor, _options, $this.currentCode.substr($this.cursor, 10))
                    var _e = $this.valueFinder({
                        statementBreak: $js.merge([",","}"], _dict_key == null ? [':'] : []),
                        _inc: [-1],
                        constraintType: !_options._hasValueConstraint ? ['Any'] : _dict_key == null ? _options._keyConstraints : _options._valueConstraints,
                        _finalize: _dict_key != null,
                        untilEnd: true,
                        _wrappable: _dict_key == null ? false : _options._hasValueConstraint ? $this.getCurrentTypeData()._wrappable : true
                    });
                        // console.log('[DICT]',_e, '/', $this.currentCode[$this.cursor-1], _dict_last_cursor, $this.cursor,
                        //     '//',$this.currentCode.substr($this.cursor,20));
                    _dict_string = $js.clearSpace($this.currentCode.substr(_dict_last_cursor, $this.cursor - _dict_last_cursor));
                    if($this.currentCode[$this.cursor] == ':'){
                        _dict_key = $js.unQuote(_dict_string);
                        // console.log('[Key]',_dict_key, $this.cursor,$this.currentCode.substr($this.cursor, 10))
                        if(_options._hasValueConstraint && !$js.hasCommonValues(['Any', $this.getPrimitiveTypeFrom(_dict_key)], _options._keyConstraints)){
                            $this.debugging("[ "+_dict_key+" ] is not a type of "+_options._keyConstraints.join(' or '));
                        }
                    }
                    if($js.set(_e.label, '') == 'function'){
                        _e.type = "Any";
                    }
                    if(['}', ','].indexOf($this.currentCode[$this.cursor]) >= 0){
                        var _alone = false;
                        if(/^[a-z0-9_]+$/i.test($js.unQuote(_dict_string)) && _dict_key == null){
                            _dict_key = $js.unQuote(_dict_string);
                            _e = $this.valueFinalizer(_dict_string,_options.constraintType);
                            _alone = true;
                        }
                        else if(_dict_key == null && _dict_string.length){
                            $this.debugging(_dict_string);
                        }
                        if(_dict_key != null){
                            if(_alone && !$js.isJson(_e) && _options._hasValueConstraint && !$js.hasCommonValues(['Any', $this.getPrimitiveTypeFrom(_e)], _options._valueConstraints)){
                                $this.debugging("[ "+_e+" ] is not a type of "+_options._valueConstraints.join(' or '));
                            }
                            _val_d[_dict_key] = _e;
                        }
                        _dict_key = null;
                    }
                    _options.renderMode = $this.currentCode[$this.cursor] == '}' ? false : '{';
                    if(!_options.renderMode){
                        s.brace--;
                        // $this.cursor++;
                        _hint = ['}',':', ','];
                        r.push(_val_d);
                        // console.error('[R]',r, $js.copyObj(s))
                        val = '';
                        _val_d = {};
                    }
                    return;
                }
            }
            //Dès qu'on voit une parenthèse on le traite comme une sous-branche
            if(char == '(' && val.length == 0 && $js.checkSymbols(s, ['parenthese']) && s.parenthese == 1){
                // console.log('%c[Ok]', 'color: lightgreen', $js.copyObj(r));
                _fn_cursor = $this.cursor;
                $this.cursor++;
                var e = $this.valueFinder(')', -1);
                val = char+e+$this.currentCode[$this.cursor];
                _removeLastParentheses = true;
                r.push(e);
                val = '';
                if($this.currentCode[$this.cursor] == ')'){
                    s.parenthese--;
                }
                return;
            }
            //Si c'est un callable (function, mixin, methode) on le traite
            else if(val.length && char == '(' && $js.checkSymbols(s, ['parenthese']) && s.parenthese == 1){
                var __val = $js.clearSpace(val);
                if(__val == 'external'){
                    _hasPendingExternal = true;
                    $this.cursor--;
                }
                else{
                    if(__val.length){
                        var _mod = $this.moduleValueIndex(__val,true),
                            e, _checked = false;
                        if(_mod.root == null){
                            $this.debugging("[ "+__val+" ] is undefined !");
                        }
                        if(_options._getRef){
                            r.push(_mod.root);
                            $this.cursor--;
                            val = '';
                            return;
                        }
                        else{
                            //Si c'est un mixin et qu'on est en mode de pas finaliser les mixins
                            if(_mod.root.label == 'mixin' && !_options._mixinArgFinalize){
                                //on vérifie si le mixin possède l'un des types du contrainte
                                if(!$js.hasCommonValues(_options.constraintType, $js.merge([_mod.root.type], _mod.root.legacy))){
                                    $this.debugging("[ "+val+" ] is not a type of "+_options.constraintType.join(' or '));
                                }
                                _checked = true;
                            }
                            //Sinon, on traite le mixin
                            if(_options._hasValueConstraint && !_checked){
                                var _typeData = $this.getCurrentTypeData();
                                _mod = $js.isJson(_mod.value) && ('typeData' in _mod.value) ? _mod.value : _mod.root;
                                // console.log('[E___]', _mod, _options)
                                if($js.isInternalObject(_mod) && $js.hasCommonValues(['Array', 'JSON'], _options.constraintType) &&
                                    (
                                        _mod.typeData == null ||
                                        !_mod.typeData._hasValueConstraint ||
                                        _options.constraintType.indexOf(_mod.type) < 0 ||
                                        !$js.hasCommonValues(_typeData._keyConstraints, _mod.typeData._keyConstraints,true) ||
                                        !$js.hasCommonValues(_typeData._valueConstraints, _mod.typeData._valueConstraints,true) ||
                                        (!_typeData._wrappable && _mod.typeData._wrappable)
                                    )
                                ){
                                    $this.debugging("Type error !");
                                }
                            }
                            if('root' in _mod && $js.isInternalObject(_mod.root)){
                                _mod = _mod.root;
                            }
                            if(_mod.label == 'mixin') {
                                //puis on enregistre le mixin sous une forme abstraite
                                e = $this.getMixinAbstraction(_mod,undefined, __val);
                            }
                            else{
                                _scope = $this.currentScope;
                                e = $this.callable(__val);
                            }
                            // console.log('[E]',e,_options,val,$this.index($js.clearSpace(val)));
                            var _t = $this.index($js.clearSpace(val));
                            if(!_checked){
                                _t = _t.label == 'mixin' ? $js.merge([_t.type], _t.legacy) : [_t.type];
                            }
                            if(_options._finalize && !_checked && !$js.hasCommonValues(_options.constraintType, $js.merge(['Any'], _t) )){
                                $this.debugging(_options.constraintType.join(' or ')+" type expected, [ "+_t.join(' or ')+" ] type was given !");
                            }
                            r.push(e);
                        }
                    }
                    _removeLastParentheses = false;
                }
                s.parenthese--;
                val = '';
                return;
            }
            else{
                if(typeof val == 'object'){
                    if(/[\S]/.test(char)){  
                        if(_hint.indexOf(char) >= 0){
                            _hint = [];
                        }
                        else{
                            val += char;
                        }
                    }
                }
                else{
                    val += char;
                }
            }
            // @Sign Si c'est un signe, on enregistre la position ou on déclenche une erreur
            if($js.checkSymbols(s) && (signs.indexOf(char) >= 0 || signs.indexOf(char+$this.currentCode[i+1]) >= 0)){
                __sign = signs.indexOf(char+$this.currentCode[i+1]) >= 0 ? char+$this.currentCode[i+1] : char;
                // console.log('[char]',__sign)
                if( $js.clearSpace(val) != '-' || ( r.length && !$js.is.sign(r[r.length - 1]) )){
                    //Si le signe était collé à l'élément précédent, on enregistre cet élément précédent
                    if(val.substr(0,val.length - __sign.length).length > 0){
                        if(char == '!' && !$js.is.sign($this.currentCode[i+1])){
                            //La valeur actuelle doit avoir un seul caractère
                            $this.debugging("Error at line "+$this.currentLine+", invalid syntax",true);
                        }
                        var __val = val.substr(0,val.length - __sign.length);
                        if(__val.length){
                            if(_options._finalize){
                                r.push($this.valueFinalizer(__val, _options.constraintType));
                            }else{
                                r.push(__val);
                            }
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
                        //S'il n'y avait pas d'éléments précédent ou l'élément précédent est un signe, on signale une erreur
                        $this.debugging("Error at line "+$this.currentLine+", invalid syntax",true);
                    }
                    else if(/[<>=!]=|&&|\|\|/.test(char+$this.currentCode[i+1])){
                        priority[/&&|\|\|/.test(char+$this.currentCode[i+1]) ? 4 : 3].push(r.length);
                        r.push(char+$this.currentCode[i+1]);
                        $this.cursor += 2;
                        char = $this.currentCode[$this.cursor];
                        val = '';
                    }
                    else if(_signs.indexOf($this.currentCode[i+1]) < 0){
                        priority[(/\*|\/|%/.test(char) ? 1 : 2)].push(r.length);
                        r.push(char);
                    }
                    else{
                        $this.debugging("Error at line "+$this.currentLine+", invalid syntax",true);
                    }
                    val = '';
                }
            }
            //@push [VAL]
            //Si on voit un espace blanc on passe aux interprétation
            if(/[\s]/.test(char)){
                if($js.clearSpace(val) == 'external'){
                    if(_options.constraintType.indexOf('External') < 0){
                        // console.log('[constraint]',_options.constraintType)
                        $this.debugging("illegal syntax ! : external");
                    }
                    if(_hasPendingExternal){
                        $this.debugging("illegal syntax ! : external ... external");
                    }
                    _hasPendingExternal = true;
                    val = '';
                }
                if($js.checkSymbols(s) && !_options.untilEnd){
                    val = $js.clearSpace(val);
                    if($js.len(val)){
                        val = /^\(([\s\S]+?|)\)$/.test(val) ? val.replace(/^\(|\)$/g, '') : val;
                        tmp_cur = $this.cursor;
                        if(_options._allowTypage && ($this.currentGeneric.indexOf(val) >= 0 || $js.merge(['const', 'final','unset'], types).indexOf(val) >= 0)){
                            if($this.currentGeneric.indexOf(val) >= 0 || types.indexOf(val) >= 0){
                                $this.currentType[$this.currentScope] = val;
                            }
                            else if(val == 'final'){
                                $this.final();
                            }
                            else if(val == 'const'){
                                $this.const();
                            }
                            else if(val == 'unset'){
                                $this.unset('',_options._mixinSetting);
                            }
                            val = '';
                        }
                        else if(val == '@js'){
                            console.log('[Ok****]')
                            tmp_line = $this.currentLine;
                            var e = $this['@js'](val);
                            val = e == EMPTY ? $this.anonymousFnManagerGet() : e;
                            r.push(val);
                            // if(r[r.length - 1] == EMPTY){
                            if(['Any', 'Function'].indexOf(_options.constraintType) < 0 && _options._finalize){
                                $this.debugging("Type Error at line "+tmp_line,true);
                            }
                            // finish();
                            // }
                            val = '';
                            return;
                        }
                        else if($js.is.variable(val) && callAsMethodKeys.indexOf($this.getLabel(val)) >= 0){
                            var e = $this.callable(val, 'valueFinder');
                            val = e;
                            r.push(val);
                            val = '';
                            return;
                        }
                        else{
                            if(val == 'External'){
                                _hasCallback = true;
                                r.push($this.external('', true));
                                $this.passBlank();
                                val = '';
                                return;
                            }
                            else{
                                if($js.is.anonymousFn(val) && r.length){
                                    var t = val.match(/\n/g);
                                    $this.debugging("Error at line "+($this.currentLine - (Array.isArray(t) ? t.length : 0))+", can't concatenate expression !", true);
                                }
                                $this.cursor = tmp_cur;
                            }
                            if(_options._finalize){
                                r.push($this.valueFinalizer(val, _options.constraintType));
                            }
                            else{
                                r.push(val);
                            }
                            val = '';
                        }
                        _removeLastParentheses = false;
                        // console.warn('[P]',r);
                    }
                }
            }
            //@Ternary [SIGN]
            //Si c'est un signe de questionnement : operateur ternaire
            else if($js.checkSymbols(s) && /(\:|\?)/.test(char) && (_char == null || _char.indexOf(char) < 0 ) ){
                // console.log('[E]',s,_sym,_char,val,r, statementBreak)
                _in_fn_arg = char == ':' && _options.statementBreak.indexOf(")") >= 0 && asking == 0 && r.length;
                if(char == '?'){
                    if($this.currentCode[i + 1] == '>'){
                        $this.cursor--;
                        return false;
                    }else{
                        asking++;
                    }
                }
                else{
                    if(asking > resp){
                        resp++;
                    }
                    else if(!_in_fn_arg){
                        $this.debugging(":");
                    }
                }
                if(!_in_fn_arg){
                    priority[0].push(r.length);
                    val = '';
                    r.push(char);
                }
                else{
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
                // console.warn('[char]',statementBreak, _char, val);
                if(typeof val == 'object'){
                    r.push(val);
                }
                else{
                    _clearVal();
                    if($js.len(val)){
                        if(r.length > 1 && !$js.is.sign(r[r.length - 1]) && !/^(\:|\?)$/.test(r[r.length-1]) && val.length && _options.statementBreak.indexOf(',') < 0){
                            // console.warn('[append]');
                            r[r.length - 1] += val;
                        }
                        else{
                            if(_options._finalize && _options._passAfter.indexOf(char) < 0){
                                // console.log('[Val]',val)
                                r.push(typeof val == 'object' ? val : $this.valueFinalizer(val, _options.constraintType));
                                // console.warn('[push]',val, $js.copyObj(r));
                            }
                            else{
                                r.push(val);
                            }
                        }
                    }
                    // console.error('[Ok-->]>'+val+'<', statementBreak,r, $js.len(val));
                }
                return false;
            }
            else if(!$js.is.sign(char)){
                // console.log('[S]',char, $js.copyObj(r),val+'<')
                if(!_options.untilEnd){
                    if(r.length && !$js.is.sign(r[r.length - 1]) && !/[:?]/.test(r[r.length - 1])){
                        // console.log('[__Value]',val, '>'+char+'<', r, renderMode);
                        // console.error('[***]', char+'<<')
                        $this.cursor--;
                        return false;
                    }
                    else if(!$js.checkSymbols(s, ['quote', 'simple_quote'])){
                        if(typeof val == 'object'){
                            r.push(val);
                        }else{
                            val = $js.clearSpace(val.substr(0, val.length-1));
                            if(val.length){
                                r.push($this.valueFinalizer(val,_options.constraintType));
                            }
                        }
                        $this.cursor--;
                        return false;
                    }
                }
            }
            else if(char == '=' && !$js.is.sign($this.currentCode[i - 1]) && $this.currentCode[i + 1] != '=' && $js.checkSymbols(s)){
                $this.debugging("assignment into value : "+$js.clearSpace($this.currentCode.substr(start, $this.cursor-start + 4)+"..."));
            }
        }
        if($this.cursor >= $this.currentCode.length - 1){
            val = _options.renderMode ? val : $js.clearSpace(val);
            if($js.len(val)){
                if(_options.renderMode){
                    _render += val.replace(/\)$/, '');
                    r.push(_render);
                }
                else{
                    // console.warn('[USH]',val, _val_t, cursor);
                    // val = /^\(([\s\S]+?|)\)$/.test(val) ? val.replace(/^\(|\)$/g, '') : val;
                    _clearVal();
                    //On vérifie s'il y avait enregistrement de tableau ou de dictionnaire
                    if(/(\]|})$/.test(val)){
                        if(_val_t.length){
                            val = _val_t;
                        }
                        else{
                            if($js.len(_val_d)){
                                val = _val_d;
                            }
                        }
                    }
                    if(r.length == 0 || $js.is.sign(r[r.length -1])){
                        // console.error('[here]',val);
                        if (_options._finalize) {
                            r.push($this.valueFinalizer(val, _options.constraintType));
                        }
                        else {
                            r.push(val);
                        }
                    }
                }
            }
            return false;
        }
    });
    // console.warn('[R]',r,$this.cursor,'/',$this.currentScope, statementBreak);
    var a,b;
    function find(i,reverse){
        while(r[i] === NULL && (reverse ? i >= 0 : i < r.length) ){
            if(reverse){
                i--;
            }
            else{
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
            r[b] = r[a] ? r[a] : r[b];
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
            max = $js.set(max, r.length - 1),
            _t;
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
        // console.log('[Prio]',priority)
        //S'il y a un ternaire dans la valeur
        if(priority[0].length){
            var tern = priority[0],
                last = -1, reason = false, latest = -1,
                next = -1, _resp = 0, current = -1,
                _quest = 0, __last, _hasAsking = true;
            for(var i = 0; i < tern.length; i++){
                if(r[tern[i]] == '?'){
                    iterate(last + 1, tern[i]);
                    reason = r[tern[i] - 1];
                    r[tern[i] - 1] = NULL;
                    r[tern[i]] = NULL;
                    next = -1;
                    //Si on est pas encore à la fin des priorités
                    if(i < tern.length){
                        _resp = 0;
                        _quest = 1;
                        //On cherche s'il y a une valeur vérifiant l'échec de la condition après :
                        for(var j = i + 1; j < tern.length; j++){
                            if(r[tern[j]] == ':'){
                                _resp++;
                                //On tient à ce que les ? correspondent aux : par leurs nombres d'occurence
                                if(_resp == _quest){
                                    next = tern[j];
                                    __last = tern[j];
                                    break;
                                }
                            }
                            else{
                                _quest++;
                            }
                        }
                        if(next >= 0){
                            //Si la raison du ternaire est vraie
                            if(reason){
                                _hasAsking = false;
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
                                //@experimental
                                for(var j = current; j < next; j++){
                                    if(r[j] == '?'){
                                        _hasAsking = true;
                                        break;
                                    }
                                }
                                if(!_hasAsking){
                                    asking = 1;
                                }
                                //@end Experimentation
                            }
                            else{
                                _hasAsking = false;
                                //Sinon on supprime seulement les éléments avant la borne maximale
                                for(var j = 0; j <= next; j++){
                                    r[j] = NULL;
                                }
                                current = next;
                                next = latest == -1 ? r.length - 1 : latest;
                                //@experimental
                                for(var j = current; j < next; j++){
                                    if(r[j] == '?'){
                                        _hasAsking = true;
                                        break;
                                    }
                                }
                                if(!_hasAsking){
                                    asking = 1;
                                }
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
                    last = reason ? tern[i] : __last;
                }
            }
        }
        else{
            iterate();
        }
        r = $js.pop(r,NULL);
    }
    return $js.unQuote(r.length ? r[0] : '');
};
//Calculator
$sy.calculator = function(a,b,s){
    var r;
    if($js.is.string(a,true)){
        a = $js.unQuote(a);
    }
    if($js.is.string(b,true)){
        b = $js.unQuote(b);
    }
    if(!/(\+|\-)=?/.test(s) && ($js.isJson(a) || $js.isJson(b) ) ){
        a = $js.isJson(a) ? JSON.stringify(a,'', ' ') : a;
        b = $js.isJson(b) ? JSON.stringify(b,'', ' ') : b;
        this.debugging("operation error between [ "+a+' ] and [ '+b+' ]');
    }
    // console.log({a,b,s})
    switch(s){
        case '+':
        case '+=':
            if(Array.isArray(a) && Array.isArray(b)){
                r = $js.merge(a,b);
            }else if($js.isJson(a) && $js.isJson(b)){
                r = $js.extend(a,b);
            }
            else{
                r = a + b;
            }
        break;
        case '-':
        case '-=':
            if(Array.isArray(a) && Array.isArray(b)){
                r = (function(){
                    var _r = [],
                        _s = [];
                    for(var i in a){
                        if(b.indexOf(a[i]) < 0){
                            _r.push(a[i]);
                        }else{
                            _s.push(a[i]);
                        }
                    }
                    // console.log('[S]',_s, b)
                    for(var i in b){
                        if(_s.indexOf(b[i]) < 0){
                            _r.push(b[i]);
                        }
                    }
                    return _r;
                })();
            }
            else if($js.isJson(a) && $js.isJson(b)){
                r = (function(){
                    var _r = {},
                        _s = [];
                    for(var i in a){
                        if(!(i in b)){
                            _r[i] = a[i];
                        }else{
                            _s.push(i);
                        }
                    }
                    for(var i  in b){
                        if(_s.indexOf(i) < 0){
                            _r[i] = b[i];
                        }
                    }
                    return $js.extend(_r, b);
                })();
            }
            else{
                r = a - b;
            }
        break;
        case '*':
        case '*=':
            r = a * b;
        break;
        case '/':
        case '/=':
            if(b == 0){
                this.debugging("can't divide by zero !");
            }
            r = a / b;
        break;
        case '~':
        case '~=':
            r = Math.floor(a / b);
        break;
        case '%':
            if(b == 0){
                this.debugging("can't divide by zero !");
            }
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
                _val = !$js.is.string(_val, true) ? '"'+_val+'"' : _val;
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
        if(isPoint && !/[a-z0-9_]/i.test(e[i]) && e[i] != '.'){
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
        _ext = /^(\$?[a-z_](?:[a-z0-9_]+)?)((?:\.|\[)[\s\S]+?)?(\-\-|\+\+)?$/i.exec(_e);
    var _r = [ext[1]],
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
        $this = this,
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
$sy.goToLastCharCursor = function(){
    var _k = 0;
    if(/[\S]/.test(this.currentCode[this.cursor])){
        this.cursor--;
    }
    while(/[\s]+/.test(this.currentCode[this.cursor])){
        if(this.currentCode[this.cursor] == '\n'){
            this.currentLine--;
            _k++;
        }
        this.cursor--;
        if(_k > 0){
            break;
        }
    }
}
//utils
$sy.out = function(arg){
    var screen = "", _val = "";
    for(var i in arg){
        _val = ($js.isJson(arg[i]) ? JSON.stringify(arg[i],'','  ') : arg[i].toString()).replace(/([^\\])\\n/g, '$1\n').replace(/([^\\])\\t/g, '$1\t');
        screen += _val.replace(/([^\\])?\\/g, '$1');
    }
    console.log('%c '+this.realpath+' %c: '+this.lastLine(this.cursor)+' ', 'font-weight: bolder; background-color: #330', 'background-color: #330',screen);
};
$sy.print = function(arg){
    this.out(arg);
};
$sy.typeof = function(arg){
    var r = [],
        $this = this;
    for(var i in arg){
        // console.log('[ARG]',arg[i])
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
$sy.tap = function(arg){
    var r = [];
    for(var i in arg){
        r.push(arg[i]);
    }
    if(node_env){
        return "";
    }else{
        return prompt(r.join(' '));
    }
}
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
$sy.checkArg = function(arg, n){
    var _var = null,
        n = $js.set(n, 2),
        _len = $js.len(arg),
        _mod = null;
    if(_len < n){
        this.debugging(n+" arguments must be defined at least, "+_len+(_len > 2 ? " are" : " is")+" given");
    }
    try{
        var _var = this.indexExtractor(arg[0], undefined, undefined, true);
    }catch(e){
        this.debugging("[ "+arg[0]+" ] is not a variable !");
    }
    _mod = this.index(_var.path[0]);
    if(_mod == null){
        this.debugging("[ "+arg[0]+" ] is not defined !");
    }
    return {_var : _var, _mod : _mod, _len: _len};
};
$sy.push = function(arg){
    var _e = this.checkArg(arg);
    for(var i in arg){
        if(i > 0){
            this.valueModifier(_e._mod,[arg[i]],_e._var.r,'+=');
        }
    }
};
$sy.pop = function(arg){
    var _e = this.checkArg(arg,1);
    _e._var.path.shift();
    var l = this.valueIndexation(_e._mod.value, _e._var.path);
    if(_e._len > 1){
        l = $js.arrayReverse(l);
        for(var i in arg){
            if(i > 0){
                l = $js.arrayRemoveElement(l,arg[i]);
            }
        }
        l = $js.arrayReverse(l);
        this.valueModifier(_e._mod,l,_e._var.r,'=');
    }else{
        l.pop();
        this.valueModifier(_e._mod,l,_e._var.r,'=');
    }
};
$sy.shift = function(arg){
    var _e = this.checkArg(arg,1),
        scope = this.parentScopeFinder(_e._mod.line, _e._mod.level, true);
    _e._var.path.shift();
    var l = this.valueIndexation(_e._mod.value, _e._var.path);
    if(_e._len > 1){
        for(var i in arg){
            if(i > 0){
                l = $js.arrayRemoveElement(l,arg[i]);
            }
        }
        l = JSON.stringify(l, '', ' ');
        eval('this.currModules["'+scope+'"].'+_e._mod.name+'.value'+$js.set(_e._var.r, '')+'='+l+';');
    }else{
        l.shift();
        l = JSON.stringify(l, '', ' ');
        eval('this.currModules["'+scope+'"].'+_e._mod.name+'.value'+$js.set(_e._var.r, '')+'='+l+';');
    }
};
$sy.delete = function(arg){
    var scope;
    for(var i in arg){
        var _e = this.checkArg({0: arg[i]}, 1);
        scope = this.parentScopeFinder(_e._mod.line, _e._mod.level, true);
        try{
            eval('delete this.currModules["'+scope+'"].'+_e._mod.name+(_e._var.r == undefined ? '' : '.value'+_e._var.r)+';');
        }catch(e){
            this.debugging("can't remove "+arg[i]);
        }
    }
};
$sy.sort = function(arg,inverse){
    var scope, _e, l,
        inverse = $js.set(inverse,false);
    for(var i in arg){
        _e = this.checkArg({0: arg[i]}, 1);
        _e._var.path.shift();
        scope = this.parentScopeFinder(_e._mod.line, _e._mod.level, true);
        l = this.valueIndexation(_e._mod.value, _e._var.path);
        $js.arraySort(l, inverse);
        l = JSON.stringify(l, '', ' ');
        eval('this.currModules["'+scope+'"].'+_e._mod.name+'.value'+$js.set(_e._var.r, '')+'='+l+';');
    }
};
$sy.revSort = function(arg){
    this.sort(arg,true);
};
$sy.reverse = function(arg){
    var scope, _e, l;
    for(var i in arg){
        _e = this.checkArg({0: arg[i]}, 1);
        _e._var.path.shift();
        scope = this.parentScopeFinder(_e._mod.line, _e._mod.level, true);
        l = this.valueIndexation(_e._mod.value, _e._var.path);
        l = $js.arrayReverse(l);
        l = JSON.stringify(l, '', ' ');
        eval('this.currModules["'+scope+'"].'+_e._mod.name+'.value'+$js.set(_e._var.r, '')+'='+l+';');
    }
};
$sy.filter = function(arg){
    var len = $js.len(arg);
    if(len < 2){
        this.debugging("2 arguments must be defined at least, "+len+(len > 2 ? " are" : " is")+" given");
    }
    if(!Array.isArray(arg[0])){
        this.debugging("argument 0 must be an array");
    }
    for(var i in arg){
        if( i > 0){
            arg[0] = $js.arrayRemoveElement(arg[0], arg[i], true);
        }
    }
    return arg[0];
};
$sy.round = function(arg){
    var len = $js.len(arg);
    if(len < 2){
        this.debugging("2 arguments at least must be defined, "+len+(len > 2 ? " are" : " is")+" given");
    }
    var number = arg[0],
        precision = arg[1];
    if(!$js.is.number(number)){
        this.debugging("argument 0 must be a number");
    }
    if(!/^[0-9]+$/.test(precision)){
        this.debugging("argument 1 must be an integer");
    }
    precision = Math.pow(10,precision);
    return Math.round(number * precision) / precision;
};
$sy.max = function(arg,inverse){
    var r = [],
        inverse = $js.set(inverse, false),
        e;
    for(var i in arg){
        if(Array.isArray(arg[i])){
            if(r.length){
                this.debugging("argument "+i+" is an array !");
            }
            r = arg[i];
            break;
        }else if($js.isJson(arg[i]) || !$js.is.number(arg[i])){
            this.debugging(arg[i]+" is not supported !");
        }else{
            r.push(arg[i]);
        }
    }
    e = r[0];
    for(var i = 1, j = r.length; i < j; i++){
        if( (inverse && e <= r[i]) || (!inverse && e >= r[i]) ){
            e = r[i];
        }
    }
    return e;
};
$sy.min = function(arg){
    return this.max(arg, true);
};
$sy.math = function(arg, fn){
    var r = [];
    for(var i in arg){
        if(!$js.is.number(arg[i])){
            this.debugging("argument "+i+" must be a number");
        }
        r.push(Math[fn](arg[i]));
    }
    if(!r.length){
        this.debugging("1 argument must be defined at least, 0 is given");
    }
    return r.length > 1 ? r : r[0];
};
$sy.floor = function(arg){
    return this.math(arg, 'floor');
};
$sy.ceil = function(arg){
    return this.math(arg, 'floor');
};
$sy.abs = function(arg){
    return this.math(arg, 'floor');
};
$sy.pow = function(arg){
    var len = $js.len(arg);
    if(len < 2){
        this.debugging("2 arguments must be defined at least, "+len+(len > 2 ? " are" : " is")+" given");
    }
    var number = arg[0],
        precision = arg[1];
    if(!$js.is.number(number)){
        this.debugging("argument 0 must be a number");
    }
    if(!/^[0-9]+$/.test(precision)){
        this.debugging("argument 1 must be an integer");
    }
    return Math.pow(number, precision);
};
$sy.join = function(arg){
    var len = $js.len(arg);
    if(len < 1){
        this.debugging("1 argument must be defined at least , 0 is given");
    }
    if(!Array.isArray(arg[0])){
        this.debugging("argument 0 must be an Array");
    }
    var arr = arg[0],
        glue = $js.set(arg[1], '');
    return arr.join(glue);
}
$sy.str = function(arg){
    var len = $js.len(arg),
        r = [];
    if(len < 1){
        this.debugging("1 argument must be defined at least , 0 is given");
    }
    for(var i in arg){
        r.push('"'+(typeof arg[i] == 'string' ? arg[i] : arg[i].toString())+'"');
    }
    return r.length > 1 ? r : r[0];
}
$sy.int = function(arg){
    var len = $js.len(arg),
        r = [], _r;
    if(len < 1){
        this.debugging("1 argument must be defined at least , 0 is given");
    }
    for(var i in arg){
        _r = new Number(arg[i]);
        if(isNaN(_r)){
            this.debugging("Can't cast [ "+arg[i]+"] into Interger !")
        }
        r.push(parseInt(_r));
    }
    return r.length > 1 ? r : r[0];
}
$sy.float = function(arg){
    var len = $js.len(arg),
        r = [], _r;
    if(len < 1){
        this.debugging("1 argument must be defined at least , 0 is given");
    }
    for(var i in arg){
        _r = new Number(arg[i]);
        if(isNaN(_r)){
            this.debugging("Can't cast [ "+arg[i]+"] into Interger !")
        }
        r.push(parseFloat(_r));
    }
    return r.length > 1 ? r : r[0];
}
$sy.bool = function(arg){
    var len = $js.len(arg),
        r = [];
    if(len < 1){
        this.debugging("1 argument must be defined at least , 0 is given");
    }
    for(var i in arg){
        r.push($js.toBoolean(arg[i]));
    }
    return r.length > 1 ? r : r[0];
}
$sy.timer = function(arg){
    var len = $js.len(arg),
        $this = this,
        _mixin = $this.getCurrentMixinRender(undefined, true),
        _scope = {
            last : $this.currentScope,
            current: null,
            mixin : _mixin.scope,
            _mixin : null
        },
        _renderMixin = {
            last : _mixin.r,
            current : null
        },
        _renderScope = {
            last: this.currentRenderScope,
            current: null
        },
        _dom = {
            last: this.getCurrentDOM(),
            current: null
        },
        _index = $this.parentScopeFinder($this.currentLine, $this.currentScope, true),
        _module = {
            last: {
                index : _index,
                data: $js.copyObj($this.currModules[_index])
            },
            current: {
                index: null,
                data: null
            }
        };
    // console.log('[Mixin]', $this.getCurrentMixinRender(), $js.copyObj($this.currentMixinInUse), $this.currentScope, $this.currentRenderScope)
    if(len < 1){
        this.debugging("1 argument must be defined at least , 0 is given");
    }
    if(arg[1] === undefined){
        arg[1] = 100;
    }
    if(!$js.is.interger(arg[1])){
        this.debugging("argument 1 must be a interger !");
    }
    if(!$js.isInternalObject(arg[0]) || ['function'].indexOf(arg[0].label) < 0){
        this.debugging("argument 0 must be a function !");
    }
    setTimeout(function(){
        //Sauvegarde des données actuelles
        _renderScope.current = $this.currentRenderScope;
        _dom.current = $this.getCurrentDOM();
        _scope.current = $this.currentScope;
        _mixin = $this.getCurrentMixinRender(undefined, true);
        _renderMixin.current = _mixin.r;
        _scope._mixin = _mixin.scope;

        _module.current.index = $this.parentScopeFinder($this.currentLine, $this.currentScope, true);
        _module.current.data = $this.currModules[_module.current.index];
        $this.currModules[_module.last.index] = _module.last.data;

        //Restoration des données du point d'attente
        $this.currentRenderScope = _renderScope.last;
        $this.currentDOMElement[$this.currentRenderScope] = _dom.last;
        $this.currentScope = _scope.last;
        $this.currentMixinInUse[_scope.mixin] = _renderMixin.last;

        $this.functionCaller(arg[0],{},true);

        $this.currentRenderScope = _renderScope.current;
        $this.currentDOMElement[$this.currentRenderScope] = _dom.current;
        $this.currentScope = _scope.current;
        $this.currentMixinInUse[_scope._mixin] = _renderMixin.current;

        _module.current.index = $this.parentScopeFinder($this.currentLine, $this.currentScope, true);
        $this.currModules[_module.current.index] = _module.current.data;
    }, arg[1]);
}
$sy.jsExec = function(arg){
    var r = [];
    for(var i in arg){
        r.push(eval(arg[i]));
    }
    return r.length > 1 ? r : r[0];
}
$sy.platform = function(arg){
    var is = {
        linux : /linux/i.test(navigator.userAgent),
        android: /android/i.test(navigator.userAgent),
        ios: /i(phone|pad|pod)|mac +os/i.test(navigator.userAgent),
        windows: /windows/i.test(navigator.userAgent),
        mac: /mac/i.test(navigator.userAgent)
    },
    r = [];
    for(var i in is){
        if(is[i]){
            r.push(i);
        }
    }
    if(!r.length){
        r = 'android';
    }
    else if(r.length > 1){
        r = r.indexOf('android') >= 0 ? 'android' : (r.indexOf('ios') >= 0 ? 'ios' : r[0]);
    }
    else{
        r = r[0];
    }
    return r;
}
$sy.raise = function(arg){
    if(!$js.len(arg)){
        this.debugging("0 argument given for raise(...)");
    }
    this.debugging("uncaught error at line "+this.lastLine()+", "+arg[0], true);
}

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
            this.debugging("Error from line "+line+", Can't cast [ "+value+" ] to "+type, true);
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
            level: level,
            cursor: vars[i].cursor,
            typeData: 'typeData' in vars[i] ? vars[i].typeData : null
        };
        if(buildOnly){
            r[i] = el;
        }
        else{
            this.moduleSaver(line,level, el, line);
        }
    }
    return r;
}
$sy.SDOM = function(el){
    return {
        getCss : function(e){
          if(e !== undefined){
            getComputedStyle(el,null)[e];
          }
        },
        setCss : function(e, v){
            if(e !== undefined){
                if(!Array.isArray(e) && $js.isJson(e)){
                    for(var i in e){
                        el.style[$js.toCamelCase(i)] = e[i];
                    }
                }
                else if(typeof e == 'string' && v !== undefined){
                    el.style[$js.toCamelCase(e)] = v;
                }
            }
        },
        getValue : function(){
            if('value' in el){
                return el.value;
            }
        },
        setValue : function(e){
            if('value' in el && e !== undefine){
                el.value = e;
            }
        },
        getText : function(){
            return el.innerText;
        },
        setText : function(e){
            if(e !== undefined){
                el.innerText = e;
            }
        },
        getHTML : function(){
            return el.innerHTML;
        },
        setHTML : function(e){
            if(txt !== undefined){
                el.innerHTML = e;
            }
        },
        el: el
    }
}
$sy.EventManager = {
    ev: [],
    on: function(_target, ev, _callback, $this){
        var _d = {
            type: ev,
            el: _target,
            native: $js.isInternalObject(_callback),
            callback:null,
            body: ''
        },
        exist = _d.native;
        if(_d.native){
            exist = false;
            // for(var i in this.ev){
            //     if(this.ev[i].type == ev && this.ev[i].el == _target && _callback.body == this.ev[i].body){
            //         exist = true;
            //         break;
            //     }
            // }
            _d.body = _callback.body;
            var _fn = new Function(_callback.arg, _callback.body);
            _d.callback = function(e){
                _fn($this.SDOM(_target),$this.SDOMElements,e);
            }
        }
        else{
            _d.callback = _callback;
        }
        if(!exist){
            _target.setAttribute("slimeventattached", "true");
            this.ev.push(_d);
            _target.addEventListener(ev, _d.callback, true);
        }
    },
    off: function(_target,ev){
        for(var i in this.ev){
            if(this.ev[i].type == ev && this.ev[i].el == _target){
                _target.removeEventListener(ev, this.ev[i].callback, true);
                delete this.ev[i];
            }
        }
    }
}

//Interpreteur
$sy.cls = function(string,all){
    var all = all !== undefined;
    return all ? string.replace(/[\n\t]/g, '') : string.replace(/^[\n ]+/g, '');
};
$sy.passBlank = function(){
    if(/[\s]/.test(this.currentCode[this.cursor])){
        if(this.currentCode[this.cursor] == '\n'){
            this.currentLine++;
        }
        this.cursor++;
    }
    this.syncLoop(function(char){
        if(/[\S]/.test(char)){
            return false;
        }
    });
}
$sy.pause = function(_iter){
    var i = 0,
        t = true,
        _iter = $js.set(_iter, 500);
    setTimeout(function(){
        t = false;
    }, _iter);
    while(true)i++;
}
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
    if(this.getCurrentType() != null){
        this.debugging("Error at line "+this.currentLine+", invalid syntax given !", true);
    }
};
$sy.meta = function(options){
    var t = $js.newId();
    ObjectIDS.push(t);
    return $js.extend({
        type: null, // le type de valeur: par exemple : Any, Number, String
        label: null, //le type de notation: par exemple : mixin, variable
        name: null, //le nom du notation: par exemple : nomVariable
        line: null, //la ligne de position actuelle de la notation
        level: 0, //L'étendue actuelle de la notation
        cursor: this.cursor, //Le niveau de lecture du code
        visible: false, //Le module sera visible ou pas
        origin: this.realpath, //Le chemin absolu dans lequel se trouve le module
        typeData: null, //les constraintes sur les valeurs
        objid: t
    },$js.setObject(options))
};
$sy.rootPath = function(){
    return this.realpath.replace(new RegExp("[a-zA-Z0-9_]+\\."+defExt,""), "");
};
$sy.remote = function(_path){
    return instanceDB[_path];
}
$sy.index = function(name, _origin){
    var _origin = $js.set(_origin, this.realpath);
    if(_origin != this.realpath){
        return this.remote(_origin).index(name);
    }
    var _index = this.moduleValueIndex(name,true),
        isWrappedModule = false;
    if($js.isInternalObject(_index.value)){
        isWrappedModule = true;
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
$sy._directive = function(withModules){
    var $this = this,
        _saveFiles = true,
        _saveModules = $js.set(withModules, false),
        _saveAlias = false,
        _s = $js.getSymbols(),
        _meta = {files: [], alias: null, modules: []},
        _lastComa = true, _chk = false,
        _val = '', _tmp, _close = false, _last_space = $this.cursor,
        _def = $js.merge(reservedKeys, $js.merge(types, nativeFunctions));
    function _clear(e){
        return e.replace(/^([\s])?|([\s]+?)?(,([\s]+?)?)?$/g, '');
    }
    $this.syncLoop(function(char){
        $js.countSymbols(_s, char);
        _val += char;
        _chk = $js.checkSymbols(_s);
        _close = !/[\sa-z0-9,.*_/]/i.test(char) || (_chk && char == ';');
        if(_chk || _close){
            if(/[\s,]/.test(char) || _close){
                if(_close){
                    _val = _val.substr(0, _val.length - 1);
                }
                _val = $js.clearSpace(_val);
                if(_val.length){
                    _tmp = _val;
                    //Si le mot clé est from
                    if(_def.indexOf(_clear(_val)) >= 0){
                        _val = _clear(_val);
                        if(_val == 'import'){
                            //Si aucun module n'a été importé pendant qu'on ne sauvegarde plus de fichier
                            if(_saveModules && !_saveFiles && !_meta.modules.length){
                                $this.debugging("import before modules to import !");
                            }
                            //Si on avait une virgule précédent, on lève une alerte
                            if(_lastComa){
                                $this.debugging("expected [,]");
                            }
                            //On vérifie si on avait demandé d'importer des modules
                            if(_saveModules && _saveFiles){
                                _saveFiles = false;
                            }
                            //Sinon on soulève une alerte
                            else{
                                $this.cursor = _last_space;
                                return false;
                            }
                            _tmp += ',';
                        }
                        //Si le mot-clé est in
                        else if(_val == 'in'){
                            //Si on avait une virgule précédent, on lève une alerte
                            if(_lastComa){
                                $this.debugging("expected [,]");
                            }
                            //On vérifie qu'on a déjà importé des fichiers
                            if(!_meta.files.length){
                                $this.debugging("can't define alias without file to import");
                            }
                            //On vérifie si on avait demandé d'importer des modules et qu'il y a des modules importées
                            if(_saveModules && _meta.modules.length){
                                $this.debugging("can't define alias without modules to import");
                            }
                            if(_saveAlias){
                                $this.debugging(_val);
                            }
                            _saveFiles = false;
                            _saveAlias = true;
                        }
                        //Sinon on lève une alerte
                        else{
                            if((!_meta.files.length && !_meta.modules.length) || (_saveAlias && _meta.alias == null)){
                                $this.debugging(_val);
                            }
                            $this.cursor = _last_space - 1;
                            return false;
                        }
                    }
                    //Si on enregistre les fichiers
                    else if(_saveFiles){
                        // console.log('[VAL]',_val, _last_space, $this.cursor)
                        //On vérifie qu'il y avait une virgule précédent
                        if(_lastComa){
                            _meta.files.push(_val);
                        }
                        //Sinon on arrête
                        else{
                            $this.cursor = _last_space;
                            return false;
                        }
                    }
                    //Si on enregistre les modules
                    else if(_saveAlias){
                        //Si on avait une virgule précédent, on lève une alerte
                        if(_lastComa || /,$/.test(_tmp)){
                            $this.debugging("expected [,]");
                        }
                        if(_meta.alias == null){
                            //Si le nom n'est pas correct, on lève une alerte
                            if(!$js.is.name(_val, false)){
                                $this.debugging("[ "+_val+" ] can't be an alias name");
                            }
                            _meta.alias = _val;
                        }
                        return false;
                    }
                    else if(!_saveFiles && _saveModules){
                        //On vérifie qu'il y avait une virgule précédent
                        if(_lastComa){
                            _meta.modules.push(_clear(_val));
                        }
                        //Sinon on déclenche une alerte
                        else{
                            $this.cursor = _last_space;
                            return false;
                        }
                    }
                    _lastComa = /,$/.test(_tmp);
                    _val = '';
                }
            }
            if(_close){
                if(_lastComa){
                    $this.debugging(" [,] ");
                }
                if(char != ';'){
                    $this.cursor = _last_space;
                }
                return false;
            }
            else if(/[\s]/.test(char)){
                _last_space = $this.cursor;
            }
        }
    });
    if(!_meta.files.length){
        $this.debugging("There's no file to import !");
    }
    return _meta;
};
$sy.fileFetcher = function(files,alias, modules, noFileAsAlias){
    var $this = this,
        _hasAll = false,
        noFileAsAlias = $js.set(noFileAsAlias, false),
        rootpath = this.rootPath(), path,
        _nRoot = '', _nRealPath = '', _baseFile = '';
    function _grab(file){
        file = $js.clearSpace($js.unQuote(file));
        path = $this.urlParser(file, rootpath);
        _nRoot = path.replace(/\/([a-z0-9_]+)$/i, '')+'/';
        _baseFile = path.replace(/^([\s\S]+?)\/?([a-z0-9_]+)$/i, '$2');
        _nRealPath = $this.urlParser(_baseFile, _nRoot)+'.'+defExt;
        if($this.originPathList.indexOf(_nRealPath) >= 0){
            _nRoot = '\n';
            for(var i in $this.originPathList){
                _nRoot += '\n'+$this.originPathList[i];
            }
            $this.debugging("At line "+$this.currentLine+", circular importation :\norigin"+_nRoot, true);
        }
        path += '.'+defExt;
        if(path in moduleDB){
            path = moduleDB[path];
            $this.moduleGrabber(path, alias == undefined ? (noFileAsAlias ? undefined : _baseFile) : alias, modules);
        }
        else{
            var e = new Synthetic(_nRoot, $this._ncall + 1).compileFile(_baseFile);
            $this.moduleGrabber(e.modules, alias == undefined ? (noFileAsAlias ? undefined : _baseFile) : alias, modules);
        }
        // console.log('[MOD]',alias,$js.copyObj($this.currModules))
    }
    return $this.syncLoop(files, function(file){
        _hasAll = /\.\*$/.test(file);
        if(_hasAll){
            file = file.replace(/\.\*$/, '');
            var _r = $this.urlParser(file, rootpath);
            path = _r+'/.lpkg';
            var _c = $this.fileReader(path, undefined, true),
                _p = $this.packager(_c,path);
            if(!('files' in _p)){
                return;
            }
            for(var i in _p.files){
                _grab(file+'.'+_p.files[i]);
            }
        }
        else{
            _grab(file);
        }
    });
};
$sy.import = function(){
    var $this = this,
        string = $this._directive();
    return $this._import(string);
};
$sy._import = function(_data){
    var $this = this;
    $this.currentKeyword[$this.currentScope] = 'import';
    var files = _data.files,
        alias = _data.alias == null ? undefined : _data.alias;
    return $this.fileFetcher(files,alias);
};
$sy.from = function(string){
    var $this = this,
        _data = $this._directive(true);
    return $this._from(_data);
};
$sy._from = function(_data){
    var $this = this;
    $this.currentKeyword[$this.currentScope] = 'from';
    var files = _data.files,
        modules = _data.modules,
        _hasAll = false,
        alias = _data.alias;

    if(modules !== undefined){
        for(var i in modules){
            if(modules[i] == '*'){
                _hasAll = true;
                break;
            }
        }
        modules = _hasAll ? ['*'] : modules;
    }

    return $this.fileFetcher(files, alias, modules, true);
};
$sy._include = function(string){
    string = this.cls(string);
    var k = /^include[\s]+?([\s\S]+?)(?:[\s]+?in[\s]+?([a-zA-Z0-9_]+?))?(;|[\n])?$/.exec(string),
        files = this.cls(k[1],true).split(/(?: +)?,(?: +)?/),
        alias = k[2],
        $this = this,
        rootpath = this.root();
    this.fireTypeError();
    return $this.syncLoop(files, function(e, i, st, rs){
        st();
        var e = new Synthetic(e,rootpath)
        $this.moduleGrabber(e.modules, alias == undefined ? e : alias);
    })
};
$sy.slimMeta = function(){
    // console.log('[CURR]',this.currentRenderScope, $js.copyObj(this.currentDOMElement))
    return {
        tag: null,
        attr: {},
        parent: this.getCurrentDOM().index,
        index: null,
        dom: null,
        first: false
    };
}
$sy.slimParser = function(max, breakEnter, _async, _renderCall, _start){
    //Code later
    var $this = this,
        _async = $js.set(_async, false),
        _start = $js.set(_start, false),
        max = $js.set(max, $this.currentCode.length),
        el = $this.getCurrentMixinRender(),
        _i = 0, _chevron = 0, s = $js.getSymbols(),
        _begin = false, ide = {line:$this.currentLine,level: $this.currentScope},
        _renderCall = $js.set(_renderCall, false),
        _val = '', _cursor, _tmp,
        _tryToEnd = false, _tryToClose = false,
        _stopAttr = false, _insideScope = 0,
        _currRenderScope = $this.currentRenderScope,
        _checkIfActorMixinCount = 0, _isActorMixin = false,
        _lastAttr = null, _actions = [], _currDom,
        meta = null;
    if(el == null){
        $this.debugging("There's no mixin in use !");
    }
    function _clear(e){
        return typeof e != 'string' ? e.toString() : $js.clearSpace(e.replace(/^([\s]+)?<?([\s]+)?/, '').replace(/([\s]+)?(=|>)?$/g, ''));
    }
    function _clearAttr(e){
        return e.replace(/^[\s]+?|([\s]+?)?(=|:)$/g, '');
    }
    function _attr(end){
        var end = $js.set(end, false);
        _val = _clear(_val);
        if(typeof _val == 'string' && !_val.length){
            return;
        }
        if(_lastAttr == null){
            if(!$js.is.tag(_val)){
                $this.debugging("[ "+_val+" ] can't be an attribute name")
            }
            _lastAttr = _val;
            if(end){
                meta.attr[_lastAttr] = $js.unQuote(_val);
                _lastAttr = null
            }
        }
        else{
            meta.attr[_lastAttr] = $js.unQuote(_val);
            _lastAttr = null;
        }
        _val = '';
    }
    function _dom(){
        var dom = document.createElement(meta.tag);
        for(var i in meta.attr){
            dom.setAttribute(i,meta.attr[i]);
            if(i == 'name'){
                $this.SDOMElements[meta.attr[i]] = $this.SDOM(dom);
            }
        }
        meta.dom = dom;
    }
    function _pushActions(){
        for(var i in _actions){
            if(!(_actions[i].type in el.actions)) {
                el.actions[_actions[i].type] = [];
            }
            el.actions[_actions[i].type].push({
                target : meta.dom,
                content : _actions[i].content
            });
        }
        _actions = [];
    }
    function _renderTextNode(_e){
        if(_clear(_e).length){
            var _txt = document.createTextNode(_e);
            $this.getCurrentDOM().dom.appendChild(_txt);
        }
    }

    $this.syncLoop(function(char,i){
        if($this.currentCode[i - 1] != '\\'){
            $js.countSymbols(s,char, ['bracket', 'parenthese']);
        }
        _val += /[\s]/.test(char) ? (!_chevron ? '' : ' ') : char;
        // console.log('[S]',char)//, $js.copyObj(s));
        if(char == '$' && $this.currentCode[i - 1] != '\\' && $this.currentCode[i + 1] == '{'){
            $this.cursor += 2;
            _val = _val.replace(/\$$/,'');
            var _e = $this.valueFinder({
                statementBreak: ['}'],
                _inc: [-1]
            });
            if($js.isInternalObject(_e) && _e.label == 'mixin-place'){
                _cursor = $this.cursor;
                _renderTextNode(_val);
                ide.line = $this.currentLine;
                ide.level = $this.currentScope;
                // console.log('[E]',_e);
                $this.renderMixin(_e);
                $this.currentLine = ide.line;
                $this.currentScope = ide.level;
                $this.cursor = _cursor;
                _val = '';
            }
            else if($js.clearSpace(_val).length){
                _val += _e
            }
            else{
                _val = _e;
                if(_chevron == 1){
                    _e = /^\s*([a-z_][a-z0-9_-]*)\s*=\s*([\s\S]*?)\s*?$/g.exec(_val);
                    if(_e != null && _e.length == 3){
                        for(var j = 1; j < 3; j++){
                            _val = _e[j];
                            _attr();
                        }
                    }
                    else{
                        _attr();
                    }
                }
                else{
                    _renderTextNode(_e);
                    _val = '';
                }
            }
            return;
        }
        if(_stopAttr && !/[\s>]/.test(char)){
            $this.debugging(char);
        }
        if($js.checkSymbols(s, ['brace']) && char == '}' && s.brace == -1){
            return false;
        }
        if($js.checkSymbols(s)){
            //On cherche à savoir si c'est un mixin acting
            if(/[\s]/.test(char)){
                _tmp = $js.clearSpace(_val);
                if(_tmp.length){
                    //Si le mot est @MixinActing, on vérifie si on peut déclarer le mixin en tant que mixin acting
                    if(_tmp == '@MixinActing'){
                        //Il faut que le compte d'élément non vide soit inférieur à 1
                        //Autrement dit, @MixinActing doit être le premier mot trouvé dans le corps du mixin
                        if(_checkIfActorMixinCount < 1){
                            //Si le mixin est unused, on le déclare comme mixin acting
                            if(el.unused){
                                _isActorMixin = true;
                            }
                            //Sinon on déclenche une alerte
                            else{
                                $this.debugging("Error at line "+$this.lastLine()+", mixin [ "+el.name+" ] is not unused to be a mixin acting !");
                            }
                        }
                        //Sinon on déclenche une alerte
                        else{
                            $this.debugging(_tmp);
                        }
                    }
                    _checkIfActorMixinCount++;
                }
            }
            //Si le mixin est un mixin acting, on ignore toute étude de tag
            if(_isActorMixin){
                $this.passBlank();
                $this.currentTypeData[$this.currentScope]._hasValueConstraint = true;
                $this.currentTypeData[$this.currentScope]._wrappable = true;
                $this.currentTypeData[$this.currentScope]._keyConstraints = ["String"];
                $this.currentTypeData[$this.currentScope]._valueConstraints = ["String", "Number", "External", "Boolean"];
                var _e = $this.valueFinder({
                    statementBreak: ['}'],
                    _inc: [-1],
                    untilEnd: false,
                    constraintType: "JSON"
                }),
                _indexes = ['attr', 'parentLevel', 'applyToChildren', 'style', 'css', 'event'];
                $this.currentTypeData[$this.currentScope]._hasValueConstraint = false;
                for(var i in _e){
                    if(_indexes.indexOf(i) < 0){
                        $this.debugging("Data of mixin "+el.name+":: metadata [ "+i+" ] key is not valid !",true);
                    }
                    else if(i == _indexes[2] && typeof _e[i] != 'boolean'){
                        $this.debugging("Data of mixin "+el.name+":: boolean value expected for metadata [ "+i+" ] key !",true);
                    }
                    else if(i != _indexes[2]){
                        if($js.isJson(_e[i])){
                            if(i == _indexes[1] && !Array.isArray(_e[i])){
                                $this.debugging("Data of mixin "+el.name+":: Array value expected for metadata [ "+i+" ] key !", true);
                            }
                            else if(i != _indexes[1] && Array.isArray(_e[i])){
                                $this.debugging("Data of mixin "+el.name+":: JSON value expected for metadata [ "+i+" ] key !", true);
                            }
                        }
                        else{
                            $this.debugging("Data of mixin "+el.name+":: JSON or Array value expected for metadata [ "+i+" ] key !",true);
                        }
                    }
                }
                if(!('attr' in _e)){_e.attr = {};}
                if(!('event' in _e)){_e.event = {};}
                if(!('parentLevel' in _e)){_e.parentLevel = [];}
                if(!('applyToChildren' in _e)){_e.applyToChildren = true;}
                if(!('style' in _e) && !('css' in _e)){_e.style = {};}
                el.actions = _e;
                el.isActing = true;
                return false;
            }
            else{
                if(_chevron){
                    if(/[\s]/.test(char)){
                        _val = _clear(_val);
                        if(!_tryToClose){
                            if(meta.tag == null){
                                meta.tag = _val;
                                // console.warn('[Open]',_val);
                                tagHistory[meta.tag] = $js.set(tagHistory[meta.tag], 0) + 1;
                            }
                            else{
                                _attr();
                            }
                            _val = '';
                        }
                    }
                    //Si c'est une valeur d'attribut
                    else if(char == '=' && !_tryToClose){
                        _val = _clearAttr(_val);
                        if(_val.length){
                            _attr();
                        }
                        else{
                            $this.debugging(char);
                        }
                        _val = '';
                    }
                    else if(char == '?'){
                        _tryToEnd = true;
                    }
                    //Si c'est une valeur d'action
                    else if(char == ':'){
                        _val = _clearAttr(_val);
                        if(meta.tag != 'slimAction' && (_val.length || _lastAttr != null) ){
                            $this.cursor++;
                            _val = _val.length ? _val : _lastAttr;
                            _lastAttr = $this.valueFinder({
                                statementBreak: ['>','/','}'],
                                _inc: [0],
                                untilEnd: false,
                                constraintType: /^(style|css)$/.test(_val) ? "JSON" : "External"
                            });
                            if($this.currentCode[$this.cursor] == '>'){
                                $this.cursor--;
                            }
                            else if($this.currentCode[$this.cursor] == '/'){
                                _stopAttr = true;
                            }
                            var _e = {};
                            _e[_val] = _lastAttr;
                            // console.log('[E]',_e);
                            _actions.push({
                                type: /^(style|css)$/.test(_val) ? 'style' : (_val == 'attr' ? 'attr' : 'event'),
                                content: /^(style|css)$/.test(_val) ? _lastAttr : _e
                            });
                            _val = '';
                            _lastAttr = null;
                            return;
                        }
                        else{
                            $this.debugging(char);
                        }
                        _val = '';
                    }
                    else if(char == '/'){
                        _val = $js.clearSpace(_val.replace(/^([\s]+?)?</, ''));
                        if(_val == '/'){
                            _tryToClose = true;
                            _val = '';
                        }
                        else{
                            _stopAttr = true;
                            _val = _val.replace(/\/$/, '');
                        }
                    }
                    else if(_chevron == -1){
                        console.log('%c[Val]', 'background-color: green;',_val,'/', $this.currentCode.substr($this.cursor, 20));
                    }
                }
                //@open : ouverture de balise
                if(char == '<'){
                    _chevron++;
                    _begin = true;
                    meta = $this.slimMeta();
                    _val = _val.replace(/<$/, '');
                    //Si le contenu avant l'ouverture de la balise n'est pas vide, c'est un textNode qu'on doit injecter dans le DOM
                    _renderTextNode(_val);
                    //Si on l'intercepte à l'interprétation du code native
                    if($this.currentCode[i+1] == '?'){
                        $this.cursor += 2;
                        _chevron--;
                        _begin = false;
                        var _e = $this.compiler(undefined, undefined, breakEnter, true, _async, _renderCall);
                        if(_e !== undefined){
                            _val += _e;
                        }
                        if(breakEnter !== null && breakEnter !== undefined){
                            $this.cursor--;
                            return false;
                        }
                    }
                    else{
                        _val = '';
                    }
                }
                //@close : On vérifie si c'est une fermeture de balise ou pas
                else if(char == '>'){
                    _chevron--;
                    //Si l'enregistrement d'une balise a déja commencé et que le compteur de _chevron soit égale à 0
                    if(_begin && !_chevron){
                        //Si on rencontre un chevron fermant et on pistait déjà la fermeture d'une balise paire
                        if(_tryToClose){
                            _val = _clear(_val);
                            if(!(_val in tagHistory) || tagHistory[_val] == 0){
                                $this.debugging("try to close inexistant tag");
                            }
                            if(singleTags.indexOf(_val) < 0){
                                $this.currentRenderScope--;
                            }
                            tagHistory[_val]--;
                            _insideScope--;
                            _tryToClose = false;
                            (function(i){
                                setTimeout(function(){
                                    $this.applyPlugins(i);
                                },100);
                            })(_val)
                            // $this.applyPlugins(_val);
                        }
                        //Sinon on va vérifier si c'est une balise sans attribut ou un balise terminée
                        else{
                            _stopAttr = false;
                            meta.index = $this.currentTagId;
                            if(_insideScope == 0 && _start){
                                meta.first = true;
                            }
                            $this.currentTagId++;
                            _insideScope++;
                            _val = _clear(_val);
                            //Si le nom est null, c'est surement une balise sans attribut
                            if(meta.tag == null){
                                if(!$js.is.tag(_val)){
                                    $this.debugging("[ "+_val+" ] can't be a tag name")
                                }
                                meta.tag = _val;
                                tagHistory[_val] = $js.set(tagHistory[_val], 0) + 1;
                                _dom();
                                _pushActions();
                            }
                            //Sinon on le traite comme la fin d'une instruction de balise
                            else{
                                _attr();
                                if(meta.tag != 'slimAction'){
                                    _dom();
                                    if(!_async){
                                        _pushActions();
                                    }
                                }
                            }
                            //Si la balise est orphéline, on n'augmente pas l'étendue, vu qu'elle n'en a pas
                            if(singleTags.indexOf(meta.tag) < 0){
                                $this.currentRenderScope++;
                            }
                            //Si le mixin n'a pas encore été initialisé en rendu
                            if(el.render == null){
                                el.render = [];
                            }
                            //Si c'est une action, on enregistre les actions
                            if(meta.tag == 'slimAction'){
                                if(!('type' in meta.attr) || !('content' in meta.attr)){
                                    $this.debugging("Invalid implementation of slimAction tag");
                                }
                                if(!(meta.attr.type in el.actions)){
                                    el.actions[meta.attr.type] = [];
                                }
                                el.actions[meta.attr.type].push({
                                    content : meta.attr.content,
                                    target : $this.getCurrentDOM($this.currentRenderScope).dom
                                });
                            }
                            //Sinon on enregistre les données concernant la balise
                            else{
                                el.render.push(meta);
                                if($this.currentRender == null){
                                    $this.currentRender = meta.dom;
                                }
                                _currDom = $this.getCurrentDOM($this.currentRenderScope - 1).dom;
                                if(($this.currentRenderScope == 1 && _currDom != null) || $this.currentRenderScope > 1){
                                    if($this.mainLayer == null && $this.currentRenderScope == 1){
                                        $this.mainLayer = meta.dom;
                                    }
                                    (function(p,c){
                                        setTimeout(function(){
                                            p.appendChild(c);
                                        },100)
                                    })(_currDom, meta.dom);
                                    // _currDom.appendChild(meta.dom);
                                }
                                // $this.setActions(meta);
                                if(_async){
                                    for(var _k in _actions){
                                        $this.applyAction(_actions[_k].type, meta.dom, _actions[_k].content);
                                    }
                                }
                                $this.currentDOMElement[$this.currentRenderScope] = meta;
                            }
                        }
                        _begin = false;
                        _val = '';
                    }
                }
            }
        }
        if($this.cursor >= max){
            return false;
        }
    });
    // console.log('[EL]',el);
};
$sy.mixinLegacyManager = function(name,meta,_k,_generic){
    var $this = this,
        mixin = $this.index(name),
        _attr,
        _generic = $js.setArray(_generic),
        _supGeneric = [], _finalTypes = {},
        _super, _k = $js.set(_k, -1);
    function _err(_e,_name){
        if(mixin == null){
            $this.debugging("Error at line "+$this.currentLine+", from tying to inherit [ "+_name+" ] because it's undefined !",true);
        }
        else if(mixin.label != 'mixin'){
            $this.debugging("[ "+_name+" ] is not defined !");
        }
        else if(mixin.final){
            $this.debugging("Error at line "+$this.currentLine+", can't inherit final mixin [ "+_name+" ] !",true);
        }
    }
    _err(mixin,name);
    //@legacyRef:
    meta.legacyRef.push(mixin);
    $js.merge(meta.legacyRef, mixin.legacyRef);
    //@body:
    for(var i in mixin.legacy){
        if(meta.legacy.indexOf(mixin.legacy[i]) < 0){
            _super = $this.index(mixin.legacy[i], mixin.origin);
            _err(_super, mixin.legacy[i]);
            meta.legacy.push(_super.type);
        }
    }
    //@attr:
    for(var i in mixin.attr){
        if(i in meta.attr){
            // console.log('[I]',i);
            if(meta.attr[i].final && (!mixin.attr[i].final || meta.attr[i].mixinRoot != mixin.attr[i].mixinRoot)){
                $this.debugging("Error at line "+$this.currentLine+", from trying to inherit [ "+name+" ] because argument "+i+" is already declared final in mixin [ "+meta.name+"] scope !",true);
            }
            else if(meta.attr[i].constant && !mixin.attr[i].constant){
                $this.debugging("Error at line "+$this.currentLine+", from trying to inherit [ "+name+" ] because argument "+i+" is declared const in mixin [ "+meta.name+"] scope !",true);
            }
        }
        _attr = $js.copyObj(mixin.attr[i]);
        if(mixin.generic){
            _supGeneric = $js.getIndexes(mixin.accept);
            for(var j in _supGeneric){
                _finalTypes[_supGeneric[j]] = $js.set(_generic[j], mixin.accept[_supGeneric[j]]);
            }
            _attr.type = $js.set(_finalTypes[_attr.type],_attr.type);
            for(var j in _attr.typeData._valueConstraints){
                _attr.typeData._valueConstraints[j] = $js.set(_finalTypes[_attr.typeData._valueConstraints[j]], _attr.typeData._valueConstraints[j]);
            }
            for(var j in _attr.typeData._keyConstraints){
                _attr.typeData._keyConstraints[j] = $js.set(_finalTypes[_attr.typeData._keyConstraints[j]], _attr.typeData._keyConstraints[j]);
            }
        }
        _attr.index = _k;
        _k--;
        meta.attr[i] = _attr;
    }
    return _k
};
$sy.mixin = function(string,unused){
    string = this.cls(string);
    // unused = $js.set(unused, false);
    this.currentKeyword[this.currentScope] = 'mixin';
    var meta = this.meta({
        visible : this.currentScope > 0 ? false : !this.visibilityToggler.structure,
        unused : unused,
        label : 'mixin',
        legacy: [],
        legacyRef : [],
        final: this.isFinalForNext(),
        attr: {},
        methods: {},
        generic: false,
        accept: null,
        hasBrace: true,
        ready: false,
        isActing: false,
        body: "",
        baseBody: "",
        render: null,
        actions: {}
    }),
    $this = this,
    _val = '', _k = 0,
    ide = {line: $this.currentLine, level: $this.currentScope},
    _saveLegacy = false, _s = $js.getSymbols(),
    //Argument
    _saveArg = false, _last = {arg: null}, _lastK = -1,
    _chevron = 0,
    _saveBody = false, _generic, _hasNextLegacy = false;
    $this.fireTypeError();
    $this.nextFinal[$this.currentScope] = false;
    this.fireVisibilityError(false);
    this.unsetVisibilityForPrevious();
    function _pushArg(){
        if(!$js.is.name(_val)){
            $this.debugging("[ "+_val+" ] can't be an argument name !");
        }
        _last.arg = {
            name: _val,
            type: $this.getCurrentType() == null ? "Any" : $this.getCurrentType(),
            const: $this.isConstForNext(),
            unset: $this.isUnsetForNext(),
            final: $this.isFinalForNext(),
            value: null,
            index: _k,
            origin: $this.realpath,
            cursor: $this.cursor,
            mixinRoot: $this.realpath+'::'+meta.name,
            mixinContent: false,
            typeData: $this.getCurrentTypeData()
        }
        _k++;
        $this.currentScope = ide.level + 1;
        _val = '';
    }
    function _pushValue(){
        if(_last.arg != null){
            _last.arg.mixinContent = _val == MIXINOBJECT;
            _last.arg.value = _val;
            meta.attr[_last.arg.name] = _last.arg;
            _last.arg = null;
        }
        $this.currentType[$this.currentScope] = null;
        $this.nextConst[$this.currentScope] = false;
        $this.nextFinal[$this.currentScope] = false;
        $this.setCurrentTypeData();
        $this.currentTypeData[$this.currentScope]._hasValueConstraint = false;
        _val = '';
        _resetConstraints();
    }
    function _sortArg(){
        for(var i in meta.attr){
            if(meta.attr[i].index < 0){
                meta.attr[i].index = _k;
                _k++;
            }
        }
    }
    function _resetConstraints(){
        $this.setCurrentTypeData();
        $this.currentTypeData[$this.currentScope]._hasValueConstraint = false;
        $this.currentType[$this.currentScope] = null;
        $this.nextUnset[$this.currentScope] = false;
        $this.nextFinal[$this.currentScope] = false;
        $this.nextConst[$this.currentScope] = false;
    }
    function _saveGeneric(_init){
        var _init = $js.set(_init, false),
            _types = {}, _t = null,
            __types = [],
            _v = '';
        $this.syncLoop(function(char){
            _v += char;
            // console.log('[char]',char)
            if(char == ':'){
                if(_init){
                    _v = _v.replace(/^,?[\s]*|[\s]*:$/g, '');
                    if(_v.length){
                        if(types.indexOf(_v) >= 0){
                            $this.debugging("generic type [ "+_v+" ] must be an undefined type !");
                        }
                        else{
                            _t = _v
                        }
                    }
                    else{
                        $this.debugging("Empty value given for generic type !");
                    }
                    _v = '';
                }
                else{
                    $this.debugging(char);
                }
            }
            else if(char == ','){
                _v = _v.replace(/^,?[\s]*|[\s]*,?$/g, '');
                if(!_v.length){
                    $this.debugging("Empty value given for generic type !");
                }
                else if(!types.indexOf(_v) < 0){
                    $this.debugging("[ "+_v+" ] is not defined !");
                }
                else if(_init){
                    if(_t == null){
                        $this.debugging("No default type was given for [ "+_v+" ]");
                    }
                    _types[_t];
                    _t = null;
                }
                else{
                    __types.push(_t);
                }
            }
            if(!/[:,\sa-z0-9_]/i.test(char)){
                if(char == '>'){
                    _v = _v.replace(/^,?[\s]*|[\s]*>$/g, '');
                    if(!_v.length){
                        $this.debugging("Empty value given for generic type !");
                    }
                    else if(!types.indexOf(_v) < 0){
                        $this.debugging("[ "+_v+" ] is not defined !");
                    }
                    else if(_init){
                        if(_t == null){
                            $this.debugging("No default type was given for [ "+_v+" ]");
                        }
                        _types[_t] = _v;
                    }
                    else{
                        __types.push(_v);
                    }
                    return false;
                }
                else{
                    $this.debugging(char);
                }
            }
        });
        return _init ? _types : __types;
    }

    $this.syncLoop(function(char,i){
        //Enregistrement du généric
        if(!_saveArg && !_saveBody && _chevron == 1){
            _generic = _saveGeneric(meta.name == null);
            if(meta.name == null){
                meta.generic = true;
                meta.accept = _generic;
            }
            _chevron = 0;
            _val = _val.substr(0, _val.length-1);
            return;
        }
        _chevron += char == '<' ? 1 : char == '>' ? -1 : 0
        // console.log('[char]',char);
        //@phase 1: enregistrement du nom
        if(/[\s,(]/.test(char) && !_saveArg && !_saveBody && _chevron == 0){
            _val = $js.clearSpace(_val);
            if(_val.length){
                if(_val == 'extends' && !_saveLegacy){
                    _saveLegacy = true;
                }
                else if(!$js.is.name(_val) && meta.name == null){
                    console.log('[OK]',$js.copyObj(types))
                    $this.debugging("[ "+_val+" ] can't be an object name !");
                }
                else if(meta.name == null){
                    if($this.definedModules.indexOf(meta.name) >= 0 && $this.index(meta.name) != null){
                        $this.debugging("[ "+meta.name+" ] already exists !");
                    }
                    meta.name = _val;
                    meta.type = _val;
                }
                else if(_saveLegacy){
                    if(_val == ','){
                        _hasNextLegacy = true;
                    }
                    else{
                        _lastK = $this.mixinLegacyManager(_val, meta, _lastK, _generic);
                        _generic = [];
                        meta.legacy.push(_val.replace(/^[a-z_][a-z0-9_.]*\./, ''));
                        _hasNextLegacy = false
                    }
                }
                else{
                    $this.debugging(_val);
                }
            }
            if(char == '('){
                if(_hasNextLegacy){
                    $this.debugging("previous [,]");
                }
                else if(_saveLegacy && !meta.legacy.length){
                    $this.debugging("extends without mixin parent name !");
                }
                $this.currentScope++;
                if(meta.generic){
                    $this.currentGeneric = $js.getIndexes(meta.accept);
                }
                _saveArg = true;
                $this.cursor++;
                return;
            }
            _val = '';
        }
        if(_saveArg){
            $this.passBlank();
            // console.log()
            _val = $this.valueFinder({
                statementBreak: $js.merge([',',')'], (_last.arg == null ? [':']: []) ),
                _inc: [-1],
                _mixinSetting: _last.arg == null,
                _mixinArgFinalize: false,
                _allowTypage: _last.arg == null,
                _finalize: _last.arg != null,
                constraintType: _last.arg == null ? "Any" : _last.arg.type
            });
            char = $this.currentCode[$this.cursor];
            if(char == ':'){
                if(_val.length){
                    _pushArg();
                }
                else{
                    $this.debugging("argument name can't be empty !");
                }
            }
            else if(char == ','){
                if(_val.length && _last.arg == null){
                    _pushArg();
                    _resetConstraints();
                }
                _pushValue();
            }
            else if(char == ')'){
                if(_val.length && _last.arg == null){
                    _pushArg();
                }
                _pushValue();
                _sortArg();
                _saveArg = false;
                $this.cursor++;
                $this.passBlank();
                $this.currentScope = ide.level;
                meta.cursor = $this.cursor;
                meta.line = $this.currentLine;
                meta.level = $this.currentScope + 1;
                if($this.currentCode[$this.cursor] == ';'){
                    meta.baseBody = '';
                    return false;
                }
                else if($this.currentCode[$this.cursor] != '{'){
                    $this.debugging($this.currentCode[$this.cursor]);
                }
                else if($this.currentCode[$this.cursor] == '{'){
                    $this.cursor++;
                    $this.passBlank();
                    meta.cursor = $this.cursor;
                    meta.line = $this.currentLine;
                }
                _saveBody = true;
            }
        }
        else if(_saveBody){
            if($this.currentCode[i-1] != '\\'){
                $js.countSymbols(_s,char);
            }
            if($js.checkSymbols(_s, ['brace']) && char == '}' && _s.brace == -1){
                meta.body = _val;
                meta.baseBody = _val;
                $this.cursor++;
                return false;
            }
            _val += char;
        }
        else{
            _val += char;
        }
    });
    //Appelation du gestionnaire d'héritage si le mixin est héritant
    // meta.baseBody = meta.body;
    // if(meta.legacy.length){
    //     $this.mixinLegacyManager(meta, beginLine);
    // }
    // console.log('[Finish Line]', $this.currentLine, $js.copyObj(meta))
    $this.moduleSaver(meta.line, ide.level, meta, ide.line);
    // console.log('[MODULES]', $this.realpath, $js.copyObj($this.currModules));
};
$sy.unused = function(string){
    var _val = '',$this = this;
    $this.syncLoop(function(char){
        if(/[\s]/.test(char)){
            _val = $js.clearSpace(_val);
            if(_val.length){
                if(_val != 'mixin') {
                    $this.debugging(_val);
                }else{
                    return false;
                }
            }
        }
        _val += char;
    })
    return this.mixin(string, true);
};
$sy.private = function(){
    var $this = this;
    $this.setVisibilityForNext(false);
};
$sy.export = function(){
    this.fireTypeError();
    var $this = this;
    $this.setVisibilityForNext();
};
$sy.variable = function(string,options){
    string = this.cls(string);
    // console.log('[NAME]',string)
    this.setCurrentTypeData();
    var $this = this,
        scope = $this.parentScopeList(this.currentLine, this.currentScope),
        options = $js.extend({
            ended: false
        }, $js.setObject(options)),
        ide = {line: $this.currentLine, scope: $this.currentScope},
        clearName = string.replace(/^(\$?[a-z_][a-z0-9_]*)([\s\S]+|)$/i, '$1'),
        render = '', name = string,
        s = $js.getSymbols(),
        assignement = false, values = '', sign = '', _value = '',
        _val = name, _mod, _index, catchBracket = false,
        meta = this.meta({
            label: 'variable',
            visible: $this.visibilityToggler.primitive,
            value: null,
            name: name,
            constant: $this.nextConst[$this.currentScope],
            type: $this.currentType[$this.currentScope] == null ? 'Any' : $this.currentType[$this.currentScope],
            typeData: $this.getCurrentTypeData(),
            line: ide.line,
            level: ide.scope
        }),
        endPlease = options.ended && $this.currentCode[$this.cursor] != ';',
        exist = $this.getCurrentOverride() ? null : $this.moduleFinder(clearName, scope);
        this.fireVisibilityError();
        this.unsetVisibilityForPrevious();
        // console.log('[Type]',$js.copyObj($this.currentTypeData))
    // console.log('*** VAR', clearName, exist, currentScope, currentLine);
    if(exist != null){
        $this.currentType[$this.currentScope] = null;
    }else if(!$js.is.name(clearName)){
        $this.debugging("[ "+clearName+" ] can't be a variable name !");
    }
    // console.log('[Exist]',exist,clearName,'/', name, string, $this.cursor, endPlease);
    function achieveAssignement(index){
        var index = $js.set(index, $this.indexExtractor(name));
        $this.valueModifier(exist,values,index,sign);
    }
    $this.syncLoop(function(char,i){
        if(exist == null && endPlease){
            //une constante doit avoir une valeur
            if($this.nextConst[$this.currentScope]){
                $this.debugging("constant [ "+name+" ] must have a value !");
            }
            $this.cursor--;
            return false;
        }
        // console.log('[char]',char);
        if(/(\-\-|\+\+)$/.test(string)){
            if(exist != null){
                //une constante ne peut pas être réassignée
                if(exist.constant && $this.indexExtractor(name) == undefined){
                    $this.debugging("value of constant [ "+name+" ] can't be modified !");
                }
                if($this.getCurrentType() != null){
                    $this.debugging("Error at line "+ide.line+", invalid syntax expected !", true)
                }
                else if(['Number', 'Any'].indexOf($this.indexExtractor(name) != undefined ? $this.getPrimitiveTypeFrom($this.moduleValueIndex(name)) : exist.type) < 0){
                    $this.debugging("Error at line "+ide.line+", can't increment non numeric type variable [ "+exist.name+" ]", true);
                }
                var k = $this.indexExtractor(string);
                $this.valueModifier(exist, /(\+\+)$/i.exec(string) ? 1 : -1, k, '+=');
                return false;
            }
            else{
                $this.debugging("Error at line "+ide.line+", "+clearName+" is undefined", true); 
            }
        }
        if(exist == null){
            if(char == '='){
                meta.cursor = $this.cursor;
                $this.cursor++;
                var val = $this.valueFinder({
                    statementBreak: [';'],
                    constraintType: meta.type
                });
                var t = meta.type,
                    n = meta.name,
                    v = meta.visible;
                // console.error('[END]', $this.currentCode.substr($this.cursor, 20))
                // console.warn('[Val]',val, meta.cursor, $this.cursor)
                // val = valueFinalizer(val, meta);
                if(typeof val != 'object' || val.label != 'function'){
                    if($js.isInternalObject(val) && val.label == 'mixin-place'){
                        meta = $js.extend(meta, val);
                        meta.typeData = null;
                        delete meta.value;
                    }
                    else{
                        meta.value = val;
                    }
                }
                else{
                    meta = val;
                    meta.type = t;
                    meta.name = n;
                    meta.visible = v;
                    meta.typeData = $js.copyObj($this.getCurrentTypeData())
                }
                $this.getCurrentTypeData()._hasValueConstraint = false;
                return false;
            }
            else if(char == ';'){
                return false;
            }
            else if(!/[\s]/.test(char)){
                $this.debugging(char);
            }
        }
        else{
            $js.countSymbols(s, char);
            if(!$js.checkSymbols(s) || !/[\s]/.test(char)){
                _val += char;
            }
            if(
                signs.indexOf($this.currentCode[i-1]) &&
                (
                    (char == '=' && $this.currentCode[i+1] != '=') ||
                    (/^(\+|\-|\*|\/|%|~)=$/.test(char+$this.currentCode[i+1]))
                )
            ){
                //une constante ne peut pas être réassignée
                if(exist.constant && $this.indexExtractor(name) == undefined){
                    $this.debugging("value of constant [ "+name+" ] can't be modified !");
                }
                assignement = true;
                // console.error('[Ok]')
                sign = char == '=' ? '=' : char+$this.currentCode[i+1];
                $this.cursor++;
                if(char != '='){
                    $this.cursor++;
                }
                if(exist.typeData._hasValueConstraint){
                    $this.currentTypeData[$this.currentScope] = $js.copyObj(exist.typeData);
                }
                var index = $this.indexExtractor(name);
                if(index !== undefined && index.length == 0){
                    if(exist.type != 'Array'){
                        $this.debugging("syntax error !");
                    }
                    index = '["'+exist.value.length+'"]';
                }
                //@valueConstraint : Si on accède à un membre (dans le cas où c'est un JSON ou un Array), on va vérifier s'il a des contraintes d'intégrité
                var _t = index == undefined ? exist.type : (exist.typeData._hasValueConstraint ? exist.typeData._valueConstraints : "Any");
                // console.log('[T]',exist, _t)
                var val = $this.valueFinder({
                    statementBreak : [';'],
                    constraintType: _t,
                    _wrappable: exist.typeData._hasValueConstraint && index !== undefined ? exist.typeData._wrappable : true
                });
                if($js.isInternalObject(val) && val.label == 'mixin-place'){
                    exist = $js.extend(exist, val, true);
                    exist.typeData = null;
                    delete exist.value;
                    $this.currentTypeData[$this.currentScope]._hasValueConstraint = false;
                }
                else if($js.isFunction(val)){
                    var t = exist.type,
                        n = exist.name,
                        v = exist.visible;
                    exist = $this.anonymousFnManagerGet();
                    exist.type = t;
                    exist.name = n;
                    exist.typeData = $js.copyObj($this.currentTypeData);
                    exist.visible = v;
                    $this.moduleSaver(exist.line, exist.level, exist);
                    $this.currentTypeData[$this.currentScope]._hasValueConstraint = false;
                }
                else{
                    values = val;
                    $this.currentTypeData[$this.currentScope]._hasValueConstraint = false;
                    achieveAssignement(index);
                }
                return false;
            }
            else if(['--','++'].indexOf(char+$this.currentCode[i+1]) >= 0){
                //une constante ne peut pas être réassignée
                if(exist.constant && $this.indexExtractor(name) == undefined){
                    $this.debugging("value of constant [ "+name+" ] can't be modified !");
                }
                if(['Number', 'Any'].indexOf($this.indexExtractor(name) != undefined ? $this.getPrimitiveTypeFrom($this.moduleValueIndex(name)) : exist.type) >= 0){
                    $this.valueModifier(exist, (char+$this.currentCode[i+1] == '++' ? 1 : -1), $this.indexExtractor(name), '+=');
                    $this.cursor++;
                    return false;
                }
                else{
                    console.log('[val]',$this.moduleValueIndex(name))
                    $this.debugging("Error at line "+ide.line+", can't increment non numeric type variable [ "+exist.name+" ]", true);
                }
            }
            //Sinon, si ce n'est pas un espace blanc ou un point-virgule, on lève une alerte
            else if(!/[\s;.]/.test(char)){
                name = _val;
                // console.warn('[Name]',_val);
                if(char == '['){
                    catchBracket = true;
                }
                if(catchBracket){
                    catchBracket = !(char == ']' && $js.checkSymbols(s));
                }
                else if(!$js.is.variable($js.clearSpace(_val))){
                    $this.cursor--;
                    _val = $js.clearSpace(_val.replace(/([\s]+?)?[\S]$/, ''));
                    // console.trace('[pass]',_val+'/',char);
                    var e = $this.callable(_val, 'variable');
                    render = $this.touchRender(e, render);
                    return false;
                }
            }
            else if(char == '.' && $js.checkSymbols(s) && _val[_val.length] == '.'){
                $this.debugging(_val+'.');
            }
        }
        if($this.cursor >= $this.currentCode.length - 1){

            if(exist != null){
                return false;
            }
        }
    });
    // console.log('[VAR]',meta);
    if(meta != null && exist == null){
        $this.moduleSaver(ide.line, ide.scope, meta);
    }
    $this.currentType[$this.currentScope] = null;
    // console.log('[Obj]',$js.copyObj($this.currModules), $this.cursor);
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
        callback: null,
        type: options.anonymous ? options.type : $this.getCurrentType() != null ? $this.getCurrentType() : 'Any',
        name: options.name,
        typeData : options.anonymous ? null : $this.getCurrentTypeData()
    }),
    name = '', val = '',
    saveName = options.name == null,
    saveArg = !saveName, saveType = options.type != null, 
    saveBody = false, hasBrace = false, _saveBody = false,
    argPos = 0, 
    //Argument utils
    _cursor, last_attr = null, last_char,
    _last_type = null,
    //------------------------------------
    s = $js.getSymbols(), start = $this.cursor - string.length,
    ide = {line: $this.currentLine, level: $this.currentScope};
    $this.currentType[$this.currentScope] = null;
    // console.warn('[FN___]',meta,options,{saveArg, saveType, saveBody,saveName});
    $this.cursor = options.cursor;
    this.fireVisibilityError();
    this.unsetVisibilityForPrevious();

    function _saveArg(_val){
        if(val == undefined){
            return;
        }
        val = $js.clearSpace(val);
        if(!($js.isJson(val) || Array.isArray(val) || (typeof val != 'object' && ( val.length > 0 || (last_attr != null && last_attr.length) ) ) )){
            return;
        }
        if(types.indexOf(_last_type) < 0){
            $this.debugging("Error from line "+ide.line+", Invalid type [ "+_last_type+" ] given for argument [ "+last_attr+" ]",true);
        }
        // console.log('[ARG]',{val,last_attr, _last_type, _val, cur: $this.cursor})
        // console.log('[VAL]',val);
        var _isFn = $js.isFunction(val);
        if(_isFn){
            val.callback = [val.line, val.level];
        }

        $this.setCurrentTypeData();
        meta.arg[last_attr] = {
            type: _last_type,
            index: argPos,
            line: _isFn ? val.line : ide.line,
            level: _isFn ? val.level : ide.level,
            typeData: $js.copyObj($this.getCurrentTypeData()),
            value: val
        }
        $this.currentType[$this.currentScope] = null;
        $this.currentTypeData[$this.currentScope]._hasValueConstraint = false;
        // console.log('[ATTR]',meta,_val)
        last_attr = null;
        argPos++;
    }
    $this.syncLoop(function(char){
        $js.countSymbols(s, char);
        // console.log('[char]', char, $js.copyObj(s), {saveName, saveArg, _saveBody});
        // console.log('[char]',char,currentLine, s.parenthese)
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
                if(char == '('){
                    $this.cursor++;
                }
                _cursor = $this.cursor;
                $this.currentScope = ide.level + 1;
                name = '';
                // console.log('%c[SAVE]'+char+' '+$this.cursor+' '+$this.currentCode.substr($this.cursor, 20), 'color: lightgreen')
                $this.passBlank();
                var e = $this.valueFinder({
                    statementBreak: $js.merge([",",")"], last_attr == null ? [":"] : []),
                    _inc : [-1],
                    _finalize: last_attr != null,
                    constraintType: last_attr == null || $this.currentType[$this.currentScope] == null ? 'Any' : $this.currentType[$this.currentScope],
                    _allowTypage: last_attr == null
                    //true, (_last_type == null ? 'Any' : _last_type)
                });
                last_char = $this.currentCode[$this.cursor];
                char = last_char;
                // console.warn('[SCOPE]',$this.currentScope, $js.copyObj($this.currentType),e,char)
                // console.log('[Name]',e,'/',last_char,'/',last_attr,$this.cursor);
                // console.log('[E]',name,'/',last_char, '/', currentCode.substr(cursor,7),{cursor,_cursor, _attr_cursor})
                if(last_char == ':'){
                    if(last_attr == null){
                        if(!$js.is.name(e)){
                            $this.debugging("[ "+e+" ] can't be an object name !");
                        }
                        last_attr = e;
                        _last_type = $this.getCurrentType() == null ? 'Any' : $this.getCurrentType();
                    }
                    else{
                        $this.debugging(last_char);
                    }
                }
                else if([',',')'].indexOf(last_char) >= 0){
                    if(e.length && last_attr == null){
                        if(!$js.is.name(e)){
                            $this.debugging("[ "+e+" ] can't be an object name !");
                        }
                        _last_type = $this.getCurrentType() == null ? 'Any' : $this.getCurrentType();
                        last_attr = e;
                        val = '';
                    }else{
                        val = e;
                    }
                    _saveArg($js.clearSpace($this.currentCode.substr(_cursor, $this.cursor - _cursor)));
                    if(last_char == ')'){
                        s.parenthese--;
                        $this.passBlank();
                        $this.currentScope = ide.level;
                        meta.line = $this.currentLine;
                        meta.level = $this.currentScope + 1;
                        meta.cursor = $this.cursor;
                        saveBody = true;
                        saveArg = false;
                    }
                }
                return;
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
                meta.hasBrace = true;
                meta.cursor = $this.cursor + 1;
                meta.line = $this.currentLine;
            }
        }
        if($js.checkSymbols(s)){
            //On enregistre le bloc d'exécution de la fonction
            if(char == '}' && saveBody){
                // console.warn('[Body]',name, $this.cursor,i, $this.currentCode[$this.cursor]);
                name = name.replace(/^{/,'')
                meta.body = name;
                // $this.cursor++;
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
    });
    if(options.anonymous){
        // console.log('FN', $js.copyObj(meta))
        // $this.anonymousFnManagerAdd(meta);
        return meta;
    }
    else{
        $this.moduleSaver(ide.line, ide.level, meta, ide.line);
        console.log('[Obj]',$js.copyObj(meta), $this.cursor);
        // console.log('[meta]',$js.copyObj($this.currModules), $this.cursor, $this.currentCode.substr($this.cursor, 40))
    }
};
$sy.return = function(string){
    var functionRunning = false,
        $this = this,
        levelReturn = $this.currentScope;
    for(var i in $this.currentKeyword){
        if($this.currentKeyword[i] == 'function'){
            functionRunning = true;
            levelReturn = i;
        }
    }
    // console.log('[CK]',this.currentKeyword, this.currentScope, levelReturn,'/',functionRunning);
    var _currFn = $this.currentFunctionInUse[levelReturn];
    if(_currFn == undefined){
        _currFn = $this.currentFunctionInUse[this.currentScope];
    }
    // console.warn('[Yeah !]',$js.copyObj($this.currentFunctionInUse), levelReturn, _currFn)
    $this.currentKeyword[$this.currentScope] = 'return';
    if(!functionRunning){
        $this.debugging("return expression !");
    }
    $this.breakLevel = levelReturn;

    if(_currFn.typeData != null){
        $this.currentTypeData[$this.currentScope] = $js.copyObj(_currFn.typeData);
    }
    var _val = $this.valueFinder({
        statementBreak : ["}",";"],
        _inc : [-1],
        constraintType: _currFn.type
    });
    // console.log('[_VAL]',_val, $this.cursor, $this.currentCode.substr($this.cursor, 10));
    $this.currentTypeData[$this.currentScope]._hasValueConstraint = false;
    return _val;
};
$sy.creatable = function(string){
    string = this.cls(string);
    var s = $js.getSymbols(),
        $this = this,
        ide = {
            line: $this.currentLine,
            level: $this.currentScope
        };
    // console.log('[string]',string);
    $this.syncLoop(function(char){
        $js.countSymbols(s,char);
        // console.warn('[char]',char,i,$this.cursor);
        if($js.checkSymbols(s) || ($js.checkSymbols(s,['parenthese']) && s.parenthese == 1) ){
            if(['=',';'].indexOf(char) >= 0){
                // console.trace('[Cursor]',$this.cursor, $this.currentCode.substr($this.cursor, 20))
                $this.variable(string,{
                    ended: char == ';'
                });
                // console.trace('[Cursor]',$this.cursor, $this.currentCode.substr($this.cursor, 20))
                return false;
            }
            else if(char == '('){
                $this.fn('',{
                    type: $this.getCurrentType() == null ? 'Any' : $this.getCurrentType(),
                    name: string
                })
                return false;
            }
            else if(!/[\s]/.test(char) && $this.cursor < $this.currentCode.length - 1){
                if($this.currentLine - ide.line == 0){
                    $this.debugging(char);
                }
                else{
                    $this.variable(string,{
                        ended: true
                    })
                    return true;
                }
            }
        }
        else{
            $this.debugging(char);
        }
        if($this.cursor >= $this.currentCode.length - 1){
            $this.variable(string+(/[\S]/.test(char) ? char : ''),{
                ended: true
            });
            return true;
        }
    });
    $this.nextConst[$this.currentScope] = null;
    $this.currentOverride[$this.currentScope] = false;
    $this.currentType[$this.currentScope] = null;
    $this.currentTypeData[$this.currentScope]._hasValueConstraint = false;
};
$sy.jsFunctionBuilder = function(body, arg){
    var head = '';
    for(var i in arg){
        if($js.isJson(arg[i].value)){
            arg[i].value = JSON.stringify(arg[i].value);
        }
        else{
            arg[i].value = /([\d]+|true|false)/.test(arg[i].value) ? arg[i].value : '"'+arg[i].value+'"';
        }
        head += 'var '+i+' = '+arg[i].value+';\n';
    }
    body = head + body;
    return new Function([], body);
};
$sy.functionCaller = function(meta, args, _async){
    var $this = this,
        _async = $js.set(_async, false),
        _cursor = $this.cursor,
        _currentLine = $this.currentLine,
        _currentScope = $this.currentScope;
    $this.cursor = meta.cursor;
    $this.currentKeyword[_currentScope] = 'function';
    // console.log('[Calling]', {scope: _currentScope}, meta.name, meta.level, $this.currentKeyword)
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
        return _code;
    }
    //Sinon on passe à l'exécution native synthetic
    else{
        if(meta.origin != $this.realpath){
            var _e = instanceDB[meta.origin].call(meta,args,_async);
            restoreAll();
            return _e.return;
        }
        else{
            r = $this.createScope(meta.line, meta.level, meta.arg, isJs);
            // console.log('[args]',meta,args,$this.currentScope);
            $this.currentFunctionInUse[$this.currentScope] = meta;
            $this.currentCallbackRoot[$this.currentScope] = meta.callback;
            var _code = $this.compiler(undefined, meta.cursor + meta.body.length, !meta.hasBrace, true, _async, undefined, 'functionCaller');
            $this.currentCallbackRoot[$this.currentScope] = null;
            // console.log('[R]',$js.copyObj($this.currModules), this.currentScope)
            // @restoration:  des anciennes valeurs
            restoreAll();
            $this.breakLevel = -1;
            return _code;
        }
    }
};
$sy.callable = function(string,_callFrom){
    string = this.cls(string);
    var isNativeUtils = nativeFunctions.indexOf(string) >= 0,
        $this = this,
        _callFrom = $js.set(_callFrom, 'main'),
        el = isNativeUtils ? null : $this.index(string);
    // console.log('[El]',string,'>',el, $js.copyObj($this.currModules), $this.currentCode.substr($this.cursor, 10))
    var label = isNativeUtils ? 'function' : el == null ? undefined : el.label,
        origin = isNativeUtils ? $this.realpath : el == null ? undefined : el.origin;
        // console.error('[String]',string,label,$this.cursor,$this.currentCode[$this.cursor]);
    // console.log('[MODULE]',el)
    if(label == undefined){
        return this.creatable(string);
    }
    else if(label == 'variable'){
        if(_callFrom == 'variable'){
            return;
        }
        if($this.currentCode[$this.cursor] == '('){
            $this.debugging("Error at line "+$this.currentLine+", [ "+string+" ] is not callable !",true);
        }else{
            $this.currentKeyword[$this.currentScope] = 'variable';
            return this.variable(string);
        }
    }
    else if(label == 'external'){
        $this.debugging("trying to call an External !");
    }
    else{
        var val = string,
            args = {}, 
            saveArg = true, 
            name = null,
            _typeData = $this.getCurrentTypeData(),
            code = '', last_char,
            renderMode = false, _stop = false,
            _finalize = true, _prime = false, _k = 0, _setPrimeTypeData = null,
            mod = _callFrom == 'variable' ? el : null, hasArg = false, saveArg = false, hasParenthese = false,
            continueWithoutParenthese = false,
            s = $js.getSymbols(), argPos = 0, argsByPos = {},
            _cursor, _initScope = this.currentScope,
            _scope = $this.currentScope,
            _alt, last_attr = null, _stopData,
            _t, _index = 0, _i_index = 0;
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
            val = typeof val == 'string' ? $js.clearSpace(val) : val;
            if(!(typeof val != 'string' || (typeof val == 'string' && val.length > 0) )){
                return;
            }
            var _isNative = nativeFunctions.indexOf(name),
                k = _isNative >= 0 ? argPos : last_attr == null ? $js.set(argsByPos[argPos], argPos) : last_attr,
                type = k in mod.arg ? mod.arg[k].type : 'Any';
            last_attr = null;
            val = val == EMPTY ? $this.anonymousFnManagerGet() : val;
            val = typeof val != 'object' && $js.is.string(val,true) ? $js.unQuote(val) : val;
            // console.log('[MOD]',val,_setPrimeTypeData);
            //@nativeFunction : pour les fonctions natives nécéssitant le premier paramètre en tant que référence,
            // on modifie le type de contrainte pour répondre à ses besoin
            if(_setPrimeTypeData == true){
                var __mod = $this.index(val);
                if(__mod.typeData._hasValueConstraint){
                    _t = __mod.typeData._valueConstraints;
                    $this.currentTypeData[$this.currentScope] = __mod.typeData;
                }
                else{
                    _t = __mod.type;
                    _t = ['JSON', 'Array'].indexOf(_t) >= 0 && _prime ? $js.set(__mod.typeData._valueConstraints, 'Any') : _t;
                }
                _setPrimeTypeData = false;
            }
            if($js.isFunction(val)){
                // console.log('[%]',mod.arg[k], $this.currentLine)
                val.callback = _isNative ? true : ['line' in mod.arg[k] ? mod.arg[k].line : val.line, 'level' in mod.arg[k] ? mod.arg[k].level : val.level];
            }
            args[k] = val;
            // console.log('[args]',args);
            argPos++;
            val = '';
        }
        function _saveName(){
            name = val;
            renderMode = name == 'out';
            mod = mod != null ? mod : $this.index(name);
            _t = mod.type;
            // console.warn('[Name]',name,mod,el);
            // console.error('[Name]',name,mod)
            if(mod.label == 'mixin'){
                var _abs = $this.getMixinAbstraction({name: mod.type, type: mod.type}, true, name);
                if(_callFrom == 'valueFinder'){
                    _stopData = _abs;
                    return true;
                }
                $this.renderMixin(_abs,mod);
                return true;
            }
            else{
                hasArg = ['mixin','function'].indexOf(mod.label);
                if(!hasArg){
                    return false;
                }
                else{
                    _t = 'Any';
                }
                setArgs();
                val = '';
                return false;
            }
        }
        function _defineIfFinalize(){
            var r = true;
            if(nativeFunctionRef.indexOf(name) >= 0){
                if(nativeFunctionRefPrime.indexOf(name) >= 0){
                    r = _prime;
                    _setPrimeTypeData = _setPrimeTypeData == null ? true : _setPrimeTypeData;
                    _k++;
                    if(!_prime){
                        _prime = true;
                    }
                }
                else{
                    r = false;
                }
            }
            return r;
        }
        if(name != null){
            _stop = _saveName();
            if(_stop){
                return;
            }
        }
        $this.syncLoop(function(char,i){
            // console.log('[char__]',char,$this.cursor);
            val += char;
            $js.countSymbols(s, char);
            if(name != null && !hasParenthese && /[\S]/.test(char) && char != '('){
                _cursor = $this.cursor;
                if(renderMode || name == "tap"){
                    $this.debugging("Error at line "+$this.lastLine(i)+", the function [ "+name+" ] must have parentheses !");
                }
                // console.warn('[Name]',name, char, $this.cursor, $this.currentCode.substr($this.cursor, 20));
                if(_k == 1){
                    var _m = $this.index(args[0]);
                    if(_m != null && _m.typeData != null){
                        $this.currentTypeData[$this.currentScope] = _m.typeData;
                    }
                }
                $this.currentFunctionInUse[_scope] = mod;
                // $this.currentScope++;
                val = $this.valueFinder({
                    statementBreak: [";"],
                    _finalize: _defineIfFinalize(),
                    constraintType: $this.getCurrentTypeData()._hasValueConstraint ? $this.getCurrentTypeData()._valueConstraints : $js.set(mod.type,'Any')
                });
                _saveArg();
                $this.setCurrentTypeData();
                $this.currentTypeData[$this.currentScope]._hasValueConstraint = false;
                $this.currentScope = _scope;
                return false;
            }
            if(hasParenthese){
                // console.log('[Cursor]',cursor, currentCode.substr(cursor, 30));
                _cursor = $this.cursor;
                if(_k == 1){
                    var _m = $this.index(args[0]);
                    if(_m != null && _m.typeData != null){
                        $this.currentTypeData[$this.currentScope] = _m.typeData;
                    }
                }
                // console.log('[NAME]',name,argPos,mod, argsByPos);
                $this.currentFunctionInUse[_scope] = mod;
                if(_index in argsByPos){
                    _t = mod.arg[argsByPos[_index]].type;
                    //On cherche les valeurs
                    _t = ['Array', 'JSON'].indexOf(_t) < 0 ? _t : mod.arg[argsByPos[_index]]._valueConstraints;
                    $this.currentTypeData[$this.currentScope] = $js.copyObj(mod.arg[argsByPos[_index]].typeData);
                }
                // console.log('[Name]',name, '/', $this.cursor, $this.currentLine,'/',$this.currentCode[$this.cursor]);
                if(/[\s]/.test($this.currentCode[$this.cursor])){
                    // $this.passBlank();
                }
                val = $this.valueFinder({
                    statementBreak: $js.merge([",",")"], last_attr == null || nativeFunctions.indexOf(name) >= 0 ? [":"] : []),
                    _inc: [-1],
                    untilEnd: true,
                    _passAfter: [':'],
                    _finalize: _defineIfFinalize(),
                    constraintType: _t
                    //$this.currentTypeData._hasValueConstraint ? $this.currentTypeData._valueConstraints : $js.set(mod.type,'Any')
                });
                // console.warn('[ERROR]', $js.copyObj($this.currentTypeData), $this.currentScope)
                $this.setCurrentTypeData();
                $this.currentTypeData[$this.currentScope]._hasValueConstraint = false;
                // val = $this.valueFinder($js.merge([",",")"], last_attr == null || nativeFunctions.indexOf(name) >= 0 ? [":"] : []),-1,undefined,false,true);
                last_char = $this.currentCode[$this.cursor];
                $this.currentScope = _scope;
                $this.currentFunctionInUse[_scope] = mod;
                // console.log('[attr]',val,_prime)
                if(last_char == ':'){
                    if(_k == 1){
                        _prime = false;
                    }
                    last_attr = $js.clearSpace($this.currentCode.substr(_cursor, $this.cursor - _cursor));
                    if(!$js.is.name(last_attr)){
                        $this.debugging(last_attr);
                    }
                    _index = mod.arg[last_attr].index;
                    // console.log('[last]', last_attr,mod.arg[last_attr]);
                    return;
                }
                else{
                    if(name == 'typeof'){
                        val = $this.currentCode.substr(_cursor, $this.cursor-_cursor);
                    }
                    _saveArg();
                    _i_index++;
                    _index = _i_index;
                }
                if(last_char == ','){
                    return;
                }
                if(last_char == ')'){
                    return false;
                }
            }
            if($js.checkSymbols(s) || ($js.checkSymbols(s,['parenthese']) && s.parenthese == 1) ){
                if(/[\s]/.test(char)){
                    // console.log('[val]',val);
                    val = $js.clearSpace(val);
                    if(val.length){
                        if(name == null){
                            _stop = _saveName();
                            if(_stop){
                                return false;
                            }
                        }
                    }
                }
                else if(char == '(' && !saveArg){
                    val = $js.clearSpace(val.replace(/\($/, ''));
                    //@delete : for test
                    // $this.currentScope++;
                    hasParenthese = true;
                    //@isolation: on augment le niveau d'étendue pour permettre aux autres appelations de s'isoler
                    if(val.length){
                        if(name == null){
                            _stop = _saveName();
                            if(_stop){
                                return false;
                            }
                            if(renderMode){
                                $this.cursor++;
                                val = $this.valueFinder(")", -1,undefined,true);
                                _saveArg();
                                $this.cursor++;
                                return false;
                            }
                        }
                    }
                    // $this.currentScope++;
                    saveArg = true;
                    val = '';
                }
            }
        });

        if(_stop){
            return _stopData;
        }
        // console.error('[FN]',name,mod,args,$this.cursor);
        // console.log('[Label]',string)
        if(isNativeUtils){
            return $js.set($this[name](args),'');
            // console.log('[Arg]',args,code, currentRender);
        }
        else{
            if(!(mod.label+'Caller' in $this)){
                $this.debugging("can't call [ "+name+" ]");
            }
            $this.currentKeyword[$this.currentScope] = mod.label;
            var _render = $this[mod.label+'Caller'](mod, args);
            _render = $js.set(_render,'');
            //@restoration: du typeData actif
            $this.currentTypeData[$this.currentScope] = _typeData;
            return _render;
        }
    }
};
$sy.external = function(string,anonymous,strict){
    string = this.cls(string);
    var strict = $js.set(strict, true);
    this.currentKeyword[this.currentScope] = 'external';
    if(strict && ["Any",null].indexOf(this.getCurrentType()) < 0){
        this.debugging("Invalid syntax ! External doesn't return anything fo synthetic code.");
    }
    var ide = {
            line: this.currentLine,
            level: this.currentScope
        },
        $this = this,
        anonymous = $js.set(anonymous, false),
        meta = this.meta({
            type: 'External',
            label: 'external',
            visible: $this.currentScope == 0,
            arg: [],
            body: "",
            name: anonymous ? '' : null
        }), _scope = $this.currentScope,
        val = '', s = $js.getSymbols(),
        saveBody = false, _saveBody = false,
        finishBody = false, saveArg = meta.name != null, _argSaved = false,
        hasBrace = false;
    $this.syncLoop(function(char){
        val += char;
        $js.countSymbols(s,char);
        // console.log('[S]', char, $js.copyObj(s), _saveBody)
        if(!_argSaved && $js.checkSymbols(s, ['parenthese']) && s.parenthese == 1){
            if(char == '('){
                if(meta.name == null){
                    meta.name = $js.clearSpace(val.replace(/\($/, ''));
                }
                saveArg = true;
                $this.currentScope++;
                val = '';
            }
            if(char == ',' && char != '(' && saveArg){
                val = $js.clearSpace(val.replace(/,$/,''));
                if(val.length){
                    meta.arg.push(val);
                }
                else{
                    $this.debugging("Error at line "+$this.currentLine+", invalid argument declared !");
                }
                val = '';
            }
        }
        if($js.checkSymbols(s, ['brace']) && s.brace == 1 && char == '{' && !_saveBody){
            $this.cursor++;
            saveBody = true;
            hasBrace = true;
            meta.line = $this.currentLine;
            meta.level = $this.currentScope + 1;
            val = '';
        }
        if($js.checkSymbols(s)){
            if(/[\S]/.test(char) && char != '{' && !saveBody && meta.name != null && !saveArg){
                val = char;
                meta.line = $this.currentLine;
                meta.level = $this.currentScope + 1;
                _saveBody = true;
                saveBody = true;
            }
            if(char == ')' && saveArg && !saveBody){
                saveArg = false;
                _argSaved = true;
                $this.currentScope = _scope;
                meta.line = $this.currentLine;
                meta.level = $this.currentScope + 1;
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
            if(_saveBody && char == '\n'){
                meta.body = val;
                return false;
            }
        }
    });
    if(anonymous){
        return meta;
    }
    $this.moduleSaver(meta.line, meta.level, meta, ide.line);
    console.log('[JS]',$js.copyObj($this.currModules))
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
    $this.syncLoop(function(char,i){
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
    });
    $this.moduleSaver(meta.line, meta.level, meta, ide.line);
};
$sy["@js"] = function(string){
    var s = $js.getSymbols(),
        $this = this,
        val = '', saveArg = false;
    $this.syncLoop(function(char){
        val += char;
        $js.countSymbols(s,char);
        if(saveArg){
            var e = $this.valueFinder([',', ')'], -1);
            val = val.substr(0,val.length - 1) + $js.setToString(e) + $this.currentCode[$this.cursor];
            if($this.currentCode[$this.cursor] == ')'){
                $this.cursor++;
                return false;
            }
            return;
        }
        if($js.checkSymbols(s, ['parenthese']) && s.parenthese == 1 && char == '('){
            saveArg = true;
        }
        if($js.checkSymbols(s)){
            if(char == '\n'){
                return false;
            }
        }
    });
    try{
        val = eval(val);
    }
    catch(e){
        val = undefined;
    }
    return val;
};
$sy.if = function(string,elif){
    string = this.cls(string);
    var arg = null,
        elif = $js.set(elif, false),
        $this = this,
        hasBrace = false, _last_scope, _pass = false,
        s = $js.getSymbols();
    $this.currentKeyword[$this.currentScope] = elif ? 'elif' : 'if';
    // console.log('[string]',string,currentKeyword, '>'+currentCode.substr(cursor, 10));
    $this.syncLoop(function(char){
        $js.countSymbols(s,char);
        if(arg === null && /[\S]/.test(char) && $js.checkSymbols(s,['parenthese']) && (s.parenthese == 1 || s.parenthese == 0)){
            if(char == '('){
                $this.cursor++;
            }
            if(elif && $this.currentReason[$this.currentScope]){
                _pass = true;
            }
            else{
                var e = $this.valueFinder([char == "(" ? ")" : "{"], char == '(' ? -1 : 1, undefined,false,true);
                arg = $js.is.boolean(e) ? e : $js.toBoolean(e);
                $this.currentReason[$this.currentScope] = arg && (elif ? !$this.currentReason[$this.currentScope] : true);
                if(char == '('){
                    s.parenthese--;
                }
                if($this.currentCode[$this.cursor] == '{'){
                    hasBrace = true;
                    $this.cursor++;
                }
                return;
            }
        }
        if(arg === null && _pass && ( ($js.checkSymbols(s) && char == ')') || ($js.checkSymbols(s, ['brace']) && s.brace == 1) )){
            arg = [')', '{'].indexOf(char) >= 0 ? false : arg;
            if(char == ')'){
                $this.cursor++;
            }
            $this.passBlank();
            char = $this.currentCode[$this.cursor];
            hasBrace = char == '{';
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
                $this.compiler(undefined,undefined,!hasBrace,arg);
                // console.warn('[Run If]', cursor, currentScope, hasBrace, currentCode.substr(cursor, 20));
                $this.scopeBreak[$this.currentScope] = false;
                $this.scopeBreakEnter[$this.currentScope] = false;
                $this.currentScope = _last_scope;
                return false;
            }
        }
    });
    // console.log('[Cursor]',$this.cursor, $this.currentCode.substr($this.cursor, 20));
};
$sy.elif = function(string){
    if(['if', 'elif'].indexOf(this.currentKeyword[this.currentScope]) < 0){
        this.debugging("elif without previous if or elif");
    }
    this.if(string,true);
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
    $this.syncLoop(function(char){
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
            $this.compiler(undefined,undefined,!hasBrace,arg);
            $this.scopeBreak[$this.currentScope] = false;
            $this.scopeBreakEnter[$this.currentScope] = false;
            $this.currentScope = _last_scope;
            return false;
        }
    });
};
$sy.try = function(string, catching){
    var $this = this,
        catching = $js.set(catching, false),
        withBrace = false,
        trying = !catching, _save = true,
        initialScope = $this.currentScope;
    // console.log('[key]',$this.currentKeyword)
    if(catching && $this.currentKeyword[$this.currentScope] != 'try'){
        $this.debugging("catch statement without try block !");
    }
    $this.currentKeyword[$this.currentScope] = catching ? 'catch' : 'try';
    $this.syncLoop(function(char){
        if(/[\S]/.test(char)){
            if(!trying){
                if(char == '('){
                    $this.cursor++;
                    var e = $this.valueFinder({
                        statementBreak: [")"],
                        _inc: [-1],
                        untilEnd: false,
                        _finalize: false
                    }),r = {};
                    e = $js.clearSpace(e);
                    $this.cursor++;
                    $this.currentScope++;
                    r[e] = {
                        label: 'variable',
                        visible: false,
                        value: $this.currentTrying[initialScope],
                        type: "Any"
                    };
                    _save = $this.currentTrying[initialScope] != null;
                    $this.passBlank();
                    if($this.currentCode[$this.cursor] == '{'){
                        withBrace = true;
                    }else{
                        $this.cursor--;
                    }
                    if($this.currentTrying[initialScope] == null && catching){
                        if($this.currentCode[$this.cursor] == '{'){
                            $this.cursor++;
                        }
                        $this.compiler(undefined,undefined,!withBrace, false);
                        return false;
                    }
                    $this.currentTrying[initialScope] = null;
                    $this.createScope($this.currentLine, $this.currentScope,r);
                    trying = true;
                }
            }
            else{
                if(char == '{'){
                    withBrace = true;
                    $this.cursor++;
                }
                // console.log('[TRY]',catching, withBrace,_save);
                if(catching){
                    $this.currentScope = initialScope + 1;
                    $this.compiler(undefined,undefined,!withBrace, _save);
                    $this.currentTrying[initialScope] = null;
                }
                else{
                    try{
                        $this.currentScope = initialScope + 1;
                        $this.compiler(undefined,undefined,!withBrace, _save);
                        $this.currentTrying[initialScope] = null;
                    }
                    catch(e){
                        $this.currentTrying[initialScope] = e.toString();
                    }
                }
                $this.currentScope = initialScope;
                if(withBrace){
                    //il faut que le dernier caractère soit un accolade fermant
                    while($this.currentCode[$this.cursor] != '}'){
                        if($this.currentCode[$this.cursor] == '\n'){
                            $this.currentLine++;
                        }
                        $this.cursor++;
                    }
                }
                // console.log('[E]',catching,$this.currentCode.substr($this.cursor,10))
                return false;
            }
        }
    });
};
$sy.catch = function(){
    this.try("",true);
};
$sy.for = function(string,isLoop){
    var $this = this,
        isLoop = $js.set(isLoop, false),
        s = $js.getSymbols(),
        _arg = '',
        isAdvanced = false,
        isClassic = false, isCompleteClassic = false,
        _vars = isLoop ? ['j', 'i', 'k'] : [],
        _s_vars = [],
        _hasBrace = false,
        _addBracket = true,
        _addBrace = true,
        _iterable, _k = 0,
        _cursor, _e, _line,
        _scope = $this.currentScope,
        _stopIncArg = isLoop, _lastArgCount = 0, _statement, _inc,
        _c_scope, _stop = false, _j = 0,
        _renderScope = $this.currentRenderScope,
        _argSet = false;
    $this.currentKeyword[$this.currentScope] = 'loop';
    function setScope(k,v,i){
        var r = {},
            _v = [k,v,i],
            t = 0,
            i;
        for(i in _vars){
            if(t > (isClassic ? 0 : isLoop ? 2 : 1) ){
                $this.debugging("To much arguments !");
            }
            r[_vars[i]] = {
                label: 'variable',
                visible: false,
                value: _v[t],
                type: "Any"
            };
            t++;
        }
        if(isLoop && $js.isJson(_v[1]) && !Array.isArray(_v[1])){
            for(var i in _v[1]){
                i = $js.unQuote(i);
                if(/^[a-z]/i.test(i)){
                    r[i] = {
                        label: 'variable',
                        visible: false,
                        value: _v[1][i],
                        type: $this.getPrimitiveTypeFrom(_v[1][i])
                    };
                }
            }
        }
        else if(!isLoop && t < 2){
            r[_vars[i]].value = _v[1];
            r[_vars[i]].type = $this.getPrimitiveTypeFrom(_v[1]);
        }
        $this.createScope($this.currentLine, $this.currentScope,r);
    }
    // $this.debugging()
    $this.syncLoop(function(char){
        $js.countSymbols(s,char);
        if(!_argSet && /[\S]/.test(char)){
            if(char == '('){
                if(!isLoop){
                    $this.cursor++;
                }
                else{
                    s.parenthese--;
                }
            }
            _cursor = $this.cursor;
            // console.log("char",char);
            //_addBrace ? $js.merge([")","{"], !_stopIncArg ? [','] : []) : $js.merge([")","}"], _stopIncArg ? [','] : []),
            //_addBracket ? ["["] : []
            _statement = [")","{"];
            _inc = [-1, 1, 1];
            if(!_stopIncArg && !isLoop){
                _statement.push(',');
            }
            if(_addBrace){
                _statement.push(']');
                _inc[2] = 0;
            }
            // console.log('[cursor]',$this.cursor);
            var e = $this.valueFinder({
                statementBreak : _statement, //$js.merge(_addBrace ? $js.merge([")","{"], !_stopIncArg ? [','] : []) : $js.merge([")","}"], _stopIncArg ? [','] : []), _addBracket ? ["["] : []),
                _inc : _inc,//[-1,_addBrace ? 1 : 0]
                _finalize: _stopIncArg
            });
            _e = $js.clearSpace($this.currentCode.substr(_cursor, $this.cursor - _cursor));
            // console.log('[E]',e,'/', _e, '/', char, '~/', $this.currentCode[$this.cursor], _statement, _addBrace, _inc, $this.cursor);
            //On vérifie quel type de boucle est-il
            if(_e == 'from'){
                if(!isAdvanced){
                    if(isClassic){
                        $this.debugging(_e);
                    }
                    isClassic = true;
                }
                else{
                    $this.debugging(_e);
                }
                if(_vars.length){
                    _stopIncArg = true;
                }else{
                    $this.debugging("from before iteration variable declaration !");
                }
            }
            else if(_e == 'in'){
                if(!isClassic){
                    if(isAdvanced){
                        $this.debugging(_e);
                    }
                    isAdvanced = true;
                }
                else{
                    $this.debugging(_e);
                }
                if(_vars.length){
                    _stopIncArg = true;
                }else{
                    $this.debugging("in before iteration variable declaration !");
                }
            }
            else if(_e == 'to'){
                if(isClassic){
                    isCompleteClassic = true;
                }
                else{
                    $this.debugging(_e);
                }
            }

            if($this.currentCode[$this.cursor] == ','){
                e = $js.clearSpace(e);
                if($js.is.name(e)){
                    _vars.push(e);
                }
                else{
                    $this.debugging("[ "+e+" ] can't be a variable name !");
                }
            }
            else if(!isClassic && !isAdvanced && !isLoop){
                if(!_lastArgCount){
                    e = $js.clearSpace(e);
                    if($js.is.name(e)){
                        _vars.push(e);
                    }
                    else{
                        $this.debugging("[ "+e+" ] can't be a variable name !");
                    }
                    _lastArgCount++;
                }
                else{
                    $this.debugging(e);
                }
            }
            else if(['from', 'to', 'in'].indexOf(_e) < 0){
                if(isClassic && !$js.is.number(e)){
                    $this.debugging("[ "+e+" ] is not a number !");
                }
                if(!isClassic && ['object', 'string'].indexOf(typeof e) < 0){
                    $this.debugging("type error on last argument !");
                }
                e = $js.clearSpace(e);
                _s_vars.push($js.clearSpace(e));
            }

            // console.log({_vars, _s_vars})/\
            if(!_addBracket){
                _addBracket = true;
            }
            if(!_addBrace){
                _addBrace = true;
            }
            if(char == '['){
                s.bracket--;
            }
            if($this.currentCode[$this.cursor] == '{'){
                // console.log('[Call]', isAdvanced, isLoop, _s_vars)
                if(isClassic && _s_vars.length < 2){
                    $this.debugging($this.currentCode[$this.cursor]);
                }
                else if((isAdvanced || isLoop) && _s_vars.length == 0){
                    _addBrace = false;
                    s.brace--;
                    $this.cursor--;
                    return;
                }
            }
            if($this.currentCode[$this.cursor] == '['){
                $this.cursor--;
                _addBracket = false;
                return;
            }
            if([")", "{"].indexOf($this.currentCode[$this.cursor]) >= 0 && _s_vars.length){
                _argSet = true;
                _hasBrace = $this.currentCode[$this.cursor] == '{';
                if($this.currentCode[$this.cursor] == ')'){
                    s.parenthese--;
                }
                else{
                    if(isClassic && !isCompleteClassic){
                        $this.debugging("invalid syntax !");
                    }
                    s.brace++;
                }
                _iterable = isClassic ? $js.rangeOfInt(_s_vars[0],_s_vars[1]) : _s_vars[0];
                return;
            }
            _arg += char;
        }
        else if(_argSet){
            // console.log('[Char]',char,$js.copyObj(s));
            // $this.debugging("Ok");
            if(/[\S]/.test(char) && ($js.checkSymbols(s) || $js.checkSymbols(s,['brace'], [1]))){
                // console.log('[S]',$js.copyObj(s), char);
                if(char == '{'){
                    $this.cursor++;
                    _hasBrace = true;
                }
                _c_scope = $this.currentScope + 1;
                _line = $this.currentLine;
                _cursor = $this.cursor;
                _k = 0;
                if($js.len(_iterable)){
                    for(var i in _iterable){
                        $this.currentScope = _c_scope;
                        $this.currentLine = _line;
                        $this.cursor = _cursor;
                        $this.currentRenderScope = _renderScope;
                        setScope(i,_iterable[i], _k);
                        // console.log('%c[AXIS] c : '+$this.cursor+" | l: "+$this.currentLine+" | s: "+$this.currentScope, 'background-color: green; color: #fff');
                        // console.log('[Curr]',$js.copyObj($this.currModules));
                        $this.compiler(undefined,undefined,!_hasBrace);
                        if($this.breakLevel >= 0 && _c_scope <= $this.breakLevel){
                            break;
                        }
                        _k++;
                    }
                }
                else{
                    $this.compiler(undefined,undefined, !_hasBrace, false);
                }
                $this.currentScope = _scope;
                $this.currentLine = _line;
                return false;
            }
        }
        // console.log('[char]',char);
    });
};
$sy.loop = function(){
    this.for('', true);
};
$sy.while = function(){
    var $this = this,
        s = $js.getSymbols(),
        _arg, _bodyStart = null,
        _cursor, _last_cursor,
        _time = 0,
        _line, _scope = $this.currentScope,
        _hasBrace = false,
        _renderScope = $this.currentRenderScope;
    $this.currentKeyword[$this.currentScope] = 'loop';
    $this.syncLoop(function(char){
       if(/[\S]/.test(char)){
           if(char == '('){
               $this.cursor++;
           }
           _cursor = $this.cursor;
           _line = $this.currentLine;
           do{
               $this.cursor = _cursor;
               $this.currentLine = _line;
               $this.currentScope = _scope + 1;
               $this.currentRenderScope = _renderScope;
               _arg = $this.valueFinder([")", "{"], [0,1]);
               // console.log('[Arg]',_arg);
               if(_bodyStart != null){
                   $this.cursor = _bodyStart;
               }else{
                   if($this.currentCode[$this.cursor] == ')'){
                       $this.cursor++;
                       while(!/[\S]/.test($this.currentCode[$this.cursor])){
                           $this.cursor++;
                       }
                   }
                   if($this.currentCode[$this.cursor] == '{'){
                       _hasBrace = true;
                       $this.cursor++;
                   }
                   _bodyStart = $this.cursor;
               }
               if(!_arg){
                   break;
               }
               $this.compiler(undefined,undefined,!_hasBrace);
               _time++;
               if(_null > 5){
                   $this.debugging('while');
               }
               _null++
               if($this.breakLevel >= 0 && _scope <= $this.breakLevel){
                   break;
               }
               _last_cursor = $this.cursor;
           }while(_arg);
           if(_time > 0){
               $this.cursor = _last_cursor;
           }else{
               $this.compiler(undefined,undefined,!_hasBrace,false);
           }
           // console.log('[ch**', $this.currentCode[$this.cursor])
           return false;
           // while($this.valueFinder())
       }
    });
};
$sy.break = function(){
    var loopRunning = false,
        $this = this,
        levelReturn = $this.currentScope;
    for(var i = $this.currentScope; i >= 0; i--){
        if($this.currentKeyword[i] == 'loop'){
            loopRunning = true;
            levelReturn = i;
        }
    }
    if(!loopRunning){
        $this.debugging("break expression !");
    }
    $this.breakLevel = levelReturn + 1;
};
$sy.const = function(){
    //const doit se placer avant toute déclaraction de type
    if(this.getCurrentType() != null){
        this.debugging("Invalid syntax : "+this.getCurrentType()+" ... const")
    }
    //const ne doit pas être dupliqué
    if(this.isConstForNext()){
        this.debugging("Invalid syntax : const ... const")
    }
    //const ne peut pas être en conflit avec final
    if(this.isUnsetForNext()){
        this.debugging("Invalid syntax : const ... unset")
    }
    this.nextConst[this.currentScope] = true;
};
$sy.override = function(){
    //override doit se placer avant toute déclaraction de type
    if(this.getCurrentType() != null){
        this.debugging("Invalid syntax : "+this.getCurrentType()+" ... override")
    }
    //const ne doit pas être dupliqué
    if(this.getCurrentOverride()){
        this.debugging("Invalid override : "+this.getCurrentType()+" ... override")
    }
    this.currentOverride[this.currentScope] = true;
};
$sy.switch = function(){
    var arg = null,
        _case, _choices, _isDefault = false,
        s = $js.getSymbols(),
        $this = this,
        _scope = $this.currentScope;
    $this.currentKeyword[$this.currentScope] = 'switch';
    $this.syncLoop(function(char){
        //On enregistre la valeur de commutation
       if(/[\S]/.test(char) && arg == null){
            if(char == '('){
                $this.cursor++;
            }
            arg = $this.valueFinder({
                statementBreak: [')','{'],
                _inc: [-1, 1],
                untilEnd: true
            });
            $this.cursor++;
            if($this.currentCode[$this.cursor-1] != '{'){
                while($this.currentCode[$this.cursor] != '{'){
                    if($this.currentCode[$this.cursor] == '\n'){
                        $this.cursor++;
                    }
                    if(/[\S]/.test($this.currentCode[$this.cursor])){
                        $this.debugging($this.currentCode[$this.cursor]);
                    }
                    $this.cursor++;
                }
            }
            $this.currentScope++;
       }
       if(arg != null){
            _case = $this.valueFinder({
                statementBreak: [':'],
                _inc : [0],
                _finalize: false,
                untilEnd: true
            });
            _case = $js.clearSpace(_case);
            if($this.currentCode[$this.cursor] == ':'){
                $this.cursor++;
                // console.log('[Case]',_case,arg);
            }
            if(!/^(case|default)([\s]+?)?/.test(_case)){
                $this.debugging("Invalid syntax : "+_case);
            }
            _isDefault = /^default([\s]+?)?/.test(_case);
            _choices = _case.replace(/^(case|default)([\s]+?)?/, '').split(/(?:[\s]+?)?|(?:[\s]+?)?/);
            if(!_isDefault){
                if(_choices.length){

                }else{
                    $this.debugging("Invalid syntax : [ "+_case+" ] a value must be given for case !");
                }
            }
            if(_choices.indexOf(arg.toString()) >= 0 || _isDefault){
                $this.compiler({
                    wanted : ['case','default'],
                    breakEnter: false
                });
                // console.log('[BINGO]',$this.currentCode[$this.cursor])
                if($this.currentCode[$this.cursor] != '}'){
                    $this.syncLoop(function(_char){
                        $js.countSymbols(s, _char);
                        if($js.checkSymbols(s, ['brace']) && s.brace == -1){
                            return false;
                        }
                    });
                    // console.log('[Curspr]',$this.cursor, $this.currentCode.substr($this.cursor, 20));
                }
                return false;
            }
            else{
                $this.compiler({
                    wanted : ['case','default'],
                    emergency: true,
                    breakEnter: false
                });
                if($this.currentCode[$this.cursor] == '}'){
                    return false;
                }
                return;
            }
       }
    });
};
$sy.strict_mode = function(){
    //strict_mode doit se placer avant toute déclaraction de type
    if(this.getCurrentType() != null){
        this.debugging("Invalid syntax : "+this.getCurrentType()+" ... strict_mode")
    }
    //strict_mode ne doit pas être dupliqué
    if(this.nextConst[this.currentScope]){
        this.debugging("Invalid override : const ... strict_mode")
    }
    this.currentStrictMode[this.currentScope] = true;
}
$sy.final = function(){
    //final doit se placer avant toute déclaraction de type
    if(this.getCurrentType() != null){
        this.debugging("Invalid syntax : "+this.getCurrentType()+" ... final")
    }
    //final doit se placer avant const
    if(this.nextConst[this.currentScope]){
        this.debugging("Invalid syntax : const ... final")
    }
    //final doit se placer avant unset
    if(this.isUnsetForNext()){
        this.debugging("Invalid syntax : unset ... final")
    }
    this.nextFinal[this.currentScope] = true;
}
$sy.unset = function(string,_fromMixin){
    var _fromMixin = $js.set(_fromMixin, false);
    if(!_fromMixin){
        this.debugging("unset out of mixin scope !");
    }
    //unset doit se placer avant toute déclaraction de type
    if(this.getCurrentType() != null){
        this.debugging("Invalid syntax : "+this.getCurrentType()+" ... unset")
    }
    //unset ne doit pas être en conflit avec const
    if(this.isConstForNext()){
        this.debugging("Invalid syntax : const ... unset")
    }
    this.nextUnset[this.currentScope] = true;
}
$sy.invoke = function(){
    var mx = this.getCurrentMixinRender();
    if(mx == null){
        this.debugging("Can't invoke while any mixin is using !");
    }
    this.currentInvokation[this.currentScope] = mx;
}
$sy.with = function(){
    console.log('WITH ME')
}
$sy.reset = function(){
    var mod = '',
        arg = {},
        _isVar= false,
        $this = this;
    $this.syncLoop(function(char){
        mod = $this.valueFinder({
            statementBreak : ['('],
            _inc: [1],
            _getRef: true
        });
        if(mod.label != 'mixin-place'){
            if($js.isInternalObject(mod.value)){
                _isVar = true;
            }
            else{
                $this.debugging("[ "+mod.name+" ] is not a mixin object !");
            }
        }
        console.log('[Mod]',mod)
        arg = $this.getAbstractionArguments($this.index(_isVar ? mod.value.pathname : mod.pathname, _isVar ? mod.value.origin : mod.origin));
        $js.extend(_isVar ? mod.value.arg : mod.arg, arg,true);
        return false;
    });
}
$sy.use = function(string,ref){
    var mod = '',
        ref = $js.set(ref, false),
        _cursor = this.cursor,
        ide = {},
        _name;
    mod = this.valueFinder({
        statementBreak : [';'],
        _inc: [0],
        _getRef: true
    });
    if(_null > 1){
        this.debugging()
    }
    _null++;
    _name = $js.clearSpace(this.currentCode.substr(_cursor, this.cursor - _cursor + 1).replace(/\($/, ''));
    switch(mod.label){
        case 'mixin':
            this.cursor += 1;
            if(ref){
                return this.getMixinAbstraction({type: mod.type, name: mod.name}, true, _name);
            }
            this.renderMixin(this.getMixinAbstraction({type: mod.type, name: mod.name}, true, _name));
        break;
        case 'mixin-place':
            if(ref){
                return mod;
            }
            _cursor = this.cursor;
            ide.line = this.currentLine;
            ide.level = this.currentScope;
            this.renderMixin(mod);
            this.cursor = _cursor;
            this.currentLine = ide.line;
            this.currentScope = ide.level;
        break;
    }
}
$sy.renderMixin = function(meta, _get, _arg, _allowUnused, _doNotAct){
    var $this = this,
        _allowUnused = $js.set(_allowUnused, false),
        _doNotAct = $js.set(_doNotAct, false),
        _invokationMod = $this.getCurrentInvokation($this.currentScope) != null,
        _arg = meta.label == 'mixin-place' ? meta.arg : _arg,
        isAbstract = true;
    if(!dom_env){
        $this.debugging("Synthetic needs DOM utils to work with mixin !");
    }
    if(meta == undefined){
        if($this.currentMixinInUse == null){
            $this.debugging("There's no mixin in render mode !");
        }
        meta = $this.getCurrentMixinRender();
    }
    else{
        isAbstract = meta.label == 'mixin-place';
    }
    var _get = $js.set(_get, meta.label == 'mixin' ? meta : null),
        _metaName = _get != null || meta.label == 'mixin' ? '' : meta.pathname.indexOf(meta.mixiname) < 0 ? meta.mixiname : meta.pathname,
        mixin = _get != null ? _get : (isAbstract ? this.index(_metaName, meta.origin) : meta),
        _arg =  $js.set(_arg, null),
        arg = $js.isJson(_arg) ? _arg : {},
        _args = {}, _last_key = null,
        _val, _k = 0, _type,
        ide = {
            line: $this.currentLine,
            level: $this.currentScope,
            cursor : $this.cursor
        },
        _actions = [], _superActions = [],
        _cursor;
    $this.cursor = meta.cursor + 1;
    if(!_invokationMod){
        $this.currentMixinInUse[ide.level] = mixin;
    }
    if(mixin == null){
        $this.debugging("Mixin [ "+meta.mixiname+"] not found !");
    }
    //Si le mixin actuel n'a pas déclenché un invocation ou n'est pas unused pendant une invokation, on lance une alerte
    if(_invokationMod && !mixin.unused){
        $this.debugging("can't invoke mixin [ "+mixin.name+" ] because it's not unused !");
    }
    //Si le mixin est unused, on empêche son utilisation
    if(mixin.unused && !_allowUnused && !_invokationMod){
        $this.debugging("Try to use unused mixin [ "+mixin.name+" ]");
    }
    //Récupération des arguments prédéfinis
    for(var i in mixin.attr){
        _args[mixin.attr[i].index] = mixin.attr[i].name;
    }
    $this.currentLine = meta.line;
    $this.currentScope = meta.level;
    //Si on n'a pas encore défini les arguments, on le fait
    if(_arg == null){
        //Récupération des arguments donnés
        if($this.realpath != meta.origin){
            arg = $this.remote(meta.origin).getMixinArgument(mixin, _args, meta);
        }
        else{
            arg = $this.getMixinArgument(mixin,_args, meta);
        }
        $this.currentType[$this.currentScope] = null;
        $this.currentTypeData[$this.currentScope]._hasValueConstraint = false;
    }
    //Ajout des arguments prédéfinis
    for(var i in mixin.attr){
        if(!(i in arg)){
            if(mixin.attr[i].unset){
                $this.debugging("Argument [ "+i+" ] of mixin "+mixin.name+"(...) must be defined !");
            }
            arg[i] = mixin.attr[i];
        }
    }
    function _extractArg(_mixin){
        var r = {};
        for(var i in _mixin.attr){
            r[i] = arg[i];
        }
        return r;
    }
    function _parse(_mixin, _default){
        var _default = $js.set(_default, true);
        //Appleation du traitement de rendu du mixin actuel
        if(_mixin.origin != $this.realpath){
            _superActions = instanceDB[_mixin.origin].callMixin(_mixin.name, _default ? arg : _extractArg(_mixin), $this.getCurrentDOM(), _allowUnused, true, $this.getCurrentInvokation());
            $js.merge(_actions, _superActions, true);
        }
        else{
            $this.createScope(_mixin.line, _mixin.level, _default ? arg :_extractArg(_mixin));
            $this.currentScope++;
            ide.cursor = $this.cursor;
            ide.line = $this.currentLine;
            $this.cursor = _mixin.cursor;
            $this.currentLine = _mixin.line;
            $this.currentScope = _mixin.level;
            $this.currentMixinInUse[$this.currentScope] = _mixin;
            _mixin.render = null;
            //call SlimParser
            // console.log('[SLIM]',_mixin, $this.currentRenderScope)
            $this.slimParser($this.cursor + _mixin.body.length, undefined, undefined, true, true);
            _mixin.ready = true;
            //reinitialisation
            $this.cursor = ide.cursor;
            $this.currentScope = ide.level;
            $this.currentLine = ide.line;
            //Application des évènements
            // $this.setActions(mixin);
        }
    }
    function _setAxis(unset){
        var unset = $js.set(unset,false);
        if(!unset) {
            ide.cursor = $this.cursor;
            ide.line = $this.currentLine;
            ide.level = $this.currentScope;
        }
        else{
            $this.cursor = ide.cursor;
            $this.currentScope = ide.level;
            $this.currentLine = ide.line;
        }
    }
    //Traitement du traitement de rendu des mixins parents
    for(var i in mixin.legacyRef){
        _setAxis();
        _superActions = $this.renderMixin(mixin.legacyRef[i], undefined, _extractArg(mixin.legacyRef[i]), true, true);
        _setAxis(true);
        if(mixin.legacyRef[i].unused){
            _actions.push(mixin.legacyRef[i].actions);
        }
        mixin.legacyRef[i].render = null;
        $js.merge(_actions, _superActions, true);
    }
    var _id = $this.currentTagId;
    _parse(mixin);
    if(_invokationMod){
        $this.setCurrentInvokationData(mixin.actions);
    }
    var _hasInvokation = $this.getCurrentInvokation($this.currentScope + 1) == mixin;
    // console.error('[***Actions*]',$this.realpath, '/', _actions,'/', mixin,{_hasInvokation, _invokationMod}, $js.copyObj($this.currentInvokation))
    if(_actions.length || (_hasInvokation && !_invokationMod)){
        if(_hasInvokation){
            $js.merge(_actions,  $this.getCurrentInvokationData($this.currentScope + 1), true);
            $this.currentInvokation[$this.currentScope + 1] = null;
            $this.currentInvokationData[$this.currentScope + 1] = [];
        }
        $this.setSuperActions(mixin,_actions,_id);
    }
    if($js.len(mixin.actions)){
        $this.setActions(mixin);
    }
    mixin.render = null;
    $this.currentScope = ide.level;
    $this.currentLine = ide.line;
    if(!_invokationMod){
        $this.currentMixinInUse[$this.currentScope] = null;
    }
    return _actions;
}
$sy.getMixinArgument = function(mixin, _args, meta){
    var $this = this,
        _cursor,
        _currentCursor = $this.cursor,
        _type, _last_key = null, _typeData,
        arg = {}, _val, _k = 0;
    $this.cursor = meta === undefined ? this.cursor + 1 : meta.cursor + 1;
    // console.warn('[Cursor]',this.cursor, this.currentCode.substr(this.cursor - 20, 50))
    $this.syncLoop(function(char){
        // console.log('[char]',char);
        _cursor = $this.cursor;
        _type = "Any";
        if(_k in _args){
            _type = mixin.attr[_args[_k]].type;
            _last_key = _args[_k];
            _typeData = $js.copyObj(mixin.attr[_args[_k]].typeData);
            if(mixin.generic){
                _type = $js.set(mixin.accept[_type], _type);
                for(var i in _typeData._keyConstraints){
                    _typeData._keyConstraints[i] = $js.set(_mixin.accept[_typeData._keyConstraints[i]], _typeData._keyConstraints[i]);
                }
                for(var i in _typeData._valueConstraints){
                    _typeData._valueConstraints[i] = $js.set(mixin.accept[_typeData._valueConstraints[i]], _typeData._valueConstraints[i]);
                }
            }
            $this.currentTypeData[$this.currentScope] = _typeData;
        }
        $this.passBlank();
        // console.log('[Type]',_type)
        _val = $this.valueFinder({
            statementBreak: [':',',',')'],
            _inc: [-1],
            _passAfter: [':'],
            untilEnd: true,
            constraintType: _type
        });
        char = $this.currentCode[$this.cursor];
        $this.currentType[$this.currentScope] = null;
        $this.currentTypeData[$this.currentScope]._hasValueConstraint = false;
        if(char == ':'){
            _val = $js.clearSpace($this.currentCode.substr(_cursor,$this.cursor - _cursor));
            if(_val in mixin.attr){
                _last_key = _val;
                _k = mixin.attr[_val].index;
            }
            else{
                $this.debugging("[ "+_val+" ] is not a mixin [ "+mixin.name+" ] argument !");
            }
        }
        else if(char == ','){
            if(_last_key != null && $js.len(_val)){
                arg[_last_key] = $js.extend(mixin.attr[_args[_k]], {
                    value: _val
                });
                _last_key = null;
            }
            _k++;
        }
        else if(char == ')'){
            if(_last_key != null && $js.len(_val)){
                arg[_last_key] = $js.extend(mixin.attr[_args[_k]], {
                    value: _val
                })
            }
            return false;
        }
    });
    $this.currentType[$this.currentScope] = null;
    $this.currentTypeData[$this.currentScope]._hasValueConstraint = false;
    if(_currentCursor > this.cursor){
         $this.cursor = _currentCursor;
    }
    return arg;
}
$sy.setSuperActions = function(mixin,_e){
    var firstChild = null,
    $this = this,
    _k = 0,
    _apply = function(el){
        var _type = ['style','attr','event'];
        for(var i in _e[_k]){
            if(_type.indexOf(i) >= 0){
                $this.applyAction(i, el, _e[_k][i]);
            }
        }
    },
    find = {
        children: function(_first){
            var _first = $js.set(_first, false);
            for(var i in mixin.render){
                if(mixin.render[i].first){
                    if(firstChild == null){
                        firstChild = mixin.render[i].dom;
                    }
                    if(_first){
                        break;
                    }else{
                        _apply(mixin.render[i].dom);
                    }
                }
            }
        },
        parents : function(_level){
            var r = firstChild;
            for(var i = 0; i < _level; i++){
                r = r.parentElement;
            }
            _apply(mixin.render[i].dom);
        }
    };
    for(_k in _e){
        if($js.len(_e[_k])){
            firstChild = null;
            //On cherche les premiers éléments
            find.children(!_e[_k].applyToChildren);
            //Si on a une liste de parent
            if(_e[_k].parentLevel.length && firstChild != null){
                for(var i in _e[_k].parentLevel){
                    //Il faut que la valeur soit un nombre et que le nombre soit supérieur à 0
                    if($js.is.interger(_e[_k].parentLevel[i]) && _e[_k].parentLevel[i] > 0){
                        find.parents(_e[_k].parentLevel[i]);
                    }
                }
            }
        }
    }
    // console.log('[E]',_e,mixin, this.currentRenderScope, this.currentTagId, id);
};
$sy.applyAction = function(_type, _target, data){
    var $this = this;
    switch(_type){
        case 'event':
            for(var i in data){
                (function(){
                    // if(!('slimeventattached' in _target.attributes) || !$js.toBoolean(_target.attributes.slimeventattached) ||
                    //     ('eventoverride' in _target.attributes && $js.toBoolean(_target.attributes.eventoverride))
                    // ){
                        if('eventoverride' in _target.attributes && $js.toBoolean(_target.attributes.eventoverride)){
                            $this.EventManager.off(_target, i);
                        }
                        $this.EventManager.on(_target,i,data[i],$this);
                    // }
                })();
            }
        break;
        case 'style':
        case 'css':
            for(var i in data){
                _target.style[$js.toCamelCase(i)] = data[i];
            }
        break;
        case 'attr':
            for(var i in data){
                _target.setAttribute([i], data[i]);
                if(i == 'name'){
                    this.SDOMElements[data[i]] = _target;
                }
            }
        break;
    }
}
$sy.setActions = function(mixin){
    var _act;
    if('parentLevel' in mixin.actions){
        this.setSuperActions(mixin, [mixin.actions], this.currentTagId);
    }
    else{
        for(var i in mixin.actions){
            _act = mixin.actions[i];
            for(var j in _act){
                this.applyAction(i,_act[j].target,_act[j].content);
            }
        }
    }
}


//Methods
$sy.call = function(meta, arg, _async){
    // console.log('[args]',{meta,arg,type})
    var type = meta.label,
        $this = this,
        _async = $js.set(_async, false);
        e = $this[type+'Caller'](meta, arg, _async);
    return{return : e, render: $this.currentRender};
}
$sy.getRemoteArgument = function(mixin, _args, meta){
    return this.getMixinArgument(mixin,_args, meta);
}
$sy.callMixin = function(mixin, arg, _lastDOM, _allowUnused, _doNotAct, _invoke){
    var _lastDOM = $js.set(_lastDOM, this.getCurrentDOM()),
        _isMixin = $js.isInternalObject(mixin),
        _doNotAct = $js.set(_doNotAct, false),
        _invoke = $js.set(_invoke, null),
        name = _isMixin ? mixin.name : mixin,
        _curr = this.currentInvokation[this.currentScope],
        _r,
        _allowUnused = $js.set(_allowUnused, false);
    this.currentDOMElement[this.currentRenderScope] = _lastDOM;
    this.currentInvokation[this.currentScope] = _invoke;
    var _abstract = this.getMixinAbstraction({name : mixin, type: mixin}, false);
    if(arg != undefined){
        _abstract.arg = arg;
    }
    _r = this.renderMixin(_abstract,_isMixin ? mixin : undefined,arg, _allowUnused, _doNotAct);
    this.currentInvokation[this.currentScope] = _curr;
    return _r;
}
$sy.applyPlugins = function(e){
    for(var i in plugins){
        if(e.toLowerCase() == plugins[i].tag.toLowerCase()){
            console.log('[tag]',this.currentRender.tagName);
            plugins[i].callback(this.currentRender);
        }
    }
}
//Compiler : to compile source code
$sy.compiler = function(e,end,breakEnter,save, _async, _renderCall, _from){
    // console.log('[Code]',e);
    var code = '',
        $this = this,
        _from = $js.set(_from, 'main'),
        _async = $js.set(_async, false),
        _renderCall = $js.set(_renderCall, false),
        options = $js.extend({
            e: $js.isJson(e) ? undefined : e,
            end: end,
            breakEnter: breakEnter,
            save: save,
            wanted: null,
            emergency: false
        },$js.isJson(e) ? e : {}),
        stop = false,
        render = '',
        _acting = false,
        _currLine = $this.currentLine,
        s = $js.getSymbols(),
        key  = '',
        _mixinPending = false,
        lazycode = '',
        currentLazyKey = '';
    options.end = $js.set(options.end, options.e === undefined ? $this.currentCode.length : options.e.length);
    options.save = $js.set(save, true);
    options.breakEnter = $js.set(options.breakEnter,null);
    // console.log('[OPTIONS]',options);
    // console.log('[Start]',{start: cursor, end: end, breakEnter, save});
    $this.syncLoop(options.e, function(char,i){
        $js.countSymbols(s,char);
        if(['\n', ';'].indexOf(char) >= 0){
            if($js.clearSpace(code).length == 0 && save){
                return;
            }
        }
        // console.log('[***Char]',char,'[b]',s.brace,'[p]', s.parenthese,'/', $this.cursor);
        //Si on n'est pas dans le bloc
        if($this.breakLevel >= 0 && $this.currentScope <= $this.breakLevel){
            return false;
        }
        //Si on enregistre les informations des codes ou pas
        if(!options.save){
            if(options.breakEnter === true){
                if($js.checkSymbols(s) && char == '\n'){
                    return false;
                }
            }
            else if(options.breakEnter === false && $js.checkSymbols(s, ['brace']) && s['brace'] == -1){
                return false;
            }
        }
        else{
            //Si on passe à l'interprétation de rendu
            if($this.getCurrentMixinRender() != null && $js.checkSymbols(s, ['brace', 'bracket','parenthese']) && (char == '?' && $this.currentCode[i + 1] == '>' || char == '>' && $this.currentCode[i - 1] == '?')){
                $this.cursor += char == '?' ? 2 : 1;
                if(_renderCall){
                    return false;
                }
                $this.slimParser(undefined, options.breakEnter, _async);
            }
            else if(options.breakEnter === false && $js.checkSymbols(s, ['brace']) && s['brace'] == -1){
                // console.error('END')
                return false;
            }
            else if( $this.cursor >= end-1 || (EOS.indexOf(char) >= 0 && (code.length > 0 || (_mixinPending && !$js.clearSpace(code).length && char == '(') || char == '<') ) ){
                // console.log('[CODE}/',char, $this.cursor);
                key = $js.clearSpace(code);
                //Verifier si c'est un mot-clé:
                if(char == '(' && !key.length && _mixinPending){
                    $this.renderMixin($this.getMixinAbstraction({type: $this.getCurrentType(), name: $this.getCurrentType()}, true));
                    $this.currentType[$this.currentScope] = null;
                    key = '';
                    code = '';
                    return;
                }
                else if(reservedKeys.indexOf(key) >= 0 || (options.wanted != null && options.emergency) ){
                    if(options.wanted != null){
                        // console.log('[KEY]',key);
                        if(options.wanted.indexOf(key) >= 0 && $js.checkSymbols(s)){
                            $this.cursor -= code.length + 1;
                            return false;
                        }
                        if(options.emergency){
                            key = '';
                            code = '';
                            return;
                        }
                    }
                    //Interdiction d'avoir le mot-clé override
                    if($this.getCurrentOverride()){
                        $this.debugging("invalid syntax : override ... "+key);
                    }
                    //interdiction d'avoir le mot-clé const active
                    if($this.nextConst[$this.currentScope] == true){
                        $this.debugging("invalid syntax : const ... "+key);
                    }
                    //interdiction d'avoir le mot-clé final si le mot-clé actuel ne le supporte pas
                    if($this.isFinalForNext() && finalizableKeys.indexOf(key) < 0){
                        $this.debugging("invalid syntax : final ... "+key);
                    }
                    //interdiction d'avoir les mots-clés 'export' et 'private' si le mot-clé actuel ne les supporte pas
                    else if($this.visibilityToggler.primitive || ($this.visibilityToggler.structure && privatisableKeys.indexOf(key) < 0) ){
                        $this.debugging("invalid syntax : "+($this.visibilityToggler.primitive ? "export" : "private")+" ... "+key);
                    }
                    //interdiction d'avoir un type devant un mot-clé ne supportant pas le typage
                    else if($this.getCurrentType() != null && typeBehinAcceptionKeys.indexOf(key) < 0 && _from != 'functionCaller'){
                        $this.debugging("invalid syntax : "+$this.getCurrentType()+" ... "+key);
                    }
                    //Si l'actuel clé est définit dans l'interpréteur
                    if(key in $this){
                        var result = $this[key](code);
                        // console.log('%c[key]','color: lightgreen', key,'+'+char+'+', result);
                        render = $this.touchRender(result, render);
                        if(char == '('){s.parenthese--;}
                        if(char == '['){s.bracket--;}
                        if(char == '{'){s.brace--;}
                        key = '';
                        code = '';
                        // console.log('[Last]',char+'<',$this.cursor, $this.currentCode.substr($this.cursor, 2))
                        return;
                    }
                    else{
                        code += char;
                    }
                }
                else{
                    if(types.indexOf(key) >= 0){
                        if($this.mixinDefined.indexOf(key) >= 0){
                            _mixinPending = true;
                            if(char == '('){
                                $this.currentType[$this.currentScope] = null;
                                $this.renderMixin($this.getMixinAbstraction({type: key, name : key}));
                                key = '';
                                code = '';
                                return;
                            }
                        }
                        // console.log('[TYPE]', key, '>'+char+'<', $this.getCurrentType(), '/', $this.currentCode.substr($this.cursor, 20));
                        //@override: si le type ou une contrainte de type a été défini(e), on lève une alerte
                        if($this.getCurrentType() != null || $this.getCurrentTypeData()._hasValueConstraint){
                            $this.debugging(key);
                        }
                        $this.currentType[$this.currentScope] = key;
                        //@generic
                        if(char == '<'){
                            $this.cursor++;
                            $this.getValueConstraint($this.getCurrentType() == null ? 'Any' : $this.getCurrentType());
                        }
                        code = '';
                        key = '';
                        return;
                    }
                    else{
                        _mixinPending = false;
                        // console.log('%c[KEY]', 'color: yellow', key,'/', char);
                        //@generic
                        if(char == '<'){
                            //@override: si un contrainte a déjà été défini ou le code n'est pas vide on lève une alerte !
                            if($this.getCurrentTypeData()._hasValueConstraint || code.length){
                                $this.debugging(char);
                            }
                            $this.cursor++;
                            // console.log('[Scope]',code,'/',$this.getCurrentType(),'/', $this.cursor, '>>', $this.currentCode.substr($this.cursor, 20));
                            $this.getValueConstraint($this.getCurrentType() == null ? 'Any' : $this.getCurrentType());
                            code = '';
                            key = '';
                            return;
                        }
                        else if(!$this.getCurrentOverride() && ($this.definedModules.indexOf(key) >= 0 || nativeFunctions.indexOf(key) >= 0) ){
                            // console.log('[Key]',key,'=>',$this.currentScope,render,$this.cursor, char);
                            if($this.nextConst[$this.currentScope] == true){
                                $this.debugging("Invalid syntax : const ...");
                            }
                            var result = $this.callable(key);
                            if(char == '('){s.parenthese--;}
                            if(char == '['){s.bracket--;}
                            if(char == '{'){s.brace--;}
                            // console.log('[CURSOR]',$this.cursor, $this.currentCode.substr($this.cursor,1), '/',key);
                            if($this.currentCode[$this.cursor] == '}' && breakEnter === false && $js.checkSymbols(s, ['brace']) && s['brace'] == 0){
                                // console.error('[Break]')
                                return false;
                            }
                            render = $this.touchRender(result, render);
                            code = '';
                            key = '';
                            if(options.breakEnter === true){
                                return false;
                            }
                            else{
                                return;
                            }
                        }
                        else if(/^[a-z_]([a-z0-9_]+)?$/i.test(key)){
                            // console.log('%c[Key]','color: green',key,'/', code, '/', $this.cursor,'>'+$this.currentCode.substr($this.cursor, 5))
                            $this.creatable(key);
                            code = '';
                            key = '';
                            // console.warn('[Key]',key, $this.cursor,'>'+$this.currentCode.substr($this.cursor, 5))
                            if(options.breakEnter === true){
                                return false;
                            }
                            return;
                        }
                        else{
                            // console.log('[Key]',key, $js.copyObj(s), $this.currentCode.substr($this.cursor, 20));
                            if($this.getCurrentOverride()){
                                $this.debugging("illegal syntax after override");
                            }
                            if(/[\s;]/.test(code)){
                                code = '';
                            }
                            else if(code.length){
                                console.log('[MIXIN]',$js.copyObj($this.currentMixinInUse), $this.currentScope)
                                $this.debugging(code);
                            }
                        }
                    }
                }
            }
            else{
                code += char;
            }
        }
        if($this.cursor >= end-1){
            return false;
        }
        // console.log('[Cursor]',$this.cursor,end);
    });
    // console.log('[Ok]',{render, curr: $this.currentRender})
    return render;
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
        tagHistory = {};
        exeCode = '';
        types = baseType;
    }
    $this.fileReader(file, $this._ncall > 0);
    instanceDB[$this.realpath] = $this;
    $this.compiler();
    moduleDB[$this.realpath] = $this.exportedModules;
    return {
        modules: $this.exportedModules,
        source: $this.currentCode,
        code : $this.currentRender
    };
}

//@Getters & accesories
$sy.getMainLayer = function(){
    return this.mainLayer;
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
$js.newId = function(){
    var r = '0x',
        max = Math.round(Math.random() * 10);
    for(var i = 0; i <= max; i++){
        r += Math.round(Math.random() * 7) + 3;
    }
    return r;
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
$js.isInternalObject = function(m){
    if(typeof m != 'object' || m == null || m == undefined || !('objid' in m) || ObjectIDS.indexOf(m.objid) < 0){
        return false;
    }
    else{
        return true;
    }
}
$js.isFunction = function(m){
    var r = false,
        t = [
            'arg', 'body', 'callback', 'cursor', 'hasBrace',
            'label', 'level', 'line', 'name', 'origin', 'type',
            'typeData', 'visible'
        ];
    if(!$js.isInternalObject(m)){
        return r;
    }
    r = true;
    for(var i in t){
        if(!(t[i] in m) ){
            r = false;
            break;
        }
    }
    return r;
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
    else if ($js.isJson(m)) {
        for(var i in m){l++;}
    }else{
        m = m == null || m == undefined ? '' : m.toString();
        l = m.length;
    }
    return l;
}
/*
* @setArray : function for default array definition
* */
$js.setArray = function(e){
    return Array.isArray(e) ? e : [];
}
$js.arraySort = function(e,reverse){
    if(!Array.isArray(e)){
        return;
    }
    var reverse = $js.set(reverse, false);
    e.sort(function(a,b){
       if(a < b){
           return !reverse ? -1 : 1;
       }
       else{
           return !reverse ? 1 : -1;
       }
    });
}
$js.arrayReverse = function(e){
    var r = [];
    if(!Array.isArray(e)){
        return e;
    }
    for(var i = e.length - 1; i >= 0; i--){
        r.push(e[i]);
    }
    return r;
}
$js.arrayRemoveElement = function(a,e,y){
    var y = $js.set(y, false), //définit si on supprime toutes les occurences ou pas
        r = [], nbr = 0;
    for(var i in a){
        if(e != a[i] || (e == a[i] && nbr > 0)){
            r.push(a[i]);
        }
        if(!y && e == a[i]){
            nbr++;
        }
    }
    return r;
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
 * @is
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
        return new RegExp("^("+(!strict ? "[\\s\\S]+" : "('([\\s\\S]+?|)'|\"([\\s\\S]+?|)\")" )+")$", "i").test(e);
    },
    callable: function(e){
        return /^\$?[a-z_]([a-z0-9_]+)?((\.[a-z0-9_]+|\[[\s\S]+?\])+)?([\s]+?)?\((|[\s\S]+?)\)$/i.test(e);
    },
    name: function(e,chk){
        var chk = $js.set(chk, true);
        return /^[a-z_][a-z0-9_]*$/i.test(e) &&  (!chk ? true : $js.merge(reservedKeys, $js.merge(types, nativeFunctions)).indexOf(e) < 0);
    },
    tag: function(e){
        return /^[a-z_][a-z0-9_-]*$/i.test(e);
    }
}
/*
* @checkSymbols()
* */
$js.checkSymbols = function(symbols, avoid, counts){
    var avoid = $js.setArray(avoid),
        counts = $js.setArray(counts),
        chk = false,
        r = true;
    avoid = Array.isArray(avoid) ? avoid : [avoid];
    counts = Array.isArray(counts) ? counts : [counts];
    chk = avoid.length && counts.length;
    if(chk){
        for(var i in avoid){
            if(!(i in counts)){
                counts.push(counts[counts.length - 1]);
            }
        }
    }
    $js.foreach(symbols, function(i, j){
        if(!$js.inArray(j, avoid)){
            r = i == 0 && r;
        }
    });
    if(r && chk){
        for(var i in avoid){
            if(avoid[i] in symbols){
                r = r && symbols[avoid[i]] == counts[i];
                if(!r){
                    break;
                }
            }
        }
    }
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
$js.merge = function(base,options, ref){
    if(!Array.isArray(base) || !Array.isArray(options)){
        return base;
    }
    var ref = $js.set(ref, false),
        r = ref ? base : $js.copyObj(base),
        t = $js.copyObj(options);
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
    return typeof e == 'object' && [undefined, null].indexOf(e) < 0 ? e : /^([\d]+|false|true)$/.test(e) ? e : e.toString().replace(/^([\s]+)?|([\s]+)?$/g, '');
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
        e = /([\d]+|true|false)/.test(e) ? e : '"'+e.replace(/"/g, '\\"')+'"';
    }
    return e;
}
/**
 * @param e
 * @param f
 * @returns {boolean}
 */
$js.hasCommonValues = function(e,f,strict){
    var strict = $js.set(strict, false),
        r = strict;
    if(!Array.isArray(e) || Array.isArray(f)){
        if(!e.length && !f.length){
            r = true;
        }
        else if(!e.length || !f.length){
            return false
        }
        for(var i in f){
            if( (e.indexOf(f[i]) < 0 && strict) || (e.indexOf(f[i]) >= 0 && !strict) ){
                r = !strict;
                break;
            }
        }
    }else{
        r = false;
    }
    return r;
}
$js.toCamelCase = function(e,pascal){
    if(typeof e != 'string'){
        return e;
    }
    var upper = $js.set(pascal, false),
        r = '',
        snake = ['_', '-'];
    for(var i in e){
        r += upper ? e[i].toUpperCase() : snake.indexOf(e[i]) >= 0 ? '' : e[i];
        upper = snake.indexOf(e[i]) >= 0;
    }
    return r;
}
$js.connectPlugins = function(name, callback){
    plugins[name] = callback;
}
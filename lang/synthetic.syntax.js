
/**
 * @auteur: Superga
 * @version: 8.0.0
 * @description: Synthetic language web compilator
 * @lang: french
 * @nextstep: gérer les blocs avec accolade et sans accolades
 */
var Synthetic = {};
Synthetic.Lang = {
    reservedKeys : [
        'if', 'import', 'from', 'include', 'into', 'in', 'to', 'if', 'elif',
        'else', 'while', 'loop', 'return', 'break','try','catch', 'mixin', 'use',
        'extends', 'with', 'require', 'slimPhase', 'private','unused', 'const',
        'unset', 'export','upper','root','external', 'async', 'return', '@js', 'label',
        'for', 'while', 'loop', 'override', 'switch','case','default', 'strict_mode',
        'final', 'invoke', 'reset', 'await', '@MixinActing', '@SyncBlockRender',
        'class', 'interface', 'trait', 'protected', 'this','super', 'abstract', 'static',
        'toString','implements'
    ],
    valuableReservedKeys: ['return'],
    lazyKeys : ['import', 'from', 'include'],
    baseType : ['Any', 'String', 'Number', 'JSON', 'Array', 'Boolean', 'Regex', 'Function', 'External'],
    breakableKeys : ['return', 'break'],
    scopeSniper: ['root', 'upper'],
    callAsMethodKeys : ['mixin', 'function'],
    privatisableKeys : ['mixin', 'unused', 'final', 'class', 'interface', 'abstract', 'static'],
    finalizableKeys : ['mixin', 'class'],
    typeCreatorKeys : ['mixin', 'class', 'interface', 'enum'],
    typeBehinAcceptionKeys : ['with'],
    nativeFunctions : [
        'out', 'print','split', 'typeof', 'replace', 'lower', 'maj', 'len',
        'tap', 'push','pop','shift', 'delete', 'sort','reverse', 'revSort',
        'filter', 'round','max','min', 'floor','ceil','abs', 'pow', 'join',
        'str', 'int', 'float', 'bool', 'timer', 'jsExec', 'platform', 'raise',
        'setState', 'debug'
    ],
    nativeFunctionTypes : {
        "int" : 'Number', "max" : 'Number', "min" : "Number", "float" : "Number",
        "len" : "Number", "floor": "Number", "ceil": "Number", "abs": "Number",
        "pow" : "Number", "round" : "Number", "bool" : "Boolean", "str": "String",
        "maj" : "String", "lower": "String", "replace" : "String", "typeof" : "String",
        "out": "Any", "print" : "Any", "timer": "Any", "jsExec": "Any", "raise": "Any",
        "pop": "Any", "shift": "Any", "split": "Array", "sort": "Array", "reverse": "Array",
        "revSort": "Array", "filter": "Array", "join": "String", "platform": "String", "tap" : "String",
        "push": "Any", "delete" : "Any"
    },
    definedTypes: [],
    blockEOS : ['}'],
    EOS : [' ', '\n', '\t', ';',',','(', ')','[', ']','{', '}','.', '?', ':','+','-','/','=','~','*','%', '<', '>', '|', '&', '"', "'", '!'],
    xhr: null,
    definedAddr : [],
    objects: {},
    operators : ['+','-','*','/','%','~'],
    signs : ['+','-','*','/','%','~','<','>', '&', '|','=','!','++', '--', '?', ':', '&&', '||', '>=', '<=', '==', '!=','===', '!==='],
    doubleSigns: ['++', '--', '&&', '||', '>=', '<=', '==', '!='],
    tripleSigns: ['===', '!==='],
    Reference: function(addr){
        this.addr = addr;
        this.getObject = function(){
            return Synthetic.Lang.objects[this.addr];
        }
    },
    Empty: function(){},
    constants: {
        UNKNOWN: -1,
        LITTERAL: 0,
        KEYWORD: 1,
        STRING: 2,
        NUMBER: 3,
        BOOLEAN: 4,
        REGEX: 5,
        COMMENT: 6,
        TYPE: 7,
        _EOS: {
            values: {
                start: ['(', '[', '{'],
                end: [')',']','}',',', ';', ':'],
            },
            PARENTHESE: 0,
            BRACKET: 1,
            BRACE: 2,
            COMA: 3,
            SEMICOLON: 4,
            ELSE: 5
        }
    },
    typeFromConstants: {
        0: 'Any',
        2: 'String',
        3: 'Number',
        4: 'Boolean',
        5: 'Regex'
    },
    simpleOperations: {
        POSITIVE: 0,
        NEGATIVE: 1,
        PREINCREMENTATION: 2,
        POSTINCREMENTATION: 3,
        PREDECREMENTATION: 4,
        POSTDECREMENTATION: 5,
        REVERSE: 6
    },
    scope: 0
};
Synthetic.Lang.constants.EMPTY = new Synthetic.Lang.Empty();

var node_env = typeof module == 'object' && 'exports' in module;
Synthetic.Lang.xhr = node_env ? require('fs') : new XMLHttpRequest();
if(node_env){
    module.exports = Synthetic;
}

Synthetic.Class = function(){
    this.types = this.copy(Synthetic.Lang.baseType);
    this.variableType = [];
    this.code = '';
    this.file = '';
    this.linesEnd = [];
    this.lastIndex = {
        scope: -1,
        line: -1
    };
    this.modules = {};
    this.exportables = {};
    this.executing = true;
    this.tryMethodInstead = false;
    this.tryMethodInsteadConfirmed = false;
    this.previousReason = null;
    this.blocks = ['0,0'];
    this.scopes = {};
    this.currentType = null;
    this.cursor = {
        lines : {
            x: 0,
            y: 1
        },
        scope: 0,
        index : 0,  
    };
    this.access = {
      private : false,
      protected: false,
      abstract: false,
      final: false,
      static: false,
      export: false
    };
}

var $syl = Synthetic.Class.prototype;

/**
 * la méthode addr crée aléatoirement des adresses pour les objets pour l'optimisation et référencements des objets
*/
$syl.addr = function(){
    var r = '0x',
        max = Math.round(Math.random() * 10),
        hexa = ['a','b','c','d','e','f'];
    for(var i = 0; i <= max; i++){
        r += Math.round(Math.random() * 1) ? hexa[Math.floor(Math.random() * hexa.length)] : Math.round(Math.random() * 7) + 3;
    }
    Synthetic.Lang.definedAddr.push(r);
    return r;
}
/**
 * la méthode isset permet de savoir si une variable est définie ou non
 */
$syl.isset = function(str){
    return typeof str != 'undefined' && str != null;
}
/**
 * la méthode set permet de définir une variable avec une valeur si cette variable n'est pas définie
 */
$syl.set = function(e, v, s){
    return this.isset(s) ? (e ? this.isset(v) ? v : null : this.isset(s) ? s : null) : (this.isset(e) ? e : this.isset(v) ? v : null);
}
/**
 * La méthode garbage pemet de nettoyer le stockage inutile des variables
 */
$syl.garbage = function(){
    for(var i in this.modules){
        delete this.modules[i][null];
    }
    for(var i in Synthetic.Lang.objects){
        if(Synthetic.Lang.objects[i].name == null){
            delete Synthetic.Lang.objects[i];
        }
    }
    //@DELETE

    // for(var i in this.modules){
    //     for(var j in this.modules[i]){
    //         if(this.modules[i][j].name == null){
    //             delete Synthetic.Lang.objects[this.modules[i][j].addr];
    //             delete this.modules[i][j];
    //         }
    //     }
    // }
}
/**
 * La méthode len permet de calculer la longueur d'un objet
 */
$syl.len = function(arg){
    var r = 0;
    if(typeof arg != 'object'){
        r = Array.isArray(arg) ? arg.length : (arg+'').length;
    }
    else{
        for(var i in arg){
            r++;
        }
    }
    return r;
};
/**
 * la méthode copy permet de copier les données sérialisables d'un objet itérable
*/
$syl.copy = function(e,intermediate){
    intermediate = this.set(intermediate,false);
    if(!intermediate){
        return JSON.parse(JSON.stringify(e));
    }
    else{
        var r = {};
        for(var i in e){
            r[i] = e[i];
        }
        return r;
    }
}
/**
 * la méthode extend permet d'étendre un objet itérable à partir d'un autre objet itérable
 * @param <p>
 * model : l'objet de base à étendre
 * </p>
 * <p>
 *  options: l'objet source duquel on prend les données pour étendre
 * </p>
 * <p>
 * ref: définit si on prend en compte la référence de l'objet de base
 * </p>
 * @returns JSON
*/
$syl.extend = function(model, options, ref){
    var ref = this.set(ref, false),
        r = ref ? model : this.copy(model),
        options = ref ? options : this.copy(options);
    for(var i in options){
        r[i] = options[i];
    }
    return r;
}
/**
 * La méthode extendElse permet d'étendre un objet sans perdre sa référence
 * en ajoutant seulement les valeurs qu'il n'avait pas
 */
$syl.extendElse = function(model, options){
    for(var i in options){
        if(!(i in model)){
            model[i] = options[i];
        }
    }
}
/**
 * la méthode meta donne une structure de base pour la sérialisation des objets tout en permettant d'ajouter d'autres données
*/
$syl.meta = function(options,autosave){
    var result = this.extend({
        cursor: {
            lines : {
                x: this.cursor.lines.x,
                y: this.cursor.lines.y
            },
            scope: this.cursor.scope,
            index : this.cursor.index
        },
        type: 'Any', // le type de valeur: par exemple : Any, Number, String,
        implicitType: null,
        constraints: null,
        native: false,
        ref: this.cursor.scope+','+this.cursor.index,
        label: null, //le type de notation: par exemple : mixin, variable
        name: null, //le nom du notation: par exemple : nomVariable
        visible: false, //Le module sera visible ou pas
        origin: null,//this.realpath, //Le chemin absolu dans lequel se trouve le module
        addr: this.addr()
    }, options),
    autosave = this.set(autosave,true);
    result.implicitType = result.implicitType == null ? result.type : result.implicitType;
    this.resetAccess();
    this.currentType = null;
    this.previousReason = null;
    if(autosave) this.save(result);
    return result;
}
/**
 * la fonction loop permet de parcourir une boucle de façon compatible à l'asynchrone
*/
$syl.loop = function(callback,cursor,stringless){
    var $this = this,
        cursor = typeof cursor == 'number' ? cursor : $this.cursor.index,
        _break = false, word = '',
        stringless = this.set(stringless,false),
        wrapper, _wrapper = null;
        len = $this.code.length;
    return new Promise(function(resolve, reject){
        /**
         * la fonction stop est pour mettre en pause la boucle asynchrone pour attendre une tâche
         */
        function stop(){
            _break = true;
        }
        /**
         * la fonction start est pour redémarrer la boucle asynchrone après un arrêt
        */
        function start(){
            _break = false;
            if($this.code[cursor] != '\n'){
                $this.cursor.lines.x++;
            }
            // console.log('[Start]',$this.code[cursor]);
            // $this.goTo(1);
            cursor = $this.cursor.index;
            until();
        }
        /**
         * la fonction en est l'équivalent de l'instruction break pour la boucle asynchrone
         */
        function end(){
            _break = true;
            resolve();
        }
        /**
         * la fonction until est le déclencheur du parcours de la chaîne de caractères du code source
        */
        function until(){
            var findEOS = false, doubleSigns = false, tripleSigns = false, restart = false;
            wrapper = _wrapper != null ? _wrapper : {
                quote: 0,
                simple_quote: 0,
                last_char: '',
                comment: 0,
                regex: 0
            };
            _wrapper = null;
            function rollback(){
                console.log({doubleSigns,tripleSigns});
            }
            while(cursor < len && !_break){
                if(
                    !wrapper.comment && (
                        ($this.code[cursor] == '"' && wrapper.quote) ||
                        ($this.code[cursor] == "'" && wrapper.simple_quote)
                    )
                ){
                    word += $this.code[cursor];
                    /**
                     * On empêche de considérer le quote fermant comme étant un EOS
                     * tout en déméttant le compteur de quote
                    */
                    if($this.code[cursor] == '"' && wrapper.quote){
                        wrapper.quote--;
                    }
                    if($this.code[cursor] == "'" && wrapper.simple_quote){
                        wrapper.simple_quote--;
                    }
                    /**
                     * Puis on met à jour le cursor pour le faire sauter un
                     * caractère
                     */
                    $this.goTo(1);
                    cursor = $this.cursor.index;
                }
                switch($this.code[cursor]){
                    case '\n':
                        // console.log('[line] when',$this.cursor.index);
                        // if($this.lastIndex != $this.cursor.index){
                            $this.cursor.lines.y++;
                            $this.cursor.lines.x = 0;
                            if(wrapper.comment == 1){
                                wrapper.comment = 0;
                            }
                        // }
                        $this.saveLines();
                    break;
                    case ".":
                        if(!wrapper.quote && !wrapper.simple_quote && $this.getImplicitType(word) == 'Number' && word.indexOf('.') < 0){
                            word += '.';
                            $this.goTo(1);
                            cursor = $this.cursor.index;
                            restart = true;
                        }
                    break;
                    case '/':
                        /*
                            lorsqu'on voit un '/' en déhors d'une chaine de caractère ou
                            d'un commentaire, 
                            on vérifie si on est en présence d'un commentaire ou 
                            d'un regex
                        */
                        if(!wrapper.quote && !wrapper.simple_quote){
                            if(wrapper.comment == 0){
                                if(['*', '/'].indexOf($this.code[cursor + 1]) >= 0){
                                    wrapper.comment = $this.code[cursor + 1] == '*' ? 2 : 1;
                                    $this.goTo(1);
                                    cursor = $this.cursor.index;
                                    restart = true;
                                }
                                else{
                                    wrapper.regex = !wrapper.regex;
                                }
                            }
                            else if(wrapper.last_char != '\\' && !wrapper.comment){
                                wrapper.regex = 0;
                            }
                            else if(wrapper.comment == 2 && $this.code[cursor - 1] == '*'){
                                wrapper.comment = 0;
                                $this.goTo(1);
                                cursor = $this.cursor.index;
                                restart = true;
                            }
                        }
                    break;
                    case '\\': //le caractère '/' doit exister seulement dans une chaine de caractère ou un commentaire ou un regex
                        if(!wrapper.quote && !wrapper.simple_quote && !wrapper.comment && !wrapper.regex){
                            throw new Error($this.err("illegal character [ \\ ]"));
                        }
                    break;
                    case '{':
                        if(!wrapper.quote && !wrapper.simple_quote && !wrapper.comment && !wrapper.regex){
                            $this.fixScope(true);
                        }
                    break;
                    case '}':
                        if(!wrapper.quote && !wrapper.simple_quote && !wrapper.comment && !wrapper.regex){
                            $this.fixScope(false);
                            // $this.cursor.scope = $this.cursor.scope < 0 ? 0 : $this.cursor.scope;
                        }
                    break;
                    case "'":
                        if(!stringless && !wrapper.quote && !wrapper.comment && wrapper.last_char != '\\'){
                            wrapper.simple_quote = (wrapper.simple_quote + 1) % 2;
                        }
                    break;
                    case '"':
                        if(!stringless && !wrapper.simple_quote && !wrapper.comment && wrapper.last_char != '\\'){
                            wrapper.quote = (wrapper.quote + 1) % 2;
                        }
                    break;
                }
                if(restart){
                    break;
                }
                findEOS = !wrapper.quote && !wrapper.simple_quote && !wrapper.comment && Synthetic.Lang.EOS.indexOf($this.code[cursor]) >= 0;
                findEOS = findEOS || cursor >= len - 1;
                doubleSigns = findEOS && Synthetic.Lang.doubleSigns.indexOf($this.code[cursor]+$this.code[cursor+1]) >= 0;
                tripleSigns = doubleSigns && Synthetic.Lang.tripleSigns.indexOf($this.code[cursor]+$this.code[cursor+1]+$this.code[cursor+2]) >= 0;
                
                if(doubleSigns){
                    $this.goTo(tripleSigns ? 2 : 1);
                    cursor = $this.cursor.index;
                    if($this.code[cursor] == '\n'){
                        $this.cursor.lines.y++;
                        $this.cursor.lines.x = 0;
                    }
                    // console.log('[char]',$this.code[cursor-1]+$this.code[cursor]);
                }
                if(!findEOS && !wrapper.comment){
                    word += $this.code[cursor];
                }
                // $this.lastIndex = $this.cursor.index;
                
                if(!wrapper.quote && !wrapper.simple_quote && !wrapper.comment){
                    callback({
                            char: doubleSigns ? (tripleSigns ? $this.code[cursor-2] : '') + $this.code[cursor-1]+$this.code[cursor] : $this.code[cursor], 
                            word: findEOS ? word : null, 
                            index: cursor
                        }, 
                        {
                            start: start, 
                            stop: stop, 
                            end: end,
                            rollback: rollback
                        });
                        // console.log('[__char__]',$this.code[cursor],findEOS,word,'>', cursor);
                }
                /**
                 * On parre à l'éventualité que le curseur pourrait être mise à jour dans
                 * l'exécution du callback, alors, il faut mettre aussi à jour toutes
                 * les variables qui en dépendent
                 */
                cursor = $this.cursor.index;
                if(findEOS) word = '';
                findEOS = !wrapper.quote && !wrapper.simple_quote && !wrapper.comment && Synthetic.Lang.EOS.indexOf($this.code[cursor]) >= 0;
                // if(findEOS) word = '';
                if(_break) break;
                if($this.code[cursor] != '\n'){
                    $this.cursor.lines.x++;
                }
                $this.goTo(1);
                cursor = $this.cursor.index;
                last_char = $this.code[cursor];
            }
            if(restart){
                restart = false;
                _wrapper = wrapper;
                until();
            }
            if(cursor >= len - 1){
                resolve();
            }
        }
        until();
    });
};
/**
 * La méthode backTo permet de faire des bonds arrière en lecture en prenant en compte la décompte des lignes 
 */
$syl.backTo = function(reduction){
    var t = 0, k;
    while(reduction > 0){
        switch(this.code[this.cursor.index]){
            case '\n':
                this.cursor.lines.y--;
                k = this.cursor.index-1;
                while(this.code[k] == '\n'){
                    t++;
                    k--;
                }
                this.cursor.lines.x = t;
            break;
                this.fixScope(false);
            break;
            case '}':
                this.fixScope(true);
            break;
        }
        this.cursor.index--;
        reduction--;
    }
}
/**
 * La méthode goTo permet de faire des bonds avant dans la lecture
 */
$syl.goTo = function(addition){
    var first = true;
    while(addition > 0){
        this.cursor.index++;
        if(!first){
            this.cursor.lines.x++;
            switch(this.code[this.cursor.index]){
                case '\n':
                    this.cursor.lines.y++;
                    this.cursor.lines.x = 0;
                break;
                case '{':
                    this.fixScope(true);
                break;
                case '}':
                    this.fixScope(false);
                break;
            }
        }
        first= false;
        addition--;
    }
}

$syl.fixScope = function(increase){
    if(this.lastIndex.scope == this.cursor.index){
        return;
    }
    this.lastIndex.scope = this.cursor.index;
    this.cursor.scope += increase ? 1 : -1;
}

$syl.saveLines = function(){
    if(this.lastIndex.line == this.cursor.index){
        return;
    }
    this.lastIndex.line = this.cursor.index;
    if(this.code[this.cursor.index] == '\n'){
        this.linesEnd.push(this.cursor.index);
        // console.log('[Lines]',this.linesEnd);
    }
}
/**
 * La méthode toNextChar permet de trouver le prochain caractère non-blanc dans le
 * code pour éviter d'attendre jusqu'au prochain tour de la boucle.
*/
$syl.toNextChar = function(stringless,count){
    var $this = this, _char = '', count = this.set(count,-1),
    stringless = this.set(stringless,true);
    return new Promise(function(res,rej){
        $this.loop(function(cursor,loop){
            // console.log('[char]',cursor.char,$this.cursor.index);
            if(/[\S]+/.test(cursor.char) || cursor.index == $this.code.length - 2){
                _char = cursor.char;
                if(Synthetic.Lang.doubleSigns.indexOf(_char) >= 0){
                    $this.goTo(1);
                }
                if(Synthetic.Lang.tripleSigns.indexOf(_char) >= 0){
                    $this.goTo(2);
                }
                loop.end();
            }
        },null,stringless).then(function(){
            res(_char);
        })
    });
}
/**
 * La méthode read permet de lire le contenu un fichier. Elle retourne son contenu
 */
$syl.read = function(filename){
    var $this = this;
    return new Promise(function(resolve,reject){
        $this.file = filename;
        if(node_env){
            Synthetic.Lang.xhr.readFile(filename, 'utf-8', function(err,content){
                if(err) throw err;
                $this.code = content+'\n\n';
                resolve();
            });
        }
        else{

        }
    });
}
/**
 * La méthode genericType prend en charge le types généric
*/
$syl.genericType = function(type){
    var $this = this,
        _type = type;
    return new Promise(function(res,rej){
        if(Synthetic.Lang.baseType.indexOf(_type) >= 0 && ['Array', 'JSON'].indexOf(_type) < 0){
            throw new Error($this.err("primitive type [ "+ _type + "] can't be generic !"));
        }
        var _dictMod = _type != 'Array',
            type = {
                type: _type,
                constraints: null,
                hasKeyConstraint: false,
                hasNextType: false,
                saved: false
            }, lastword = null, all = false;

        function savetype(){
            var r = false;
            if(lastword != null && type.constraints != null){
                r = true;
                /**
                 * Si le type n'est pas défini dans le module
                 * On soulève une exception
                 */
                if($this.types.indexOf(lastword) < 0){
                    throw new Error($this.err("the type [ "+lastword+" ] is undefined !"));
                }
                if(_dictMod && !type.hasKeyConstraint && ['Number', 'String','Any'].indexOf(lastword) < 0){
                    throw new Error($this.err("Number or String are only allowed to be key constraints"));
                }
                type.constraints[!type.hasKeyConstraint && _dictMod ? 'key' : 'value']
                .push(typeof lastword == 'string' ? {
                    type: lastword,
                    constraints: null
                } : lastword);
                if(_dictMod && !type.hasKeyConstraint){
                    type.hasKeyConstraint = true;
                }
                lastword = null;
            }
            return r;
        }
        $this.loop(function(cursor, loop){
            if(cursor.word){
                lastword = cursor.word;
            }
            //Avec le caractère '<' on commence la généricité
            if(cursor.char == '<'){
                if(type.constraints == null ){
                    type.constraints = {
                        key: [],
                        value: [],
                        recursive: false
                    };
                }
                //Si aucun type n'a été pris en charge dans la sous-généricité, il y a erreur de syntaxe
                else if(lastword == null || typeof lastword != 'string'){
                    throw new Error($this.err("illegal expression [ "+cursor.char+" ]"));
                }
                else{
                    throw new Error($this.err("Syntax error !"));
                }
            }
            //pour les autres caractères
            else if(type.constraints != null){
                if(cursor.char == '|'){
                    //Aucune permutation de type ne peu être faite sans un type précédent
                    if(!savetype()){
                        throw new Error($this.err("illegal expression [ "+cursor.char+" ]"));
                    }
                }
                else if(cursor.char == '.'){
                    if($this.code.substr(cursor.index, 3) == '...'){
                        if(type.constraints.recursive){
                            throw new Error($this.err("illegal expression [ "+cursor.char+" ]"));
                        }
                        if(type.constraints.key.length == 0 && _dictMod){
                            lastword = 'Any';
                            savetype();
                        }
                        type.constraints.recursive = true;
                        $this.goTo(2);
                    }
                    // else if(typeof lastword == 'string'){
                    //     lastword += '.';
                    // }
                }
                else if(cursor.char == ','){
                    savetype();
                    type.hasKeyConstraint = true;
                    if( (type.constraints.key.length == 0 && _dictMod) || (!_dictMod && !type.constraints.recursive)){
                        // console.log(type.constraints, _dictMod)
                        throw new Error($this.err("illegal character [ , ]"));
                    }
                }
                //Dès qu'on rencontre le caractère '>', on arrête tout puis on résout la promesse
                else if(cursor.char == '>'){
                    /**
                     * Si c'est une seule valeur passé pour un JSON,
                     * on la considère pour la clé et la valeur en même temps.
                     */
                    if(
                        _dictMod && 
                        type.constraints.key.length == 0 && 
                        type.constraints.value.length == 0 &&
                        lastword && lastword.length
                    ){
                        all = lastword;
                        savetype();
                        lastword = all;
                        savetype();
                        all = true;
                    }
                    //Aucune généricité ne peut être vide
                    if(!savetype() && !type.constraints.recursive && !all){
                        throw new Error($this.err("illegal expression [ "+cursor.char+" ]"));
                    }
                    type.saved = true;
                    loop.end();
                    $this.goTo(1);
                    if(type.constraints.value.length == 0){
                        lastword = 'Any';
                        savetype();
                    }
                    res(type);
                }
            }
            //sinon il y a erreur de syntaxe
            else if($this.currentType.constraints != null && $this){
                // console.log('[Current]', $this.cursor.scope, Synthetic.Lang.scope, cursor.word, $this.cursor.index, cursor.index);
                throw new Error($this.err("illegal expression [ "+(cursor.word ? cursor.word : cursor.char)+" ]" + $this.code.substr(cursor.index,10)));
            }
        });
    });
}
/**
 * La méthode getCurrentType retourne le type en cours pris en compte sinon le type par défaut : Any
 * Dans le cas où l'argument value est défini, on cherche son type ou son type implicite
*/
$syl.getType = function(value){
    value = this.set(value,null);
    return value != null ? value.implicitType : this.currentType == null ? {
        type: 'Any',
        constraints: null
    } : this.currentType;
}
/**
 * La méthode getCodeType permet de savoir si une portion du code est:
 *  - litéral
 *  - chaine de caractère
 *  - mot-clé
 *  - nombre
 *  - booléen
 *  - expression régulière
 *  - commentaire
 */
$syl.getCodeType = function(code){
    var type = Synthetic.Lang.constants.UNKNOWN;
    if(/^'([\s\S]+)?'$|^"([\s\S]+)?"$/.test(code)){
        type = Synthetic.Lang.constants.STRING;
    }
    else if(Synthetic.Lang.reservedKeys.indexOf(code) >= 0){
        type = Synthetic.Lang.constants.KEYWORD;
    }
    else if(this.types.indexOf(code) >= 0){
        type = Synthetic.Lang.constants.TYPE;
    }
    else if(/^(\-|\+)?([\s]+)?[0-9]+(\.[0-9]+)?$/.test(code)){
        type = Synthetic.Lang.constants.NUMBER;
    }
    else if(['false', 'true', true, false].indexOf(code) >= 0){
        type = Synthetic.Lang.constants.BOOLEAN;
    }
    else if(/^\/\^?[\S \\\/+*?{}\[\].,-]+\$?\/$/.test(code)){
        type = Synthetic.Lang.constants.REGEX
    }
    else if(/^\/\/([\S ]+)?\n?$|^\/\*([\s\S]+?)\*\/$/.test(code)){
        type = Synthetic.Lang.constants.COMMENT;
    }
    else if(/^[a-z_$]([a-z0-9_]+)?$/i.test(code)){
        type = Synthetic.Lang.constants.LITTERAL;
    }
    return type;
}
/**
 * La méthode getImplicitType permet de détecter le type de base non-spécifié d'une valeur
*/
$syl.getImplicitType = function(value){
    var type = this.getCodeType(value);
    return type in Synthetic.Lang.typeFromConstants ? Synthetic.Lang.typeFromConstants[type] : 'Any';
}
/**
 * La méthode toVariableStructure permet de transformer une simple valeur en 
 * valeur synthétic sérialisée
*/
$syl.toVariableStructure = function(value,parent){
    return this.meta({
        label: 'variable',
        type: this.getImplicitType(value),
        value: this.clearString(value),
        parent: parent
    },false);
}
/**
 * La méthode clearString permet d'enlever les quotes autour de la chaine synthetic
 */
$syl.clearString = function(value){
    if(typeof value == 'string'){
        value = value.replace(/^('|")|('|")$/g, '');
    }
    return value;
}
/**
 * en valeurs du langage en cours (javascript dans ce cas)
*/
$syl.toPrimitiveValue = function(value){
    var r;
    switch(value.type){
        case 'Number':
            r = parseFloat(value.value);
        break;
        case 'Boolean':
            r = value.value == 'true';
        break;
        case 'String':
            r = (value.value+"").replace(/^('|")|('|")$/g, '');
        break;
        default:
            r = value.value;
        break;
    }
    return r;
}
/**
 * La méthode isValidateConstraint permet de vérifier si un type est bien dans une
 * liste de contrainte
 */
$syl.isValidateConstraint = function(type, list){
    var r = false,
        object = typeof type != 'string' && typeof type == 'object' && 'type' in type && 'implicitType' in type,
        type = object ? type : {
            type: type,
            implicitType: type
        };
    for(var i in list){
        if(list[i].type == 'Any' || list[i].type == type.type || list[i].type == type.implicitType){
            r = true;
            break;
        }
    }
    return r;
}
/**
 * La méthode toStringTypes est une méthode extra, permettant de mettre sous forme
 * de chaine de caractères une liste d'objet de type
 */
$syl.toStringTypes = function(list){
    var r = '', k = 0;
    for(var i in list){
        r += (r.length ? ' | ' : '')+list[i].type;
        k++;
    }
    if(k > 1){
        r = '{ '+r+' }';
    }
    return r;
}

/**
 * La méthode getRelationType permet de savoir le type en priorité pour deux types distincts
 */
$syl.getRelationType = function(type1,type2,operator){
    var r = 'Any';
    if(type1 == type2 && ['||', '&&', '==', '===', '!=', '!=='].indexOf(operator) < 0){
        return type1;
    }
    switch(operator){
        case '+':
        case '+=':
            if(type1 == 'Array' || type2 == 'Array'){
                if(['Number', 'Boolean', 'String', 'Regex'].indexOf(type1 == 'Array' ? type2 : type1) >= 0){
                    r = 'Array';
                }
            }
            else if(type1 == 'String' || type2 == 'String'){
                r = 'String';
            }
            break;
        case '||':
        case '&&':
        case '==':
        case '!=':
        case '===':
        case '!==':
            r = 'Boolean';
            break;
    }
    return r;
}

/**
 * @SECTOR: Value
 */

/**
 * La méthode toBoolean convertit toute valeur primitive en booléen
 */
$syl.toBoolean = function(value){
    return [false,"false",0,'0'].indexOf(value) < 0;
}

/**
 * La méthode calc permet de simplifier une opération complexe en une seule valeur
*/
$syl.calc = function(list){
    if(list.length == 1){
        return list[0];
    }
    var $this = this,
    compute = {
        structure: {
            "+": function(a,b){
                if(['JSON', 'Array'].indexOf(a.type) < 0 || ['JSON', 'Array'].indexOf(b.type) < 0){
                    return null;
                }
                var json = a.type == 'JSON' || b.type == 'JSON',
                    result = json ? a.type == 'JSON' ? a : b : a,
                    source = result == a ? b : a;
                    result = $this.copy(result),
                    index = $this.len(result.value);
                for(var i in source.value){
                    result.value[json ? i : index] = source.value[i];
                    index++;
                }
                return result;
            },
            "-": function(a,b){
                if('Array' != a.type < 0 && 'Array' != b.type){
                    return null;
                }
                var result = $this.copy(a);
                for(var i in b.value){
                    for(var j in a.value){
                        if(b.value[i].addr == a.value[j] || b.value[i].value == a.value[j].value){
                            delete result.value[j];
                        }
                    }
                }
                var index = 0;
                for(var i in result.value){
                    result.value[index] = result.value[i];
                    if(index != i){
                        delete result.value[i];
                    }
                    index++;
                }
                return result;
            }
        },
        "+": function(a,b){
            var r = compute.structure["+"](a,b);
            r = r != null ? r : $this.toPrimitiveValue(a) + $this.toPrimitiveValue(b);
            return r;
        },
        "-": function(a,b){
            var r = compute.structure["-"](a,b);
            r = r != null ? r : $this.toPrimitiveValue(a) - $this.toPrimitiveValue(b);
            return r;
        },
        "*": function(a,b){
            return $this.toPrimitiveValue(a) * $this.toPrimitiveValue(b);
        },
        "/": function(a,b){
            return $this.toPrimitiveValue(a) / $this.toPrimitiveValue(b);
        },
        "~": function(a,b){
            return Math.floor($this.toPrimitiveValue(a) / $this.toPrimitiveValue(b));
        },
        "%": function(a,b){
            return $this.toPrimitiveValue(a) % $this.toPrimitiveValue(b);
        },
        "<": function(a,b){
            return $this.toPrimitiveValue(a) < $this.toPrimitiveValue(b);
        },
        ">": function(a,b){
            return $this.toPrimitiveValue(a) > $this.toPrimitiveValue(b);
        },
        "<=": function(a,b){
            return $this.toPrimitiveValue(a) <= $this.toPrimitiveValue(b);
        },
        ">=": function(a,b){
            return $this.toPrimitiveValue(a) <= $this.toPrimitiveValue(b);
        },
        "==": function(a,b){
            return $this.toPrimitiveValue(a) == $this.toPrimitiveValue(b);
        },
        "!=": function(a,b){
            return $this.toPrimitiveValue(a) != $this.toPrimitiveValue(b);
        },
        "===": function(a,b){
            return a.type == b.type && $this.toPrimitiveValue(a) == $this.toPrimitiveValue(b);
        },
        "!==": function(a,b){
            return a.type == b.type && $this.toPrimitiveValue(a) == $this.toPrimitiveValue(b);
        },
        "||": function(a,b){
            return $this.toPrimitiveValue(a) || $this.toPrimitiveValue(b);
        },
        "&&": function(a,b){
            return $this.toPrimitiveValue(a) && $this.toPrimitiveValue(b);
        },
        "|": function(a,b){
            return $this.toPrimitiveValue(a) | $this.toPrimitiveValue(b);
        }
    };
    //Finir les opérations
    var operands = [null,null], 
    /**
     * On définit l'ordre de recherche des opérateurs par priorité de calcul
    */
    operators = [
        ['*','/','~','%'],
        ['-','+'],
        ['||', '&&','>','>=','<','<=','==','!=', '===','!===']
    ],
    k,result;
    for(var j in operators){
        for(var i in list){
            if(operators[j].indexOf(list[i]) >= 0){
                k = i * 1 - 1;
                while(list[k] == Synthetic.Lang.constants.EMPTY){
                    k--;
                }
                operands[0] = list[k] != undefined ? list[k] : null;
                list[k] = Synthetic.Lang.constants.EMPTY;
                k = i * 1 + 1;
                while(list[k] == Synthetic.Lang.constants.EMPTY){
                    k++;
                }
                operands[1] = list[k] != undefined ? list[k] : null;
                if(operands[0] != undefined && operands[1] != undefined){
                    result = compute[list[i]](operands[0], operands[1]);
                    list[k] = $this.meta({
                        label: 'variable',
                        type: $this.getRelationType(operands[0].type, operands[1].type, list[i]),
                        value: result,
                        parent: operands[1].parent
                    });
                    list[i] = Synthetic.Lang.constants.EMPTY;
                }
            }
        }
    }
    operands = null;
    result = null;
    return list[list.length - 1];
}
/**
 * La méthode struct permet de faire la sérialization d'une structure
 */
$syl.struct = function(data){
    /**
     * la variable data contient des données importantes pour la retro-référencement d'une structure
     * et sa sérialization
     * @structure {object, ressources}
     * @return Promise\<structure : null>
     */
    var data = this.set(data, {}),
        $this = this;
    return new Promise(function(res){
        var _type = $this.code[$this.cursor.index] == '[' ? 'Array' : 'JSON',
        structure = $this.meta({
            type: _type,
            constraints: data.object.type == _type ? data.object.constraints : null,
            label: 'variable',
            value: {},
            parent: data.ressources.parent
        }), key = null, index = 0,_cursor = $this.copy($this.cursor);
        // $this.goTo(1);
        $this.loop(function(cursor,loop){
            // console.log('[Struct]', cursor);
            if(_type == 'Array' || key != null){
                loop.stop();
                if(['[', '{'].indexOf(cursor.char) >= 0){
                    $this.goTo(1);
                }
                if(cursor.word && cursor.word.length){
                    $this.cursor = $this.copy(_cursor);
                }
                _cursor = $this.copy($this.cursor);
                $this.value({
                    object: data.object,
                    subvariables: true,
                    ressources: data.ressources,
                    end: [Synthetic.Lang.constants._EOS[_type == 'Array' ? 'BRACKET' : 'BRACE'], Synthetic.Lang.constants._EOS.COMA]
                }).then(function(result){
                    if(data.object.constraints && !$this.isValidateConstraint(result, data.object.constraints.value)){
                        if(['Array', 'JSON'].indexOf(result.type) < 0 || !data.object.constraints.recursive){
                            $this.cursor = _cursor;
                            throw new Error($this.err($this.toStringTypes(data.object.constraints.value)+" value expected, "+result.implicitType+" given !"));
                        }
                    }
                    if(_type == 'Array'){
                        structure.value[index] = result;
                        index++;
                    }
                    else{
                        structure.value[key] = result;
                    }
                    key = null;
                    // console.log('[Result]',$this.code.substr($this.cursor.index-1,2),'/',result);
                    switch($this.code[$this.cursor.index-1]){
                        case ',':
                            if(/[\S]+/.test($this.code[$this.cursor.index])){
                                // $this.backTo(1);
                            }
                            _cursor = $this.copy($this.cursor);
                        break;
                        case ']':
                        case '}':
                            if(_type == 'Array'){
                                loop.end();
                                return;
                            }
                            else if(_type == 'JSON'){
                                loop.end();
                                return;
                            }
                            else{
                                throw new Error($this.err("Illegal character !"));
                            }
                        break;
                        default:
                            throw new Error($this.err("[ "+$this.code[$this.cursor.index-1]+" ] unexpected !"));
                        break;
                    }
                    loop.start();
                });
            }
            else if(_type == 'JSON'){
                /**
                 * Lorsqu'on trouve un mot, on va le vérifier pour juger si c'est bien une clé
                 */
                if(cursor.word && cursor.word.length){
                    loop.stop();
                    /**
                     * Pour éviter de tomber sur un caractère blanc après le mot pour ne pas le perdre
                     * on parcourt jusqu'à un caractère non-blanc
                     */
                     _cursor = $this.copy($this.cursor);
                     if(cursor.char == '\n'){
                        _cursor.lines.y--;
                     }

                    $this.toNextChar().then(function(_char){
                        /**
                         * si le caractère non-blanc est un ":" on sait qu'on a inévitablement une clé
                         */
                        if(_char == ':'){
                            key = $this.clearString(cursor.word);
                            $this.cursor.index++;
                            _cursor = $this.copy($this.cursor);
                            loop.start();
                        }
                        /**
                         * Sinon on va vérifier si c'est une variable inscrustée dans la structure
                         */
                        else if(['}', ','].indexOf(_char) >= 0){
                            if($this.getCodeType(cursor.word) == Synthetic.Lang.constants.LITTERAL){
                                $this.litteral(cursor.word, data.ressources).then(function(result){
                                    if(data.object.constraints && !$this.isValidateConstraint("String", data.object.constraints.key)){
                                        if(['Array', 'JSON'].indexOf(result.type) < 0 || !data.object.constraints.recursive){
                                            $this.cursor = _cursor;
                                            throw new Error($this.err($this.toStringTypes(data.object.constraints.key)+" key type expected, String given implicitly !"));
                                        }
                                    }
                                    if(data.object.constraints && !$this.isValidateConstraint(result, data.object.constraints.value)){
                                        if(['Array', 'JSON'].indexOf(result.type) < 0 || !data.object.constraints.recursive){
                                            $this.cursor = _cursor;
                                            throw new Error($this.err($this.toStringTypes(data.object.constraints.value)+" value expected, "+result.implicitType+" given !"));
                                        }
                                    }
                                    if(!result.name){
                                        throw new Error($this.err("Cannot defined key from implicit value given !"));
                                    }
                                    structure.value[result.name] = result;
                                    if($this.code[$this.cursor.index] == '}'){
                                        loop.end();
                                        return;
                                    }
                                    loop.start();
                                    $this.cursor.index++;
                                    _cursor = $this.copy($this.cursor);
                                });
                            }
                            /**
                             * Sinon on lève une exception
                             */
                            else{
                                throw new Error($this.err("Cannot define key from value of [ "+cursor.word+" ]"));
                            }
                        }
                    });
                }
            }
        }).then(function(){
            // console.log('[Struct]',structure);
            res(structure);
        })
    });
}

$syl.ternary = function(data){
    /**
     * @structure : {object, reason, references, end}
     */
    var data = this.set(data, {}),
        $this = this;
    return new Promise(function(res){
        var end = false, EOS = Synthetic.Lang.constants._EOS,
            pass = false, result,_cursor, executing = $this.executing;
        $this.goTo(1);
        $this.loop(function(cursor,loop){
            if(!end){
                loop.stop();
                if(!data.reason && !pass){
                    $this.executing = false;
                }
                $this.value({
                    object: data.object,
                    subvariables: true,
                    ressources: data.ressources,
                    end: [EOS.ELSE]
                }).then(function(value){
                    // console.log('[Cool]',value, $this.code.substr($this.cursor.index, 10))
                    if(data.reason){
                        result = value;
                        $this.executing = false;
                    }
                    else{
                        $this.executing = executing;
                    }
                    if($this.code[$this.cursor.index] != ':'){
                        throw new Error($this.err("[ : ] expected !"));
                    }
                    $this.goTo(1);
                    end = true;
                    pass = true;
                    loop.start();
                });
            }
            else{
                loop.stop();
                $this.value({
                    object: data.object,
                    ressources: data.ressources,
                    subvariables: true,
                    end: data.end
                }).then(function(value){
                    if(!data.reason){
                        result = value;
                    }
                    $this.executing = executing;
                    loop.end();
                });
            }
        }).then(function(){
            res(result);
        })
    })
}
/**
 * La méthode value permet de trouver la valeur d'une expression
 */
$syl.value = function(data){
    /**
     * @structure [data]
     * {object,subvariables,ressources,ternary,subvalue, end, nearconstraints}
     * 
    */
    var $this = this,
        values = [], 
        preOperations = -1,
        waitingForNextOperand = false,
        ternaryOperator = {
            active: 0,
            right: false,
            end: false
        },
        defernow = false,
        subvariables = {
            searching: 0,
            index: 0,
            key: null
        },
        constants = Synthetic.Lang.constants._EOS, 
        _end, _start, _char, _cursor, _type,
        _tryMethod = this.tryMethodInstead;
    data.subvariables = this.set(data.subvariables, false);
    data.subvalue = this.set(data.subvalue, false);
    data.nearconstraints = 'nearconstraints' in data ? data.nearconstraints : data.subvariables ? null : data.object.constraints;
    data.end = Array.isArray(data.end) ? data.end : [];
    // console.log('[Data.Object]',data.object)
    return new Promise(function(res,rej){
        $this.loop(function(cursor,loop){
            /**
             * (*1)Si on attend la partie droite du ternaire, on ignore la partie droite
             * Ou le ternaire principal est terminé, on ignore le reste jusqu'à la fin
             */
                _end = constants.values.end.indexOf(cursor.char);
                _start =  constants.values.start.indexOf(cursor.char);
            // console.log('[Word]',cursor.word);
        
            /**
             * Dans la recherche des valeurs, on veut des mots, et pour chaque mot
             * non vide trouvé, on cherche son type pour le traiter soit en tant que:
             * - Littéral
             * - Nombre ou autre type de valeur
             */
            if(cursor.word && cursor.word.length){
                /**
                 * Si le mot est un litteral, on cherche sa valeur
                 */
                _type = $this.getCodeType(cursor.word);
                // console.log('[Val][Word]',cursor.word,'/'+$this.code.substr($this.cursor.index,10)+'<', $this.executing);
                if(_type == Synthetic.Lang.constants.LITTERAL){
                    loop.stop();
                    if(/[\S]+/.test(cursor.char)){
                        $this.backTo(cursor.char.length - 1);
                    }
                    _cursor = $this.cursor;
                    /**
                     * Si on est en mode subvalue
                     * On va vérifier si on est en une appelle de fonction
                     */
                    // console.log('[Here]',cursor.word);
                    $this.litteral(cursor.word, data.ressources).then(function(result){
                        // if(data.subvalue && !result)
                        // console.log('[Result]', data.subvalue,result == null, $this.tryMethodInsteadConfirmed);
                        values.push(result);
                        waitingForNextOperand = false;
                        // console.log('[Litt____]',cursor.char,'//',$this.code.substr($this.cursor.index, 10));
                        // $this.backTo(1);
                        loop.start();
                    }).catch(function(e){
                        // console.log('[Err]');
                    });
                    return;
                }
                /**
                 * Si c'est un mot-clé ou un type, on déclenche une erreur
                 */
                else if(_type == Synthetic.Lang.constants.KEYWORD || _type == Synthetic.Lang.constants.TYPE){
                    /**
                     * SI on rencontre un type en étant en mode subvalue
                     * Il se peut qu'on parcours par hasard l'argument d'une fonction
                     * On doit tout arrêter et empêcher une erreur
                     */
                    if(_type == Synthetic.Lang.constants.TYPE && data.subvalue){
                        $this.tryMethodInsteadConfirmed = true;
                        loop.end();
                        return;
                    }
                    throw new Error($this.err("invalid syntax !"));
                }
                /**
                 * Sinon on enregistre la valeur avec son type implicite
                 */
                else{
                    var type = $this.getImplicitType(cursor.word);
                    /**
                     * S'il y a une opération à faire avant l'enregistrement de la valeur
                     * On doit avoir un nombre pour le faire sinon on lève une exception
                     * sauf dans le cas où le pré-opération pour la reversion
                    */
                    if(preOperations >= 0 && $this.executing){
                        // console.log('[PreOp]',preOperations,Synthetic.Lang.simpleOperations, values, $this.executing);
                        if(type != 'Number' && preOperations != Synthetic.Lang.simpleOperations.REVERSE){
                            throw new Error($this.err("Number value expected"));
                        }
                        cursor.word = parseFloat(cursor.word);
                        switch(preOperations){
                            case Synthetic.Lang.simpleOperations.NEGATIVE:
                                cursor.word *= -1;
                            break;
                            case Synthetic.Lang.simpleOperations.PREINCREMENTATION:
                                cursor.word++;
                            break;
                            case Synthetic.Lang.simpleOperations.PREDECREMENTATION:
                                cursor.word--;
                            break;
                            case Synthetic.Lang.simpleOperations.REVERSE:
                                cursor.word = [false,'false',0,'0'].indexOf(cursor.word) >= 0;
                                cursor.word = !cursor.word;
                            break;
                        }
                        preOperations = -1;
                    }
                    values.push($this.toVariableStructure(cursor.word+'',data.ressources.parent));
                    waitingForNextOperand = false;
                }
            }
            /**
             * Si on voit un signe d'opération on vérifie si sa place est correcte
             */
            if(Synthetic.Lang.signs.indexOf(cursor.char) >= 0){
                // console.log('[Sign]',cursor.char,data.end, _end);
                /**
                 * Il faut vérifier d'abord que le signe n'est pas un EOS
                 * par exemple: le cas de ":"
                 */
                 if(data.end.indexOf(_end) >= 0){
                    loop.end();
                    return;
                }
                /**
                 * Il faut d'abord vérifier qu'il n'y a pas d'operande en attente et que
                 * le tableau temporaire des valeurs ne soient pas vide
                 */
                if(values.length && !waitingForNextOperand){
                    /**
                     * Si c'est un '?' on prend en compte un opérateur ternaire
                     */
                    if(cursor.char == '?'){
                            /**
                             * On évite de calculer si on n'execute pas
                             */
                            var calc = $this.executing ? $this.calc(values).value : false;
                            // console.log('[CALC]',calc,values);
                            values = [];
                            calc = ['false', false, 0, '0'].indexOf(calc) < 0;
                            loop.stop();
                            $this.ternary({
                                object: data.object,
                                end: data.end,
                                ressources: data.ressources,
                                reason: calc
                            }).then(function(result){
                                values.push(result);
                                loop.start();
                            });
                            return;
                    }
                    /**
                     * Sinon on ajoute le signe pour faire le calcul plus tard
                     */
                    else{
                        values.push(cursor.char);
                        waitingForNextOperand = true;
                    }
                }
                else if(['-', '+', '++', '--', '!'].indexOf(cursor.char) >= 0){
                    // console.log('[Values]',values);
                    if(cursor.char == '+'){
                        preOperations = Synthetic.Lang.simpleOperations.POSITIVE;
                    }
                    else if(cursor.char == '++'){
                        preOperations = Synthetic.Lang.simpleOperations.PREINCREMENTATION;
                    }
                    else if(cursor.char == '-'){
                        preOperations = Synthetic.Lang.simpleOperations.NEGATIVE;
                    }
                    else if(cursor.char == '--'){
                        preOperations = Synthetic.Lang.simpleOperations.PREDECREMENTATION;
                    }
                    else{
                        preOperations = Synthetic.Lang.simpleOperations.REVERSE;
                    }
                }
                else{
                    throw new Error($this.err("illegal operator sign [ "+cursor.char+" ]"));
                }
            }
            /**
             * Si le caractère est un caractère de fin de recherche d'instruction
             */
            if(_end >= constants.PARENTHESE){
                if(waitingForNextOperand){
                    throw new Error($this.err("right operand expected"));
                }
                if(data.end.indexOf(_end) >= 0 || 
                    (!data.subvariables && _end == constants.SEMICOLON) ||
                    (data.subvariables && (data.end.indexOf(_end) || _end == constants.SEMICOLON) )
                ){
                    $this.goTo(1);
                    loop.end();
                }
                else if(Synthetic.Lang.blockEOS.indexOf(cursor.char) < 0){
                    throw new Error($this.err("illegal end of statement [ "+cursor.char+" ]"));
                }
            }
             /**
             * Si on rencontre un caractère qui succède un non signe 
             * 1er Cas) sans aucune attente d'opérande, on met fin à la lecture 
             *          de valeur
             */
              if(
                /[\S]+/.test(cursor.char) && data.end.indexOf(_end) < 0 && 
                values.length && !waitingForNextOperand &&
                Synthetic.Lang.signs.indexOf(cursor.char) < 0
            ){
                if(data.end.indexOf(_end) < 0 && Synthetic.Lang.blockEOS.indexOf(cursor.char) < 0 && _end != constants.SEMICOLON && /[\S]+/.test(cursor.char)){
                    $this.backTo(1);
                }
                // console.log('[END]',_end,cursor.char, Synthetic.Lang.blockEOS.indexOf(cursor.char));
                loop.end();
                return;
            }
            if(defernow){
                defernow = false;
                $this.backTo(1);
            }

    /**
     * @TRAITEMENT_DES_CARACTERES_DE_DESCISION
     */
            /**
             * 1) Cas
             * Si on rencontre un '(' on vérifie si la dernière valeur enregistrée 
             * est une fonction ou un signe d'opération
             * 
             * 2)Cas
             * Si c'est un '[' on vérifie si la dernière valeur enregistrée est
             * un soit un tableau, soit une chaine de caractère.
             * Et dans le cas où c'est un signe ou il n'y a rien, on procède à
             * l'enregistrement d'un tableau
            */
            //  console.log('[GO]',_start, cursor.char);
             if(_start >= constants.PARENTHESE && _start <= constants.BRACE){
                /**
                 * S'il y a un mot non-enregistré, on l'enregistre d'abord avant
                 * d'effectuer le traitement
                */
                if(cursor.word && cursor.word.length){
                    defernow = true;
                }
                else{
                    /**
                     * Si c'est un signe ou il n'y avait pas de valeur précédente
                     * on enregistre une sous-valeur
                    */
                    if(
                        /**
                         * Si c'est un '(' on s'assure que...
                         */
                        (_start == constants.PARENTHESE && (
                            !values.length || Synthetic.Lang.signs.indexOf(values[values.length - 1]) >= 0)
                        ) ||
                        /**
                         * Si c'est un '['
                         */
                        (_start == constants.BRACKET && 
                            values.length && Synthetic.Lang.signs.indexOf(values[values.length - 1]) < 0
                        )
                    ){
                        /**
                         * Si on prend en compte le '[' et que la valeur précédente n'est pas
                         * une chaine de caractère ou tableau ou un JSON, on soulève une erreur
                         */
                        if(_start == constants.BRACKET && ['String','Array', 'JSON'].indexOf($this.getType(values[values.length - 1])) < 0){
                            throw new Error($this.err("illegal character [ "+cursor.char+"]"));
                        }
                        _cursor = $this.copy($this.cursor);
                        loop.stop();
                        $this.goTo(1);
                        /**
                         * Il se pourrait qu'on ait la difficulté de différencier
                         * Une recherche de sous-valeur d'une construction de fonction
                         */
                        if(_start == constants.PARENTHESE){
                            $this.tryMethodInstead = true;
                        }
                        $this.value({
                            object : data.object,
                            subvariables: data.subvariables,
                            ressources: data.ressources,
                            ternary: data.ternary,
                            subvalue: true,
                            end: [constants.PARENTHESE]
                        }).then(function(result){
                            // console.log('[Result]',result, $this.code.substr($this.cursor.index-1,10))
                            /**
                             * Si le caractère actuel n'est pas un ')'
                             * Il se pourrait bien qu'on a tenté une fonction
                             */
                            $this.toNextChar().then(function(_char){

                                if((!result && $this.tryMethodInsteadConfirmed) || _char == '{'){
                                    // console.log('[Go to] method');
                                    $this.cursor = $this.copy(_cursor);
                                    $this.tryMethodInsteadConfirmed = false;
                                    $this.tryMethodInstead = _tryMethod;
                                    $this.method(data.object, data.ressources).then(function(method){
                                        // console.log('[Method]',method);//_cursor = $this.copy($this.cursor);
                                        values.push(data.object);
                                        waitingForNextOperand = false;
                                        loop.start();
                                    });
                                    return;
                                }
                                $this.tryMethodInsteadConfirmed = false;
                                $this.tryMethodInstead = _tryMethod;
    
                                if(_start == constants.BRACKET){
                                    var val = $this.toPrimitiveValue(values[values.length - 1])[result.value];
                                    values[values.length - 1].value = val;
                                }
                                else{
                                    values.push(result);
                                }
                                
                                waitingForNextOperand = false;
                                loop.start();
                            });
                        });
                    }
                    else if(_start >= constants.BRACKET && _start <= constants.BRACE && (!values.length || waitingForNextOperand) ){
                        /**
                         * Si la structure n'accepte pas d'imbrication de structure
                         * Et qu'il ne demande pas une structure comme contrainte de clé ou de valeur
                         * On soulève une exception.
                         */
                        if(data.subvariables && (data.object.constraints == null || !data.object.constraints.recursive) ){
                            throw new Error($this.err("Denied structure syntax !"));
                        }
                        _type = _start == constants.BRACKET ? 'Array' : 'JSON';
                        subvariables.searching = _start == constants.BRACKET  ? 1 : 2;
                        subvariables.index = 0;
                        subvariables.key = null;

                        loop.stop()
                        $this.struct({
                            object: data.object,
                            ressources: data.ressources
                        }).then(function(result){
                            values.push(result);
                            loop.start();
                        });
                    }
                    /**
                     * Si c'est une fonction, on l'appelle comme un littéral
                     */
                    // else if(values[values.length - 1]){
                        
                    // }
                    /**
                     * Sinon on déclenche une erreur
                     */
                    else{
                        throw new Error($this.err("illegal character [ "+cursor.char+"]"));
                    }
                }
             }
        /**
         * @FIN_DU_TRAITEMENT
         */
        }).then(function(){
            /**
             * Si _tempBlocking est activé,
             * on empêche la vérification des valeurs
             */
            if($this.tryMethodInsteadConfirmed){
                res(null);
                return;
            }
            // console.log('[Values]',values);
            var r = $this.executing ? $this.calc(values) : null;
            // console.log('[R]',r,data.subvariables);
            if($this.executing && !data.subvariables && !data.subvalue && data.object.type != 'Any' && r.type != data.object.type && r.implicitType != data.object.type){
                $this.cursor = data.object.cursor;
                throw new Error($this.err(data.object.type+" value expected, "+r.implicitType+" given !"));
            }
            else if($this.executing && data.subvariables && data.object.constraints && !$this.isValidateConstraint(r, data.object.constraints.value)){
                if(['Array', 'JSON'].indexOf(r.type) < 0 || !data.object.constraints.recursive){
                    throw new Error($this.err($this.toStringTypes(data.object.constraints.value)+" value expected, "+r.type+" given !"));
                }
            }
            $this.garbage();
            res(r);
        })
    });
}
/**
 * la méthode err permet d'avoir un affichage basic d'un code d'erreur
*/
$syl.err = function(message){
    var r = this.cursorOrigin(this.cursor.index);
    return "ERROR at file "+this.file+" line " + r.y + "::"+r.x+" -> " +this.set(message,'');
}
/**
 * Les Méthodes suivantes sont pour la gestion des mots-clés
 */

/**
 * @SECTOR : Portée et visiblité
 */
/**
 * La méthode accessErr déclenche des erreurs s'il y a une erreur 
 * de syntaxe pour les portées/visibilitéss
 */
$syl.accessErr = function(previousKey,currentKey,reject){
    reject = this.set(reject, null);
    if(this.access[previousKey]){
        throw new Error(this.err("syntax error : " + previousKey + " ... " + currentKey));
    }
}
/**
 * la méthode private définit si l'instruction suivante a une portée privée
*/
$syl.private = function(){
    var $this = this;
    return new Promise(function(res,rej){
        //erreur de syntax : private ... private
        $this.accessErr('private', 'private',rej);
        //erreur de syntax : protected ... private
        $this.accessErr('protected', 'private',rej);
        //erreur de syntax : static ... private
        $this.accessErr('static', 'private',rej);
        //erreur de syntax :  export ... private
        $this.accessErr('export', 'private',rej);
        //erreur de syntax :  final ... private
        $this.accessErr('final', 'private',rej);
        $this.access.private = true;
        res();
    });
}
/**
 * la méthode protected définit si l'instruction suivante a une portée protégée
*/
$syl.protected = function(){
    var $this = this;
    return new Promise(function(res,rej){
        //erreur de syntax : private ... protected
        $this.accessErr('private', 'protected',rej);
        //erreur de syntax : protected ... protected
        $this.accessErr('protected', 'protected',rej);
        //erreur de syntax : static ... protecte
        $this.accessErr('static', 'protected',rej);
        //erreur de syntax :  export ... protected
        $this.accessErr('export', 'protected',rej);
        //erreur de syntax :  final ... protected
        $this.accessErr('final', 'protected',rej);

        $this.access.protected = true;
        res();
    });
}
/**
 * la méthode abstract définit si l'instruction suivante a une portée abstraite
*/
$syl.abstract = function(){
    var $this = this;
    return new Promise(function(res,rej){
        //erreur de syntax : private ... abstract
        $this.accessErr('private', 'abstract',rej);
        //erreur de syntax : protected ... abstract
        $this.accessErr('protected', 'abstract',rej);
        //erreur de syntax :  export ... abstract
        $this.accessErr('export', 'abstract',rej);
        //erreur de syntax :  final ... abstract
        $this.accessErr('final', 'abstract',rej);
        $this.access.abstract = true;
        res();
    });
}
/**
 * la méthode static définit si l'instruction suivante a une portée static
*/
$syl.static = function(){
    var $this = this;
    return new Promise(function(res,rej){
        //erreur de syntax :  export ... static
        $this.accessErr('export', 'static',rej);
        //erreur de syntax :  abstract ... static
        $this.accessErr('abstract', 'static',rej);
        $this.access.static = true;
        res();
    });
}
/**
 * la méthode final définit si l'instruction suivante comme étant finale
*/
$syl.final = function(){
    var $this = this;
    return new Promise(function(res,rej){
        //erreur de syntax :  abstract ... final
        $this.accessErr('abstract', 'final',rej);
        $this.access.final = true;
        res();
    });
}
/**
 * la méthode export définit si l'instruction suivante sera exportable
*/
$syl.export = function(){
    var $this = this;
    return new Promise(function(res,rej){
        //erreur de syntax :  abstract ... export
        $this.accessErr('abstract', 'export',rej);
        //erreur de syntax :  private ... export
        $this.accessErr('private', 'export',rej);
        //erreur de syntax :  protected ... export
        $this.accessErr('protected', 'export',rej);
        //erreur de syntax :  final ... export
        $this.accessErr('final', 'export',rej);
        //erreur de syntax :  static ... export
        $this.accessErr('static', 'export',rej);
        $this.access.export = true;
        res();
    });
}
/**
 * la méthode resetAccess permet de réinitiliaser les accès
*/
$syl.resetAccess = function(){
    this.access = {
      private : false,
      protected: false,
      abstract: false,
      final: false,
      static: false,
      export: false
    }
}

/**
 * @SECTOR: Référencement des objets
 */

/**
 * la méthode save permet de sauvegarder un objet dans la mémoire du programme pour mieux le référencer
*/
$syl.save = function(objet,parent){
    if(!this.executing){
        return;
    }
    if(parent != undefined){
        parent = {
            scope: parent.cursor.scope + 1,
            index: parent.cursor.index
        }
    }
    else{
        parent = {
            scope: objet.cursor.scope,
            index: objet.cursor.index
        }
    }
    var ref = this.previousCloserRef([parent.scope, parent.index], true);
    // console.log('[REF]',ref, objet.name,objet.label);
    if(!(ref in this.modules)){
        this.modules[ref] = {};
    }
    this.modules[ref][objet.name] = objet;
    Synthetic.Lang.objects[objet.addr] = objet;
    // if(objet.visible){
    //     this.exportables[objet.name] = objet;
    // }
}
/**
 * la méthode parent permet de retrouver l'étendue parente d'une instruction
*/
$syl.previousCloserRef = function(cursor,notNull){
    var scopeList = [], indexList = [], ref = null, _scopes = {},
        notNull = this.set(notNull,false);
    // console.log('[blocks]', this.blocks);
    for(var i in this.blocks){
        ref = this.blocks[i].split(',');
        if(ref[0] * 1 < cursor[0] * 1){
            if(!(ref[0] in _scopes)){
                _scopes[ref[0]] = [];
            }
            _scopes[ref[0]].push(ref[1] * 1);
            if(scopeList.indexOf(ref[0] * 1) < 0){
                scopeList.push(ref[0] * 1);
            }
        }
    }
    scopeList.sort();
    scopeList.reverse();
    ref = null;
    for(var i in scopeList){
        indexList = _scopes[scopeList[i]];
        indexList.sort();
        indexList.reverse();
        for(var j in indexList){
            if(indexList[j] <= cursor[1] * 1){
                ref = scopeList[i]+','+indexList[j];
                break;
            }
        }
        if(ref) break;
    }
    return ref == null ? '0,0' : ref;
}
/**
 * La méthode createBlock permet de créer virtuellement un block d'attachement d'objets
*/
$syl.createBlock = function(ref){
    if(!this.executing){
        return;
    }
    var cursor = ref.split(',');
    var ref = cursor[0] + ',' + cursor[1];
    this.blocks.push(ref);
    return this;
}
/**
 * La méthode getCloserStruct permet de retrouver la structure (class, mixin, enum) la plus proche en parenté
 */
$syl.getCloserStruct = function(cursor, labels){
    var previous = this.previousCloserRef(cursor,true),
        labels = Array.isArray(labels) ? labels : Synthetic.Lang.typeCreatorKeys,
        object, r = null, list = {}, indexes = [];
    /**
     * On ne doit pas rechercher dans le scope parent actuel
     * mais de préférence dans le scope parent du scope parent actuel
     * Si le resultat est [0,0] on sait alors qu'on est dans la racine
     * et qu'aucun structure n'est identifiable comme le bloc parent de l'élément actuel
     */
    if(previous == '0,0'){
        return 0;
    }
    else{
        previous = this.previousCloserRef(previous.split(','), true);
    }
    while(!r){
        if(previous in this.modules){
            object = this.modules[previous];
            for(var i in object){
                if(labels.indexOf(object[i].label) >= 0){
                    list[object[i].cursor.index] = object[i];
                    indexes.push(object[i].cursor.index * 1);
                    r = true;
                    break;
                }
            }
            if(r){
                break;
            }
        }
        if(previous == '0,0'){
            break;
        }
        previous = this.previousCloserRef(previous.split(','));
    }
    r = null;
    indexes.sort();
    for(var i in indexes){
        if(cursor[1] > indexes[i]){
            r = list[indexes[i]];
        }
        else{
            break;
        }
    }
    return r;
}
/**
 * la méthode createScopeObject 
 */
$syl.createScopeObject = function(serial,list){
    var args = {},
        index = 0,
        _arg = null;
    while(true){
        _arg = null;
        for(var i in serial.arguments){
            if(index == serial.arguments[i].index){
                _arg = serial.arguments[i];
                break;
            }
        }
        if(index in list){
            args[index] = this.copy(list[index]);
            args[index].name = _arg ? _arg.name : null;
        }
        else if(_arg){
            args[index] = _arg;
        }
        else{
            break;
        }
        index++;
    }
    for(var i in args){
        this.save(args[i], serial);
    }
}
/**
 * La méthode fin permet de trouver une objet synthetic
 */
$syl.find = function(name){
    if(Synthetic.Lang.nativeFunctions.indexOf(name) >= 0){
        return this.meta({
            name: name,
            label: "function",
            native: true,
            arguments: {},
            type: Synthetic.Lang.nativeFunctionTypes[name]
        },false);
    }
    else{
        var $this = this;
        var scope = $this.previousCloserRef([$this.cursor.scope, $this.cursor.index],true),
            r = null;
        while(scope != null && r == null){
            if(name == 'root'){
                if(scope == "0,0"){
                break;
                }
                scope = '0,0';
            }
            else if(name[0] == 'upper'){
                if(scope == "0,0"){
                    break;
                }
                scope = $this.previousCloserRef(scope.split(','),true);
            }
            else{
                if($this.modules[scope] && name in $this.modules[scope]){
                    r = $this.modules[scope][name];
                    break;
                }
                if(scope == "0,0"){
                    break;
                }
                scope = $this.previousCloserRef(scope.split(','),true);
            }
        }
    }
    // console.log('[Return]',r, this.modules);
    return r;
}

$syl.cursorOrigin = function(index){
    var r = {
        y: 1,
        x: 0
    },
    last = 0;
    for(var i in this.linesEnd){
        if(this.linesEnd[i] <= index){
            last = this.linesEnd[i];
            r.y++;
        }
        else{
            break;
        }
    }
    r.x = index - last;
    return r;
}

/**
 * @SECTOR : execution
 */

$syl.native = function(serial,args,ressources){
    var $this = this;
    var repere = this.cursorOrigin(serial.cursor.index);
    return new Promise(function(res){
        /**
         * 'out', 'print','split', 'typeof', 'replace', 'lower', 'maj', 'len',
        'tap', 'push','pop','shift', 'delete', 'sort','reverse', 'revSort',
        'filter', 'round','max','min', 'floor','ceil','abs', 'pow', 'join',
        'str', 'int', 'float', 'bool', 'timer', 'jsExec', 'platform', 'raise',
        'setState'
         */
        var natives = {
            tab: function(n){
                var r = '';
                for(var i = 0; i < n; i++){
                    r += ' ';
                }
                return r;
            },
            struct: function(e,n){
                var n = $this.set(n,0),
                    array = e && e.type == 'Array' ? 1 : e && e.type == 'JSON' ? 2 : 0;
                    r = array > 0 ? array == 1 ? '[' : '{' : '';
                if(array > 0){
                    for(var i in e.value){
                        r += r.length == 1 && array > 1 ? '\n' : '';
                        r += (r.length > 2 ? ", "+(array > 1 ? '\n' : '') : "")+(array > 1 ? " "+this.tab(n) : "")+(array == 1 ? "": i+" : ")+this.struct(e.value[i], n+1);
                    }
                    r += r.length > 1 && array > 1 ? '\n' : '';
                }
                else{
                    r += e && (e.type == 'String' || e.implicitType == 'String' && n > 0) ? '"'+e.value+'"' : e ? e.value : ""+e;
                }
                r += array > 0 ? array ==  1 ? ']' : this.tab(n)+'}' : '';
                return r;
            },
            print: function(args){
                var r = '';
                for(var i in args){
                    r += (r.length ? ' ' : '')+this.struct(args[i]); 
                }
                console.log(r);
                return null;
            },
            debug: function(){
                var r = '';
                for(var i in args){
                    r += (r.length ? ' ' : '')+args[i].value; 
                }
                console.log("\x1b[43m\x1b[30m", $this.file+" :: "+repere.y+":"+repere.x,"\x1b[0m", r);
                return null;
            },
            int: function(args){
                var r = {};
                for(var i in args){
                    r = args[i];
                    break;
                }
                r = parseInt(r.value);
                r = isNaN(r) ? 0 : r;
                return $this.toVariableStructure(r, ressources.parent);
            }
        };
        res(natives[serial.name](args));
    });
}
/**
 * La méthode caller
 */
$syl.caller = function(callable,ressources){
    var $this = this, cursor;
    if(callable.ref in this.modules){
        delete this.modules[callable.ref];
    }
    return new Promise(function(res){
        $this.toNextChar().then(function(_char){
            // console.log('[code]',$this.code.substr($this.cursor.index, 5));
            $this.arguments(callable,ressources,true).then(function(args){
                // console.log('[Args]',args,$this.executing);
                // console.log('[Arg]',args,'\n-->',$this.code.substr($this.cursor.index-10, 20), $this.executing);
                if(!$this.executing){
                    res(null);
                }
                else{
                    /**
                     * Conséquence d'un argument ayant le même nom qu'une fonction définie
                     * alors qu'on le crée dans les paramètres d'un callback
                     */
                    if(!args && $this.tryMethodInstead){
                        $this.tryMethodInsteadConfirmed = true;
                        res(null);
                        return;
                    }
                    if(callable.native){
                        $this.native(callable,args,ressources).then(function(value){
                            res(value);
                        });
                    }
                    else{
                        $this.createScopeObject(callable,args);
                        // console.log('[$modules]',$this.modules);
                        /**
                         * On copie les données actuelles du curseur pour les restaurer après !
                         */
                        cursor = $this.copy($this.cursor);
                        $this.cursor = $this.copy(callable.scopeCursor);
                        // $this.cursor.index++;
                        // console.log('[CALL][PARSING]')
                        $this.parse({
                            parent : callable.addr
                        },{
                            end: callable.braced ? [Synthetic.Lang.constants._EOS.BRACE] : [],
                            statementCount: callable.braced ? -1 : 1
                        }).then(function(response){
                            $this.executing = true;
                            if(callable.braced){
                                $this.toNextChar().then(function(__char){
                                    $this.cursor = $this.copy(cursor);
                                    res(response);
                                });
                            }
                            else{
                                // $this.cursor.scope--;
                                $this.cursor = $this.copy(cursor);
                                res(response);
                            }
                        })
                    }
                }
            })
        })
    });
}
/**
 * La méthode arguments permet de récupérer et d'inspecter les arugments d'une méthode 
 */
$syl.arguments = function(serial,ressources, calling){
    var $this = this,
        calling = $this.set(calling, false);
    return new Promise(function(res){
        var _arguments = {},
            arg, index = 0, _cursor, _arg,
            withParenthese = 0;
        function getArg(n,notNull){
            notNull = $this.set(notNull,false)
            for(var i in serial.arguments){
                if(serial.arguments[i].index == n){
                    return $this.copy(serial.arguments[i],true);
                }
                if(serial.arguments[i].name == n){
                    return $this.copy(serial.arguments[i],true);
                }
            }
            return notNull ? {} : null;
        }
        function resetArg(){
            var r = $this.meta({
                label: 'argument',
                type: 'Any',
                implicitType: 'Any',
                value: null,
                unset: false,
                constant: false
            },false),_r;
            if(calling){
                _r = getArg(index);
                r = _r ? _r : r;
            }
            return r;
        }
        arg = resetArg();
        function finishSavingArgument(cursor,loop,_res){
            // console.log('[CURSOR]',cursor);
            if(cursor.char == ','){
                if(!calling && arg.constant){
                    throw new Error($this.err("argument [ "+arg.name+" ] must have default value !"));
                }
                if(!withParenthese){
                    throw new Error($this.err("syntax error withing parenthesisless calling style function !"));
                }
                if(!calling){
                    arg.index = index;
                }
                if(!calling){
                    arg.name = cursor.word;
                    _arguments[arg.name] = arg;
                }
                else{
                    _arg = getArg(index);
                    if(_arg && _arg.constant){
                        throw new Error($this.err("error from trying to set value of [ "+_arg.name+" ] !"));
                    }
                    _arguments[index] = typeof cursor.word == 'object' ? cursor.word : $this.toVariableStructure(cursor.word);
                }
                index++;
                /**
                 * On réinitialise l'objet arg
                */
                arg = resetArg();
                _res();
            }
            else if(cursor.char == ':'){
                if(arg.unset){
                    throw new Error($this.err("unset argument [ "+arg.name+" ] can't have default value !"));
                }
                if(!withParenthese){
                    throw new Error($this.err("syntax error withing parenthesisless calling style function !"));
                }
                if(calling && !(cursor.word in serial.arguments)){
                    throw new Error($this.err("[ "+cursor.word+" ] is not a defined argument for "+serial.name+" !"));
                }
                _arg = getArg(cursor.word);
                if(_arg && _arg.constant){
                    throw new Error($this.err("error from trying to set value of [ "+_arg.name+" ] !"));
                }
                $this.goTo(1);
                /**
                 * Si la boucle est déjà bloquée, on ne le bloc pas à nouveau
                 */
                // console.log('[Set]',$this.code.substr($this.cursor.index, 10));
                $this.value({
                    object: arg,
                    subvariables: false, 
                    ressources: ressources,
                    ternary: false,
                    end: [Synthetic.Lang.constants._EOS.COMA, Synthetic.Lang.constants._EOS.PARENTHESE]
                }).then(function(result){
                    // console.log('[Result]',result);
                    arg.implicitType = result.implicitType;
                    arg.value = result.value;
                    arg.index = index;
                    index++;
                    arg.name = cursor.word;
                    _arguments[arg.name] = arg;
                    _cursor = $this.copy($this.cursor);
                    /**
                     * Si le caractère EOS est un ')' alors, on arrête tout
                     */
                    if($this.code[$this.cursor.index - 1] == ')'){
                        withParenthese--;
                        loop.end();
                        return;
                    }
                    /**
                     * On réinitialise l'objet arg
                    */
                    arg = resetArg();
                    _res();
                });
                return;
            }
            else if(cursor.char == ')'){
                if(!calling){
                    arg.index = index;
                }
                if(!calling){
                    arg.name = cursor.word;
                    _arguments[arg.name] = arg;
                }
                else{
                    _arg = getArg(index);
                    if(_arg && _arg.constant){
                        throw new Error($this.err("error from trying to set value of [ "+_arg.name+" ] !"));
                    }
                    _arguments[index] = typeof cursor.word == 'object' ? cursor.word : $this.toVariableStructure(cursor.word);
                }
                withParenthese--;
                $this.goTo(1);
                // console.log('[ARGS][END][1]',serial.name, $this.code.substr($this.cursor.index, 10));
                // console.log('[arg][end]', cursor.word,serial.name, '>'+$this.code.substr($this.cursor.index-1, 5));
                loop.end();
            }
            else{
                if(calling){
                    _arg = getArg(index);
                    if(_arg && _arg.constant){
                        throw new Error($this.err("error from trying to set value of [ "+_arg.name+" ] !"));
                    }
                    _arguments[index] = typeof cursor.word == 'object' ? cursor.word : $this.toVariableStructure(cursor.word,serial.parent);
                    if(/[\S]+/.test(cursor.char)){
                        $this.backTo(cursor.char.length - (cursor.char.length == 1 ? 1 : 0));
                    }
                    // console.log('[END][Args]',$this.code.substr($this.cursor.index, 10));
                    loop.end();
                }
                else{
                    throw new Error($this.err("[ "+cursor.char+" ] unexpected !"));
                }
            }
        }
        function saveArgument(cursor,loop){
            return new Promise(function(_res,_rej){
                if(calling && cursor.char != ':' && cursor.word && typeof cursor.word != 'object'){
                    // console.log('[Char*****]', cursor.word, '/', cursor.char,'>'+$this.code.substr(_cursor.index,10));
                    loop.stop();
                    $this.cursor = $this.copy(_cursor);
                    // console.log('[String]',$this.code.substr($this.cursor.index, 10));
                    $this.value({
                        object: arg,
                        ressources: ressources,
                        end: [Synthetic.Lang.constants._EOS.COMA, Synthetic.Lang.constants._EOS.PARENTHESE]
                    }).then(function(result){
                        // console.log('[Result]',result,$this.code.substr($this.cursor.index,10));
                        var _char = $this.code[$this.cursor.index-1];
                        /**
                         * Si le caractère précédent est une ")", on doit pas procéder
                         * jusqu'au caractère non-blanc suivant avant de finir l'enregistrement
                         */
                        // console.log('[ARG][Litt]','>'+$this.code.substr($this.cursor.index,10), '/', _char, result)
                        if([')'].indexOf(_char) >= 0){
                            _cursor = $this.copy($this.cursor);
                            $this.cursor.index--;
                            finishSavingArgument({char: _char, word: result}, loop,_res);
                        }
                        else{
                            // console.log('[Master]****',cursor.word, '/', _char, '/','>'+$this.code.substr($this.cursor.index-1,10))
                            $this.toNextChar().then(function(__char){
                                _cursor = $this.copy($this.cursor);
                                // console.log('[Char]',_char, '/', __char);
                                // console.log('[HERE]',$this.code[$this.cursor.index - 1],_char,withParenthese)
                                // console.log('[ARG][Litt]',cursor.word, '>'+$this.code.substr($this.cursor.index,10))
                                finishSavingArgument({char: _char, word: result}, loop,_res);
                            });
                        }
                    });
                }
                else{
                    _cursor = $this.copy($this.cursor);
                    finishSavingArgument(cursor,loop,_res);
                }
            });
        }
        _cursor = $this.copy($this.cursor);
        if($this.code[$this.cursor.index] == '('){
            withParenthese = 1;
            _cursor.index++;
        }

        $this.loop(function(cursor,loop){
            /**
             * On cherche les mots dans les arguments
             */
            //  console.log('[Cursor]',cursor);
            if(cursor.word && cursor.word.length){
                // console.log('[Word]',cursor.word);
                if($this.types.indexOf(cursor.word) >= 0){
                    if(arg.name || calling){
                        throw new Error($this.err("invalid syntax !"));
                    }
                    arg.type = cursor.word;
                    loop.stop();
                    $this.toNextChar().then(function(char){
                        if(char == '<'){
                            $this.genericType(cursor.word).then(function(generic){
                                arg.constraints = generic.constraints;
                                loop.start();
                            });
                        }
                        else{
                            $this.backTo(1);
                            loop.start();
                        }
                    });
                }
                else if(Synthetic.Lang.reservedKeys.indexOf(cursor.word) >= 0){
                    if(!calling && cursor.word == 'unset' && !arg.constant){
                        arg.unset = true;
                    }
                    else if(!calling && cursor.word == 'const' && !arg.unset){
                        arg.constant = true;
                    }
                    else{
                        throw new Error($this.err("invalid syntax near [ "+cursor.word+" ] !"));
                    }
                }
                else{
                    // console.log('[word]',cursor.word, calling, index,cursor.char);
                    arg.name = cursor.word;
                    if(['\n', ' '].indexOf(cursor.char) >= 0){
                        loop.stop();
                        $this.toNextChar().then(function(_char){
                            saveArgument({char:_char, word: cursor.word}, loop).then(function(){
                                loop.start();
                            });
                        });
                        return;
                    }
                    loop.stop();
                    // console.log('[call for]',cursor.word,'/',cursor.char, '\n',$this.code.substr($this.cursor.index, 10));
                    saveArgument(cursor,loop).then(function(){
                        // console.log('[end-->]')
                        loop.start();
                    });
                }
            }
            /**
             * Sinon si c'est une utilisation de fonction,
             * on recupère la valeur de la structure si on rencontre un '[' ou un '{'
             */
            else if(['[', '{'].indexOf(cursor.char) >= 0 && calling){
                loop.stop();
                // console.log('[Check]', $this.code.substr($this.cursor.index, 10));
                $this.struct({
                    object: arg,
                    ressources: ressources
                }).then(function(result){
                    $this.toNextChar().then(function(_char){
                        // console.log('[Result]',result, $this.code[$this.cursor.index]+"<");
                        saveArgument({char:_char, word: result}, loop).then(function(){
                            loop.start();
                        });
                    });
                });
            }
            else if(cursor.char == ')'){
                withParenthese--;
                $this.goTo(1);
                loop.end();
                // throw new Error($this.err("near by [ "+cursor.char+" ] unexpected !"));
            }
        })
        .then(function(){
            // $this.goTo(1);
            if(withParenthese != 0){
                /**
                 * Il se peut qu'un argument ait le même nom qu'une fonction définie,
                 * il faut empêcher le déclenchemenent de l'erreur
                 */
                if($this.tryMethodInstead){
                    res(null);
                }
                else{
                // $this.backTo(1);
                // console.log('[NOOOOO !]',withParenthese,calling,'>'+$this.code.substr($this.cursor.index-1,10));
                    throw new Error($this.err(withParenthese < 0 ? "syntax error ! [ ) ] unexpected" : "[ ) ] expected !"));
                }
            }
            // console.log('[Arg][finish]',$this.code.substr($this.cursor.index, 10));
            // console.log('[__Word__]',serial.name,'>'+$this.code.substr($this.cursor.index,10));
            if(calling){
                arg = {};
                // console.log('[arg]',_arguments);
                for(var i in _arguments){
                    if(/^[0-9]+$/.test(i)){
                        arg[i] = _arguments[i];
                    }
                    else{
                        // console.log('[serial]',serial);
                        arg[serial.arguments[i].index] = _arguments[i];
                    }
                }
                if($this.executing){
                    for(var i in serial.arguments){
                        if(serial.arguments[i].unset && !(serial.arguments[i].index in arg) ){
                            throw new Error($this.err("argument [ "+serial.arguments[i].name+" ] has no value set !"));
                        }
                    }
                }
                _arguments = arg;
            }
            res(_arguments);
        });
    });
}

/***
 * La méthode method permet la sérialization d'une fonction ou d'une méthode
 */
$syl.method = function(serial,ressources){
    var $this = this;
    this.currentType = null;
    // console.log('[Serial]',serial);
    // console.trace('[Method]',serial.name);
    return new Promise(function(res,rej){
        var savingArg = false,executing = $this.executing,
            scope;
        serial.label = 'function';
        serial.arguments = {};
        serial.scopeCursor = $this.cursor;
        //On définit si la fonction a des accollades
        serial.braced = false;
        serial.begin = 0;
        serial.end = 0;
        brace = 0;
        $this.loop(function(cursor,loop){
            if(cursor.char == '(' && !savingArg){
                loop.stop();
                scope = $this.cursor.scope;
                $this.fixScope(true);
                $this.arguments(serial,ressources)
                .then(function(arg){
                    $this.toNextChar().then(function(_char){
                        /**
                         * On doit décrémenter le scope parce qu'on l'avait incrémenté avant la
                         * lecture des arguments
                         */
                        $this.cursor.scope--;
                        serial.arguments = arg;
                        if($this.code[$this.cursor.index] == '{'){
                            serial.braced = true;
                            $this.fixScope(false);
                            $this.goTo(1);
                            // console.log('[method] braced', $this.code.substr($this.cursor.index, 10));
                        }
                        else if(/[\S]+/.test($this.code[$this.cursor.index])){
                            $this.backTo(1);
                        }
                        if(!serial.braced){
                            $this.fixScope(true);
                        }
                        serial.scopeCursor = $this.copy($this.cursor);
                        serial.begin = $this.cursor.index;
                        $this.createBlock(serial.ref);
                        // console.log('[Arg]', arg, serial.name, $this.code.substr($this.cursor.index-1, 10))//, serial.ref, $this.executing, $this.blocks);
                        loop.start();
                    });
                });
                return;
            }
            $this.executing = false;
            loop.stop();
            $this.parse(ressources, {
                end: [Synthetic.Lang.constants._EOS.BRACE],
                statementCount: serial.braced ? -1 : 1
            }).then(function(){
                // console.log('[PARSE][END]',serial.name, $this.code.substr($this.cursor.index, 10));
                /**
                 * Si la function a des accolades, il faut que le EOS soit un "}"
                 * sinon on déclenche une erreur
                 */
                $this.executing = executing;
                // console.log('[End] of Method',serial.name,'/',$this.code.substr($this.cursor.index, 10)+'<')//,serial, $this.code.substr($this.cursor.index, 10));
                if(serial.braced && $this.code[$this.cursor.index] != '}'){
                    throw new Error($this.err("[ } ] expected !"));
                }
                if(serial.braced){
                    $this.goTo(1);
                }
                else{
                    $this.cursor.scope--;
                    $this.backTo(1);
                }
                loop.end();
            });
        }).then(function(){
            res(serial);
        })
    });
}
/**
 * La méthode littéral permet de définir si le littéral en cours sera soit :
 *  * la déclaration d'une variable, 
 *  * l'appelation d'une fonction haut niveau
 *  * la déclaration d'une fonction
*/
$syl.litteral = function(litteral,ressources){
    var $this = this,
        type = this.getType(),
        syntObject = $this.find(litteral),
        redefinition = this.currentType != null,
        exist = !redefinition && syntObject != null,
        settingKey = null, settingKeyObject = null,
        created = false, dotted = false, nextWord = '',
        serial = exist ? syntObject : this.meta({
            type: type.type,
            parent: this.set(ressources.parent,null),
            constraints: type.constraints,
            label: 'variable', //le type de notation: par exemple : mixin, variable
            name: litteral, //le nom du notation: par exemple : nomVariable
            visible: this.access.export,
            parent: this.set(ressources.parent,null)
        }),
        resultValue = exist ? syntObject :null,_cursor;
        // console.log('[Type]',litteral,redefinition,exist);

        // console.trace('[Serial]',litteral,exist,serial);
        // previous = exist ? null : this.getCloserStruct([serial.cursor.scope,serial.cursor.index]);
        // console.log('[Ok]');
    return new Promise(function(res){

        _cursor = $this.copy($this.cursor);
        $this.loop(function(cursor,loop){
            // return;
            loop.stop();
            if(cursor.char.length){
                $this.backTo(cursor.char.length - 1);
            }
            if(dotted && $this.executing){
                /**
                 * S'il y a de l'espace entre le point et le précédent objet,
                 * on fait en sorte que cela n'impacte pas la notation pointée
                 * Et on évite à ce que les littéraux soient interpretés en mot-clé ou type
                 */
                if(/^[\s]+$/.test(nextWord) || !nextWord.length || [Synthetic.Lang.constants.LITTERAL, Synthetic.Lang.constants.TYPE, Synthetic.Lang.constants.KEYWORD].indexOf($this.getCodeType(nextWord+cursor.char)) >= 0){
                    if(!nextWord.length && /[\s]+/.test(nextWord)){
                        nextWord = '';
                    }
                    if(/[\S]+/.test(cursor.char)){
                        nextWord += cursor.char;
                    }
                    if(!nextWord.length){
                        $this.cursor.index++;
                        loop.start();
                        return;
                    }
                }
                else{
                    /**
                     * Si l'objet en cours est null
                     * on ne peut pas procéder au syntaxe pointé
                     */
                    if(resultValue == null){
                        $this.cursor = $this.copy(_cursor);
                        throw new Error($this.err("Cannot read property [ "+nextWord+" ] of null"));
                    }
                    if(nextWord in resultValue.value){
                        resultValue = resultValue.value[nextWord];
                    }
                    else{
                        /**
                         * Si l'objet exist mais pas la clé,
                         * on le prépare paresseusement pour un enregistrement
                         */
                        if(resultValue.type == 'JSON' && exist){
                            settingKey = nextWord;
                            settingKeyObject = resultValue;
                        }
                        resultValue = null;
                        _cursor = $this.copy($this.cursor);
                    }
                    if(cursor.char == '.'){
                        dotted = false;
                    }
                    nextWord = '';
                    cursor.word = '';
                    // _cursor = $this.copy($this.cursor);
                    // console.log('[Cool]', $this.code.substr($this.cursor.index, 10));
                }
            }
            $this.toNextChar().then(function(_char){
                cursor.index = $this.cursor.index;
                cursor.char = _char;
                /**
                 * Si on n'est pas en lecture pointé 'variable.index'
                 * on fait un rollback
                 */
                if(cursor.word && cursor.word.length && !dotted){
                    $this.cursor = _cursor;
                }
                //Si on a un opérateur '=', on passe à une affectation
                if(cursor.char == '='){
                    // if(exist){
                    //     throw new Error($this.err("trying to override defined object [ "+litteral+"]"));
                    // }
                    $this.goTo(1);
                    // console.log('[Serial]',litteral,settingKey, exist);
                    if(settingKey){
                        settingKey = $this.meta({
                            name: settingKey,
                            constraints: serial.constraints,
                            visible: false
                        });
                    } 
                    // loop.stop();
                    $this.value({
                        object: exist ? resultValue && !settingKey ? resultValue : settingKey : serial, 
                        subvariables: false, 
                        ressources:ressources,
                        ternary: false
                    }).then(function(result){
                        // console.log('[result]',litteral,dotted,exist,'/',result, $this.executing);
                        if(exist){
                            if(settingKey){
                                settingKeyObject.value[settingKey.name] = $this.extend(settingKey, result);
                            }
                            else{
                                var tmp = {
                                    name : resultValue.visible,
                                    visible : resultValue.visible
                                };
                                $this.extend(resultValue, result,true);
                                resultValue.name = tmp.name;
                                resultValue.visible = tmp.visible;
                            }
                        }
                        else{
                            if($this.executing){
                                $this.extendElse(serial, result);
                                serial.implicitType = result.implicitType;
                                _cursor = $this.copy($this.cursor);
                                created = true;
                                resultValue = serial;
                            }
                        }
                        loop.end();
                    });
                }
                //Si on a le caractère '(' on passe à l'appelation d'une fonction
                else if(cursor.char == '('){
                    /**
                     * Si la variable resultValue n'est pas nulle, c'est lui
                     * le serial à présent
                     */
                    serial = resultValue != null ? resultValue : serial;
                    if(!exist){
                        $this.method(serial,ressources).then(function(method){
                            resultValue = method;
                            // console.log('[Method]',$this.executing,method.name);
                            _cursor = $this.copy($this.cursor);
                            created = true;
                            loop.start();
                        });
                    }else{
                        $this.caller(resultValue,ressources).then(function(result){
                            resultValue = result;
                            // console.log('[Caller][finished]')
                            _cursor = $this.copy($this.cursor);
                            loop.end();
                        });
                        return;
                    }
                }
                /**
                 * Si on tente l'accès à un variable
                 * Mais si l'objet en cours est une fonction, on évite cette section pour passer
                 * à la suivante.
                 */
                else if(cursor.char == '[' && $this.executing && (!resultValue || resultValue.label != 'function') ){
                    if(!exist && resultValue == null){
                        throw new Error($this.err("[ "+cursor.char+" ] unexpected !"));
                    }
                    if(dotted){
                        throw new Error($this.err("syntax error !"));
                    }
                    // resultValue = syntObject;
                    dotted = false;
                    $this.goTo(1);
                    loop.stop();
                    $this.value({
                        object: $this.meta({
                            type: 'Any',
                            implicitType: 'Any'
                        },false), 
                        subvariables: false, 
                        ressources:ressources,
                        ternary: false,
                        end: [Synthetic.Lang.constants._EOS.BRACKET]
                    }).then(function(result){
                        if(result.value in  resultValue.value){
                            resultValue = resultValue.value[result.value];
                        }
                        else{
                            resultValue = null;
                        }
                        // console.log('[INDEXED]',result.value, $this.code.substr($this.cursor.index, 10));
                        _cursor = $this.copy($this.cursor);
                        loop.start();
                    });
                    return;
                }
                else if(cursor.char == '.'){
                    if(dotted && $this.executing){
                        /**
                         * Il est hormis d'avoir deux points consécutifs
                         */
                        if(!nextWord.length){
                            throw new Error($this.err("invalid syntax !"));
                        }
                        if(nextWord in resultValue.value){
                            resultValue = resultValue.value[nextWord];
                        }
                        else{
                            resultValue = null;
                            dotted = false;
                        }
                        // console.log('[Nextword]',nextWord);
                    }
                    else{
                        dotted = true;
                    }
                    cursor.word = '';
                    nextWord = '';
                    $this.cursor.index++;
                    loop.start();
                }
                else{
                    // resultValue = resultValue == null ? $this.find(litteral) : resultValue;
                    // console.log('[END LITT]', litteral, exist, created, $this.cursor.index, $this.code.substr($this.cursor.index, 10));
                    if(!exist && $this.executing && !created /*&& resultValue == null*/){
                        if($this.tryMethodInstead){
                            resultValue = null;
                            $this.tryMethodInsteadConfirmed = true;
                            loop.end();
                            return;
                        }
                        else{
                            // console.log('[Litteral]',resultValue,$this.cursor,dotted);
                            throw new Error($this.err("[ "+litteral+" ] is undefined !"));
                        }
                    }
                    if(exist && resultValue && resultValue.label == "function"){
                        // console.log('[Cursor__]',cursor,resultValue);
                        // console.log('[Next To]',cursor.char,'/',$this.code.substr($this.cursor.index-10,10));
                        $this.caller(resultValue,ressources).then(function(result){
                            // console.log('[Call][end]', $this.cursor);
                            resultValue = result;
                            loop.end();
                        });
                        return;
                    }
                    /**
                     * Si l'EOS n'est pas un caractère blanc, on fait marche arrière
                     *  * d'un caractère si la longueur est 1
                     *  * de la totalité de la longueur sinon
                     * 
                     */
                    if(!dotted || (dotted && [Synthetic.Lang.constants.LITTERAL, Synthetic.Lang.constants.TYPE, Synthetic.Lang.constants.KEYWORD].indexOf($this.getCodeType(nextWord+cursor.char)) < 0)){
                        // console.log('[Done]',dotted,nextWord, cursor.char);
                        if(cursor.char.length && /[\S]+/.test(cursor.char)){
                            // console.log('[Char]',cursor.char, _char);
                            $this.backTo(cursor.char.length - (cursor.char.length == 1 ? 1 : 0));
                        }
                        loop.end();
                    }
                    else{
                        $this.cursor.index++;
                        loop.start();
                    }
                }
            });
        }).then(function(){
            // console.log('[Result]', litteral, '/', resultValue, $this.code.substr($this.cursor.index, 10));
            if($this.code[$this.cursor.index] == '}'){
                // console.log('[litt][}]',$this.cursor.scope);
                $this.fixScope(true);
                // console.log('[litt][}]',$this.cursor.scope);
            }
            res(resultValue);
        });
    });
}

/**
 * La méthode parse est la partie principale de l'interpréteur de syntax synthétic
*/
$syl.parse = function(ressource,data){
    var $this = this,
        /**
         * la variable data contient des informations supplémentaires pour la lecture du code
         */
        data = this.set(data,{}),
        /**
         * la variable ressource contient des données importantes pour la lecture du code
         * comme par exemple le référencement du bloc de l'instruction parente
        */
        ressource = this.set(ressource,{}),
        object = null,
        _end, statement = 0;
        // console.log('[Parse]', ressource);
        data.end = Array.isArray(data.end) ? data.end : [];
        data.statementCount = this.set(data.statementCount,-1);
    return new Promise(function(resolve, reject){
        $this.loop(function(cursor,loop){
            /**
             * S'il y a un mot trouvé, on va vérifier:
             */
            _end = Synthetic.Lang.constants._EOS.values.end.indexOf(cursor.char);
            // console.log('[WORD]',cursor);
            if(cursor.word){
                /**
                 * S'il existe dans la liste des mots-clés réservés
                 */
                if(Synthetic.Lang.reservedKeys.indexOf(cursor.word) >= 0){
                    loop.stop();
                    $this[cursor.word](ressource).then(function(result){
                        if(Synthetic.Lang.valuableReservedKeys.indexOf(cursor.word) >= 0){
                            object = result;
                        }
                        statement++;
                        // console.log('[PARSE][keyword]',$this.cursor.index,data.statementCount);
                        if(data.statementCount >= statement){
                            loop.end();
                        }
                        else{
                            loop.start();
                        }
                    });
                    return;
                }
                /**
                 * S'il est un type défini on prend on compte le type
                 */
                else if($this.types.indexOf(cursor.word) >= 0){
                    /**
                     * Si aucun type n'est encore pris en compte, on passe à sa prise en compte
                     */
                    if($this.currentType == null){
                        $this.currentType = {
                            type: cursor.word,
                            constraints: null,
                            hasKeyConstraint: false,
                            saved: true,
                            hasNextType: false
                        };
                    }
                    /**
                     * si le type pris en compte a des contraintes, c'est qu'il est générique
                     */
                    else if($this.currentType.constraints != null && !$this.currentType.saved && $this.hasNextType){
                        $this.currentType.constraints[!$this.currentType.hasKeyConstraints ? 'key' : 'value'].push(cursor.word);
                    }
                    /**
                     * sinon il y a erreur de syntaxe
                     */
                    else{
                        throw new Error($this.err("syntax error : "+$this.currentType.type+" ... "+cursor.word));
                    }
                }
                /**
                 * Sinon c'est un litéral
                 */
                else if($this.getCodeType(cursor.word) == Synthetic.Lang.constants.LITTERAL){
                    loop.stop();
                    $this.litteral(cursor.word, ressource).then(function(result){
                        object = result;
                        statement++;
                        // console.log('[PARSE]', data,cursor.word);
                        if(data.statementCount >= statement){
                            loop.end();
                        }
                        else{
                            loop.start();
                        }
                    });
                    return;
                }
            }
            /**
             * Si on constate un caractère EOS sous demande, on met fin à la lecture
             */
            if(data.end.indexOf(_end) >= 0){
                // console.log('[parse][end]',cursor.char,statement);
                if(cursor.char == '}' && statement){
                    $this.fixScope(true);
                }
                loop.end();
                return;
            }
            else if(cursor.char != '<' && !cursor.word && /[\S]+/.test(cursor.char)){
                // console.log('[Char][parse]',cursor.char);
            }
            /**
             * on suggère qu'il y a un type prise en compte pour voir s'il y a généricité
             */
            if($this.currentType != null && cursor.char == '<'){
                loop.stop();
                $this.genericType($this.getType().type).then(function(e){
                    $this.currentType = e;
                    loop.start();
                });
            }
        }).then(function(){
            resolve(object);
        });
    });
}
/**
 * la méthode compile est la porte d'entrée de toute interprétation de syntaxe 
 */
$syl.compile = function(filename){
    var $this = this;
    return new Promise(function(resolve, reject){
        $this.read(filename).then(function(){
            $this.parse().then(function(){
                resolve($this);
            }).catch(function(e){
                reject(e);
            })
        }).catch(function(e){
            reject(e);
        });
    })
}
/**
 * @SECTOR : Keywords
 */
/**
 * la méthode class permet de sérialiser le syntax en données simples et manipulables
 */
$syl.class = function(ressources){
    var $this = this;
    return new Promise(function(resolve, reject){
        $this.accessErr("protected", "class");
        var  serial = $this.meta({
            label: 'class',
            parent: $this.set(ressources.parent,null),
            visible: !$this.access.private,
            static: $this.access.static,
            abstract: $this.access.abstract,
            final: $this.access.final,
            superclass: [],
            supertypes: [],
            methods: [],
            attributes: [],
            value: {}
        });
        $this.loop(function(cursor,loop){
            if(cursor.word && cursor.word.length){
                if(serial.name == null){
                    serial.name = cursor.word;
                    serial.type = cursor.word;
                    serial.supertypes.push(cursor.word);
                }
                // console.log('[Word]',word, char,);
            }
            if(cursor.char == '{'){
                serial.cursor.index = cursor.index;
                serial.cursor.scope = $this.cursor.scope - 1;
                serial.cursor.lines = {
                    x : $this.cursor.lines.x,
                    y : $this.cursor.lines.y,
                };
                $this.createBlock(serial.ref);
                // console.log('753::[Blocks]',$this.blocks);
                loop.stop();
                $this.goTo(1);
                $this.parse($this.extend(ressources,{
                    parent: serial.addr
                },true)).then(function(){
                    Synthetic.Lang.scope--;
                    loop.start();
                });
            }
        }).then(function(){
            resolve();
        })
        // .catch(function(e){
        //     reject(e);
        // });
    });
}

/**
 * La méthode if permet d'executer un bloc if
 */
$syl.if = function(ressources, data){
    var $this = this,
        /**
         * la variable data contient des informations nécessaire pour la condition
         * @structure : {type}
         */
        data = this.set(data,{}), previousReason;
    data.type = this.set(data.type, 0);
    return new Promise(function(res){
        var parentheseless = false,
            executing = $this.executing,
            braceless = false,
            reason = false;
        // console.log('[Type]',data.type, $this.previousReason);
        if(data.type == 0){
            $this.previousReason = null;   
        }
        previousReason = $this.previousReason;
        /**
         * Si aucune raison précédente n'a été définie alors qu'on ne traite pas un if,
         * on lève une exception
         */
        if(previousReason == null && data.type > 0){
            throw new Error($this.err("syntax error ! can't read "+(data.type == 1 ? "elif" : "else")+" statement without a previous if or elif statement !"));
        }
        $this.toNextChar().then(function(_char){
            /**
             * Traitement pour les else
             */
            if(data.type == 2){
                $this.executing = executing && previousReason !== null && !previousReason;
                // console.log('[ELSE]', $this.cursor.scope);
                braceless = $this.code[$this.cursor.index] != '{';
                if(!braceless){
                    $this.executing = $this.executing && !previousReason;
                    $this.goTo(1);
                }
                else{
                    $this.cursor.scope++;
                }
                $this.parse(ressources,{
                    end: braceless ? [] : [Synthetic.Lang.constants._EOS.BRACE],
                    statementCount: braceless ? 1 : -1
                }).then(function(){
                    $this.executing = executing;
                    if(!braceless){
                        if($this.code[$this.cursor.index] != '}'){
                            throw new Error($this.err("[ } ] expected !"));
                        }
                        $this.goTo(1);
                    }
                    $this.cursor.scope--;
                    res();
                });
            }
            /**
             * Traitement pour les if/elif
             */
            else{
                parentheseless = _char != '(';
                $this.backTo(_char.length - 1);
                if(!parentheseless){
                    $this.goTo(1);
                }
                $this.value({
                    object: $this.meta({},false),
                    ressources: ressources,
                    end: !parentheseless ? [Synthetic.Lang.constants._EOS.PARENTHESE] : []
                }).then(function(value){
                    // console.log('[Val]',value, $this.code.substr($this.cursor.index-1, 10));
                    if(parentheseless && $this.code[$this.cursor.index + 1] != '{'){
                        throw new Error($this.err("syntax error. [ { ] expected !"));
                    }
                    if(!parentheseless){
                        $this.goTo(1);
                        // $this.cursor.scope++;
                    }
                    braceless = $this.code[$this.cursor.index + (parentheseless ? 1 : 0)] != '{';
                    reason = !$this.executing ? false : $this.toBoolean(value.value);
                    if(!reason || (previousReason !== null && !previousReason) ){
                        $this.executing = false;
                    }
                    // console.log('[reason]',$this.previousReason,braceless);
                    if(!braceless){
                        $this.goTo(1);
                    }
                    else{
                        $this.cursor.scope++;
                    }
                    $this.parse(ressources,{
                        end: braceless ? [] : [Synthetic.Lang.constants._EOS.BRACE],
                        statementCount: braceless ? 1 : -1
                    }).then(function(e){
                        $this.executing = executing;
                        $this.previousReason = reason;
                        // console.log('[ENDIF]',$this.code.substr($this.cursor.index, 10))
                        if(!braceless){
                            if($this.code[$this.cursor.index] != '}'){
                                throw new Error($this.err("[ } ] expected !"));
                            }
                            $this.goTo(1);
                        }
                        $this.cursor.scope--;
                        res(e);
                    });
                });
            }
        });
    })
}

/**
 * La méthode elif permet d'executer un bloc elif (else if)
 */
$syl.elif = function(ressources){
    var $this = this;
    return new Promise(function(res){
        $this.if(ressources,{
            type: 1
        }).then(function(e){
            res(e)
        })
    });
}

/**
 * La méthode else permet d'executer un bloc else
 */
$syl.else = function(ressources){
    var $this = this;
    return new Promise(function(res){
        $this.if(ressources,{
            type: 2
        }).then(function(e){
            res(e)
        })
    });
}

/**
 * La méthode return permet d'exécuter un retour de fonction
 */
$syl.return = function(ressources){
    var $this = this;
    return new Promise(function(res){
        var parent = Synthetic.Lang.objects[ressources.parent];
        
        //$this.getCloserStruct([$this.cursor.scope, $this.cursor.index], ['function']);
        /**
         * Si l'instruction return est en déhors d'une fonction, on arrête tout
         */
        // if('parent' in ressources){
        //     console.log('[Ressources]',Synthetic.Lang.objects[ressources.parent]);   
        // }
        if($this.executing && parent.label != 'function'){
            throw new Error($this.err("Illegal statement ! return statement outside of function !"));
        }
        $this.value({
            object: $this.executing ? $this.copy(parent) : $this.meta({},false),
            subvariables: false, 
            ressources : ressources,
            ternary: false
        }).then(function(result){
            // $this.extend(parent, cp_parent);
            if($this.executing){
                $this.executing = false;
                res(result);
            }
            else{
                res(null);
            }
        });
    });
}
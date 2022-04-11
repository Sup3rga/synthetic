
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
        'str', 'int', 'float', 'bool', 'timer', 'jsExec', 'platform', 'raise'
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
    EOS : [' ', '\n', '\t', ';',',','(', ')','[', ']','{', '}','.', '?', ':','+','-','/','=','~','*','%', '<', '>', '|', '&', '"', "'"],
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
            PARENTHESE: 0,
            BRACKET: 1,
            BRACE: 2,
            COMA: 3,
            SEMICOLON: 4
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
        POSTDECREMENTATION: 5
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
    this.modules = {};
    this.exportables = {};
    this.blocks = {
        '0,0': []
    };
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
    if(autosave) this.save(result);
    return result;
}
/**
 * la fonction loop permet de parcourir une boucle de façon compatible à l'asynchrone
*/
$syl.loop = function(callback,cursor){
    var $this = this,
        cursor = typeof cursor == 'number' ? cursor : $this.cursor.index,
        _break = false, word = '',
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
            $this.cursor.index++;
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
            var findEOS = false, doubleSigns = false, restart = false;
            wrapper = _wrapper != null ? _wrapper : {
                quote: 0,
                simple_quote: 0,
                last_char: '',
                comment: 0,
                regex: 0
            };
            _wrapper = null;
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
                    $this.cursor.index++;
                    cursor = $this.cursor.index;
                }
                switch($this.code[cursor]){
                    case '\n':
                        $this.cursor.lines.y++;
                        $this.cursor.lines.x = 0;
                        if(wrapper.comment == 1){
                            wrapper.comment = 0;
                        }
                    break;
                    case ".":
                        if(!wrapper.quote && !wrapper.simple_quote && $this.getImplicitType(word) == 'Number' && word.indexOf('.') < 0){
                            word += '.';
                            $this.cursor.index++;
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
                                    $this.cursor.index++;
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
                                $this.cursor.index++;
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
                            $this.cursor.scope++;
                        }
                    break;
                    case '}':
                        if(!wrapper.quote && !wrapper.simple_quote && !wrapper.comment && !wrapper.regex){
                            $this.cursor.scope--;
                        }
                    break;
                    case "'":
                        if(!wrapper.quote && !wrapper.comment && wrapper.last_char != '\\'){
                            wrapper.simple_quote = (wrapper.simple_quote + 1) % 2;
                        }
                    break;
                    case '"':
                        if(!wrapper.simple_quote && !wrapper.comment && wrapper.last_char != '\\'){
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
                if(doubleSigns){
                    $this.cursor.index++;
                    cursor = $this.cursor.index;
                    if($this.code[cursor] == '\n'){
                        $this.cursor.lines.y++;
                        $this.cursor.lines.x = 0;
                    }
                }
                if(!findEOS && !wrapper.comment){
                    word += $this.code[cursor];
                }
                if(!wrapper.quote && !wrapper.simple_quote && !wrapper.comment){
                    callback({
                            char: doubleSigns ? $this.code[cursor-1]+$this.code[cursor] : $this.code[cursor], 
                            word: findEOS ? word : null, 
                            index: cursor
                        }, 
                        {
                            start: start, 
                            stop: stop, 
                            end: end
                        });
                        // console.log('[__char__]',$this.code[cursor],findEOS,word,'>', cursor);
                }
                /**
                 * On parre à l'éventualité que le curseur pourrait être mise à jour dans
                 * l'exécution du callback, alors, il faut mettre aussi à jour toutes
                 * les variables qui en dépendent
                 */
                cursor = $this.cursor.index;
                findEOS = !wrapper.quote && !wrapper.simple_quote && !wrapper.comment && Synthetic.Lang.EOS.indexOf($this.code[cursor]) >= 0;
                if(findEOS) word = '';
                if(_break) break;
                if($this.code[cursor] != '\n'){
                    $this.cursor.lines.x++;
                }
                $this.cursor.index++;
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
 * La méthode toNextChar permet de trouver le prochain caractère non-blanc dans le
 * code pour éviter d'attendre jusqu'au prochain tour de la boucle.
*/
$syl.toNextChar = function(){
    var $this = this, _char;
    return new Promise(function(res,rej){
        $this.loop(function(cursor,loop){
            if(/[\S]+/.test(cursor.char) || cursor.index == $this.code.length - 2){
                _char = cursor.char;
                loop.end();
            }
        }).then(function(){
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
        if(node_env){
            Synthetic.Lang.xhr.readFile(filename, 'utf-8', function(err,content){
                if(err) throw err;
                $this.code = content+'\n';
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
        if(Synthetic.Lang.baseType.indexOf(type) >= 0 && ['Array', 'JSON'].indexOf(type) < 0){
            throw new Error(this.err("primitive type [ "+ type + "] can't be generic !"));
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
                        $this.cursor.index += 2;
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
                    $this.cursor.index++;
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
    else if(/^[a-z_$]([a-z0-9_]+)?$/.test(code)){
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
    });
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
            r = value.value.replace(/^('|")|('|")$/g, '');
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
    var r = false;
    for(var i in list){
        if(list[i].type == type || list[i].type == 'Any'){
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
 * La méthode calc permet de simplifier une opération complexe en une seule valeur
*/
$syl.calc = function(list){
    if(list.length == 1){
        return list[0];
    }
    var $this = this,
        compute = {
        "+": function(a,b){
            var r,k= $this.len(a.value);
            if(a.type == b.type && a.type == 'Array'){
                r = $this.copy(a);
                for(var i in b.value){
                    r.value[k] = b.value[i];
                    k++;
                }
            }
            else if(a.type == 'Array' || b.type == 'Array'){
                r = $this.copy(a.type == 'Array' ? a : b);
                if(
                    a.type == 'Array' && 
                    (
                        !a.constraints ||
                        (
                            a.constraints && 
                            $this.isValidateConstraint(b.type, a.constraints.value)
                        )
                    )
                ){
                    r.value[k] = b;
                }
                else if(
                    b.type == 'Array' && 
                    (
                        !b.constraints ||
                        (
                            b.constraints && 
                            $this.isValidateConstraint(a.type, b.constraints.value)
                        )
                    )
                ){
                    r.value[k] = a;
                }
                else{
                    r.value  = $this.toPrimitiveValue(a) + $this.toPrimitiveValue(b);
                    r.type = 'Any';
                    r.implicitType = 'Any';
                }
            }
            else{
                r = $this.toPrimitiveValue(a) + $this.toPrimitiveValue(b);
            }
            return r;
        },
        "-": function(a,b){
            return $this.toPrimitiveValue(a) - $this.toPrimitiveValue(b);
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
        _end, _start, _char, _cursor, _type;
    data.subvariables = this.set(data.subvariables, false);
    data.subvalue = this.set(data.subvalue, false);
    data.nearconstraints = 'nearconstraints' in data ? data.nearconstraints : data.subvariables ? null : data.object.constraints;
    data.end = Array.isArray(data.end) ? data.end : [];
    return new Promise(function(res,rej){
        $this.loop(function(cursor,loop){
            /**
             * (*1)Si on attend la partie droite du ternaire, on ignore la partie droite
             * Ou le ternaire principal est terminé, on ignore le reste jusqu'à la fin
             */
                _end = [')',']','}',',', ';'].indexOf(cursor.char);
                _start =  ['(', '[', '{'].indexOf(cursor.char);
            /**
             * @TRAITEMENT_DES_META_STRUCTURES (Array, JSON)
            */
            /**
             * Si on cherche des sous variables simples, 
             * on est en mode méta structure de valeur
             */
            // console.log('[SUBVARIABLES]', cursor.char,'->',$this.cursor.index);
            if(subvariables.searching && (subvariables.key != null || subvariables.searching == 1) ){
                loop.stop();
                /**
                 * La lecture lit tout une chaine de caractère avant de passer au callback
                 * Dans ce cas:
                 *  - Une chaine de caractère sera donnée dans la valeur cursor.word
                 *  - On doit le prendre en compte, sinon ça risque de causer des résultats
                 *    imprévus
                 *  - mais si cursor.word n'est pas null et n'est pas une chaine de
                 *    de caractère, on doit soulever une exception
                 */
                if(cursor.word){
                    if($this.getCodeType(cursor.word) != Synthetic.Lang.constants.STRING){
                        throw new Error("Syntax error !");
                    }
                    if(subvariables.searching == 1){
                        values[values.length - 1].value[subvariables.index] = $this.toVariableStructure(cursor.word,data.ressources.parent);
                    }
                    else{
                        values[values.length - 1].value[subvariables.key] = $this.toVariableStructure(cursor.word,data.ressources.parent);
                    }
                    subvariables.key = null;
                    subvariables.index++;
                    /**
                     * Ça peut arriver que le EOS est un espace
                     * Il faut alors trouver immédiatement le prochaine caractère
                     * non-blanc pour ne pas attendre le prochain tour de la boucle
                     */
                    $this.toNextChar().then(function(_char){
                        if( (_char == '}' && subvariables.searching == 2) || (_char == ']' && subvariables.searching == 1) ){
                            subvariables.searching = 0;
                            subvariables.key = null;
                            subvariables.index = 0;
                        }
                        loop.start();
                    });
                }
                else{
                    _cursor = $this.copy($this.cursor);
                    // console.log('[SUBVARIABLES]',data.subvariables, $this.code.substr($this.cursor.index,2));
                    $this.value({
                        object : data.object,
                        subvariables: true,
                        ressources: data.ressources,
                        ternary: data.ternary,
                        subvalue: true,
                        nearconstraints: data.object.constraints,
                        end: [constants.COMA, subvariables.searching > 1 ? constants.BRACE : constants.BRACKET]
                    }).then(function(result){
                        // console.log('[Constraints]',data.nearconstraints,_cursor);

                        if(subvariables.searching == 1){
                            values[values.length - 1].value[subvariables.index] = result;
                        }
                        else{
                            if(subvariables.key == null && result.name == null){
                                throw new Error("can't defined JSON key from null");
                            }
                            values[values.length - 1].value[subvariables.key == null ? result.name : subvariables.key] = result;
                        }
                        _char = $this.code[$this.cursor.index - 1];
                        // console.log('[SUBRESULT]',subvariables.searching,data.subvariables,'/',subvariables.searching,'/',_char,$this.cursor.index,result);
                        // console.log('[SUBRESULT]',_char,$this.cursor.index, $this.code.substr($this.cursor.index, 2),result);
                        subvariables.key = null;
                        subvariables.index++;
                        if( (_char == '}' && subvariables.searching == 2) || (_char == ']' && subvariables.searching == 1) ){
                            subvariables.searching = 0;
                            subvariables.key = null;
                            subvariables.index = 0;
                        }

                        if(_char == ';' 
                        // || ( data.subvariables && data.end.indexOf( [null,']','}',null, ';'].indexOf(_char) ) >= 0) 
                        ){
                            loop.end();
                        }
                        else{
                            if(_char == ','){
                                $this.cursor.index--;
                            }
                            loop.start();
                        }
                    });
                }
                return;
            }
            /**
             * @FIN_DE_TRAITEMENT
            */
            /**
             * Si on rencontre un caractère qui succède un non signe 
             * 1er Cas) sans aucune attente d'opérande, on met fin à la lecture 
             *          de valeur
             * 2e Cas)  si on est en attente d'une partie de ternaire 
             *          on déclenche une erreur
             * 3e Cas) Si on est en recherche de clé de DICTIONNAIRE (sous-variable)
             *         et la prochaine clé a déjà été définie, on lève une exception
             */
            // console.log('end...', _end, data.end, cursor.char, values.length, data.subvariables);
            if(
                /[\S]/.test(cursor.char) && data.end.indexOf(_end) < 0 && 
                values.length && !waitingForNextOperand && !ternaryOperator.active &&
                Synthetic.Lang.signs.indexOf(cursor.char) < 0
            ){
                if(subvariables.searching){
                    if(subvariables.key != null){
                        throw new Error($this.err("syntax error !"));
                    }
                }
                else{
                    // console.log('[end]', values, '|',cursor.char,'|',$this.code.substr($this.cursor.index,20));
                    $this.cursor.index--;
                    loop.end();
                }
            }
            /**
             * Dans la recherche des valeurs, on veut des mots, et pour chaque mot
             * non vide trouvé, on cherche son type pour le traiter soit en tant que:
             * - Littéral
             * - Nombre ou autre type de valeur
             */
            if(cursor.word && cursor.word.length){
                if($this.getCodeType(cursor.word) == Synthetic.Lang.constants.LITTERAL && !subvariables.searching ){
                    // console.log('[Litt**]');
                    //(*1)
                    if(!ternaryOperator.end && (!ternaryOperator.active || !ternaryOperator.right) ){
                        /**
                         * S'il y a une opération à faire, il faut attendre le type de la variable
                         * avant de déclencher une action appropriée
                        */
                    //    console.log('[Litt**]');
                       loop.stop();
                        $this.litteral(cursor.word, data.ressources).then(function(result){
                            values.push(result);
                            waitingForNextOperand = false;
                            loop.start();
                        });
                        return;
                    }
                }
                else{
                    // console.log('[WORD]',cursor.word);
                    var type = $this.getImplicitType(cursor.word);
                    /**
                     * S'il y a une opération à faire avant l'enregistrement de la valeur
                     * On doit avoir un nombre pour le faire sinon on lève une exception
                    */
                    if(preOperations >= 0){
                        if(type != 'Number'){
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
                        }
                        preOperations = -1;
                    }
                    //(*1)
                    if(subvariables.searching < 2 && !ternaryOperator.end && (!ternaryOperator.active || !ternaryOperator.right) ){
                        // console.log('****',cursor.word,subvariables)
                        values.push($this.toVariableStructure(cursor.word+'',data.ressources.parent));
                    }
                    waitingForNextOperand = false;
                }
            }
            //Si on voit un signe d'opération on vérifie si sa place est correcte
            if(Synthetic.Lang.signs.indexOf(cursor.char) >= 0){
                // console.log('[Values]',values,waitingForNextOperand);
                if((values.length || ternaryOperator.active) && !waitingForNextOperand){
                    /**
                     * Si c'est un '?' on prend en compte un opérateur ternaire
                     * 
                     * CAS 2:
                     * Si on est en mode recherche de sous-variable dans le même niveau d'itération
                     * on bloque les '?'
                     */
                    if(cursor.char == '?' && !subvariables.searching){
                        ternaryOperator.active++;
                        //(*1)
                        if(!ternaryOperator.end && (!ternaryOperator.active || !ternaryOperator.right) ){
                            // console.log('[CALC]',calc,values);
                            var calc = $this.calc(values).value;
                            values = [];
                            calc = ['false', false, 0, '0'].indexOf(calc) < 0;
                            if(calc){
                                // console.log('[Calc] again !', calc);
                                loop.stop();
                                $this.cursor.index++;
                                $this.value({
                                    object : data.object,
                                    subvariables: data.subvariables,
                                    ressources: data.ressources,
                                    ternary: true,
                                    subvalue: data.subvalue,
                                    end: data.end
                                }).then(function(result){
                                    values = [result];
                                    ternaryOperator.active--;
                                    ternaryOperator.right = false;
                                    ternaryOperator.end = true;
                                });
                            }
                            else{
                                ternaryOperator.right = true;
                            }
                        }
                    }
                    else if(cursor.char == ':'){
                        if(subvariables.searching){
                            subvariables.key = $this.toPrimitiveValue(values[values.length - 1]);
                            subvariables.keytype = $this.getCodeType(subvariables.key);
                            subvariables.keytype = subvariables.keytype == 0 || subvariables.keytype ==  1 ? 2 : subvariables.keytype;
                            subvariables.keytype = $this.set(Synthetic.Lang.typeFromConstants[subvariables.keytype], 'Any');
                            if(data.object.constraints && !$this.isValidateConstraint(subvariables.keytype, data.object.constraints.key)){
                                throw new Error($this.err($this.toStringTypes(data.object.constraints.key)+" key type expected, "+subvariables.keytype+" given !"));
                            }
                            /**
                             * Le type de la clé doit être soit:
                             * - String
                             * - Number
                             * - Boolean (qui sera implicitement converti en String)
                            */
                            if(['String', 'Number', 'Boolean'].indexOf(subvariables.keytype) < 0){
                                throw new Error($this.err("[String | Number] type expected, "+subvariables.keytype+" given !"))
                            }
                            values.pop();
                        }
                        else{
                            ternaryOperator.active--;
                            /**
                             * si le décompteur est négatif on vérifie si on avait
                             * demandé une partie ternaire pour terminer la partie
                             * sinon on déclenche une erreur
                            */
                            if(ternaryOperator.active == -1){
                                if(data.ternary){
                                    loop.end();
                                }
                                else{
                                    throw new Error($this.err("illegal operator sign [ "+cursor.char+"]"));
                                }
                            }
                            else if(!ternaryOperator.active == 0){
                                ternaryOperator.right = false;
                            }
                        }
                    }
                    else{
                        //(*1)
                        if(!ternaryOperator.end && (!ternaryOperator.active || !ternaryOperator.right) ){
                            values.push(cursor.char);
                        }
                        waitingForNextOperand = true;
                    }
                }
                else if(['-', '+', '++', '--'].indexOf(cursor.char) >= 0 && !subvariables.searching){
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
                }
                else{
                    // console.log('[Err]',values, subvariables);
                    throw new Error($this.err("illegal operator sign [ "+cursor.char+"]"));
                }
            }
            //Si le caractère est un caractère de fin de recherche d'instruction
            if(_end >= constants.PARENTHESE){
                // console.log('[CHAR]',cursor.char, _end, $this.cursor.index);
                if(waitingForNextOperand){
                    throw new Error($this.err("right operand expected"));
                }
                if(data.end.indexOf(_end) >= 0 || 
                    (!data.subvariables && !ternaryOperator.active && _end == constants.SEMICOLON) ||
                    (data.subvariables && (data.end.indexOf(_end) || _end == constants.SEMICOLON) )
                ){
                    $this.cursor.index++;
                    loop.end();
                }
                else if(cursor.char == '}' && subvariables.searching == 2 ){
                    // console.log('[Cool]', $this.getCodeType(cursor.word), Synthetic.Lang.constants)
                    /**
                     * Si c'est un JSON qu'on manipule, on ne prend que du littéral
                     */
                    _type = $this.getCodeType(cursor.word);
                    if(subvariables.searching == 2){
                        if(_type == Synthetic.Lang.constants.LITTERAL){
                            loop.stop();
                            $this.litteral(cursor.word, data.ressources).then(function(result){
                                /**
                                 * On vérifie d'abord que les contraintes sont respectées
                                 */
                                //TODO: Trouver où est l'erreur de l'objet synthetic null
                                console.log('[Obj]',data.object.constraints);
                                if(!$this.isValidateConstraint("String", data.object.constraints.key)){
                                    throw new Error($this.err($this.toStringTypes(data.object.constraints.key)+" key type expected, String given implicitly !"));
                                }
                                if(data.object.constraints && !$this.isValidateConstraint(result.type, data.object.constraints.value)){
                                    if(['Array', 'JSON'].indexOf(result.type) < 0 || !data.object.constraints.recursive){
                                        throw new Error($this.err($this.toStringTypes(data.object.constraints.value)+" value expected, "+result.type+" given implicitly !"));
                                    }
                                }
                                values[values.length - 1].value[result.name] = result;
                                loop.start();
                            });
                            return;
                        }
                        else if(cursor.word.length){
                            throw new Error($this.err("unexpected statements ! [ "+cursor.word+" ]"));
                        }
                    }
                    subvariables.searching = 0;
                    subvariables.key = null;
                    subvariables.index = 0;
                }
                else{
                    console.log('[data]', data.end,_end,'/', data.subvariables,'/',_end,values,subvariables);
                    throw new Error($this.err("illegal end of statement [ "+cursor.char+" ]"));
                }
            }
            if(defernow){
                defernow = false;
                $this.cursor.index--;
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
                //  console.log('[CHECK]');
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
                        //Si c'est un '('
                        (_start == constants.PARENTHESE && (
                            !values.length || Synthetic.Lang.signs.indexOf(values[values.length - 1]) >= 0)
                        ) ||
                        //Si c'est un '['
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
                        loop.stop();
                        $this.cursor.index++;
                        $this.value({
                            object : data.object,
                            subvariables: data.subvariables,
                            ressources: data.ressources,
                            ternary: data.ternary,
                            subvalue: true,
                            end: [constants.PARENTHESE]
                        }).then(function(result){
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
                    }
                    else if(_start >= constants.BRACKET && _start <= constants.BRACE && (!values.length || waitingForNextOperand) ){
                        // console.log('[CHECK]',data.nearconstraints);
                        /**
                         * Si la structure n'accepte pas d'imbrication de structure
                         * Et qu'il ne demande pas une structure comme contrainte de clé ou de valeur
                         * On soulève une exception.
                         */
                        if(data.subvariables && (data.object.constraints == null || !data.object.constraints.recursive) ){
                            throw new Error($this.err("Denied structure syntax !"));
                        }
                        _type = _start == constants.BRACKET ? 'Array' : 'JSON';
                        values.push($this.meta({
                            type: _type,
                            constraints: data.object.type == _type ? data.object.constraints : null,
                            label: 'variable',
                            value: {},
                            parent: data.ressources.parent
                        }));
                        subvariables.searching = _start == constants.BRACKET  ? 1 : 2;
                        subvariables.index = 0;
                        subvariables.key = null;
                    }
                    //Si c'est une fonction, on l'appelle comme un littéral
                    else if(values[values.length - 1]){
                        
                    }
                    //Sinon on déclenche une erreur
                    else{
                        throw new Error($this.err("illegal character [ "+cursor.char+"]"));
                    }
                }
            }
        /**
         * @FIN_DU_TRAITEMENT
         */
        }).then(function(){
            var r = $this.calc(values);
            // console.trace('-->',r);
            if(!data.subvariables && !data.subvalue && data.object.type != 'Any' && r.type != data.object.type && r.implicitType != data.object.type){
                $this.cursor = data.object.cursor;
                throw new Error($this.err(data.object.type+" value expected, "+r.implicitType+" given !"));
            }
            else if(data.subvariables && data.object.constraints && !$this.isValidateConstraint(r.type, data.object.constraints.value)){
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
 * La méthode parse est la partie principale de l'interpréteur de syntax synthétic
*/
$syl.parse = function(ressource){
    var $this = this,
        /**
         * la variable ressource contient des données importantes pour la lecture du code
         * comme par exemple le référencement du bloc de l'instruction parente
        */
        ressource = this.set(ressource,{});
    return new Promise(function(resolve, reject){
        $this.loop(function(cursor,loop){
            //S'il y a un mot trouvé, on va vérifier:
            if(cursor.word){
                // console.log('[WORD]',cursor.word);
                //S'il existe dans la liste des mots-clés réservés
                if(Synthetic.Lang.reservedKeys.indexOf(cursor.word) >= 0){
                    loop.stop();
                    $this[cursor.word](ressource).then(function(){
                        loop.start();
                    })
                    // .catch(function(e){
                    //     loop.end();
                    //     reject(e);
                    // });
                }
                //S'il est un type défini on prend on compte le type
                else if($this.types.indexOf(cursor.word) >= 0){
                    //Si aucun type n'est encore pris en compte, on passe à sa prise en compte
                    if($this.currentType == null){
                        $this.currentType = {
                            type: cursor.word,
                            constraints: null,
                            hasKeyConstraint: false,
                            saved: true,
                            hasNextType: false
                        };
                    }
                    //si le type pris en compte a des contraintes, c'est qu'il est générique
                    else if($this.currentType.constraints != null && !$this.currentType.saved && $this.hasNextType){
                        $this.currentType.constraints[!$this.currentType.hasKeyConstraints ? 'key' : 'value'].push(cursor.word);
                    }
                    //sinon il y a erreur de syntaxe
                    else{
                        throw new Error($this.err("syntax error : "+$this.currentType.type+" ... "+cursor.word));
                    }
                }
                //Sinon c'est un litéral
                else if($this.getCodeType(cursor.word) == Synthetic.Lang.constants.LITTERAL){
                    loop.stop();
                    $this.litteral(cursor.word, ressource).then(function(){
                        loop.start();
                    })
                    // .catch(function(e){
                    //     loop.end();
                    //     reject(e);
                    // });
                }
            }
            //on suggère qu'il y a un type prise en compte pour voir s'il y a généricité
            if($this.currentType != null && cursor.char == '<'){
                loop.stop();
                $this.genericType($this.currentType.type).then(function(e){
                    $this.currentType = e;
                    loop.start();
                })
                .catch(function(e){
                    loop.end();
                    reject(e);
                });
            }
        }).then(function(){
            resolve();
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
 * la méthode err permet d'avoir un affichage basic d'un code d'erreur
*/
$syl.err = function(message){
    return "ERROR at file line " + this.cursor.lines.y + " -> " +this.set(message,'');
}
/**
 * Les Méthodes suivantes sont pour la gestion des mots-clés
 */

//Portée et visiblité
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

//Référencement des objets

/**
 * la méthode save permet de sauvegarder un objet dans la mémoire du programme pour mieux le référencer
*/
$syl.save = function(objet){
    var ref = this.previousCloserRef([objet.cursor.scope, objet.cursor.index], true);
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
    for(var i in this.blocks){
        ref = i.split(',');
        if(ref[0] * 1 < cursor[0] * 1){
            if(!(ref[0] in _scopes)){
                _scopes[ref[0]] = [];
            }
            _scopes[ref[0]].push(ref[1] * 1);
            scopeList.push(ref[0] * 1);
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
            if(indexList[j] < cursor[1] * 1){
                ref = scopeList[i]+','+indexList[j];
                break;
            }
        }
        if(ref) break;
    }
    return ref == null && notNull ? '0,0' : ref;
}
/**
 * La méthode createBlock permet de créer virtuellement un block d'attachement d'objets
*/
$syl.createBlock = function(ref){
    var cursor = ref.split(',');
    var ref = cursor[0] + ',' + cursor[1];
    this.blocks[ref] = [];
    return this;
}
/**La méthode attachToCurrentBlock permet d'ajouter le reférencement-paire [x,y]
 * d'un objet en cherchant le block parent le plus proche
*/
$syl.attachToCurrentBlock = function(ref){
    var cursor = ref.split(',');
    var block = [], ref, _scopes = {}, scopeList = [], indexList = [];
    //si le scope actuel est zéro, on cherche plus, puisque la racine est [0,0]
    if(cursor[0] * 1 - 1 < 0){
        block = this.blocks['0,0'];
    }
    else{
        ref = this.previousCloserRef(cursor);
        if(ref){
            block = this.blocks[ref];
        }
    }
    block.push(ref);
    return this;
}
/**
 * La méthode getCloserStruct permet de retrouver la structure (class, mixin, enum) la plus proche en parenté
 */
$syl.getCloserStruct = function(cursor){
    var previous = this.previousCloserRef(cursor),
        object, r = null;
    if(previous == null){
        return  '0,0';
    }
    while(r==null){
        if(previous in this.modules){
            object = this.modules[previous];
            if(Synthetic.Lang.typeCreatorKeys.indexOf(object.label) >= 0){
                r = object;
                break;
            }
        }
        else{
            if(previous == '0,0'){
                break;
            }
            previous = this.previousCloserRef(previous.split(','));
        }
    }
    return r;
}

/**
 * La méthode fin permet de trouver une objet synthetic
 */
$syl.find = function(name){
    /** 
     * TODO: décommenter la boucle while et continuer la recherche des modules
     * dans chaque scope, jusqu'au scope racine si on n'y est pas encore 
     */
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
    // console.log('[Return]',r, this.modules);
    return r;
}

$syl.caller = function(callable){
    return new Promise(function(res,rej){
        
    });
}

/**
 * La méthode arguments permet de récupérer et d'inspecter les arugments d'une méthode 
 */
$syl.arguments = function(serial,ressources, calling){
    var $this = this,
        calling = $this.set(calling, false);
    return new Promise(function(res,rej){
        var _arguments = {},
            arg, index = 0;
        function resetArg(){
            var r = $this.meta({
                label: 'argument',
                type: 'Any',
                implicitType: 'Any',
                defaultValue: null
            },false);
            if(calling){
                for(var i in serial.arguments){
                    if(serial.arguments[i].index = index){
                        r = $this.copy(serial.arguments[i],true);
                        return;
                    }
                }
            }
            return r;
        }
        arg = resetArg();
        function saveArgument(cursor,loop){
            return new Promise(function(_res,_rej){
                if(cursor.char == ','){
                    if(!calling){
                        arg.index = index;
                    }
                    index++;
                    if(!calling){
                        arg.name = cursor.word;
                        _arguments[arg.name] = arg;
                    }
                    else{
                        _arguments[arg.name].value = cursor.word;
                    }
                    /**
                     * On réinitialise l'objet arg
                    */
                    arg = $this.meta({
                        label: 'argument',
                        type: 'Any',
                        implicitType: 'Any',
                        defaultValue: null
                    },false);
                    _res();
                }
                else if(cursor.char == ':'){
                    $this.cursor.index++;
                    /**
                     * Si la boucle est déjà bloquée, on ne le bloc pas à nouveau
                     */
                    $this.value({
                        object: arg,
                        subvariables: false, 
                        ressources: ressources,
                        ternary: false,
                        end: [Synthetic.Lang.constants._EOS.COMA, Synthetic.Lang.constants._EOS.PARENTHESE]
                    }).then(function(result){
                        arg.implicitType = result.implicitType;
                        arg.defaultValue = result.value;
                        arg.index = index;
                        index++;
                        arg.name = cursor.word;
                        _arguments[arg.name] = arg;
                        /**
                         * Si le caractère EOS est un ')' alors, on arrête tout
                         */
                        if($this.code[$this.cursor.index - 1] == ')'){
                            loop.end();
                            return;
                        }
                        /**
                         * On réinitialise l'objet arg
                        */
                        arg = $this.meta({
                            label: 'argument',
                            type: 'Any',
                            implicitType: 'Any',
                            defaultValue: null
                        },false);
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
                        _arguments[arg.name].value = cursor.word;
                    }
                    $this.cursor.index++;
                    $this.toNextChar().then(function(){
                        loop.end();
                    });
                }
                else{
                    throw new Error($this.err("[ "+cursor.char+" ] unexpected !"));
                }
            });
        }

        $this.loop(function(cursor,loop){
            //On cherche les mots dans les arguments
            if(cursor.word && cursor.word.length){
                if($this.types.indexOf(cursor.word) >= 0){
                    if(arg.name || calling){
                        throw new Error($this.err("invalid syntax !"));
                    }
                    arg.type = cursor.word;
                }
                else if(Synthetic.Lang.reservedKeys.indexOf(cursor.word) >= 0){
                    throw new Error($this.err("invalid syntax !"));
                }
                else{
                    arg.name = cursor.word;
                    if(['\n', ' ', ',', ':', ')'].indexOf(cursor.char) < 0){
                        throw new Error($this.err("unexpected [ "+cursor.char+"] !"));
                    }
                    if(['\n', ' '].indexOf(cursor.char) >= 0){
                        loop.stop();
                        $this.toNextChar().then(function(_char){
                            saveArgument({char:_char, word: cursor.word}, loop, true).then(function(){
                                loop.start();
                            });
                        });
                        return;
                    }
                    loop.stop();
                    saveArgument(cursor,loop).then(function(){
                        loop.start();
                    })
                }
            }
        })
        .then(function(){
            res(_arguments);
        })
    });
}

/***
 * La méthode method permet la sérialization d'une fonction ou d'une méthode
 */
$syl.method = function(serial,ressources){
    var $this = this;
    return new Promise(function(res,rej){
        var savingArg = false;
        serial.label = 'method';
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
                $this.arguments(serial,ressources)
                .then(function(arg){
                    serial.arguments = arg;
                    if($this.code[$this.cursor.index] == '{'){
                        serial.braced = true;
                    }
                    serial.scopeCursor = $this.cursor;
                    serial.begin = $this.cursor.index;
                    loop.start();
                });
                return;
            }
            if(serial.braced){
                if(cursor.char == '{'){brace++;}
                if(cursor.char == '}'){
                    brace--;
                    if(brace < 0){
                        serial.end = $this.cursor.index;
                        loop.end();
                    }
                }
            }
        });
    });
}
/**
 * La méthode littéral permet de définir si le littéral en cours sera soit :
 *  - la déclaration d'une variable, 
 *  - l'appelation d'une fonction haut niveau
 *  - la déclaration d'une fonction
*/
$syl.litteral = function(litteral,ressources){
    var $this = this,
        type = this.getType(),
        syntObject = $this.find(litteral),
        exist = syntObject != null,
        serial = this.meta({
            type: type.type,
            parent: this.set(ressources.parent,null),
            constraints: type.constraints,
            label: 'variable', //le type de notation: par exemple : mixin, variable
            name: litteral, //le nom du notation: par exemple : nomVariable
            visible: this.access.export,
            parent: this.set(ressources.parent,null)
        }),
        resultValue = exist ? syntObject :null;
        previous = this.getCloserStruct([serial.cursor.scope,serial.cursor.index]);
    return new Promise(function(res,rej){
        $this.loop(function(cursor,loop){
            loop.stop();
            $this.toNextChar().then(function(_char){
                cursor.index = $this.cursor.index;
                cursor.char = _char;
                // console.log('[Char]',_char);
                //Si on a un opérateur '=', on passe à une affectation
                if(cursor.char == '='){
                    if(exist){
                        throw new Error($this.err("trying to override defined object [ "+litteral+"]"));
                    }
                    $this.cursor.index++;
                    // console.log('[Serial]',litteral,serial);
                    // loop.stop();
                    $this.value({
                        object: serial, 
                        subvariables: false, 
                        ressources:ressources,
                        ternary: false
                    }).then(function(result){
                        $this.extendElse(serial, result)
                        // console.log('[LITTERAL] result', serial, '/', result);
                        serial.implicitType = result.implicitType;
                        // console.log('[cursor]',serial);
                        resultValue = serial;
                        loop.end();
                    });
                }
                //Si on a le caractère '(' on passe à l'appelation d'une fonction
                else if(cursor.char == '('){
                    /**
                     * Si la variable resultValue n'est pas nulle, c'est lui
                     * le serial à présent
                     */
                    serial = resultValue == null ? resultValue : serial;
                    if(Synthetic.Lang.nativeFunctions.indexOf(serial.name) >= 0){
                        console.log('[NATIVE]');
                    }
                    else{
                        $this.method(serial,ressources).then(function(){
                            loop.start();
                        });
                    }
                    // console.log('[Serial]',serial,ressources);
                    // $this.caller()
                }
                //Si on tente l'accès à un variable
                else if(cursor.char == '['){
                    if(!exist && resultValue == null){
                        throw new Error($this.err("[ "+cursor.char+" ] unexpected !"));
                    }
                    resultValue = syntObject;
                    // console.log('[result]',resultValue);
                    $this.cursor.index++;
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
                        loop.start();
                    });
                }
                else{
                    resultValue = resultValue == null ? $this.find(litteral) : resultValue;
                    if(!exist){
                        throw new Error($this.err("[ "+litteral+" ] is undefined !"));
                    }
                    $this.cursor.index--;
                    loop.end();
                }
            });
        }).then(function(){
            res(resultValue);
        });
    });
}
//Structures

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
                $this.attachToCurrentBlock(serial.ref).createBlock(serial.ref);
                // console.log('753::[Blocks]',$this.blocks);
                loop.stop();
                $this.cursor.index++;
                Synthetic.Lang.scope++;
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
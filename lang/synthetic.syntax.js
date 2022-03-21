
/**
 * @auteur: Superga
 * @version: 8.0.0
 * @description: Synthetic language web compilator
 * @lang: french
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
        TYPE: 7
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
 * la méthode copy permet de copier les données sérialisables d'un objet itérable
*/
$syl.copy = function(e){
    return JSON.parse(JSON.stringify(e));
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
        wrapper;
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
            wrapper = {
                quote: 0,
                simple_quote: 0,
                last_char: '',
                comment: 0,
                regex: 0
            };
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
                if(!wrapper.quote && !wrapper.simple_quote){
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
                }
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
 * La méthode read permet de lire le contenu un fichier. Elle retourne son contenu
 */
$syl.read = function(filename){
    var $this = this;
    return new Promise(function(resolve,reject){
        if(node_env){
            Synthetic.Lang.xhr.readFile(filename, 'utf-8', function(err,content){
                if(err) throw err;
                $this.code = content;
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
        }, lastword = null;

        function savetype(){
            var r = false;
            if(lastword != null && type.constraints != null){
                r = true;
                type.constraints[type.hasKeyConstraint || _dictMod ? 'value' : 'key']
                .push(typeof lastword == 'string' ? {
                    type: lastword,
                    constraints: null
                } : lastword);
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
                    if(typeof lastword == 'string'){
                        loop.stop();
                        $this.genericType(lastword).then(function(e){
                            lastword = e;
                            loop.start();
                        }).catch(function(e){
                            loop.end();
                            rej(e);
                        })
                    }
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
                        console.log(type.constraints, _dictMod)
                        throw new Error($this.err("illegal character [ , ]"));
                    }
                }
                //Dès qu'on rencontre le caractère '>', on arrête tout puis on résout la promesse
                else if(cursor.char == '>'){
                    //Aucune généricité ne peut être vide
                    if(!savetype()){
                        throw new Error($this.err("illegal expression [ "+cursor.char+" ]"));
                    }
                    type.saved = true;
                    loop.end();
                    $this.cursor.index++;
                    res(type);
                }
            }
            //sinon il y a erreur de syntaxe
            else if($this.currentType.constraints != null && $this){
                console.log('[Current]', $this.cursor.scope, Synthetic.Lang.scope, cursor.word, $this.cursor.index, cursor.index);
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
 * La méthode toNativeValue permet d'avoir en mémoire les valeurs synthétiques 
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
 * La méthode calc permet de simplifier une opération complexe en une seule valeur
*/
$syl.calc = function(list){
    if(list.length == 1){
        return list[0];
    }
    var $this = this,
        compute = {
        "+": function(a,b){
            return $this.toPrimitiveValue(a) + $this.toPrimitiveValue(b);
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
                        type: $this.getImplicitType(result),
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
     * {object,subvariables,ressources,ternary,subvalue, endbracket}
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
        defernow = false;
    data.subvariables = this.set(data.subvariables, false);
    data.subvalue = this.set(data.subvalue, false);
    data.endbracket = this.set(data.endbracket, 0);
    return new Promise(function(res,rej){
        $this.loop(function(cursor,loop){
            /**
             * (*1)Si on attend la partie droite du ternaire, on ignore la partie droite
             * Ou le ternaire principal est terminé, on ignore le reste jusqu'à la fin
             */

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
            if(['(','['].indexOf(cursor.char) >= 0){
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
                        (cursor.char == '(' && (
                            !values.length || Synthetic.Lang.signs.indexOf(values[values.length - 1]) >= 0)
                        ) ||
                        //Si c'est un '['
                        (cursor.char == '[' && 
                            values.length && Synthetic.Lang.signs.indexOf(values[values.length - 1]) < 0
                        )
                    ){
                        /**
                         * Si on prend en compte le '[' et que la valeur précédente n'est pas
                         * une chaine de caractère ou tableau, on soulève une erreur
                         */
                        if(cursor.char == '[' && ['String','Array'].indexOf($this.getType(values[values.length - 1])) < 0){
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
                            endbracket: cursor.char == '['
                        }).then(function(result){
                            if(cursor.char == '['){
                                var val = $this.toPrimitiveValue(values[values.length - 1])[result.value];
                                values[values.length - 1].type = $this.getImplicitType(val);
                                values[values.length - 1].value = val;
                                console.log('[VAL]',val, values);
                            }
                            else{
                                values.push(result);
                            }
                            waitingForNextOperand = false;
                            loop.start();
                        });
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
            else if(cursor.char == ')'){
                if(data.subvalue){
                    $this.cursor.index++;
                    loop.end();
                }
                else{
                    throw new Error($this.err("illegal character [ "+cursor.char+"]"));
                }
            }
    /**
     * @FIN_DU_TRAITEMENT
     */
            /**
             * Si on rencontre un caractère qui succède un non signe sans aucune
             * attente d'opérande, on met fin à la lecture de valeur
             * ou on déclenche une erreur si on est en attente d'une partie de ternaire
             */
            if(
                [' ', ';'].indexOf(cursor.char) < 0 && 
                values.length && !waitingForNextOperand && !ternaryOperator.active &&
                Synthetic.Lang.signs.indexOf(cursor.char) < 0
            ){
                console.log('[end]', values, cursor.char);
                $this.cursor.index--;
                loop.end();
            }
            if(cursor.word && cursor.word.length){
                if($this.getCodeType(cursor.word) == Synthetic.Lang.constants.LITTERAL){
                    console.log('[Litt]')
                    //(*1)
                    if(!ternaryOperator.end && (!ternaryOperator.active || !ternaryOperator.right) ){
                        /**
                         * S'il y a une opération à faire, il faut attendre le type de la variable
                         * avant de déclencher une action appropriée
                        */
                        $this.litteral(cursor.word, data.ressources).then(function(result){
                            values.push(result);
                            waitingForNextOperand = false;
                        });
                    }
                }
                else{
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
                    if(!ternaryOperator.end && (!ternaryOperator.active || !ternaryOperator.right) ){
                        values.push($this.meta({
                            label: 'variable',
                            type: type,
                            value: cursor.word+'',
                            parent: data.ressources.parent
                        }));
                    }
                    waitingForNextOperand = false;
                }
            }
            //Si on voit un signe d'opération on vérifie si sa place est correcte
            if(Synthetic.Lang.signs.indexOf(cursor.char) >= 0){
                // console.log('[Values]',values,waitingForNextOperand);
                if((values.length || ternaryOperator.active) && !waitingForNextOperand){
                    //Si c'est un '?' on prend en compte un opérateur ternaire
                    if(cursor.char == '?'){
                        ternaryOperator.active++;
                        //(*1)
                        if(!ternaryOperator.end && (!ternaryOperator.active || !ternaryOperator.right) ){
                            // console.log('[CALC]',calc,values);
                            var calc = $this.calc(values).value;
                            values = [];
                            calc = ['false', false, 0, '0'].indexOf(calc) < 0;
                            if(calc){
                                console.log('[Calc] again !', calc);
                                loop.stop();
                                $this.cursor.index++;
                                $this.value({
                                    object : data.object,
                                    subvariables: data.subvariables,
                                    ressources: data.ressources,
                                    ternary: true,
                                    subvalue: data.subvalue,
                                    endbracket: data.endbracket
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
                    else{
                        //(*1)
                        if(!ternaryOperator.end && (!ternaryOperator.active || !ternaryOperator.right) ){
                            values.push(cursor.char);
                        }
                        waitingForNextOperand = true;
                    }
                }
                else if(['-', '+', '++', '--'].indexOf(cursor.char) >= 0){
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
                    console.log('[Err]',values);
                    throw new Error($this.err("illegal operator sign [ "+cursor.char+"]"));
                }
            }
            if(cursor.char == ';'){
                if(waitingForNextOperand){
                    throw new Error($this.err("right operand expected"));
                }
                if(!data.subvariables && !ternaryOperator.active){
                    loop.end();
                }else{
                    throw new Error($this.err("illegal end of statement [ ; ]"));
                }
            }
            if(defernow){
                defernow = false;
                $this.cursor.index--;
            }
        }).then(function(){
            var r = $this.calc(values);
            console.log('[Result]',r);
            res(r);
        })
    })
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
                    }).catch(function(e){
                        loop.end();
                        reject(e);
                    });
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
                    }).catch(function(e){
                        loop.end();
                        reject(e);
                    });
                }
            }
            //on suggère qu'il y a un type prise en compte pour voir s'il y a généricité
            if($this.currentType != null && cursor.char == '<'){
                loop.stop();
                $this.genericType($this.currentType.type).then(function(e){
                    $this.currentType = e;
                    loop.start();
                }).catch(function(e){
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
    this.modules[objet.cursor.scope+","+objet.cursor.index] = objet;
    Synthetic.Lang.objects[objet.addr] = objet;
    // if(objet.visible){
    //     this.exportables[objet.name] = objet;
    // }
}
/**
 * la méthode parent permet de retrouver l'étendue parente d'une instruction
*/
$syl.previousCloserRef = function(cursor){
    var scopeList = [], indexList = [], ref = null, _scopes = {};
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
    return ref;
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
 * La méthode littéral permet de définir si le littéral en cours sera soit :
 *  - la déclaration d'une variable, 
 *  - l'appelation d'une fonction haut niveau
 *  - la déclaration d'une fonction
*/
$syl.litteral = function(litteral,ressources){
    var $this = this,
        type = this.getType(),
        serial = this.meta({
            type: type.type,
            parent: this.set(ressources.parent,null),
            constraints: type.constraints,
            label: 'variable', //le type de notation: par exemple : mixin, variable
            name: litteral, //le nom du notation: par exemple : nomVariable
            visible: this.access.export
        });
        previous = this.getCloserStruct([serial.cursor.scope,serial.cursor.index]);
    return new Promise(function(res,rej){
        $this.loop(function(cursor,loop){
            if(cursor.char != ' '){
                //Si on a un opérateur '=', on passe à une affectation
                if(cursor.char == '='){
                    $this.cursor.index++;
                    loop.stop();
                    $this.value({
                        object: serial, 
                        subvariables: false, 
                        ressources:ressources,
                        ternary: false
                    }).then(function(result){
                        loop.start();
                    });
                }
                //Si on a le caractère '(' on passe à l'appelation d'une fonction
                else if(cursor.char == '('){

                }
            }
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
                console.log('753::[Blocks]',$this.blocks);
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
        }).catch(function(e){
            reject(e);
        });
    });
}
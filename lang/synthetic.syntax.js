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
    baseType : ['Any', 'String', 'Number', 'JSON', 'Array', 'Boolean', 'RegExp', 'Function', 'External'],
    breakableKeys : ['return', 'break'],
    callAsMethodKeys : ['mixin', 'function'],
    privatisableKeys : ['mixin', 'unused', 'final', 'class', 'interface', 'abstract', 'static'],
    finalizableKeys : ['mixin', 'class'],
    typeCreatorKeys : ['mixin', 'class', 'interface'],
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
    EOS : [' ', '\n', '\t', ';',',','(','[','{','.', ':','+','-','/','=','~','*','%', '<'],
    xhr: null,
    definedAddr : [],
    objects: {}
};

var node_env = typeof module == 'object' && 'exports' in module;
Synthetic.Lang.xhr = node_env ? require('fs') : new XMLHttpRequest();
if(node_env){
    module.exports = Synthetic;
}

Synthetic.Class = function(){
    this.code = '';
    this.modules = {};
    this.exportables = {};
    this.scopes = [];
    this.currentStructure = {};
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
$syl.meta = function(options){
    var result = this.extend({
        cursor: {
            lines : {
                x: this.cursor.lines.x,
                y: this.cursor.lines.y
            },
            scope: this.cursor.scope,
            index : this.cursor.index
        },
        type: null, // le type de valeur: par exemple : Any, Number, String
        label: null, //le type de notation: par exemple : mixin, variable
        name: null, //le nom du notation: par exemple : nomVariable
        visible: false, //Le module sera visible ou pas
        origin: null,//this.realpath, //Le chemin absolu dans lequel se trouve le module
        typeData: null, //les constraintes sur les valeurs
        addr: this.addr()
    }, options);
    this.resetAccess();
    return result;
}
/**
 * la fonction loop permet de parcourir une boucle de façon compatible à l'asynchrone
*/
$syl.loop = function(callback,cursor){
    var $this = this,
        cursor = typeof cursor == 'number' ? cursor : $this.cursor.chars,
        _break = false, word = '',
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
            var findEOS = false;
            while(cursor < len && !_break){
                if($this.code[cursor] == '\n'){
                    $this.cursor.lines.y++;
                    $this.cursor.lines.x = 0;
                }
                if($this.code[cursor] == '{'){
                    $this.cursor.scope++;
                }
                if($this.code[cursor] == '}'){
                    $this.cursor.scope--;
                }
                findEOS = Synthetic.Lang.EOS.indexOf($this.code[cursor]) >= 0;
                if(!findEOS){
                    word += $this.code[cursor];
                    // console.log('[Word]',word);
                }
                // if(findEOS) console.error('Here !', code[cursor], word);
                callback($this.code[cursor], findEOS ? word : null, cursor, start, stop, end);
                if(findEOS) word = '';
                if(_break) break;
                if($this.code[cursor] != '\n'){
                    $this.cursor.lines.x++;
                }
                $this.cursor.index++;
                cursor = $this.cursor.index;
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
 * La méthode parse est la partie principale de l'interpréteur de syntax synthétic
*/
$syl.parse = function(){
    var $this = this;
    return new Promise(function(resolve, reject){
        $this.loop(function(char,word,index,start,stop,end){
            //S'il y a un mot trouvé, on va vérifier:
            if(word){
                //S'il existe dans la liste des mots-clés réservés
                if(Synthetic.Lang.reservedKeys.indexOf(word) >= 0){
                    stop();
                    $this[word]().then(function(){
                        start();
                    });
                }
                //S'il est un type défini
                else if(Synthetic.Lang.definedTypes.indexOf(word) >= 0){

                }
                //Sinon c'est un litéral
                else{

                }
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
    if(!(objet.cursor.scope in this.scopes)){
        this.scopes[objet.cursor.scope] = [];
    };
    this.scopes[objet.cursor.index];
    if(objet.visible){
        this.exportables[objet.name] = objet;
    }
}
/**
 * la méthode parent permet de retrouver l'étendue parente d'une instruction
*/
$syl.parent = function(scope,index){
    var scopeList = [], indexList = [], found = false, r = null;
    for(var i in this.scopes){
        scopeList.push(i * 1);
    }
    scopeList.sort();
    
}

//Structures

/**
 * la méthode class permet de sérialiser le syntax en données simples et manipulables
 */
$syl.class = function(){
    this.accessErr("protected", "class");
    var $this = this,
        serial = this.meta({
            label: 'class',
            visible: !this.access.private,
            static: this.access.static,
            abstract: this.access.abstract,
            final: this.access.final,
            superclass: [],
            supertypes: [],
            methods: [],
            attributes: [],
            value: {}
        });
    return new Promise(function(resolve, reject){
        $this.loop(function(char,word,index,start,stop,end){
            if(word && word.length){
                if(serial.name == null){
                    serial.name = word;
                    serial.type = word;
                    serial.supertypes.push(word);
                }
                // console.log('[Word]',word, char,);
            }
            if(char == '{'){
                serial.cursor.chars = index;
                serial.cursor.scope = $this.cursor.scope - 1;
                serial.cursor.lines = {
                    x : $this.cursor.lines.x,
                    y : $this.cursor.lines.y,
                };
            }
        }).then(function(){
            console.log('[Meta]',serial);
            resolve();
        }).catch(function(e){
            reject(e);
        });
    });
}
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
         'else', 'while', 'loop', 'return', 'break','continue','try','catch', 'mixin', 'use',
         'extends', 'with', 'require', 'slimPhase', 'private','unused', 'const',
         'unset', 'export','upper','root','external', 'async', 'return', 'label',
         'for', 'while', 'loop', 'override', 'switch','case','default', 'strict_mode',
         'final', 'invoke', 'reset', 'await', '@MixinActing', '@SyncBlockRender',
         'class', 'interface', 'trait', 'protected', 'this','super', 'abstract', 'static',
         'toString','implements','null','callable','run'
     ],
     valuableReservedKeys: ['return'],
     lazyKeys : ['import', 'from', 'include'],
     baseType : ['Object','Any', 'String', 'Number', 'JSON', 'Array', 'Boolean', 'Regex', "SML"],
     breakableKeys : ['return', 'break'],
     scopeSniper: ['root', 'upper'],
     callAsMethodKeys : ['mixin', 'function'],
     privatisableKeys : ['mixin', 'unused', 'final', 'class', 'interface', 'abstract', 'static'],
     finalizableKeys : ['mixin', 'class'],
     typeCreatorKeys : ['mixin', 'class', 'interface', 'enum','type'],
     megaStructureKeys : ['class', 'interface', 'trait', 'enum'],
     typeBehinAcceptionKeys : ['with'],
     nativeFunctions : [
         'print','split', 'typeof', 'replace', 'lower', 'maj', 'len',
         'tap', 'push','pop','shift', 'sort','reverse',
         'round','max','min', 'floor','ceil','abs', 'pow', 'join',
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
         "filter": "Array", "join": "String", "platform": "String", "tap" : "String",
         "push": "Any","debug": "Any"
     },
     definedTypes: [],
     blockEOS : ['}',')'],
     EOS : [' ', '\n', '\t', ';',',','(', ')','[', ']','{', '}','.', '?', ':','+','-','/','=','~','*','%', '<', '>', '|', '&', '"', "'", '!'],
     xhr: null,
     definedAddr : [],
     objects: {},
     operators : ['+','-','*','/','%','~'],
     signs : ['+','-','*','/','%','~','<','>', '&', '|','=','!','++', '--', '?', ':', '&&', '||', '>=', '<=', '==', '!=','===', '!==='],
     doubleSigns: ['++', '--', '&&', '||', '>=', '<=', '==', '!=', '+=', '-=', '*=', '/=', '~=','%='],
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
                 end: [')',']','}',',', ';', ':', '|'],
             },
             PARENTHESE: 0,
             BRACKET: 1,
             BRACE: 2,
             COMA: 3,
             SEMICOLON: 4,
             ELSE: 5,
             OR: 6
         },
         LOOP: {
             LOOP: 0,
             WHILE: 1,
             FORIN: 2,
             FOR: 3
         }
     },
     typeFromConstants: {
         0: 'Any',
         2: 'String',
         3: 'Number',
         4: 'Boolean',
         5: 'Regex',
         Any: 'Any',
         String: 'String',
         Number: 'Number',
         Boolean: 'Boolean',
         Regex: 'Regex',
         Array: 'Array',
         JSON: 'JSON',
         Object: 'Object',
         SML: 'SML'
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
     this.types = [];
     this.variableType = [];
     this.code = '';
     this.file = '';
     this.linesEnd = [];
     this.lastIndex = {
         scope: -1,
         line: -1
     };
     this.modules = {};
     this.scopeSaver = {};
     this.objectAddrSaver = {};
     this.structureSaver = {current: {}, old: {}};
     this.currentScope = this.addr();
     this.rootScope = this.currentScope;
     this.currentObjectAddr = null;
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
       export: false,
       const: false,
       override: false
     };
     this.modules[this.currentScope] = {
         parent: null,
         modules: {}
     }
     /**
     * On va définir les types de bases en étant des objects synthetic
     * si ce n'est pas encore fait
     */
     var r, defineBase = typeof Synthetic.Lang.baseType[0] == 'string',
         objectaddr;
     for(var i in Synthetic.Lang.baseType){
         r = typeof Synthetic.Lang.baseType[i] == 'object' ?
             Synthetic.Lang.baseType[i] :
                 this.meta({
                 type: Synthetic.Lang.baseType[i],
                 label: 'type',
                 native: true,
                 name: Synthetic.Lang.baseType[i],
                 visible: true,
                 origin: null,
                 callable: false,
                 supertypes: objectaddr ? [objectaddr] : [],
                 value: {
                     type: this.meta({
                         type: Synthetic.Lang.baseType[i],
                         label: 'type',
                         value: Synthetic.Lang.baseType[i]
                     },false)
                 }
             });
         if(Synthetic.Lang.baseType[i] == 'Object'){
            objectaddr = r.addr;
         }
         if(defineBase){
             Synthetic.Lang.baseType[i] = r;
         }
         else{
             this.save(r);
         }
         this.types.push(r.name);
     }
     if(defineBase){
         for(var i in Synthetic.Lang.typeFromConstants){
             Synthetic.Lang.typeFromConstants[i] = this.getBaseType(Synthetic.Lang.typeFromConstants[i]);
         }
     }
 }
 
 var $syl = Synthetic.Class.prototype;
 
 /**
  * la méthode addr crée aléatoirement des adresses pour les objets pour l'optimisation et référencements des objets
 */
 $syl.addr = function(){
     var r = '0x',
         max = Math.round(Math.random() * 10),
         hexa = ['a','b','c','d','e','f'];
     do{
         for(var i = 0; i <= max; i++){
             r += Math.round(Math.random() * 1) ? hexa[Math.floor(Math.random() * hexa.length)] : Math.round(Math.random() * 7) + 3;
         }
     }while(Synthetic.Lang.definedAddr.indexOf(r) >= 0);
     Synthetic.Lang.definedAddr.push(r);
     return r;
 }
 $syl.isAddr = function(val){
    return /^0x[a-z0-9]+$/.test(val);
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
 $syl.garbage = function(more,block){
     var addr = [],
         block = this.set(block, null),
         more = this.set(more, false);
    for(var i in this.modules){
        if(block){
            i = block;
        }
        if(!(i in this.modules)){
            continue;
        }
        if(null in this.modules[i].modules){
            // console.log('[Modules]',this.modules[i].modules[null]);
            addr.push(this.modules[i].modules[null].addr);
            this.freeLinkOf(this.modules[i].modules[null]);
            delete this.modules[i].modules[null];
        }
        /**
         * Si on en demande plus comme :
         *  * la suppression des variables non-existantes
         */
        if(more){
            for(var j in this.modules[i].modules){
                /**
                 * Les variables qui ont été comme non-existant doivent être supprimées !
                 */
                if(
                    (this.modules[i].modules[j].label == 'variable' && !('value' in this.modules[i].modules[j]) ) 
                    // ||
                    // (i != this.rootScope && this.modules[i].modules[j].linked == 0)
                ){
                    // console.log('[I]', this.modules[i].modules[j].name)
                    addr.push(this.modules[i].modules[j].addr);
                    this.freeLinkOf(this.modules[i].modules[j]);
                    delete this.modules[i].modules[j];
                }
                else if(i != this.rootScope && this.modules[i].modules[j].linked == 0){
                    // console.log('[I]', this.modules[i].modules[j].name)
                    // addr.push(this.modules[i].modules[j].addr);
                    // this.freeLinkOf(this.modules[i].modules[j]);
                    // delete this.modules[i].modules[j];
                }
            }
        }
        if(block){
            break;
        }
     }
     for(var i in addr){
         delete Synthetic.Lang.objects[addr[i]];
     }
     if(block && block in this.modules && this.len(this.modules[block].modules) == 0){
        delete this.modules[block];
     }
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
 $syl.convert = function(){
    var $this = this;
    return {
        hexa: {
            alpha: ['a','b','c','d','e','f'],
            check: function(e){
                return /^[0-1]x[a-z0-9]+$/.test(e);
            },
            from: function(e){
                var r = 0;
                for(var i = 2, j = e.length; i < j; i++){
                    r += (this.alpha.indexOf(e[i]) >= 0 ? 10 + this.alpha.indexOf(e[i]) : parseInt(e[i])) * Math.pow(16,j - 1 - i);
                }
                return r * (e[0] == '1' ? -1 : 1);
            },
            to: function(e){
                var r = '',mod,
                    pref = e < 0 ? '1x' : '0x';
                    e = Math.abs(e);
                do{
                    mod = e % 16;
                    e = Math.floor(e / 16);
                    r = (mod < 10 ? mod : this.alpha[mod - 10])+r;
                    if(e < 16){
                        r = (e < 10 ? e : this.alpha[e - 10])+r;
                    }
                }while(e >= 16);
                return pref+r;
            },
            parse: function(a,b){
                var convert = this.check(a.value) || this.check(b.value)
                if(!convert){
                    return null;
                }
                var a = $this.copy(a),
                    b = $this.copy(b);
                a.value = this.check(a.value) ? this.from(a.value) : a.value;
                b.value = this.check(b.value) ? this.from(b.value) : b.value;
                return [a,b];
            },
            "+": function(a,b){
                var r = this.parse(a,b);
                return !r ? r : this.to($this.toPrimitiveValue(r[0]) + $this.toPrimitiveValue(r[1]));
            },
            '-': function(a,b){
                var r = this.parse(a,b);
                return !r ? r : this.to($this.toPrimitiveValue(r[0]) - $this.toPrimitiveValue(r[1]));
            },
            '*': function(a,b){
                var r = this.parse(a,b);
                return !r ? r : this.to($this.toPrimitiveValue(r[0]) * $this.toPrimitiveValue(r[1]));
            },
            '/': function(a,b){
                var r = this.parse(a,b);
                return !r ? r : this.to($this.toPrimitiveValue(r[0]) / $this.toPrimitiveValue(r[1]));
            },
            '~': function(a,b){
                var r = this.parse(a,b);
                return !r ? r : this.to(Math.ceil($this.toPrimitiveValue(r[0]) / $this.toPrimitiveValue(r[1])));
            },
            '%': function(a,b){
                var r = this.parse(a,b);
                return !r ? r : this.to($this.toPrimitiveValue(r[0]) % $this.toPrimitiveValue(r[1]));
            }
        }
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
         type: Synthetic.Lang.typeFromConstants.Any.addr, 
         implicitType: null,
         labelConstraint: null,
         typeOrigin: null,
         constraints: null,
         native: false,
         static: false,
         async: false,
         final: this.access.final,
         constant: this.access.const,
         ref: this.cursor.scope+','+this.cursor.index,
         label: null, 
         name: null, 
         visible: this.access.export, 
         origin: this.file,
         addr: this.addr(),
         linked: 0,
         following: [],
         parentScope: this.currentScope
     }, options, true),
     autosave = this.set(autosave,true);
     result.implicitType = result.implicitType == null ? result.type : result.implicitType;
     this.resetAccess();
     this.currentType = null;
     this.previousReason = null;
     this.currentSwitchReference = null;
     if(autosave) this.save(result);
     return result;
 }
 /**
  * la fonction loop permet de parcourir une boucle de façon compatible à l'asynchrone
 */
 $syl.runner = function(callback,cursor,stringless){
     var $this = this,
         cursor = typeof cursor == 'number' ? cursor : $this.cursor.index,
         _break = false, _end = false, word = '',
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
             if(_end) return;
             _break = false;
             if($this.code[cursor] != '\n'){
                 $this.cursor.lines.x++;
             }
             
             
             cursor = $this.cursor.index;
             until();
         }
         /**
          * la fonction en est l'équivalent de l'instruction break pour la boucle asynchrone
          */
         function end(){
             _break = true;
             _end = true;
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
                         
                         
                             $this.cursor.lines.y++;
                             $this.cursor.lines.x = 0;
                             if(wrapper.comment == 1){
                                 wrapper.comment = 0;
                             }
                         
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
                     case '\\': 
                         if(!wrapper.quote && !wrapper.simple_quote && !wrapper.comment && !wrapper.regex){
                             $this.exception($this.err("illegal character [ \\ ]"),true);
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
                             if($this.cursor.scope < 0){
                                 console.log('[Error SRC]',$this.executing, $this.code.substr($this.cursor.index-10, 20));
                                 $this.exception($this.err("illegal char [ "+$this.code[cursor]+" ]"),true)
                             }
                             
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
                 if(!wrapper.comment && !wrapper.simple_quote && !wrapper.quote && !wrapper.regex 
                     && !/[a-z0-9.?:;<>!=&|+*~/%_\[\])"', \n({}-]/i.test($this.code[cursor])){
                     $this.exception($this.err("illegal char [ "+$this.code[cursor]+" ]"),true)
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
                     
                 }
 
                 if(!findEOS && !wrapper.comment){
                     word += $this.code[cursor];
                 }
                 
                 
                 if(!wrapper.quote && !wrapper.simple_quote && !wrapper.comment){
                     var _data = {
                         char: doubleSigns ? tripleSigns ? $this.code.substr(cursor-2, 3) : $this.code.substr(cursor-1,2) : $this.code[cursor],
                         word: findEOS ? word : null, 
                         index: cursor
                     };
                     callback(_data, 
                     {
                         start: start, 
                         stop: stop, 
                         end: end,
                         rollback: rollback,
                         reset: function(){
                             word = '';
                         }
                     });
                         
                 }
                 /**
                  * On parre à l'éventualité que le curseur pourrait être mise à jour dans
                  * l'exécution du callback, alors, il faut mettre aussi à jour toutes
                  * les variables qui en dépendent
                  */
                 cursor = $this.cursor.index;
                 if(findEOS) word = '';
                 findEOS = !wrapper.quote && !wrapper.simple_quote && !wrapper.comment && Synthetic.Lang.EOS.indexOf($this.code[cursor]) >= 0;
                 
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
                 if($this.cursor.scope != 0){
                     
                 }
                 resolve();
             }
         }
         until();
     });
 };
 /**
  * La méthode wait permet de parcourir une liste de façon asynchrone
  */
 $syl.wait = function(list, callback){
     var indexes = [],
         k = 0;
     for(var i in list){
         indexes.push(i);
     }
     function end(){
        k = indexes.length;
        until();
     }
     function until(){
         if(k < indexes.length && k >= 0){
             callback(list[indexes[k]], indexes[k], k, indexes.length - k, until, end);
         }
         else{
             return;
         }
         k++;
     }
     until();
 }
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
                     this.saveLines();
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
 /**
  * La méthode setScope permet de réécrire le scope actuel en un autre
  * tout en sauvegardant l'actuel scope en donnant la clé qui permettra de 
  * le restaurer plus tard
  */
 $syl.setScope = function(scope){
     var len = this.saveScope(typeof scope != 'number');
     if(typeof scope == 'string'){
         this.currentScope = scope;
     }
     else{
         this.cursor.scope = scope;
     }
     return len;
 }
 /**
  * La méthode saveScope permet de sauvegarder l'actuel scope tout en permettant de
  * le restaurer plus tard en retournant la clé pour ce faire
  */
 $syl.saveScope = function(blockinstead){
     var len = this.len(this.scopeSaver),
         blockinstead = this.set(blockinstead, false);
     while(len in this.scopeSaver){
         len++;
     }
     this.scopeSaver[len] = blockinstead ? this.currentScope : this.cursor.scope;
     return len;
 }
 /**
  * La méthode restoreScope permet de restaurer la scope répondant à la clé qui lui
  * est passée en paramètre
  */
 $syl.restoreScope = function(index){
     var list = Array.isArray(index) ? index : [index];
     for(var i = list.length - 1; i >= 0; i--){
         index = list[i];
         if(index in this.scopeSaver){
             
             if(typeof this.scopeSaver[index] != 'number'){
                 this.currentScope = this.scopeSaver[index];
             }
             else{
                 this.cursor.scope = this.scopeSaver[index];
             }
             delete this.scopeSaver[index];
         }
     }
     return this;
 }
 /**
  * La méthode saveObjectAddr permet de sauvegarder l'actuel adresse d'objet tout en permettant de
  * le restaurer plus tard en retournant la clé pour ce faire
  */
 $syl.saveObjectAddr = function(){
     var len = this.len(this.objectAddrSaver);
     while(len in this.objectAddrSaver){
         len++;
     }
     this.objectAddrSaver[len] = this.currentObjectAddr;
     return len;
 }
 /**
  * La méthode setObjectAddr permet de réécrire l'adresse d'object actuel en un autre
  * tout en sauvegardant l'actuel adresse d'objet en donnant la clé qui permettra de 
  * le restaurer plus tard
  */
 $syl.setObjectAddr = function(addr){
     var len = this.saveObjectAddr();
     this.currentObjectAddr = addr;
     return len;
 }
 /**
  * La méthode restoreScope permet de restaurer la scope répondant à la clé qui lui
  * est passée en paramètre
  */
 $syl.restoreObjectAddr = function(index){
     var list = Array.isArray(index) ? index : [index];
     for(var i = list.length - 1; i >= 0; i--){
         index = list[i];
         if(index in this.objectAddrSaver){
             this.currentObjectAddr = this.objectAddrSaver[index];
             delete this.objectAddrSaver[index];
         }
     }
     return this;
 }
 /**
  * La méthode saveStructure permet de sauvegarder sainement la structure de contrôle actuelle
  * en retournant la clé de la structure actuelle
  */
 $syl.saveStructure = function(key){
     var k = -1;
     if(key in this.structureSaver.current){
         for(var i in this.structureSaver.old){
             if(this.structureSaver.old[i] == this.structureSaver.current[key]){
                 k = i;
                 break;
             }
         }
     }
     return k;
 }
/**
 * La méthode setStructure permet d'enregistrement sainement des structures de contrôle
 * en retournant la clé de la structure actuelle et celle de la précédente si elle existe
 */
 $syl.setStructure = function(key,value){
    var k = 0, /** La clé de l'actuel structure remplaçante */
        v = this.saveStructure(key);
    while(k in this.structureSaver.old){ k++; }
    this.structureSaver.current[key] = value;
    this.structureSaver.old[k] = value;
    return k;
 }
 /**
  * La méthode restoreStructure permet de restaurer sainement des structures de contrôle
  * tout en supprimant celle d'actuelle
  */
 $syl.restoreStructure = function(index,key){
    var keys = Array.isArray(key) ? key : [key],
        k;
    if(index in this.structureSaver.current){
        for(var i in keys){
            if(Array.isArray(keys[i])){
                keys[i] = keys[i][0];
            }
            for(k in this.structureSaver.old){
                if(this.structureSaver.old[k] == this.structureSaver.current[index]){
                    this.structureSaver.current[index] = null;
                    break;
                }
            }
            if(keys[i] in this.structureSaver.old){
                this.structureSaver.current[index] = this.structureSaver.old[keys[i]];
            }
            if(keys[i] != k){
                // delete this.structureSaver.old[k];
            }
        }
    }
 }
/**
 * La méthode getStructure permet de récupérer sainement la structure de contrôle actuelle
 */
 $syl.getStructure = function(index){
     return index in this.structureSaver.current ? this.structureSaver.current[index] : null;
 }
/**
 * La méthode updateStructure permet de modifier sainement une structure de contrôle
 */
 $syl.updateStructure = function(index,key,newValue){
     if(index in this.structureSaver.current && key in this.structureSaver.old){
         var isCurrent = this.structureSaver.current[index] == this.structureSaver.old[key];
         this.structureSaver.old[key] = newValue;
         if(isCurrent){
             this.structureSaver.current[index] = newValue;
         }
     }
 }
 /**
  * La méthode setExecutionMod permet de définir sainement le mode d'exécution du code
  */
 $syl.setExecutionMod = function(mod, relative){
     relative = this.set(relative,true);
     var r = (!this.getStructure('tryingBlock') || !relative ? true : !this.getStructure('tryingBlock').blocked);
     r = r && mod;
     r = r && (!this.getStructure('currentLoop') || !relative ? true : !this.getStructure('currentLoop').broken && !this.getStructure('currentLoop').continued);
    
     this.executing =  r;
 }
 $syl.saveLines = function(){
     if(this.lastIndex.line == this.cursor.index){
         return;
     }
     this.lastIndex.line = this.cursor.index;
     if(this.code[this.cursor.index] == '\n' && this.linesEnd.indexOf(this.cursor.index) < 0){
         this.linesEnd.push(this.cursor.index);
         
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
         $this.runner(function(cursor,loop){
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
  * @SECTOR : TYPE
  */
 /**
  * La méthode isBaseType permet de définir si un type est un type de base
  */
 $syl.isBaseType = function(type){
    var type = typeof type == 'string' ? this.getBaseType(type) : type;
    return Synthetic.Lang.baseType.indexOf(type) >= 0;
}
 /**
  * La méthode genericType prend en charge le types généric
 */
 $syl.genericType = function(type,origin){
     var $this = this,
         _currType, _cursor,
         _type = type, isBaseType;
     return new Promise(function(res,rej){
         if($this.isBaseType(_type) && !$this.isTypeInBaseTypeList(['Array','JSON'],_type)){
             $this.exception($this.err("primitive type [ "+ _type + " ] can't be generic !"),true);
         }
         var _dictMod = !$this.isTypesEqual(_type, Synthetic.Lang.typeFromConstants.Array),
             _origin,
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
                 if(_dictMod && !type.hasKeyConstraint && !$this.isTypeInBaseTypeList(['Number','String','Any'],lastword)){
                    //  console.log('[Lastword]',lastword)
                     $this.exception($this.err("Number or String are only allowed to be key constraints"));
                 }
                 type.constraints[!type.hasKeyConstraint && _dictMod ? 'key' : 'value']
                 .push({
                     type: lastword.addr,
                     origin: _origin,
                     constraints: null
                 });
                 if(_dictMod && !type.hasKeyConstraint){
                     type.hasKeyConstraint = true;
                 }
                 lastword = null;
             }
             return r;
         }
 
         function nextStatements(cursor,loop){
             
             if(cursor.char == '<'){
                 if(type.constraints == null ){
                     type.constraints = {
                         key: [],
                         value: [],
                         recursive: false
                     };
                 }
                 else if(lastword == null){
                     $this.exception($this.err("illegal expression [ "+cursor.char+" ]"),true);
                 }
                 else{
                     $this.exception($this.err("Syntax error !"),true);
                 }
             }
             
             else if(type.constraints != null){
                 if(cursor.char == '|'){
                     if(!savetype()){
                         $this.exception($this.err("illegal expression [ "+cursor.char+" ]"),true);
                     }
                     $this.goTo(1);
                 }
                 else if(cursor.char == '.'){
                     if($this.code.substr(cursor.index, 3) == '...'){
                         if(type.constraints.recursive){
                             $this.exception($this.err("illegal expression [ "+cursor.char+" ]"),true);
                         }
                         if(type.constraints.key.length == 0 && _dictMod){
                             lastword = Synthetic.Lang.typeFromConstants.Any;
                             savetype();
                         }
                         type.constraints.recursive = true;
                         $this.goTo(2);
                     }
                 }
                 else if(cursor.char == ','){
                     savetype();
                     type.hasKeyConstraint = true;
                     if( (type.constraints.key.length == 0 && _dictMod) || (!_dictMod && !type.constraints.recursive)){   
                         $this.exception($this.err("illegal character [ , ]"),true);
                     }
                     $this.goTo(1);
                 }
                 
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
                     
                     if(!savetype() && !type.constraints.recursive && !all){
                         $this.exception($this.err("illegal expression [ "+cursor.char+" ]"),true);
                     }
                     type.saved = true;
                     loop.end();
                     $this.goTo(1);
                     if(type.constraints.value.length == 0){
                         lastword = Synthetic.Lang.typeFromConstants.Any;
                         savetype();
                     }
                     res(type);
                     loop.end();
                 }
             }
             
             else if($this.currentType.constraints != null && $this){
                 
                 $this.exception($this.err("illegal expression [ "+(cursor.word ? cursor.word : cursor.char)+" ]" + $this.code.substr(cursor.index,10)),true);
             }
         }
 
         $this.runner(function(cursor, loop){
             if(cursor.word){
                 lastword = cursor.word;
                 loop.stop();
                 _cursor = $this.copy($this.cursor);
                 _currType = $this.currentType;
                 $this.currentType = null;
                 $this.litteral(lastword,{parent:null},true).then(function(type){
                    //  lastword += $this.code.substr(_cursor.index, $this.cursor.index - _cursor.index - 1);
                     if(!type || !$this.isType(type)){
                         $this.exception($this.err("[ "+lastword+" ] is not a defined type !"));
                     }
                     lastword = type;
                     $this.currentType = _currType;
                     cursor.char = $this.code[$this.cursor.index];
                     nextStatements(cursor,loop);
                     loop.start();
                 });
                 return;
             }
             nextStatements(cursor,loop);
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
         type: Synthetic.Lang.typeFromConstants.Any.addr,
         constraints: null
     } : this.currentType;
 }
 /**
  * La méthode getBaseType permet de récupérer l'objet d'un type de base
  */
 $syl.getBaseType = function(name){
     var r = {addr: null};
     for(var i in Synthetic.Lang.baseType){
         if(Synthetic.Lang.baseType[i].type == name){
             r = Synthetic.Lang.baseType[i];
             break;
         }
     }
     return r;
 }
 $syl.getBaseTypes = function(list){
     var r = [];
     for(var i in list){
        r.push(Synthetic.Lang.typeFromConstants[list[i]]);
     }
     return r;
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
     else if(/^(\-|\+)?([\s]+)?[0-9]+(\.[0-9]+)?$|^[0-1]x[a-z0-9]+$/.test(code)){
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
     return type in Synthetic.Lang.typeFromConstants ? Synthetic.Lang.typeFromConstants[type] : Synthetic.Lang.typeFromConstants.Any;
 }
 /**
  * La méthode isType permet de savoir si un objet est un type
  */
 $syl.isType = function(object){
    return typeof object == 'object' && object != null && Synthetic.Lang.typeCreatorKeys.indexOf(object.label) >= 0;
 }
 $syl.getObjectFromAddr = function(addr){
    return this.isAddr(addr) ? new Synthetic.Lang.Reference(addr).getObject() : addr;
 }
 $syl.isTypeInBaseTypeList = function(list, type){
     var type = this.getObjectFromAddr(type);
     return this.getBaseTypes(list).indexOf(type) >= 0;
 }
 $syl.getTypeName = function(type){
     var type = this.getObjectFromAddr(type);
     return typeof type == 'object' && type != null ? type.name : type;
 }
 $syl.isTypesEqual = function(type1,type2){
        type1 = this.getObjectFromAddr(type1);
        type2 = this.getObjectFromAddr(type2);
        // console.log({type1: type1.name,type2:  type2.name},  type1 == type2);
        type1 = {
            type: this.isType(type1) ? type1 : this.isAddr(type1.type) ? new Synthetic.Lang.Reference(type1.type).getObject() : type1.type,
            alt: this.isType(type1) ? type1 : this.isAddr(type1.implicitType) ? new Synthetic.Lang.Reference(type1.implicitType).getObject() : type1.implicitType,
        };
        type2 = {
            type: this.isType(type2) ? type2 : this.isAddr(type2.type) ? new Synthetic.Lang.Reference(type2.type).getObject() : type2.type,
            alt: this.isType(type2) ? type2 : this.isAddr(type2.implicitType) ? new Synthetic.Lang.Reference(type2.implicitType).getObject() : type2.implicitType,
        };
        var r = this.isTypeDescendant(type1.type,type2.type) || 
                this.isTypeDescendant(type1.alt,type2.alt) ;
                // || 
                // type1.type == type2.alt || type1.alt == type2.type
                ;
        // console.log('[Types]',{
        //     type1: this.getTypeName(type1.type),
        //     alt1: this.getTypeName(type1.alt),
        //     type2: this.getTypeName(type2.type),
        //     alt2: this.getTypeName(type2.alt),
        //     r : r
        // })
    return r;
 }
 $syl.isTypeDescendant = function(type, ref){
    var type = this.getObjectFromAddr(type),
        ref = this.getObjectFromAddr(ref),
        typeCHK = this.isType(type) && this.isType(ref);
        r = typeCHK && type == ref;
    /**
     * Avant de faire la remontée en recherche, il faut d'abord s'assurer que ce sont deux types
     * qu'on prend en compte
     */
    if(!r && typeCHK){
        for(var i in type.supertypes){
            r = this.isTypeDescendant(type.supertypes[i], ref);
            if(r){
                break;
            }
        }
    }
    return r;
 }
 /**
  * en valeurs du langage en cours (javascript dans ce cas)
 */
 $syl.toPrimitiveValue = function(value){
     var r,
         type = this.getObjectFromAddr(value.type);
     switch(type){
         case Synthetic.Lang.typeFromConstants.Number:
             r = parseFloat(value.value);
         break;
         case Synthetic.Lang.typeFromConstants.Boolean:
             r = this.toBoolean(value.value);
         break;
         case Synthetic.Lang.typeFromConstants.String:
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
         type = this.getObjectFromAddr(type),
         list = typeof list == 'string' || this.isType(list) ? [{
             type: this.getObjectFromAddr(list).addr
         }] : list;
     for(var i in list){
        //  console.log('[type]',list[i].type, this.getTypeName(list[i].type));
         if(this.isTypesEqual(list[i].type, Synthetic.Lang.typeFromConstants.Any) || this.isTypesEqual(list[i].type,type) ){
             r = true;
             break;
         }
     }
     return r;
 }
 /**
  * La méthode suitable permet de comparer si deux variable sont compatible en type
  * et en contrainte de type
  */
 $syl.isSuitable = function(referal,object){
     var r = this.isTypesEqual(object, referal) ||
             this.isTypesEqual(object.type, Synthetic.Lang.typeFromConstants.Any) || 
             this.isTypesEqual(object.implicitType, Synthetic.Lang.typeFromConstants.Any);
    if(r){
        r = (!referal.constraints == null && object.constraints != null && !object.constraints.recursive) 
            ||
            (referal.constraints != null && referal.constraints.recursive)
            ||
            (referal.constraints == null && object.constraints == null)
    }
    if(referal.constraints != null && object.constraints == null){
        r = false;
    }
    else if(r && referal.constraints != null && object.constraints != null){
        var keys = ['key', 'value'];
        for(var j in object.constraints[keys[k]]){
            for(var i in referal.constraints[keys[k]]){
                r = this.isTypesEqual(object.constraints[keys[k]][j].type, referal.constraints[keys[k]][i].type) || 
                    this.isTypesEqual(referal.constraints[keys[k]][i].type, Synthetic.Lang.typeFromConstants.Any);
                if(r){
                    break;
                }
            }
            if(!r){
                break;
            }
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
         r += (r.length ? ' | ' : '')+this.getObjectFromAddr(list[i].type).type;
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
     var r = Synthetic.Lang.typeFromConstants.Any,
         types = Synthetic.Lang.typeFromConstants;
     if(type1 == type2 && ['||', '&&', '==', '===', '!=', '!=='].indexOf(operator) < 0){
         return this.getObjectFromAddr(type1);
     }
     switch(operator){
         case '+':
         case '+=':
             if(this.isTypesEqual(type1, types.Array) || this.isTypesEqual(type2, types.Array) ){
                 if([types.Number, types.Boolean, types.String, types.Regex].indexOf(this.isTypesEqual(type1,types.Array) ? type2 : type1) >= 0){
                     r = types.Array;
                 }
             }
             else if(this.isTypesEqual(type1, types.String) || this.isTypesEqual(type2, types.String) ){
                 r = types.String;
             }
             break;
         case '||':
         case '&&':
         case '==':
         case '!=':
         case '===':
         case '!==':
             r = types.Boolean;
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
     return [false,"false",0,'0','null',null].indexOf(value) < 0;
 }
 
/**
  * La méthode toVariableStructure permet de transformer une simple valeur en 
  * valeur synthétic sérialisée
 */
$syl.toVariableStructure = function(value,parent){
    return this.meta({
        label: 'variable',
        type: this.getImplicitType(value).addr,
        value: this.clearString(value),
        parent: parent && typeof parent == 'object' && 'parent' in parent ? parent.parent : parent
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
                 if(!$this.isTypeInBaseTypeList(['JSON', 'Array'],a.type) || !$this.isTypeInBaseTypeList(['JSON', 'Array'],b.type)){
                     return null;
                 }
                 var json = $this.isTypesEqual(a.type,Synthetic.Lang.typeFromConstants.JSON) || $this.isTypesEqual(b.type,Synthetic.Lang.typeFromConstants.JSON),
                     result = json ? $this.isTypesEqual(a.type,Synthetic.Lang.typeFromConstants.JSON) ? a : b : a,
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
                 if(!$this.isTypesEqual(a.type, Synthetic.Lang.typeFromConstants.Array) < 0 && !$this.isTypesEqual(b.type,Synthetic.Lang.typeFromConstants.Array)){
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
         hexa: $this.convert().hexa,
         "+": function(a,b){
             var r = compute.structure["+"](a,b);
             r = compute.hexa['+'](a,b);
             r = r != null ? r : $this.toPrimitiveValue(a) + $this.toPrimitiveValue(b);
             return r;
         },
         "-": function(a,b){
             var r = compute.structure["-"](a,b);
             r = compute.hexa['-'](a,b);
             r = r != null ? r : $this.toPrimitiveValue(a) - $this.toPrimitiveValue(b);
             return r;
         },
         "*": function(a,b){
             var r = compute.hexa['*'](a,b);
             if(r){ return r;}
             return $this.toPrimitiveValue(a) * $this.toPrimitiveValue(b);
         },
         "/": function(a,b){
            var r = compute.hexa['/'](a,b);
            if(r){ return r;}
             return $this.toPrimitiveValue(a) / $this.toPrimitiveValue(b);
         },
         "~": function(a,b){
            var r = compute.hexa['~'](a,b);
            if(r){ return r;}
             return Math.ceil($this.toPrimitiveValue(a) / $this.toPrimitiveValue(b));
         },
         "%": function(a,b){
            var r = compute.hexa['%'](a,b);
            if(r){ return r;}
            return $this.toPrimitiveValue(a) % $this.toPrimitiveValue(b);
         },
         "<": function(a,b){
             var r = compute.hexa.parse(a,b);
             if(r){
                 a = r[0]; b = r[0];
             }
             return $this.toPrimitiveValue(a) < $this.toPrimitiveValue(b);
         },
         ">": function(a,b){
            var r = compute.hexa.parse(a,b);
            if(r){
                a = r[0]; b = r[0];
            }
             return $this.toPrimitiveValue(a) > $this.toPrimitiveValue(b);
         },
         "<=": function(a,b){
            var r = compute.hexa.parse(a,b);
            if(r){
                a = r[0]; b = r[0];
            }
             return $this.toPrimitiveValue(a) <= $this.toPrimitiveValue(b);
         },
         ">=": function(a,b){
            var r = compute.hexa.parse(a,b);
            if(r){
                a = r[0]; b = r[0];
            }
             return $this.toPrimitiveValue(a) >= $this.toPrimitiveValue(b);
         },
         "==": function(a,b){
            var r = compute.hexa.parse(a,b);
            if(r){
                a = r[0]; b = r[0];
            }
             return $this.toPrimitiveValue(a) == $this.toPrimitiveValue(b);
         },
         "!=": function(a,b){
            var r = compute.hexa.parse(a,b);
            if(r){
                a = r[0]; b = r[0];
            }
             return $this.toPrimitiveValue(a) != $this.toPrimitiveValue(b);
         },
         "===": function(a,b){
            var r = compute.hexa.parse(a,b);
            if(r){
                a = r[0]; b = r[0];
            }
             var sameType = $this.isTypesEqual(a,b);
             return sameType && $this.toPrimitiveValue(a) == $this.toPrimitiveValue(b);
         },
         "!==": function(a,b){
            var r = compute.hexa.parse(a,b);
            if(r){
                a = r[0]; b = r[0];
            }
             var sameType = $this.isTypesEqual(a,b);
             return sameType && $this.toPrimitiveValue(a) == $this.toPrimitiveValue(b);
         },
         "||": function(a,b){
            var r = compute.hexa.parse(a,b);
            if(r){
                a = r[0]; b = r[0];
            }
             return $this.toPrimitiveValue(a) || $this.toPrimitiveValue(b);
         },
         "&&": function(a,b){
            var r = compute.hexa.parse(a,b);
            if(r){
                a = r[0]; b = r[0];
            }
             return $this.toPrimitiveValue(a) && $this.toPrimitiveValue(b);
         },
         "|": function(a,b){
             var r = compute.hexa.parse(a,b);
             if(r){
                 a = r[0]; b = r[0];
             }
             return $this.toPrimitiveValue(a) | $this.toPrimitiveValue(b);
         },
         '+=': function(a,b){
             return this['+'](a,b);
         },
         '-=': function(a,b){
             return this['-'](a,b);
         },
         '*=': function(a,b){
             return this['*'](a,b);
         },
         '/=': function(a,b){
             return this['/'](a,b);
         },
         '~=': function(a,b){
             return this['~'](a,b);
         },
         '%=': function(a,b){
             return this['%'](a,b);
         }
     };
     
     var operands = [null,null], 
     /**
      * On définit l'ordre de recherche des opérateurs par priorité de calcul
     */
     operators = [
         ['*','/','~','%'],
         ['-','+'],
         ['>','>=','<','<=','==','!=', '===','!==='],
         ['||', '&&'],
         ['+=', '-=','%=','*=','/=','~=']
     ],
     k,result;
     for(var j in operators){
         for(var i in list){
             if(operators[j].indexOf(list[i]) >= 0){
                 /**
                  * on suppose que la première opérande est la case directe d'avant
                  */
                 k = i * 1 - 1;
                 /**
                  * mais tant que cette case est vide, on parcourt en arrière pour trouver
                  * la prochaine case arrière avec une valeur
                  */
                 while(list[k] == Synthetic.Lang.constants.EMPTY){
                     k--;
                 }
                 /**
                  * S'il n'y a aucune case non-vide, on suppose que
                  * la première opérande est null
                  */
                 operands[0] = list[k] != undefined ? list[k] : null;
                 /**
                  * On vide la case d'avant
                  */
                 list[k] = Synthetic.Lang.constants.EMPTY;
                 /**
                  * maintenant on suppose pour la deuxième opérande que c'est la case
                  * directe d'après
                  */
                 k = i * 1 + 1;
                 /**
                  * mais on parcourt en avant qu'elle est vide
                  */
                 while(list[k] == Synthetic.Lang.constants.EMPTY){
                     k++;
                 }
                 /**
                  * Si on ne la trouve pas, on suppose que la deuxième operande est nulle
                  */
                 operands[1] = list[k] != undefined ? list[k] : null;
                 /**
                  * À la fin, on execute l'opération de calcul
                  */
                 if(operands[0] != undefined && operands[1] != undefined){
                     result = compute[list[i]](operands[0], operands[1]);
                     list[k] = $this.meta({
                         label: 'variable',
                         type: $this.getRelationType(operands[0].type, operands[1].type, list[i]).addr,
                         value: result,
                         parent: operands[1].parent
                     },false);
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
  * La méthode struct permet de faire la sérialization d'une structure (JSON|Array)
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
         var _scopeKey = [$this.saveScope(true)];
         $this.createBlock();
         var _type = $this.code[$this.cursor.index] == '[' ? 'Array' : 'JSON',
         structure = $this.meta({
             type: Synthetic.Lang.typeFromConstants[_type].addr,
             constraints: data.object.type == _type ? data.object.constraints : null,
             label: 'variable',
             value: {},
             parent: data.ressources.parent,
             childScope: $this.currentScope
         }), key = null, index = 0,
         addrKey = [$this.saveObjectAddr()],
         _scope, _isCallable = false,
         _cursor = $this.copy($this.cursor),
         object;
         $this.linkWith(structure, data.object);
         
         $this.runner(function(cursor,loop){
             if(_type == 'Array' || key != null){
                 loop.stop();
                 if(['[', '{'].indexOf(cursor.char) >= 0){
                     $this.goTo(1);
                 }
                 if(cursor.word && cursor.word.length){
                     $this.cursor = $this.copy(_cursor);
                 }
                 _cursor = $this.copy($this.cursor);
                 /**
                  * Il ne faut enregistrer la variable provenue de la clé pour éviter les conflits
                  * avec l'existence des variables pré-existantes !
                  */
                 object = $this.meta({
                     type: !data.object.constraints ? Synthetic.Lang.typeFromConstants.Any.addr : data.object.constraints.value[0].type,
                     name: _type == 'JSON' ? key : index,
                     constraints: !data.object.constraints ? null : data.object.constraints,
                     value: null
                 }, false);
                 $this.linkWith(object,data.object);
                 
                 addrKey.push($this.setObjectAddr(object.addr));
                 /**
                  * On mémorise le scope pour le restaurer ensuite
                  */
                 _scope = $this.cursor.scope;
                 $this.value({
                     object: object,
                     subvariables: true,
                     ressources: data.ressources,
                     end: [Synthetic.Lang.constants._EOS[_type == 'Array' ? 'BRACKET' : 'BRACE'], Synthetic.Lang.constants._EOS.COMA]
                 }).then(function(result){
                     if($this.executing && result){
                         $this.linkWith(result);
                     }
                     if($this.executing){
                         $this.cursor.scope = _scope;
                         _isCallable = result && $this.isCallable(result);
                         if(_isCallable){
                             object = $this.copy(result);
                         }
                         else{
                             object = result;
                         }
                         /**
                          * Pour éviter la suppression de l'objet sans nom
                          * lorsque la ramasse-miette s'en charge
                          */
                         if(result && !result.name){
                             object.name = _type == 'Array' ? index : key;
                            //  $this.save(object);
                         }
                         if(structure.constraints){
                             if(_isCallable && structure.constraints.value.length > 1 && !$this.isValidateConstraint(Synthetic.Lang.typeFromConstants.Any, structure.constraints.value)){
                                 $this.cursor = $this.copy(_cursor);
                                 $this.exception($this.err("to much return value types !"));
                             }
                             /**
                              * Si le resulta est un external, on vérifier qu'il n'y a acceptation que
                              * du type 'Any'
                              */
                             if(object.label == 'external' && !$this.isValidateConstraint(Synthetic.Lang.typeFromConstants.Any, object.constraints.value)){
                                 $this.cursor = $this.copy(_cursor);
                                 $this.exception($this.err("external structure don't support other type than Any, "+structure.constraints.value[0].type+" was given !"));
                             }
                             /**
                              * Si c'est une fonction et que le type est Any
                              * On lui passe le type principale de la contrainte de la 
                              * structure
                              */
                             if($this.isTypesEqual(result.type,Synthetic.Lang.typeFromConstants.Any) && $this.isCallable(objet)){
                                 objet.type =  structure.constraints.value[0].type;
                             }
                             /**
                              * Sinon Si le type de la valeur n'est pas compatible aux contraintes
                              * de la structure, on lève une erreur
                              */
                             else if(!$this.isValidateConstraint(object, structure.constraints.value)){
                                 $this.cursor = $this.copy(_cursor);
                                 $this.exception($this.err($this.toStringTypes(structure.constraints.value)+" value expected, "+$this.getTypeName(object.implicitType)+" given !"));
                             }
                         }
                         if(result){
                            $this.save(object);
                         }
                     }
                     if(data.object.constraints && !$this.isValidateConstraint(object, data.object.constraints.value)){
                         if(!$this.isTypeInBaseTypeList(['Array', 'JSON'],object.type)|| !data.object.constraints.recursive){
                             $this.cursor = _cursor;
                             $this.exception($this.err($this.toStringTypes(data.object.constraints.value)+" value expected, "+object.implicitType+" given !"));
                         }
                     }
                     if(_type == 'Array'){
                         if(object != undefined || $this.code[$this.cursor.index-1] != ']'){
                             structure.value[index] = object;
                         }
                         index++;
                     }
                     else{
                         structure.value[key] = object;
                     }
                     
                     key = null;
                     
                     switch($this.code[$this.cursor.index-1]){
                         case ',':
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
                                 $this.exception($this.err("Illegal character !"),true);
                             }
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
                                     if($this.executing){
                                         if(data.object.constraints && !$this.isValidateConstraint("String", data.object.constraints.key)){
                                             if(['Array', 'JSON'].indexOf(result.type) < 0 || !data.object.constraints.recursive){
                                                 $this.cursor = _cursor;
                                                 console.log(data.object.constraints)
                                                 $this.exception($this.err($this.toStringTypes(data.object.constraints.key)+" key type expected, String given implicitly !"));
                                             }
                                         }
                                         if(data.object.constraints && !$this.isValidateConstraint(result, data.object.constraints.value)){
                                             if(['Array', 'JSON'].indexOf(result.type) < 0 || !data.object.constraints.recursive){
                                                 $this.cursor = _cursor;
                                                 $this.exception($this.err($this.toStringTypes(data.object.constraints.value)+" value expected, "+result.implicitType+" given !"));
                                             }
                                         }
                                         if(!result.name){
                                             $this.exception($this.err("Cannot defined key from implicit value given !"));
                                         }
                                         structure.value[result.name] = result;
                                     }
                                     if($this.code[$this.cursor.index] == '}'){
                                         $this.goTo(1);
                                         
                                         loop.end();
                                         return;
                                     }
                                     $this.goTo(1);
                                     _cursor = $this.copy($this.cursor);
                                     loop.start();
                                 });
                             }
                             /**
                              * Sinon on lève une exception
                              */
                             else{
                                 $this.exception($this.err("Cannot define key from value of [ "+cursor.word+" ]"));
                             }
                         }
                     });
                 }
                 else if(cursor.char == '}'){
                     loop.end();
                 }
             }
         }).then(function(){
             $this.restoreObjectAddr(addrKey);
             $this.restoreScope(_scopeKey);
             res(structure);
         });
     });
 }
 /**
  * La méthode ternary permet de trouver la valeur d'une opération ternaire
  */
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
         $this.runner(function(cursor,loop){
             if(!end){
                 loop.stop();
                 if(!data.reason && !pass){
                     $this.setExecutionMod(false);
                 }
                 $this.value({
                     object: data.object,
                     subvariables: true,
                     ressources: data.ressources,
                     end: [EOS.ELSE]
                 }).then(function(value){
                     if(data.reason){
                         result = value;
                         $this.setExecutionMod(false);
                     }
                     else{
                         $this.setExecutionMod(executing);
                     }
                     if($this.code[$this.cursor.index] != ':'){
                         $this.exception($this.err("[ : ] expected !"),true);
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
                     $this.setExecutionMod(executing);
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
     
     return new Promise(function(res,rej){
         $this.runner(function(cursor,loop){
             /**
              * (*1)Si on attend la partie droite du ternaire, on ignore la partie droite
              * Ou le ternaire principal est terminé, on ignore le reste jusqu'à la fin
              */
                 _end = constants.values.end.indexOf(cursor.char);
                 _start =  constants.values.start.indexOf(cursor.char);
             
         
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
                
                 if(_type == Synthetic.Lang.constants.LITTERAL){
                     loop.stop();
                     /**
                      * Si le caractère de fin d'instruction n'est pas un espace blanc,
                      * on fait marche arrière pour qu'on puisse traiter son cas plus tard.
                      */
                     if(/[\S]+/.test(cursor.char)){
                         $this.backTo(cursor.char.length - 1);
                     }
                     /**
                      * Puis on sauvegarde le curseur
                      */
                     _cursor = $this.copy($this.cursor);
                     /**
                      * Si on est en mode subvalue
                      * On va vérifier si on est en une appelle de fonction
                      */
                     $this.litteral(cursor.word, data.ressources).then(function(result){
                        /**
                         * Si rien n'est retourné ou un type pendant qu'on tente 
                         * l'enregistrement d'un callback. On arrête la lecture.
                         */
                        // console.log('[val][result]',cursor.word, result);
                        if( (!result || $this.isType(result)) &&  data.subvalue && $this.tryMethodInstead){
                            $this.tryMethodInsteadConfirmed = true;
                            loop.end();
                            return;
                        }
                        if($this.executing){
                            if(!$this.isTypesEqual(result.type, Synthetic.Lang.typeFromConstants.Number) && result.label != 'variable' && preOperations >= 0 && preOperations != Synthetic.Lang.simpleOperations.REVERSE){
                                $this.cursor = $this.copy(_cursor);
                                $this.exception($this.err("Number value expected"),true);
                            }
                            /**
                             * S'il y avait une préopération,
                             * on l'applique à la valeur trouvée
                             */
                            if(preOperations >= 0){
                                switch(preOperations){
                                    case Synthetic.Lang.simpleOperations.NEGATIVE:
                                        result.value *= -1;
                                    break;
                                    case Synthetic.Lang.simpleOperations.PREINCREMENTATION:
                                        result.value++;
                                    break;
                                    case Synthetic.Lang.simpleOperations.PREDECREMENTATION:
                                        result.value--;
                                    break;
                                    case Synthetic.Lang.simpleOperations.REVERSE:
                                        values.push($this.toVariableStructure(!$this.toBoolean(result.value)));
                                    break;
                                }
                                if(preOperations != Synthetic.Lang.simpleOperations.REVERSE){
                                    values.push(result);
                                }
                                preOperations = -1;
                            }
                        }
                        /**
                         * Si le litteral est un type, il y a deux possibilités
                         *  * Soit on tente l'enregistrement d'une fonction anonyme
                         *  * Soit une erreur de syntaxe
                         */
                         if(result && $this.isType(result)){
                            $this.exception($this.err("invalid syntax !"),true);
                         }
                        
                         /**
                          * Si l'eos avant est une post-opération numérique,
                          * on enregistre pour la valeur courante, la valeur du resultat moins le 1 ou plus le 1
                          * RAISON :
                          *  * raison de la post-incrémentation lors d'une affectation
                          */
                         if(['--','++'].indexOf($this.code.substr($this.cursor.index - 3, 2)) >= 0){
                             values.push($this.toVariableStructure(result.value * 1 - 1));
                         }
                         else{
                             values.push(result);
                         }
                         waitingForNextOperand = false;
                        
                         loop.start();
                     })
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
                     /**
                      * Si le mot est "null"
                      * on considère la valeur null
                      */
                     if(cursor.word == "null"){
                         values.push($this.toVariableStructure(null, data.ressources));
                     }
                     else if(['external', 'callable'].indexOf(cursor.word) >= 0){
                         loop.stop();
                         $this[cursor.word](data.ressources).then(function(method){
                             values.push(method);
                             loop.start();
                         });
                         return;
                     }
                     else if(_type == Synthetic.Lang.constants.TYPE){
                         loop.stop();
                         _cursor = $this.copy($this.cursor);
                        //  console.log('[Val] to [Litteral]')
                         $this.litteral(cursor.word, data.ressources, true).then(function(result){
                            if(result.label == 'class'){
                                var _currentAction = [$this.saveStructure('instanciation'),$this.setStructure('instanciation',true)[1]];
                                $this.cursor = $this.copy(_cursor);
                                $this.litteral(cursor.word,data.ressources).then(function(result){
                                    values.push(result);
                                    loop.start();
                                });
                            }
                            else{
                                $this.exception($this.err("[ "+result.name+" ] can not be linked as value !"),true);
                            }
                         });
                         return;
                     }
                     else if(['this','super'].indexOf(cursor.word) >= 0){
                         loop.stop();
                         $this.litteral(cursor.word, data.ressources).then(function(result){
                            if(['--','++'].indexOf($this.code.substr($this.cursor.index - 3, 2)) >= 0){
                                values.push($this.toVariableStructure(result.value * 1 - 1));
                            }
                            else{
                                values.push(result);
                            }
                            waitingForNextOperand = false;
                            loop.start();
                         });
                         return;
                     }
                     else{
                         $this.exception($this.err("invalid syntax !"),true);
                     }
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
                         
                         if(!$this.isTypesEqual(type, Synthetic.Lang.typeFromConstants.Number) && preOperations != Synthetic.Lang.simpleOperations.REVERSE){
                            //  console.log('[Word]',cursor.word, preOperations)
                             $this.exception($this.err("Number value expected"));
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
                     $this.exception($this.err("illegal operator sign [ "+cursor.char+" ]"),true);
                 }
             }
             /**
              * Si le caractère est un caractère de fin de recherche d'instruction
              */
             if(_end >= constants.PARENTHESE){
                 if(waitingForNextOperand){
                     $this.exception($this.err("right operand expected"),true);
                 }
                
                 if(data.end.indexOf(_end) >= 0 || 
                     (!data.subvariables && _end == constants.SEMICOLON) ||
                     (data.subvariables && (data.end.indexOf(_end) || _end == constants.SEMICOLON) )
                 ){
                     $this.goTo(1);
                     loop.end();
                 }
                 else if(Synthetic.Lang.blockEOS.indexOf(cursor.char) < 0){
                     $this.exception($this.err("illegal end of statement [ "+cursor.char+" ]"),true);
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
                
                /**
                 * Si on rencontre le mot-clé in
                 * on vérifie le booléen
                 */
                 if($this.code.substr($this.cursor.index, 2) == 'in'){
                    if(!values.length || typeof values[values.length - 1] != 'object'){
                        $this.exception($this.err("syntax error near by ... in ... operator !"),true);
                    }
                    $this.goTo(2);
                    loop.stop();
                    loop.reset();
                    $this.in({
                        key: values[values.length - 1],
                        ressources: data.ressources
                    }).then(function(result){
                        values[values.length - 1] = result;
                        loop.start();
                    });
                 }
                 else{
                    if( data.end.indexOf(_end) < 0 && _end != constants.SEMICOLON && Synthetic.Lang.blockEOS.indexOf(cursor.char) < 0 && /*_end != constants.SEMICOLON && */ /[\S]+/.test(cursor.char)){
                        
                        $this.backTo(1);
                    }
                    
                    loop.end();
                }
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
                         if(_start == constants.BRACKET && !$this.isTypeInBaseTypeList(['String','Array', 'JSON'],$this.getType(values[values.length - 1]))){
                             $this.exception($this.err("illegal character [ "+cursor.char+" ]"),true);
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
                             /**
                              * Si le caractère actuel n'est pas un ')'
                              * Il se pourrait bien qu'on a tenté une fonction
                              */
                             $this.toNextChar().then(function(_char){
                                 /**
                                  * @Cas exceptionnel
                                  * Ça peut arriver qu'une sous-valeur en mode non-exécution
                                  * génère une methodInstead alors qu'on cherchait un ternaire
                                  */
                                 if(_char == '?'){
                                    $this.tryMethodInsteadConfirmed = false;
                                    $this.tryMethodInstead = _tryMethod;
                                    $this.ternary({
                                        object: data.object,
                                        end: data.end,
                                        ressources: data.ressources,
                                        reason: false
                                    }).then(function(result){
                                        values.push($this.executing ? result : $this.toVariableStructure(result));
                                        waitingForNextOperand = false;
                                        loop.start();
                                    });
                                    return;
                                 }
                                 if((!result && $this.tryMethodInsteadConfirmed) || _char == '{'){
                                     $this.cursor = $this.copy(_cursor);
                                     $this.tryMethodInsteadConfirmed = false;
                                     $this.tryMethodInstead = _tryMethod;
                                     $this.method(data.object, data.ressources).then(function(method){
                                         values.push(data.object);
                                         waitingForNextOperand = false;
                                         $this.garbage(true);
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
                             $this.exception($this.err("Denied structure syntax !"),true);
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
                      * Sinon on déclenche une erreur
                      */
                     else{
                         $this.exception($this.err("illegal character [ "+cursor.char+" ]"),true);
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
             
             var r = $this.executing ? $this.calc(values) : null;
            //  console.log('[DATA]',data.object)
             if($this.executing && !data.subvariables && !data.subvalue && !$this.isTypesEqual(data.object.type, Synthetic.Lang.typeFromConstants.Any) && (!r || !$this.isTypesEqual(r, data.object)) ){
                 
                 if(!$this.getStructure('currentInstance') && (!r || !('labelConstraint' in r && r.labelConstraint == 'callable' && r.label == 'function'))){
                     if(_cursor){
                        $this.cursor = $this.copy(_cursor);
                     }
                    //  console.log('[Data]',data.object);
                     $this.exception($this.err($this.getTypeName(data.object.type)+" value expected, "+(r ? $this.getTypeName(r.implicitType) : "Any" )+" given !"));
                 }
             }
             else if($this.executing && data.subvariables && data.object.constraints && (!r || !$this.isValidateConstraint(r, data.object.constraints.value)) ){
                if(!r || !$this.isTypeInBaseTypeList(['Array', 'JSON'],r.type) || !data.object.constraints.recursive){
                    //  console.log('[Object]',data.object, r);
                     $this.exception($this.err($this.toStringTypes(data.object.constraints.value)+" value expected, "+(!r ? "Any" : $this.getTypeName(r.type))+" given !"));
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
 $syl.err = function(message,exception){
     var r = this.cursorOrigin(this.cursor.index),
        exception = this.set(exception,false);
     return (exception ? "Exception raised" : "ERROR")+" at file "+this.file+" line " + r.y + "::"+r.x+" -> " +this.set(message,'');
 }
 /**
  * La méthode exception permet de lever une exception en tout sécurité
  */
 $syl.exception = function(message,runtimeError){
     var runtimeError = this.set(runtimeError, false);
     if(this.getStructure('tryingBlock') && !runtimeError){
         if(!this.getStructure('tryingBlock').blocked){
             this.getStructure('tryingBlock').message = message;
             this.getStructure('tryingBlock').blocked = true;
         }
         this.executing = false;
     }
     else{
         throw new Error(message);
     }
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
         this.exception(this.err("syntax error : " + previousKey + " ... " + currentKey), true);
     }
 }
 /**
  * la méthode private définit si l'instruction suivante a une portée privée
 */
 $syl.private = function(){
     var $this = this;
     return new Promise(function(res,rej){
         
         $this.accessErr('private', 'private',rej);
         
         $this.accessErr('protected', 'private',rej);
         
         $this.accessErr('static', 'private',rej);
         
         $this.accessErr('export', 'private',rej);
         
         $this.accessErr('final', 'private',rej);
         
         $this.accessErr('const', 'private',rej);
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
         
         $this.accessErr('private', 'protected',rej);
         
         $this.accessErr('protected', 'protected',rej);
         
         $this.accessErr('static', 'protected',rej);
         
         $this.accessErr('export', 'protected',rej);
         
         $this.accessErr('final', 'protected',rej);
         
         $this.accessErr('const', 'protected',rej);
 
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
         
         $this.accessErr('abstract', 'abstract',rej);
         
         $this.accessErr('private', 'abstract',rej);
         
         $this.accessErr('protected', 'abstract',rej);
         
         $this.accessErr('export', 'abstract',rej);
         
         $this.accessErr('final', 'abstract',rej);
         
         $this.accessErr('override', 'abstract',rej);
         
         $this.accessErr('const', 'abstract',rej);
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
         
         $this.accessErr('static', 'static',rej);
         
         $this.accessErr('export', 'static',rej);
         
         $this.accessErr('abstract', 'static',rej);
         
         $this.accessErr('const', 'static',rej);
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
         var MegaScope = $this.getCurrentMegaStructure();
         if(MegaScope && MegaScope.label == 'interface'){
             $this.exception($this.err("no final member is allowed inside interface scope"));
         }
         $this.accessErr('final', 'final',rej);
         
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
         
         $this.accessErr('abstract', 'export',rej);
         
         $this.accessErr('private', 'export',rej);
         
         $this.accessErr('protected', 'export',rej);
         
         $this.accessErr('final', 'export',rej);
         
         $this.accessErr('static', 'export',rej);
         
         $this.accessErr('export', 'export',rej);
         
         $this.accessErr('const', 'export',rej);
         
         $this.accessErr('override', 'export',rej);
         $this.access.export = true;
         res();
     });
 }
 /**
  * la méthode const définit si l'instruction suivante comme constante
 */
 $syl.const = function(){
     var $this = this;
     return new Promise(function(res,rej){
         
         $this.accessErr('const', 'const',rej);
         $this.access.const = true;
         res();
     });
 }
 /**
  * la méthode override définit si l'instruction suivante une rédéfinition
 */
 $syl.override = function(){
     var $this = this;
     return new Promise(function(res,rej){
         
         $this.accessErr('override', 'override',rej);
         
         $this.accessErr('abstract', 'override',rej);
         
         $this.accessErr('final', 'override', rej);
         
         $this.accessErr('export', 'override', rej);
         
         $this.accessErr('protected', 'override', rej);
         
         $this.accessErr('private','override', rej);
         $this.access.override = true;
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
       export: false,
       const: false,
       override : false
     }
 }
 
 /**
  * @SECTOR: Référencement des objets
  */
 
 /**
  * la méthode save permet de sauvegarder un objet dans la mémoire du programme pour mieux le référencer
 */
 $syl.save = function(object,parent){
     if(!this.executing){
         return;
     }
     this.modules[this.currentScope].modules[object.name] = object;
     if(Synthetic.Lang.typeCreatorKeys.indexOf(object.label) >= 0){
         this.types.push(object.name);
     }
     Synthetic.Lang.objects[object.addr] = object;
 }
 
 /**
  * La méthode freeLinkOf permet de libérer les liens d'un objet vis-à-vis un autres
  */
 $syl.freeLinkOf = function(object){
     for(var i in object.following){
         if(object.following[i] in Synthetic.Lang.objects){
            Synthetic.Lang.objects[object.following[i]].linked--;
            Synthetic.Lang.objects[object.following[i]].linked = Synthetic.Lang.objects[object.following[i]].linked < 0 ? 0 : Synthetic.Lang.objects[object.following[i]].linked;
         }
     }
     return this;
 }
 /**
  * La méthode linkWith permet de lier deux objets Synthetic
  */
 $syl.linkWith = function(depend,current){
     var depend = typeof depend == 'object' ? depend :
         Synthetic.Lang.objects[depend],
         current = this.set(current, Synthetic.Lang.objects[this.currentObjectAddr]);
     if(current && depend && this.currentObjectAddr){
         depend.linked++;
         current.following.push(depend.addr);
     }
     return this;
 }
 /**
  * la méthode parent permet de retrouver l'étendue parente d'une instruction
 */
 $syl.previousCloserRef = function(cursor,notNull){
     var scopeList = [], indexList = [], ref = null, _scopes = {},
         notNull = this.set(notNull,false);
     
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
 $syl.createBlock = function(autoReplace, struct, parent){
     if(!this.executing){
         return;
     }
     var scope = this.addr(),
         struct = this.set(struct,null),
         parent = this.set(parent, this.currentScope),
         autoReplace = this.set(autoReplace, true);
     this.modules[scope] = {
         parent: parent,
         besides: [],
         structure: struct,
         modules: {}
     };
     if(autoReplace){
         this.currentScope = scope;
     }
     return scope;
 }
 /**
  * La méthode getCloserStruct permet de retrouver la structure (class, mixin, enum) la plus proche en parenté
  */
 $syl.getCloserStruct = function(deeper){
     var r = null,
         deeper = this.set(deeper, false),
         scope = this.currentScope;
     if(!scope){
         return r;
     }
    //  if(this.executing)
    //      console.log('[Begin]',scope, this.modules)
     do{
         /**
          * On vérifie si le block en cours à une structure existant parmis les objets
          */
        if(this.modules[scope].structure != null && this.modules[scope].structure in Synthetic.Lang.objects){
            r = Synthetic.Lang.objects[this.modules[scope].structure];
            r = Synthetic.Lang.megaStructureKeys.indexOf(r.label) >= 0 ? r : null;
            if(r){
                // console.log('[Addr]',scope)//,this.modules[scope].modules);
                r = {values: this.modules[scope].modules, object: r};
            }
        }
        /**
         * Sinon on cherche dans le block parent
         *  * Et si le block courant n'a pas de parent, on arrête tout !
         */
        else{
            scope = this.modules[scope].parent;
            if(!scope){
                break;
            }
        }
        if(r){
            break;
        }
    }while(deeper);
     return r;
 }
 $syl.getCurrentMegaStructure = function(){
    var r = null;
    if(this.currentObjectAddr && this.currentObjectAddr in Synthetic.Lang.objects){
       r = Synthetic.Lang.objects[this.currentObjectAddr];
       r = Synthetic.Lang.megaStructureKeys.indexOf(r.label) >= 0 ? r : null;
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
             /**
              * Si la valeur de l'argument est une fonction,
              * on doit modifier son 'scopeCursor.scope' à la valeur du scope de l'argument
              * correspondant ou celui de la fonction appelée, augmentée de 1
              * @reason : Pour corriger l'erreur de recherche des arguments internes
              */
             if('scopeCursor' in args[index]){
                 args[index].scopeCursor.scope = _arg ? _arg.cursor.scope + 1 : serial.scopeCursor.scope ; 
             }
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
 $syl.find = function(name,scope,lookUpper){
     if(Synthetic.Lang.nativeFunctions.indexOf(name) >= 0){
         return this.meta({
             name: name,
             label: "function",
             native: true,
             async: name == 'timer',
             arguments: {},
             type: Synthetic.Lang.typeFromConstants[Synthetic.Lang.nativeFunctionTypes[name]].addr
         },false);
     }
     else{
         var $this = this,
             scope = this.set(scope,this.currentScope),
             lookUpper = this.set(lookUpper,true),
             r = null;
         if(!(scope in this.modules)){
             return r;
         }
         function findBeside(name,_module){
             var response = null, r;
             if('besides' in _module){
                for(var i in _module.besides){
                    r = $this.find(name, _module.besides[i].addr,false);
                    if(r){
                        response = r;
                    }
                }
             }
             if(response){
                 response = response.visible || response.protected ? response : null;
             }
            return response;
         }
         while(!r){
             if(name in this.modules[scope].modules){
                 r = this.modules[scope].modules[name];
             }
             else{
                 r = findBeside(name, this.modules[scope]);
                 if(this.modules[scope].parent != null && lookUpper && !r){
                     scope = this.modules[scope].parent;
                 }
                 else{
                     break;
                 }
             }
         }
     }
     return r;
 }
 /**
  * La méthode containsKey permet de savoir si une clé existe dans le champs des valeur
  * d'un objet
  */
 $syl.containsKey = function(key, object, parent){
     if(!object){
         this.exception(this.err("cant read [ "+key+" ] property of null"));
     }
     var r = false,
         parent = this.set(parent, false);
     if(object.label == 'object'){
        //  console.trace('[Objects]',object);
         if( (object.name != 'super' && !parent) || parent){
            r = this.modules[object.object.addr].modules[key];
         }
         if(!r){
            for(var i in object.object.parents){
                r = this.containsKey(key, {
                        label: 'object',
                        type: object.type,
                        name: object.name,
                        object: object.object.parents[i]
                    }, true);
                if(r){
                    break;
                }
            }
         }
         else{
             r = (object.name == 'super' && parent) || (object.name == 'this' && (!parent || r.protected)) ? true : r.visible;
         }
     }
     else{
         r = object && object.value && typeof object.value[key] != 'undefined'; 
     }
     return r;
 }
 $syl.getValueOf = function(key, object,parent){
    if(!object){
        this.exception(this.err("cant read [ "+key+" ] property of null"));
    }
    var r = null,
        parent = this.set(parent, false);
    if(object.label == 'object'){
        var _r = null,
            internal = {
                current: object.name == 'this',
                parent: object.name == 'super'
            };
        if( (!internal.parent && !parent) || parent){
            r = this.modules[object.object.addr].modules[key];
        }
        if(!r){
           for(var i in object.object.parents){
               _r =  this.getValueOf(key, {
                    label: 'object',
                    type: object.type,
                    implicitType: object.type,
                    name: object.name,
                    object: object.object.parents[i]
                }, true);
               if(_r){
                   r = _r;
               }
           }
        }
        r = !internal.parent && parent && r && !r.protected && !r.visible ? null : r;
        if(!internal.parent && !parent && (!r || (!r.visible && !internal.current) ) ){
            this.exception(this.err("[ "+key+" ] is not visible to [ "+object.name+" ]"));
        }
    }
    else{
        r = object && object.value ? object.value[key] : null; 
    }
    return r;
 }
 /**
  * La méthode cursorOrigin permet de trouver la ligne approximative dans laquelle se
  * trouvait le curseur
  */
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
  * La méthode isCallable permet de savoir si un objet peut être invoqué
  */
 $syl.isCallable = function(object, more){
     more = this.set(more,false);
     if(object && this.getStructure('constructorContext') && object.label == 'object' && ['this','super'].indexOf(object.name) >= 0){
        //  console.log('[Ctx]',this.getStructure('constructorContext'),object);
         return true;
     }
     return object && ['function','external', more ? 'class' : ''].indexOf(object.label) >= 0;
 }
 /**
  * @SECTOR : execution
  */
 
 $syl.native = function(serial,args,ressources){
     var $this = this;
     var repere = this.cursorOrigin(serial.cursor.index);
     return new Promise(function(res){
         /**
          * 'out',
         'delete', 'revSort',
          */
         var natives = {
             tab: function(n){
                 var r = '';
                 for(var i = 0; i < n; i++){
                     r += ' ';
                 }
                 return r;
             },
             hexa: $this.convert().hexa,
             struct: function(e,n){
                 var n = $this.set(n,0),
                     array = e && $this.isTypesEqual(e, Synthetic.Lang.typeFromConstants.Array) ? 1 : e && $this.isTypesEqual(e, Synthetic.Lang.typeFromConstants.JSON) ? 2 : 0;
                     r = array > 0 ? array == 1 ? '[' : '{' : '';
                 if(array > 0){
                     for(var i in e.value){
                         r += r.length == 1 && array > 1 ? '\n' : '';
                         r += (r.length >= 3+(array > 1 ? 0 : -1) ? ", "+(array > 1 ? '\n' : '') : "")+(array > 1 ? " "+this.tab(n) : "")+(array == 1 ? "": i+" : ")+this.struct(e.value[i], n+1);
                     }
                     r += r.length > 1 && array > 1 ? '\n' : '';
                 }
                 else{
                     r += e && $this.isTypesEqual(e,Synthetic.Lang.typeFromConstants.String) && n > 0 && !$this.isCallable(e) ? 
                                 '"'+e.value+'"' : 
                                 e ? 
                                     'value' in e && !$this.isCallable(e) ? e.value : e.label+" ["+e.addr+"]"
                                      : ""+e;
                 }
                 r += array > 0 ? array ==  1 ? ']' : this.tab(n)+'}' : '';
                 return r;
             },
             err: function(n_arg){
                 var n = $this.len(args);
                 if(n < n_arg){
                     $this.cursor = $this.copy(serial.cursor);
                     $this.exception($this.err(n_arg+" arguments expected for [ "+serial.name+" ], "+n+" given !"));
                 }
             },
             expect: function(arg,n,types){
                 if(!$this.isValidateConstraint(arg, types)){
                     $this.cursor = $this.copy(arg.cursor);
                     $this.exception($this.toStringTypes(types)+" expected for argument "+n+" of "+serial.name+", "+$this.getTypeName(arg.implicitType)+" given !");
                 }
             },
             rearrange: function(){
                 var indexes = [], tmp;
                 for(var i in args[0].value){
                     indexes.push(i);
                 }
                 for(var i in indexes){
                     tmp = args[0].value[indexes[i]];
                     delete args[0].value[indexes[i]];
                     args[0].value[i] = tmp;
                 }
             },
             print: function(){
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
                     r += (r.length ? ' ' : '')+this.struct(args[i]); 
                 }
                 console.log("\x1b[43m\x1b[30m", $this.file+" :: "+repere.y+":"+repere.x,"\x1b[0m", r);
                 return null;
             },
             int: function(){
                 var r = {};
                 for(var i in args){
                     r = args[i];
                     break;
                 }
                 r = parseInt(this.hexa.check(r.value) ? this.hexa.from(r.value) : r.value);
                 r = isNaN(r) ? 0 : r;
                 return $this.toVariableStructure(r, ressources.parent);
             },
             float: function(){
                 var r = {};
                 for(var i in args){
                     r = args[i];
                     break;
                 }
                 r = parseFloat(this.hexa.check(r.value) ? this.hexa.from(r.value) : r.value);
                 r = isNaN(r) ? 0.0 : r;
                 return $this.toVariableStructure(r, ressources.parent);
             },
             len: function(){
                 var r = 0;
                 if('0' in args && 'value' in args[0]){
                     if($this.isTypeInBaseTypeList(['Array', 'JSON'], args[0].type)){
                         r = $this.len(args[0].value);
                     }
                     else{
                         r = args[0].value.length;
                     }
                 }
                 return $this.toVariableStructure(r);
             },
             split: function(){
                 var r = [], separator = '', result = $this.meta({
                     type: Synthetic.Lang.typeFromConstants.Array.addr,
                     value: {}
                 },false);
                 this.expect(args[0],0,[{type: Synthetic.Lang.typeFromConstants.String.addr}]);
                 if('0' in args && $this.isTypesEqual(args[0], Synthetic.Lang.typeFromConstants.String.addr)){
                     if('1' in args && $this.isTypesEqual(args, Synthetic.Lang.typeFromConstants.String.addr)){
                         separator = args[1].value;
                     }
                     r = args[0].value.split(separator);
                 }
                 for(var i in r){
                     result.value[i] = $this.toVariableStructure(r[i])
                 }
                 return result;
             },
             typeof: function(){
                 var r = Synthetic.Lang.typeFromConstants.Any.type;
                 if('0' in args){
                     r = $this.getObjectFromAddr(args[0].implicitType).type;
                 }
                 return $this.toVariableStructure(r);
             },
             replace: function(){
                 this.err(3);
                 var r = args[0].value;
                 this.expect(args[0],0,[{type:Synthetic.Lang.typeFromConstants.String.addr}]);
                 this.expect(args[1],1,[{type: Synthetic.Lang.typeFromConstants.String.addr},{type: Synthetic.Lang.typeFromConstants.Number.addr}]);
                 this.expect(args[2],2,[{type: Synthetic.Lang.typeFromConstants.String.addr},{type: Synthetic.Lang.typeFromConstants.Number.addr}]);
                 r = args[0].value.replace(args[1].value, args[2].value);
                 return $this.toVariableStructure(r);
             },
             lower: function(){
                 this.expect(args[0], 0, [{type: Synthetic.Lang.typeFromConstants.String.addr},{type: Synthetic.Lang.typeFromConstants.Number.addr}]);
                 var r = $this.toVariableStructure(args[0].value.toLowerCase());
                 r.type = Synthetic.Lang.typeFromConstants.String.addr;
                 r.implicitType = Synthetic.Lang.typeFromConstants.String.addr;
                 return r;
             },
             maj: function(){
                 this.expect(args[0], 0, [{type:Synthetic.Lang.typeFromConstants.String.addr},{type: Synthetic.Lang.typeFromConstants.Number.addr}]);
                 
                 var r = $this.toVariableStructure(args[0].value.toUpperCase());
                 r.type = Synthetic.Lang.typeFromConstants.String.addr;
                 r.implicitType = Synthetic.Lang.typeFromConstants.String.addr;
                 return r;
             },
             push: function(){
                 this.err(2);
                 this.expect(args[0], 0, [{type: Synthetic.Lang.typeFromConstants.Array.addr}]);
                 var index = $this.len(args[0].value);
                 for(var i in args){
                     if(i * 1 > 0){
                         this.expect(args[i], i, args[0].constraints ? args[0].constraints.value : [{type: Synthetic.Lang.typeFromConstants.Any.addr}]);
                         if($this.isTypeInBaseTypeList(['Array','JSON'],args[i].type) && (!args[0].constraints || !args[0].constraints.recursive)){
                             $this.cursor = $this.copy(args[i].cursor);
                             $this.exception($this.err("trying to push structure into non-recursive structure !"));
                         }
                         args[0].value[index] = args[i];
                         index++;
                     }
                 }
                 return args[0];
             },
             shift: function(){
                 this.expect(args[0], 0, [{type: Synthetic.Lang.typeFromConstants.Array.addr}, {type: Synthetic.Lang.typeFromConstants.JSON.addr}]);
                 for(var i in args[0].value){
                     delete args[0].value[i];
                     break;
                 }
                 if($this.isTypesEqual(args[0],Synthetic.Lang.typeFromConstants.Array)){
                     this.rearrange();
                 }
                 return args[0];
             },
             pop: function(){
                 this.expect(args[0], 0, [{type: Synthetic.Lang.typeFromConstants.Array.addr},{type: Synthetic.Lang.typeFromConstants.JSON.addr}]);
                 var index = $this.len(args[0].value),
                     json = $this.isTypesEqual(args[0],Synthetic.Lang.typeFromConstants.JSON),
                     indexed = false;
                 for(var i in args){
                     if(typeof args[0].value[args[i].value] != 'undefined'){
                         delete args[0].value[args[i].value];
                     }
                 }
                 if(!indexed){
                     for(var i in args[0].value){
                         index = i;
                     }
                     delete args[0].value[index];
                 }
                 if($this.isTypesEqual(args[0],Synthetic.Lang.typeFromConstants.Array)){
                     this.rearrange();
                 }
                 return args[0];
             },
             str: function(){
                 var r = {};
                 for(var i in args){
                     r = args[i];
                     break;
                 }
                 r = '"'+r.value.toString()+'"';
                 return $this.toVariableStructure(r, ressources.parent);
             },
             sort: function(){
                 this.expect(args[0], 0, [{type: Synthetic.Lang.typeFromConstants.Array.addr}]);
                 var tmp, len = $this.len(args[0].value);
                 for(var i = 0; i < len - 1; i++){
                     for(var j = i + 1; j < len; j++){
                         if(args[0].value[i].value > args[0].value[j].value){
                             tmp = args[0].value[i];
                             args[0].value[i] = args[0].value[j];
                             args[0].value[j] = tmp;
                         }
                     }
                 }
                 return args[0];
             },
             reverse: function(){
                 this.expect(args[0], 0, [{type: Synthetic.Lang.typeFromConstants.Array.addr}]);
                 var tmp, len = $this.len(args[0].value);
                 for(var i = 0; i < len - 1; i++){
                     if(i < len - 1 - i){
                         tmp = args[0].value[i];
                         args[0].value[i] = args[0].value[len - 1 - i];
                         args[0].value[len - 1 - i] = tmp;
                     }
                     else{
                         break;
                     }
                 }
                 return args[0];
             },
             round: function(){
                 this.expect(args[0], 0, [{type: Synthetic.Lang.typeFromConstants.Number.addr}]);
                 var precision = 0;
                 if('1' in args){
                     this.expect(args[1], 0, [{type: Synthetic.Lang.typeFromConstants.Number.addr}]);
                     precision = Math.floor(args[1].value * 1);
                 }
                 var r = Math.round(args[0].value * Math.pow(10,precision)) / Math.pow(10,precision);
                 return $this.toVariableStructure(r);
             },
             floor: function(){
                 this.expect(args[0], 0, [{type: Synthetic.Lang.typeFromConstants.Number.addr}]);
                 return $this.toVariableStructure(Math.floor(args[0].value * 1));
             },
             ceil: function(){
                 this.expect(args[0], 0, [{type: Synthetic.Lang.typeFromConstants.Number.addr}]);
                 return $this.toVariableStructure(Math.ceil(args[0].value * 1));
             },
             abs: function(){
                 this.expect(args[0], 0, [{type: Synthetic.Lang.typeFromConstants.Number.addr}]);
                 return $this.toVariableStructure(Math.abs(args[0].value * 1));
             },
             pow: function(){
                 this.err(2);
                 this.expect(args[0], 0, [{type: Synthetic.Lang.typeFromConstants.Number.addr}]);
                 this.expect(args[1], 1, [{type: Synthetic.Lang.typeFromConstants.Number.addr}]);
                 return $this.toVariableStructure(Math.pow(args[0].value * 1, args[1].value * 1));
             },
             max: function(max){
                 this.expect(arg[0],0,[{type: Synthetic.Lang.typeFromConstants.Number.addr}]);
                 var r = arg[0].value * 1,
                     max = $this.set(max, true);
                 for(var i in args){
                     this.expect(arg[i],i,[{type: Synthetic.Lang.typeFromConstants.Number.addr}]);
                     r = (max && r > args[i].value) || (!max && r < args[i].value) ? r : args[i].value;
                 }
                 return $this.toVariableStructure(r);
             },
             min: function(){
                 return this.max(false);
             },
             join: function(){
                 this.err(2);
                 this.expect(args[0], 0, [{type: Synthetic.Lang.typeFromConstants.Array.addr}]);
                 this.expect(args[1], 1, [{type: Synthetic.Lang.typeFromConstants.String.addr}, {type: Synthetic.Lang.typeFromConstants.Number.addr}]);
                 var r = '';
                 for(var i in args[0].value){
                     r += (r.length ? args[1].value : '')+args[0].value[i].value;
                 }
                 r = $this.toVariableStructure(r);
                 r.type = Synthetic.Lang.typeFromConstants.String.addr;
                 r.implicitType = Synthetic.Lang.typeFromConstants.String.addr;
                 return r;
             },
             bool: function(){
                 return $this.toVariableStructure($this.toBoolean(args[0].value));
             },
             raise: function(){
                 $this.exception($this.err(args[0].value,true));
             },
             plaform: function(){
                 var r = null;
                 return $this.toVariableStructure(r);
             },
             timer: function(){
                 var r = null,
                     time = 100;
                 this.err(1);
                 if(args[0].label != 'function'){
                    $this.exception($this.err("argument 0 must be a function"));
                 }
                 if(1 in args){
                    this.expect(args[1], 1, [{type: Synthetic.Lang.typeFromConstants.Number.addr}]);
                    time = $this.toPrimitiveValue(args[1]);
                 }
                //  console.log('[args]',args[0]);
                 var scope = {
                     old: $this.currentScope,
                     new: null,
                 };
                 setTimeout(function(){
                    scope.new = $this.currentScope;
                    //  console.log('[Modules]',scope,$this.modules);
                    $this.currentScope = scope.old;
                    $this.exec(ressources,args[0],{}).then(function(e){
                        $this.currentScope = scope.new;
                        // console.log('[End]',e);
                    })
                 }, time);
                 return $this.toVariableStructure(r);
             },
             setState: function(){
                 var r = null;
                 return $this.toVariableStructure(r);
             }
         };
         if(serial.name == 'tap'){
             var message = "";
             if('0' in args){
                 natives.expect(args[0],0,[{type: Synthetic.Lang.typeFromConstants.String.addr}]);
                 message = args[0].value;
             }
             if(node_env){
                 var readline = require('readline');
                 rl = readline.createInterface({
                     input: process.stdin,
                     output: process.stdout
                 });
                 rl.question(message, function(e){
                     rl.close();
                     e = /[\d]+(\.[\d]+)/.test(e) ? e : '"'+e+'"';
                     res($this.toVariableStructure(e));
                 });
             }
         }
         else{
             res(natives[serial.name]());
         }
     });
 }
 $syl.createInstance = function(classSrc, parentInstance){
    var parents = [], parent,
        parentInstance = this.set(parentInstance, false);
        
    for(var i in classSrc.superclass){
        parent = this.getObjectFromAddr(classSrc.superclass[i]);
        if(parent.label == 'class'){
            parents.push(this.createInstance(parent));
        }
    }
    var addr = this.createBlock(true, classSrc.addr, this.modules[classSrc.module].parent),
        obj;
    for(var i in classSrc.members){
        obj = this.getObjectFromAddr(classSrc.members[i]);
        // console.log('[Obj]',obj);
        if(!obj.static){
            obj = this.copy(obj);
            obj.addr = this.addr();
            obj.method = true;
            obj.parent = this.currentScope;
        }
        this.save(obj);
    }
    this.modules[this.currentScope].besides = parents;
    obj = this.extend({
        addr : addr, 
        parents: parents,
    }, parentInstance ? {} : {
        type: classSrc.type,
        scope: this.currentScope, 
        replaceScope: null,
        instanciation: true
    });
    return obj;
 }
 $syl.setInstanceTrace = function(addr,method){
    var megastruct = null, _instanceKey = -1;
    if(this.modules[addr].structure in Synthetic.Lang.objects){
        var object = this.modules[addr],
            method = this.set(method,false);
        megastruct = Synthetic.Lang.objects[object.structure];
       //  console.log('[MegaStruct]',megastruct);
        instance = {
           values : {}, 
           type: megastruct.type, 
           scope: addr, 
           replaceScope: null,
           instanciation: false
        }
    }
    if(megastruct && method){
       _instanceKey = this.setStructure('instance', this.meta({
           label: 'object',
           name: 'this',
           type: megastruct.type,
           implicitType: megastruct.type,
           value: null,
           object: {
               addr: addr,
               parents: object.besides,
               scope: addr
           }
       },false));
    }
    else{
       _instanceKey = this.setStructure('instance', null);
    }
    return {
        _instanceKey: _instanceKey,
        instance : instance
    }
 }
 $syl.definedUsingSignature = function(method, args){
    var list = [], $this = this, len = $this.len(args),r;
    function compatible(method){
        var r = true, k = 0;
        for(var i in method.arguments){
            r = $this.isValidateConstraint(args[k], [method.arguments[i]]);
            k++;
            if(!(k in args) || !r){
                break;
            }
        }
        if( (k && !len) || (!k && len) ){
            r = false;
        }
        if(r){
            list.push(method);
        }
        return r;
    }
    if(!method.signatures.length){
        return method;
    }
    compatible(method,args);
    for(var i in method.signatures){
        compatible(Synthetic.Lang.objects[method.signatures[i]]);
    }
    if(!list.length){
        r = !$this.len(args) ? method : null;
    }
    else{
        var argLen = {
            calc: 0,
            saved: -1
        };
        for(var i in list){
            argLen.calc = $this.len(list[i].arguments);
            /**
             * Il faut que le nombre d'argument soit sensiblement égale aux nombres d'arguments
             */
            if(len >= argLen.calc && (argLen.calc <= argLen.saved || argLen.saved < 0)){
                argLen.saved = argLen.calc;
                r = list[i];
            }
        }
    }
    return r;
 }
 $syl.getSignature = function(method, index){
     var r = null;
     if(!index){
        r = method;
     }
     else{
       r = method.signatures[index * 1 - 1];
       r = typeof r == 'string' ? Synthetic.Lang.objects[r] : null;
     }
     return r;
 }
 /**
  * La méthode isSignatureSuitable permet de détecter si deux méthodes ont les mêmes signatures
  */
 $syl.isSignaturesSuitable = function(base, next){
    var r = false, $this = this;
    function compare(a,b){
        var same = {type: false, argtype: false};
        same.type = $this.isTypesEqual(a,b);
        same.argtype = $this.len(a.arguments) == $this.len(b.arguments);
        if(same.argtype && !$this.len(a.arguments)){
            return same;
        }
        if(same.argtype){
            same.argtype = false;
            var k=0,v=0,f=true;
            for(var i in b.arguments){
                v = 0; f = false;
                for(var j in a.arguments){
                    if(k == v){
                        // console.log('[KV]',$this.getTypeName(a.arguments[j].type), $this.getTypeName(b.arguments[i].type))
                        same.argtype = $this.isTypesEqual(a.arguments[j],b.arguments[i]);
                        if(same.argtype){
                            break;
                        }
                        f = true;
                    }
                    v++;
                }
                if(same.argtype || !f){
                    break;
                }
                k++;
            }
        }
        return same;
    }
    r = compare(base,next);
    r = r.type && r.argtype;
    if(!r){
        if(base.signatures.length){
            // console.log('[Signatures]',{base,next});
        }
        for(var i in base.signatures){
            r = compare(Synthetic.Lang.objects[base.signatures[i]], next);
            r = r.type && r.argtype;
            if(r){
                break;
            }
        }
    }
    return r;
 }
 $syl.checkIfCanOverrideMethod = function(struct,method, already){
     var already = this.set(already,false),
         $this = this;
     function check(parent){
        var r = 0;
        /**
         * Si le nom du membre en question existe, on va voir si
         * son correspondant est final
         */
        //  console.log('[Parent]',members);
         if(method.name in parent.members){
            member = $this.getObjectFromAddr(parent.members[method.name]);
            if(already){
                if($this.isSignaturesSuitable(member, method)){
                    r++;
                }
                else if(parent.superclass.length){
                    r += $this.checkIfCanOverrideMethod($this.getObjectFromAddr(parent.superclass[0]), struct,already);
                }
            }
            else if(member.final){
                $this.exception($this.err("[ "+member+" ] was declared final at \""+member.origin+"\""));
            }
        }
        /**
         * Si on ne trouve pas le champ dans les membres de la classe,
         * on poursuit pour la classe parente
         */
        else if(parent.superclass.length){
            r += $this.checkIfCanOverrideMethod(already ? $this.getObjectFromAddr(parent.superclass[0]) : parent, struct, already);
        }
        return r;
     }
    if(already){
        if(!check(struct)){
            $this.exception($this.err("("+struct.name+")."+method.name+"("+$this.getArgsListTypes(method.arguments,false,true).join(", ")+") was not implemented !"));
        }
    }
    else if(struct.superclass.length){
        var parent, member = false;
        for(var i in struct.superclass){
            check(this.getObjectFromAddr(struct.superclass[i]));
        }
    }
 }
 /**
  * La méthode exec permet d'executer une fonction
  */
 $syl.exec = function(ressources, callable, args){
    var $this = this;
    return new Promise(function(res){
        $this.createBlock();
        // console.log('[NEXT]',callable.name,$this.currentScope);
        $this.createScopeObject(callable,args);
        $this.cursor = $this.copy(callable.scopeCursor);
        $this.parse({
            parent : callable.addr
        },{
            end: callable.braced ? [Synthetic.Lang.constants._EOS.BRACE] : [],
            statementCount: callable.braced ? -1 : 1
        }).then(function(response){
            res(response);
        });
    });
 }
 /**
  * La méthode caller
  */
 $syl.caller = function(callable,ressources){
     var $this = this, cursor;
     /**
      * On sauvegarde le scope actuel pour le restaurer plus tard
      */
     var key = [$this.saveScope(true)],
         instance = null, noReturn = false,
         _instanceKey = [$this.saveStructure('instance')], 
         defaultConstruct = false,
         _constCtx = [$this.saveStructure('constructorContext')],
         _cursor = $this.copy($this.cursor);
     if(callable.label == 'class'){
         instance = $this.createInstance(callable);
         _instanceKey.push($this.setStructure('instance', $this.meta({
             label: 'object',
             name: 'this',
             type: instance.type,
             implicitType: instance.type,
             value: null,
             object: {
                 addr: instance.addr,
                 parents: instance.parents,
                 scope: instance.scope
             }
         },false)));
         _constCtx.push($this.setStructure('constructorContext', false));
         key.push($this.setScope(instance.scope));
         callable = callable._constructor;
         if(!callable){
             callable = $this.meta({
                 type: instance.type,
                 label: 'function'
             }, false);
             defaultConstruct = true;
         }
     }
     /**
      * Si on fait appel au constructeur d'une classe à traver les objets 'this', 'super'
      */
     else if(callable.label == 'object'){
         _constCtx.push($this.setStructure('constructorContext', false));
         var addr = callable.name == 'super' ? callable.object.parents[0].addr : callable.object.addr,
            setting = this.setInstanceTrace(addr,true);
         instance = setting.instance;
         _instanceKey.push(setting._instanceKey);
         callable = this.getObjectFromAddr(this.modules[addr].structure)._constructor;
         noReturn = true; /** Empêche de vérifier la valeur de retour */
     }
     else if(callable.parent in this.modules){
         var setting = this.setInstanceTrace(callable.parent,callable.method);
         instance = setting.instance;
         _instanceKey.push(setting._instanceKey);
         _constCtx.push($this.setStructure('constructorContext', false));
        //  console.log('[Key]',_instanceKey, $this.structureSaver);
        //  console.log('[GOT]',callable,callable.parent);
     }
     return new Promise(function(res){
         $this.toNextChar().then(function(_char){
             $this.arguments(callable,ressources,true).then(function(args){
                 if(!$this.executing){
                     res(null);
                 }
                 else{
                     /**
                      * Conséquence d'un argument ayant le même nom qu'une fonction définie
                      * alors qu'on le crée dans les paramètres d'un callback
                      */
                     if(!args){
                         /**
                          * Si le resultat des arguments est nul on va vérifier:
                          *  * Si 'trynMethodeInstead' est activé, dans ce cas on prendra en compte
                          *    le traitement d'un callback (création)
                          *  * Sinon on saura qu'on doit retourner la référence de la fonction
                          */
                         if($this.tryMethodInstead){
                             $this.tryMethodInsteadConfirmed = true;
                             res(null);
                             return;
                         }else{
                             res(callable);
                             return;
                         }
                     }
                     if(callable.native){
                        args = args.arguments;
                         $this.native(callable,args,ressources).then(function(value){
                             if(!value){
                                 value = $this.toVariableStructure(value,ressources);
                             }
                             res(value);
                         });
                     }
                     else{
                        if((!callable || defaultConstruct) && instance && instance.instanciation){
                            $this.setExecutionMod(true);

                            // response = $this.toVariableStructure(response,ressources);
                            /**
                             * À la fin de l'éxecution de la fonction, on restaure 
                             * le scope principale
                             */
                            $this.restoreScope(key);
                            $this.restoreStructure('instance',_instanceKey);
                            res($this.meta({
                                name: null,
                                type: instance.type,
                                value: null,
                                label: 'object',
                                object: {
                                    addr: instance.addr,
                                    parents: instance.parents,
                                    scope: instance.scope
                                }
                            }));
                        }
                        else{
                            /**
                             * On copie les données actuelles du curseur pour les restaurer après !
                             */
                            cursor = $this.copy($this.cursor);
                            cursor.lines = $this.cursorOrigin(cursor.index);
                            /**
                             * On définit le scope actuel comme le scope actuel pour le référencer
                             * lorsqu'on va créer le scope suivant comme actuel
                             * pour ne pas briser la chaine des scopes
                             */
                            var defaultCallable = callable;
                            callable = args.signature;//$this.getSignature(callable, args.signature);
                            args = args.arguments;
                            // console.log('[Callable]',args);
                            // $this.definedUsingSignature(callable,args);
                            if(!callable){
                                var types = '';
                                for(var i in args){
                                    types += (types.length ? ', ' : '')+$this.getTypeName(args[i].type);
                                }
                                $this.cursor = $this.copy(_cursor);
                                $this.exception($this.err("undefined method signature like "+ (instance ? $this.getTypeName(instance.type)+'.' : '') +defaultCallable.name+"("+types+") !"));
                            }
                            key.push($this.setScope(callable.childScope));
                            if(instance){
                                instance.replaceScope = {
                                    scope: $this.currentScope,
                                    parent: $this.modules[$this.currentScope].parent
                                };
                                // console.log('[_____scope_____]',callable.name,$this.currentScope, instance.scope);
                                $this.modules[$this.currentScope].parent = instance.scope;
                            }
                            $this.exec(ressources,callable,args).then(function(response){
                                $this.setExecutionMod(true);
                                $this.restoreScope(key);
                                if(instance && instance.instanciation){
                                    response = $this.meta({
                                        name: null,
                                        type: instance.type,
                                        value: null,
                                        label: 'object',
                                        object: {
                                            addr: instance.addr,
                                            parents: instance.parents,
                                            scope: instance.scope
                                        }
                                    });
                                }
                                else{
                                    /**
                                     * Si l'exécution ne retourne aucune donnée,
                                     * on évite de retourner la valeur sous sa forme brute
                                     */
                                    if(!response){
                                        response = $this.toVariableStructure(response,ressources);
                                    }
                                    if(!$this.isValidateConstraint(response, callable.type) && !noReturn){
                                        $this.exception($this.err(" "+callable.type+" expected, "+$this.getTypeName(response.type)+" given"));
                                    }
                                }
                                $this.restoreStructure('constructorContext', _constCtx);
                                $this.restoreStructure('instance',_instanceKey);
                                if(instance){
                                    $this.modules[instance.replaceScope.scope].parent = instance.replaceScope.parent;
                                }
                                $this.cursor = $this.copy(cursor);
                                /**
                                 * À la fin de l'éxecution de la fonction, on restaure 
                                 * le scope principale
                                 */
                                res(response);
                            });
                        }
                     }
                 }
             })
         })
     });
 }
 $syl.getArgsListTypes = function(list, realtype, withName){
     var r = [],
         realtype = this.set(realtype, true),
         withName = this.set(withName, false);
     for(var i in list){
         r.push(withName ? this.getTypeName(list[i][realtype ? 'implicitType' : 'type']) : list[i][realtype ? 'implicitType' : 'type']);
     }
     return r;
 }
 /**
  * La méthode arguments permet de récupérer et d'inspecter les arugments d'une méthode 
  */
 $syl.arguments = function(serial,ressources, calling){
     var $this = this,
         calling = $this.set(calling, false);
     return new Promise(function(res){
        //  console.log('[Serial]',serial);
         var _arguments = {}, _typeset = false,
             containSignature = serial && 'signatures' in serial && serial.signatures.length > 0,
             _instance = $this.getStructure('currentInstance'),
             arg, index = 0, _cursor, _reachCursor, _arg,
             withParenthese = 0, callCertitude = 0,
             arglist = {};
         if(calling){
             arglist[0] = serial.arguments;
             for(var i in serial.signatures){
                 arglist[i*1+1] = Synthetic.Lang.objects[serial.signatures[i]].arguments;
             }
         }
         function argName(name,clear,types){
            var r = null,
                types = $this.set(types,null),
                list = [];
            for(var i in arglist){
                if(name in arglist[i]){
                    r = arglist[i][name];
                    list.push(i);
                }
                else if(clear){
                    delete arglist[i];
                }
            }
            return r;
         }
         function getArg(n,notNull){
             notNull = $this.set(notNull,false);
             if(!_instance){
                for(var i in serial.arguments){
                    if(serial.arguments[i].index == n){
                        return $this.copy(serial.arguments[i],true);
                    }
                    if(serial.arguments[i].name == n){
                        return $this.copy(serial.arguments[i],true);
                    }
                }
             }
             return notNull ? {} : null;
         }
         function resetArg(){
             var r = $this.meta({
                 label: 'argument',
                 type: Synthetic.Lang.typeFromConstants.Any.addr,
                 implicitType: Synthetic.Lang.typeFromConstants.Any.addr,
                 value: null,
                 altype: [],
                 unset: false,
                 callable: false,
                 external: false,
                 constant: false,
                 autoassign: false
             },false),_r;
             if(calling){
                 _r = getArg(index);
                 r = _r ? _r : r;
             }
             _typeset = false;
             return r;
         }
         arg = resetArg();
         function finishSavingArgument(cursor,loop,_res){
             
             if(cursor.char == ','){
                 if(cursor.word){
                     if(!calling && arg.constant){
                         $this.cursor = $this.copy(_cursor);
                         $this.exception($this.err("argument [ "+arg.name+" ] must have default value !"));
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
                             $this.cursor = $this.copy(_cursor);
                             $this.exception($this.err("error from trying to set value of argument [ "+_arg.name+" ] declared constant !"));
                         }
                         _arguments[index] = typeof cursor.word == 'object' ? cursor.word : $this.toVariableStructure(cursor.word);
                     }
                 }
                 if(!withParenthese){
                     loop.end();
                     return;
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
                     $this.exception($this.err("unset argument [ "+arg.name+" ] can't have default value !"));
                 }
                 if(!withParenthese){
                    //  console.log('[Cursor]',cursor.word);
                     $this.exception($this.err("syntax error withing parenthesisless calling style function !"),true);
                 }
                 if(calling && !argName(cursor.word,true)){
                     $this.exception($this.err("[ "+cursor.word+" ] is not a defined argument for "+serial.name+" !"));
                 }
                 _arg = getArg(cursor.word);
                 if(_arg && _arg.constant){
                     $this.exception($this.err("error from trying to set value of [ "+_arg.name+" ] !"));
                 }
                 $this.goTo(1);
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
                     /**
                      * On doit déléguer les type si c'est une fonction
                     /**
                      * S'il y a contraint 'callable' de label sur l'argument
                      * pn verifie qu'il reçoit bien un callable ('external', 'function')
                      */
                     if(arg.callable && ['external', 'function'].indexOf(result.label) < 0){
                         $this.exception($this.err("callable structure expected, "+result.label+" structure given !"));
                     }
                     /**
                      * S'il y a contraint 'external' de label sur l'argument
                      * pn verifie qu'il reçoit bien un external
                      */
                     if(arg.external && result.label != 'external'){
                         $this.exception($this.err("external expected, "+result.label+" given !"));
                     }
                    //  if(!result) console.log('[Value]', $this.executing, serial)
                     arg.implicitType = result.implicitType;
                     if(result.label == 'object'){
                        arg.label = result.label;
                        arg.object = result.object;
                     }
                     else{
                         arg.value = result.value;
                     }
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
                         $this.exception($this.err("error from trying to set value of [ "+_arg.name+" ] !"));
                     }
                     _arguments[index] = typeof cursor.word == 'object' ? cursor.word : $this.toVariableStructure(cursor.word);
                 }
                 withParenthese--;
                 if(callCertitude){
                     $this.goTo(1);
                 }
                 loop.end();
             }
             else{
                 if(calling){
                     _arg = getArg(index);
                     if(_arg && _arg.constant){
                         $this.exception($this.err("error from trying to set value of [ "+_arg.name+" ] !"));
                     }
                     _arguments[index] = typeof cursor.word == 'object' ? cursor.word : $this.toVariableStructure(cursor.word,serial.parent);
                     if(/[\S]+/.test(cursor.char)){
                         $this.backTo(cursor.char.length - (cursor.char.length == 1 || cursor.char == ';' ? 1 : 0));
                     }
                     _cursor = $this.copy($this.cursor);
                     loop.end();
                 }
                 else{
                     $this.exception($this.err("[ "+cursor.char+" ] unexpected !"),true);
                 }
             }
         }
         function _medio_saveArgument(){

         }
         function saveArgument(cursor,loop){
             return new Promise(function(_res,_rej){
                //  console.log('[cursor]',cursor,calling);
                 if(calling && cursor.char != ':' && cursor.word && typeof cursor.word != 'object'){
                    //  console.log('[Search]',cursor.word, $this.executing);
                     $this.cursor = $this.copy(_cursor);
                     $this.value({
                         object: arg,
                         ressources: ressources,
                         end: [Synthetic.Lang.constants._EOS.COMA, Synthetic.Lang.constants._EOS.PARENTHESE]
                     }).then(function(result){
                        // console.log('[Result]',cursor.word, result);
                         /**
                          * S'il y a contraint 'callable' de label sur l'argument
                          * pn verifie qu'il reçoit bien un callable ('external', 'function')
                          */
                         if(arg.callable && ['external', 'function'].indexOf(result.label) < 0){
                             $this.exception($this.err("callable expected, "+result.label+" given !"));
                         }
                         /**
                          * S'il y a contraint 'external' de label sur l'argument
                          * pn verifie qu'il reçoit bien un external
                          */
                         if(arg.external && result.label != 'external'){
                             $this.exception($this.err("external expected, "+result.label+" given !"));
                         }
                        
                         var _char = $this.code[$this.cursor.index - 1];
                        
                         /**
                          * Si le caractère précédent est une ")", on doit pas procéder
                          * jusqu'au caractère non-blanc suivant avant de finir l'enregistrement
                          */
                         
                         if([')'].indexOf(_char) >= 0){
                            
                             $this.backTo(1);
                             finishSavingArgument({char: _char, word: result}, loop,_res);
                             _cursor = $this.copy($this.cursor);
                         }
                         else{
                             
                             $this.toNextChar().then(function(__char){
                                 finishSavingArgument({char: _char, word: result}, loop,_res);
                                 _cursor = $this.copy($this.cursor);
                             });
                         }
                     });
                 }
                 else{
                     finishSavingArgument(cursor,loop,_res);
                     _cursor = $this.copy($this.cursor);
                 }
             });
         }
         _cursor = $this.copy($this.cursor);
         if($this.code[$this.cursor.index] == '('){
             withParenthese = 1;
             _cursor.index++;
             callCertitude = 1;
             $this.goTo(1);
         }
 
         $this.runner(function(cursor,loop){
             /**
              * On cherche les mots dans les arguments
              */
             
             if(cursor.word && cursor.word.length){
                
                 if(Synthetic.Lang.reservedKeys.indexOf(cursor.word) >= 0 && cursor.word != 'null'){
                     if(_typeset){
                         $this.exception($this.err("syntax error near by [ "+$this.getTypeName(arg.type)+" ... "+cursor.word+" ] !"),true);
                     }
                     if(!calling && cursor.word == 'unset' && !arg.constant){
                         arg.unset = true;
                     }
                     else if(!calling && cursor.word == 'const' && !arg.unset){
                         arg.constant = true;
                     }
                     else if(['callable', 'external'].indexOf(cursor.word) >= 0){
                         if(!calling){
                             arg[cursor.word] = true;
                         }
                         else{
                             loop.stop();
                             $this[cursor.word](ressources).then(function(method){
                                 /**
                                  * S'il y a contraint 'external' de label sur l'argument
                                  * pn verifie qu'il reçoit bien un external
                                  */
                                 if(arg.external && method.label != 'external'){
                                     $this.cursor = $this.copy(_cursor);
                                     $this.exception($this.err("external expected !"));
                                 }
                                 if(method.label != 'external'){
                                     /**
                                      * Il faut donner par référence le type de l'argument au callable
                                      */
                                     method.type = arg.type;
                                     method.implicitType = arg.implicitType;
                                 }
                                 $this.toNextChar().then(function(_char){
                                     saveArgument({char:_char, word: method}, loop).then(function(){
                                         _cursor = $this.copy($this.cursor);
                                         loop.start();
                                     });
                                 });
                             });
                             return;
                         }
                     }
                     else if(['this','super'].indexOf(cursor.word) >= 0){
                         if(calling){
                             loop.stop();
                             $this.litteral(cursor.word,ressources).then(function(result){
                                $this.toNextChar().then(function(_char){
                                    saveArgument({char:_char, word: result}, loop).then(function(){
                                        _cursor = $this.copy($this.cursor);
                                        loop.start();
                                    });
                                });
                             });
                             return;
                         }
                         else{
                             loop.stop();
                            //  $this.litteral(cursor.word,ressources).then(function(result){
                            //      console.log('[Result]',result,arg);
                            //      result = $this.extendElse($this.copy(result),arg);
                            //      arg = result;
                            //     $this.toNextChar().then(function(_char){
                            //         saveArgument({char:_char, word: result}, loop).then(function(){
                            //             _cursor = $this.copy($this.cursor);
                            //             loop.start();
                            //         });
                            //     });
                            //  });
                             console.log('[FIX] THIS !!!');
                             return;
                         }
                     }
                     else{
                         $this.exception($this.err("invalid syntax near [ "+cursor.word+" ] !"),true);
                     }
                 }
                 else{
                     _reachCursor = $this.copy($this.cursor);
                        /**
                         * On cherche à savoir si le litteral actuel est un Type
                         */
                        loop.stop();
                        $this.litteral(cursor.word,{parent: null},true).then(function(type){
                            if(type && $this.isType(type)){
                                if(arg.name || calling || (serial.label == 'external' && !$this.isTypesEqual(type, Synthetic.Lang.typeFromConstants.Any))){
                                    if(serial.label == 'external'){
                                        $this.exception("externals function don't support other type than Any");
                                    }
                                    $this.exception($this.err("invalid syntax !"),true);
                                }
                                if(arg.external && !$this.isTypesEqual(type.type,Synthetic.Lang.typeFromConstants.Any)){
                                    $this.exception($this.err("syntax error, external don't support other type than Any !"),true);
                                }
                                arg.type = type.addr;
                                arg.implicitType = type.addr;
                                _typeset = true;
                                $this.toNextChar().then(function(char){
                                    if(char == '<'){
                                        $this.genericType(type.addr).then(function(generic){
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
                            else{
                                $this.cursor = $this.copy(_reachCursor);
                                arg.name = cursor.word;
                                if(['\n', ' '].indexOf(cursor.char) >= 0){
                                    $this.toNextChar().then(function(_char){
                                        saveArgument({char:_char, word: cursor.word}, loop).then(function(){
                                            loop.start();
                                        });
                                    });
                                    return;
                                }
                                
                                saveArgument(cursor,loop).then(function(){
                                    loop.start();
                                });
                            }
                        });
                    
                     return;
                 }
             }
             else if(cursor.char == '(' && calling){
                 loop.stop();
                 $this.value({
                    object: arg,
                    ressources: ressources,
                    end: [Synthetic.Lang.constants._EOS.COMA, Synthetic.Lang.constants._EOS.PARENTHESE]
                 }).then(function(result){
                    // console.log('[Char]',$this.code.substr($this.cursor.index-1, 4));
                    var _char = $this.code[$this.cursor.index - 1];
                        
                    /**
                     * Si le caractère précédent est une ")", on doit pas procéder
                     * jusqu'au caractère non-blanc suivant avant de finir l'enregistrement
                     */
                    
                    if([')'].indexOf(_char) >= 0){
                        $this.backTo(1);
                        _cursor = $this.copy($this.cursor);
                        finishSavingArgument({char: _char, word: result},loop, function(){
                            loop.start();
                        });
                    }
                    else{
                        $this.toNextChar().then(function(__char){
                            _cursor = $this.copy($this.cursor);
                            finishSavingArgument({char: _char, word: result}, loop, function(e){
                                loop.start();
                            });
                        });
                    }
                    // console.log('[Call] FN', $this.code.substr($this.cursor.index, 10), result);
                 })
             }
             /**
              * Sinon si c'est une utilisation de fonction,
              * on recupère la valeur de la structure si on rencontre un '[' ou un '{'
              */
             else if(['[', '{'].indexOf(cursor.char) >= 0 && calling){
                 loop.stop();
                 
                 $this.struct({
                     object: arg,
                     ressources: ressources
                 }).then(function(result){
                     
                     $this.toNextChar().then(function(_char){
                         
                         saveArgument({char:_char, word: result}, loop).then(function(){
                             loop.start();
                         });
                     });
                 });
             }
             else if(cursor.char == ')'){
                 withParenthese--;
                 if(callCertitude){
                     $this.goTo(1);
                 }
                 loop.end();
             }
             else if(cursor.char == ';'){
                 /**
                  * Si on rencontre un ; on doit s'assurer que l'enregistrement des
                  * arguments est terminé
                  */
                 if(withParenthese){
                     $this.exception($this.error("illegal end of statement [ ; ] !"),true);
                 }
                 loop.end();
             }
             /**
              * Si on rencontre un ',' et qu'aucun argument n'a été pris en charge
              * Tout en ayant terminé, on doit terminer la lecture
              */
             else if([',','}'].indexOf(cursor.char) >= 0 && !$this.len(_arguments)){
                 if(withParenthese){
                     $this.exception($this.err("[ "+cursor.char+" ] unexpected !"),true);
                 }
                 loop.end();
             }
             else{
                 
                 
             }
         })
         .then(function(){
             
             if(withParenthese != 0){
                 /**
                  * Il se peut qu'un argument ait le même nom qu'une fonction définie,
                  * il faut empêcher le déclenchemenent de l'erreur
                  */
                 if($this.tryMethodInstead){
                     res(null);
                 }
                 else if(callCertitude){
                 
                     $this.exception($this.err(withParenthese < 0 ? "syntax error ! [ ) ] unexpected" : "[ ) ] expected !"),true);
                 }
             }
             
             if(calling){
                 arg = {};
                //  console.log('[_Arguments]',_arguments,arglist);
                 /**
                  * Parcourir la liste des arguments d'appel pour les comparer avec ceux
                  * des signatures pour voir s'il en existe de compatiblité
                  */
                 var arglen = {
                     saved: -1,
                     current: 0,
                     expected: $this.len(_arguments)
                 }, signature = -1, byName,pass = [];
                //  console.log('[Arglist]',arglist,_arguments);
                if(containSignature){
                    for(var i in _arguments){
                        compatible = true;
                        byName = !/^[0-9]+$/.test(i);
                        index = !byName ? i * 1 : _arguments[i].index;
                        pass = [];
                        for(var j in arglist){
                            for(var k in arglist[j]){
                                if(
                                    (byName && k == i) || 
                                    (!byName && arglist[j][k].index == index) 
                                ){
                                    if($this.isTypesEqual(_arguments[i], arglist[j][k])){
                                        compatible = true;
                                    }
                                    else{
                                        pass.push(j);
                                    }
                                }
                                else{
                                    compatible = true;
                                }
                            }
                        }
                        for(var j in pass){
                            delete arglist[pass[j]];
                        }
                    }
                    /**
                     * Récupération de la signature
                     */
                    for(var i in arglist){
                        arglen.current = $this.len(arglist[i]);
                        if(arglen.current > arglen.saved && arglen.current <= arglen.expected){
                            signature = i;
                            arglen.saved = arglen.current;
                        }
                    }
                    //  console.log('[At][end]', arglist,signature,serial);
                    if(signature < 0){
                        $this.exception($this.err("cannot find method ("+$this.getTypeName(_instance.type)+")."+serial.name+"("+$this.getArgsListTypes(_arguments, true).join(", ")+") !"));
                    }
                    signature *= 1;
                    // console.log('[Serial]',serial.name, signature, arglist);x
                    if(!signature){
                        signature = serial;
                    }
                    else{
                        signature = new Synthetic.Lang.Reference(serial.signatures[signature - 1]).getObject();
                    }
                    serial = signature.arguments;
                 }
                 else{
                    signature = serial;
                    serial = signature.arguments;
                 }
                 index = 0;
                 for(var i in _arguments){
                     if(/^[0-9]+$/.test(i)){
                         arg[i] = _arguments[i];
                         index = i * 1 + 1;
                     }
                     else{
                        //  console.log('[I]',i, _arguments[i], argName(i,false,[{type: _arguments[i].implicitType}]));
                         arg[signature >= 0 ? serial[i].index : index] = _arguments[i];
                     }
                 }
                 if($this.executing){
                     for(var i in serial){
                         if(serial[i].unset && !(serial[i].index in arg) ){
                             $this.exception($this.err("argument [ "+serial.arguments[i].name+" ] has no value set !"));
                         }
                     }
                 }
                 _arguments = arg;
             }
             /**
              * Si on n'a aucune certitude qu'on a fait appelle à la fonction
              * ce qui obligerait les '()'
              * on retourne null
              */
             if(!$this.len(_arguments) && !callCertitude){
                 res(null);
                 return;
             }
             res(calling ? {signature : signature, arguments: _arguments} : _arguments);
         });
     });
 }
 /***
  * La méthode method permet la sérialization d'une fonction ou d'une méthode
  */
 $syl.method = function(serial,ressources){
     var $this = this,
         _currentScope = $this.currentScope,
         key,
         _addr = [$this.saveObjectAddr(), $this.setObjectAddr(null)];
        //  console.log('[Scope]',_currentScope, this.currentObjectAddr)
     this.currentType = null;
     return new Promise(function(res,rej){
         var savingArg = false,executing = $this.executing,
             scope;
         if(serial.label != 'external'){
             serial.label = 'function';
         }
         serial.arguments = {};
         serial.scopeCursor = $this.cursor;
         serial.signatures = [];
         serial.braced = false;
         serial.begin = 0;
         serial.end = 0;
         serial.childScope = null;
         bodyLess = serial.abstract;
         brace = 0;
         $this.runner(function(cursor,loop){
             if(cursor.char == '(' && !savingArg){
                 loop.stop();
                 scope = $this.cursor.scope;
                 key = $this.setScope($this.cursor.scope + 1);
                 /**
                  * On crée un bloc pour éviter tout écrasement de nom
                  */
                 $this.createBlock();
                 serial.childScope = $this.currentScope;
                 $this.arguments(serial,ressources)
                 .then(function(arg){
                     
                     $this.toNextChar().then(function(_char){
                         /**
                          * On doit décrémenter le scope parce qu'on l'avait incrémenté avant la
                          * lecture des arguments
                          */
                         $this.restoreScope(key);
                         key = $this.setScope($this.cursor.scope + 1);
                         
                         serial.arguments = arg;
                         if($this.code[$this.cursor.index] == '{'){
                             if(serial.abstract){
                                 $this.exception($this.err("[ "+serial.name+" ] is declared abstract"));
                             }
                             serial.braced = true;
                             $this.goTo(1);
                         }
                         else if($this.code[$this.cursor.index] == ';'){
                            bodyLess = true;
                         }
                         else if(/[\S]+/.test($this.code[$this.cursor.index])){
                             $this.backTo(1);
                         }
                         if(!serial.braced){
                             
                         }
                         serial.scopeCursor = $this.copy($this.cursor);
                         serial.begin = $this.cursor.index;
                         $this.createBlock(serial.ref);
                         
                         loop.start();
                     });
                 });
                 return;
             }
             /**
              * On restaure le bloc parent
              */
             $this.currentScope = _currentScope;
             if(bodyLess){
                $this.restoreScope(key);
                $this.setExecutionMod(executing);
                loop.end();
                return;
             }
             $this.setExecutionMod(false);
             loop.stop();
             $this.parse(ressources, {
                 end: [Synthetic.Lang.constants._EOS.BRACE],
                 statementCount: serial.braced ? -1 : 1
             }).then(function(){
                 /**
                  * Si la function a des accolades, il faut que le EOS soit un "}"
                  * sinon on déclenche une erreur
                  */
                 $this.setExecutionMod(executing);
                 
                 if(serial.braced && $this.code[$this.cursor.index] != '}'){
                     
                     $this.exception($this.err("[ } ] expected !"),true);
                 }
                 /**
                  * Si on pense que c'est une fonction alors qu'elle n'avait pas d'accollade
                  * de debut, on enlève la décompte de scope faite précédemment !
                  */
                 if(!serial.braced && $this.code[$this.cursor.index] == '}'){
                     
                     
                 }
                 if(serial.braced){
                     $this.goTo(1);
                 }
                 else{
                     $this.backTo(1);
                 }
                 $this.restoreScope(key);
                 loop.end();
             });
         }).then(function(){
             $this.currentScope = _currentScope;
             $this.restoreObjectAddr(_addr);
             res(serial);
         })
     });
 }
 /**
  * La méthode external permet de définir une fonction orientée usage externe comme:
  *  * pont callback entre 'Synthetic' et une autre langage (ici: 'Javascript')
  */
 $syl.external = function(ressources){
     var $this = this,
         serial = this.meta({
             type: Synthetic.Lang.typeFromConstants.Any.addr,
             label: 'external',
             parent: ressources.parent
         });
     return new Promise(function(res){
         $this.runner(function(cursor,loop){
             if(cursor.word && cursor.word.length){
                 if($this.getCodeType(cursor.word) == Synthetic.Lang.constants.LITTERAL){
                     serial.name = cursor.word;
                 }
                 else{
                     $this.exception($this.err("syntax error near by [ "+$this.code.substr($this.cursor.index-5,10)+" ]"),true);
                 }
             }
             if(cursor.char == '('){
                 loop.stop();
                 $this.method(serial,ressources).then(function(method){
                     loop.end();
                     res(method);
                 });
             }
         });
     });
 }
 /**
  * La méthode callable permet de définir sainement une fonction
  */
 $syl.callable = function(ressources){
     var $this = this,
         serial = this.meta({
             type: Synthetic.Lang.typeFromConstants.Any.addr,
             label: 'function',
             labelConstraint: 'callable',
             parent: ressources.parent
         });
     return new Promise(function(res){
         $this.runner(function(cursor,loop){
             if(cursor.word && cursor.word.length){
                 $this.exception($this.err("syntax error near by [ ..."+$this.code.substr($this.cursor.index-5,10)+"... ]"),true);
             }
             if(cursor.char == '('){
                 loop.stop();
                 $this.method(serial,ressources).then(function(method){
                     loop.end();
                     res(method);
                 });
             }
         });
     });
 }
 /**
  * La méthode littéral permet de définir si le littéral en cours sera soit :
  *  * la déclaration d'une variable, 
  *  * l'appelation d'une fonction haut niveau
  *  * la déclaration d'une fonction
 */
 $syl.litteral = function(litteral,ressources,ref){
    //  console.log('[Litteral]',litteral);
        //  console.log('[ADDR][start]',this.currentObjectAddr,litteral,typeof Synthetic.Lang.objects[this.currentObjectAddr])
     var $this = this,
         assignType = this.currentType,
         ref = this.set(ref,false),
         type = this.getType(),
         syntObject = $this.find(litteral),
         key = [this.saveObjectAddr()],
         MegaScope = $this.getCurrentMegaStructure(),
         usingObjectKey = [$this.saveStructure('object')],/** Sauvegarde de l'actuel objet en utilisation */
         _scopeKey = [this.saveScope(true)],
         _currentObjetAddr = this.currentObjectAddr,
         forInArgSearching = $this.getStructure('currentLoop') && $this.getStructure('currentLoop').type == 'forin' && !$this.getStructure('currentLoop').argset,
         redefinition = this.currentType != null && !forInArgSearching,
         exist = !redefinition && syntObject != null && !$this.access.override,
         settingKey = null, settingKeyObject = null,
         created = false, dotted = false, nextWord = '',
         serial = exist || ref ? syntObject : this.meta({
             type: type.type,
             typeOrigin: type.origin,
             parent: this.set(ressources.parent,null),
             constraints: type.constraints,
             label: 'variable', 
             name: litteral, 
             static: this.access.static,
             abstract: this.access.abstract || MegaScope && !ref && MegaScope.label == 'interface',
             visible: MegaScope ? !this.access.private && !this.access.protected : this.access.export,
             protected: MegaScope ? this.access.protected : false,
             parent: this.set(ressources.parent,null)
         }, !forInArgSearching && ['this','super'].indexOf(litteral) < 0),
         exist = !forInArgSearching && exist && MegaScope == null,
         resultValue = exist ? syntObject : null, called = false,
        //  previousObject = resultValue,
         _currentObjectInUse = null,
         _cursor;

         if(!$this.isType(serial) && MegaScope && serial){
            /**
             * On libère de la mémoire l'ancien objet
             */
            serial = this.meta({
                type: type.type,
                typeOrigin: type.origin,
                parent: this.set(ressources.parent,null),
                constraints: type.constraints,
                label: 'variable', 
                name: litteral, 
                static: this.access.static,
                abstract: this.access.abstract || MegaScope && !ref && MegaScope.label == 'interface',
                visible: MegaScope ? !this.access.private && !this.access.protected : this.access.export,
                protected: MegaScope ? this.access.protected : false,
                parent: this.set(ressources.parent,null)
            }, !forInArgSearching && ['this','super'].indexOf(litteral) < 0);
         }
         else if($this.isType(serial)){
             resultValue = serial;
         }

         /**
          * On ne peut pas déclarer une abstraction à l'extérieur d'une structure
          */
         if(serial && serial.abstract && ['trait','interface','class'].indexOf(serial.label) < 0){
            if(MegaScope){
                if(!MegaScope.abstract){
                    $this.exception($this.err("Error ! declaration inside a non abstract structure !"));
                }
            }
            else{
                $this.exception($this.err("Error ! declaration out of structure scope !"));
            }
         }

        //  console.log('[Litteral]',litteral, exist);
         
         if(['this','super'].indexOf(litteral) >= 0){
            //  console.log('[Keys]',usingObjectKey, $this.getStructure('instance'));
            //  console.log('__[Scope]',this.currentScope);
            if($this.executing){
             _currentObjectInUse = $this.getStructure('instance');
             if(!_currentObjectInUse){
                 $this.exception($this.err("[ "+litteral+" ] does not point to any structure !"));
             }
            //  console.log('[Object]',_currentObjectInUse);
             serial = $this.meta({
                 type: _currentObjectInUse.object.type,
                 label: 'object',
                 name: litteral,
                 value: _currentObjectInUse.value,
                 object: _currentObjectInUse.object
             },false);
             resultValue = serial;
             previousObject = resultValue;
             exist = $this.executing;
            //  if(!$this.executing){
            //     console.log('[THIS]',_currentObjectInUse);
            //  }
            }
            else{
                serial = $this.meta({type: "variable", value: null},false);
                resultValue = null;
            }
            // console.log('[Block]',_curr,$this.modules[$this.currentScope]);
         }

        
         if(MegaScope && !ref){
            /**
             * Si la Mégastructure est static, tous ses membres doivent être aussi static
             */
            // console.log('[Litteral]',litteral, serial, true);
            if(MegaScope.static && !serial.static && !$this.isType(serial)){
                // console.log('[Litteral]', resultValue, litteral, exist, serial);
                $this.exception($this.err("static member expected for  ("+MegaScope.name+")." +serial.name+"(...) is not static"));
            }
            /**
             * Si la Mégastructure est une interface, tous ses membres doivent être aussi abstraits
             */
            if(MegaScope.label == 'interface' && !serial.abstract && !$this.isType(serial)){
                $this.exception($this.err("abstract member expected for [ "+MegaScope.name+" ], [ " +resultValue.name+" ] is not abstract"));
            }
            /**
             * Si le constructeur d'une mégastructure ne peut pas être static
             */
            if(litteral == MegaScope.name){
                if(serial.static){
                    $this.exception($this.err("syntax error ! static ... "+litteral+"(...)"));
                }
            }
         }
         if(forInArgSearching && serial.label == 'variable' && $this.types.indexOf(serial.name) < 0){
             $this.getStructure('currentLoop').args.push(serial);
         }
     return new Promise(function(res){
         if(syntObject != null && $this.isType(syntObject) && assignType != null){
             if(!$this.getStructure('currentLoop') || $this.getStructure('currentLoop').type != 'forin' || $this.getStructure('currentLoop').argset){
                $this.exception($this.err("syntax error : "+$this.getTypeName(assignType.type)+" ... "+syntObject.name),true);
             }
             else{
                 $this.currentType = null;
                 assignType = null;
             }
         }
         if(redefinition && exist && (resultValue.constant || resultValue.final) ){
             $this.exception($this.err("cannot override [ "+litteral+" ] declared previously as "+(resultValue.constant ? 'constant' : 'final')+" !"));
         }
         _cursor = $this.copy($this.cursor);
         if(ref && !exist){
             res(null);
             return;
         }
         $this.runner(function(cursor,loop){ 
             loop.stop();
             if(cursor.char.length){
                 $this.backTo(cursor.char.length - 1);
             }
             if(dotted){
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
                     if($this.executing){
                        /**
                         * Si l'objet en cours est null
                         * on ne peut pas procéder au syntaxe pointé
                         */
                        if(resultValue == null && $this.executing){
                            $this.cursor = $this.copy(_cursor);
                            $this.exception($this.err("Cannot read property [ "+nextWord+" ] of null"));
                        }
                        // console.log('[Result]',resultValue);
                        if($this.containsKey(nextWord,resultValue)){
                            previousObject = resultValue;
                            resultValue = $this.getValueOf(nextWord,resultValue);
                            _cursor = $this.copy($this.cursor);
                        }
                        else{
                            /**
                             * Si l'objet exist mais pas la clé,
                             * on le prépare paresseusement pour un enregistrement
                             */
                            if($this.isTypesEqual(resultValue, Synthetic.Lang.typeFromConstants.JSON) && exist){
                                settingKey = nextWord;
                                settingKeyObject = resultValue;
                            }
                            else{
                                $this.exception($this.err("can not read value of property [ "+nextWord+" ] "));
                            }
                            resultValue = null;
                            _cursor = $this.copy($this.cursor);
                        }
                     }
                     dotted = false;
                     if(called){
                         called = false;
                     }
                     nextWord = '';
                     cursor.word = '';
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

                 if(['=','+=','-=','/=','*=','~=', '--', '++'].indexOf(cursor.char) >= 0){
                     /**
                      * Si on recherche des arguments pour la boucle for ... in
                      * on empêche une affectation
                      */
                     if(forInArgSearching){
                         $this.exception($this.err("syntax error withing for ... in statement"),true);
                     }
                     if(ref){
                         loop.end();
                         return;
                     }
                     /**
                      * Si le sign est '=' on avance la lecture pour éviter une
                      * mésinterprétation du signe même
                      */
                     if(cursor.char == '='){
                        $this.goTo(1);
                     }
                     /**
                      * Si la variable est en mode création
                      * On évite le conflit de redéfinition si elle reférencera une autre
                      * variable comme valeur. 
                      */
                     if(!exist && cursor.char == '='){
                         $this.currentType = null;
                     }
                     /**
                      * Si l'objet n'existe pas et que c'est n'est pas une création d'objet
                      * on lève une exception
                      */
                     if(!exist && cursor.char != '=' && $this.executing){
                         $this.exception($this.err("cannot modified undefined object [ "+(settingKey ? settingKey : litteral)+" ] value"));
                     }
                     if(!exist || resultValue || !settingKey){
                         key.push($this.setObjectAddr(exist ? resultValue.addr : serial.addr));
                     }
                     if(cursor.char == '=' && exist && resultValue){
                         
                         $this.freeLinkOf(resultValue);
                     }
                     
                     if(settingKey){
                         _scopeKey.push($this.setScope(settingKeyObject.childScope));
                         _scopeKey.push($this.saveScope());
                         _scopeKey.push($this.setScope(settingKeyObject.cursor.scope + 1));
                         settingKey = $this.meta({
                             name: settingKey,
                             constraints: serial.constraints,
                             visible: false,
                             value: null
                         }, false);
                         $this.linkWith(settingKey,serial);
                         
                         key.push($this.setObjectAddr(settingKey.addr));
                         
                     } 
                     if(exist && cursor.char == '=' && resultValue && ( resultValue.constant || resultValue.final ) ){
                         $this.exception($this.err("cannot override [ "+litteral+" ] declared previously as "+(resultValue.constant ? 'constant' : 'final')+" !"));
                     }
                     /**
                      * On doit donner à la variable la clé 'value' pour ne pas être supprimée
                      * Si on est entrain de la créer
                      */
                     if(!exist){
                         serial.value = null;
                     }
                     if(['--', '++'].indexOf(cursor.char) >= 0){
                        // console.log('[Litt][Next]',$this.code.substr($this.cursor.index, 10));
                         if($this.executing){
                             var tmp = {
                                 name : resultValue.name,
                                 visible : resultValue.visible,
                                 addr: resultValue.addr
                             };
                             
                             resultValue.value = $this.calc([resultValue, cursor.char == '++' ? '+=' : '-=', $this.meta({type: Synthetic.Lang.typeFromConstants.Number.addr, label: 'variable', value: 1})]).value;
                             $this.extend(resultValue, tmp,true);
                         }
                         loop.end();
                     }
                     else{
                         $this.value({
                             object: exist ? resultValue && !settingKey ? resultValue : settingKey : serial, 
                             subvariables: false, 
                             ressources:ressources,
                             ternary: false,
                             end: assignType != null ? [Synthetic.Lang.constants._EOS.COMA] : []
                         }).then(function(result){
                            // if(MegaScope == null && result && !exist){
                            //    console.log('[Exist]',$this.executing,litteral);
                            //    for(var i in result.value){
                            //        console.log('[For]',i, 'exist->', Synthetic.Lang.objects[result.value.addr] == result.value)
                            //    }
                            // }
                             if($this.code[$this.cursor.index-1] == ','){
                                 $this.currentType = assignType;
                             }
                             if(exist){
                                 if(settingKey){
                                     /**
                                      * Si c'est un callable
                                      * On doit vérifier que le type de retour n'est pas multiple
                                      */
                                    //  console.log('[KEY]', result, settingKey);
                                     if($this.isCallable(result) && serial.constraints && serial.constraints.value.length > 1 && !$this.isValidateConstraint(Synthetic.Lang.typeFromConstants.Any, serial.constraints.value)){
                                         $this.cursor = $this.copy(_cursor);
                                         $this.exception($this.err("too much return value types !"));
                                     }

                                     settingKeyObject.value[settingKey.name] = $this.extend(settingKey, $this.copy(result));
                                     if(serial.constraints){
                                         /**
                                          * Si le resulta est un external, on vérifier qu'il n'y a acceptation que
                                          * du type 'Any'
                                          */
                                         if(result.label == 'external' && !$this.isValidateConstraint(Synthetic.Lang.typeFromConstants.Any, serial.constraints.value)){
                                             $this.cursor = $this.copy(_cursor);
                                             $this.exception($this.err("external structure don't support other type than Any, "+$this.getTypeName(serial.constraints.value[0].type)+" was given !"));
                                         }
                                         /**
                                          * Si c'est une fonction et que le type est Any
                                          * On lui passe le type principale de la contrainte de la 
                                          * structure
                                          */
                                         if($this.isTypesEqual(result.type,Synthetic.Lang.typeFromConstants.Any) && $this.isCallable(result)){
                                             settingKeyObject.value[settingKey.name].type =  serial.constraints.value[0].type;
                                         }
                                         /**
                                          * Sinon Si le type de la valeur n'est pas compatible aux contraintes
                                          * de la structure, on lève une erreur
                                          */
                                         else if(!$this.isValidateConstraint(result, serial.constraints.value)){
                                             $this.cursor = $this.copy(_cursor);
                                             $this.exception($this.err($this.toStringTypes(serial.constraints.value)+" value expected, "+$this.getTypeName(result.implicitType)+" given !"));
                                         }
                                     }
                                     $this.save(settingKey);
                                     $this.restoreScope(_scopeKey);
                                     _scopeKey = [];
                                 }
                                 else{
                                     var tmp = {
                                         name : resultValue.name,
                                         visible : resultValue.visible,
                                         addr: resultValue.addr
                                     };
                                     if(cursor.char != '='){
                                         result = $this.calc([resultValue, cursor.char, result]);
                                     }
                                    $this.extend(resultValue, result,true);
                                    $this.extend(resultValue, tmp,true);
                                 }
                             }
                             else{
                                 if($this.executing){
                                     delete serial.value;
                                     $this.extendElse(serial,result);
                                     if(!result){
                                         $this.exception($this.err("previous syntax error detected !"));
                                     }
                                     serial.implicitType = result.implicitType;
                                     if(["function", 'external', 'object'].indexOf(result.label) >= 0){
                                        //  console.log('[OBJECT]',result.object, $this.getTypeName(result.type));
                                         serial.label = result.label;
                                     }
                                     _cursor = $this.copy($this.cursor);
                                     created = true;
                                     resultValue = serial;
                                 }
                             }
                             loop.end();
                         });
                     }
                 }
                 
                 else if(cursor.char == '('){
                     if(ref){
                         loop.end();
                         return;
                     }
                     /**
                      * Si la variable resultValue n'est pas nulle, c'est lui
                      * le serial à présent
                      */
                     serial = resultValue != null ? resultValue : serial;
                     if(
                         !exist || 
                         (
                             exist && 
                             (redefinition || settingKey) && 
                             !$this.isCallable(serial,true) && 
                             (serial.constant || serial.final) 
                          ) ||
                          /**
                           * Pour permettre l'enregistrement d'un constructeur
                          */
                          (MegaScope && serial.label == 'class' && serial.name == MegaScope.name)
                      ){
                         if(exist){
                             if(settingKey){
                                 if(!$this.isTypesEqual(serial.type,Synthetic.Lang.typeFromConstants.JSON)){
                                     $this.exception($this.err("cannot add [ "+settingKey+" ] to [ "+serial.name+" ], JSON type required !"));
                                 }
                                 if(serial.constraints && serial.constraints.length > 1){
                                     $this.exception($this.err("too much return type !"));
                                 }
                                 if(serial.constraints && !$this.isValidateConstraint(Synthetic.Lang.typeFromConstants.String, serial.constraints.key)){
                                     $this.exception($this.err($this.toStringTypes(serial.constraints.key)+" key type expected String given !"));
                                 }
                                 serial.value[settingKey] = $this.meta({
                                     type: !serial.constraints ? Synthetic.Lang.typeFromConstants.Any.addr : serial.constraints.value[0].type,
                                     name: settingKey,
                                     constraints: !serial.constraints ? null : serial.constraints.value[0].constraints,
                                 });
                                 serial = serial.value[settingKey];
                             }
                         }
                         else if(MegaScope && MegaScope.name == litteral){
                            serial = $this.meta({
                                type: type.type,
                                typeOrigin: type.origin,
                                parent: serial.parent,
                                constraints: type.constraints,
                                label: 'function',
                                name: litteral, 
                                visible: serial.visible
                            },true);
                         }
                         $this.method(serial,ressources).then(function(method){
                             resultValue = method;
                             _cursor = $this.copy($this.cursor);
                            //  console.log('[NAME]',method.name);
                             /**
                              * Pour empêcher d'interpréter fraichement la fonction
                              * on dit qu'elle n'a pas existée et on désactive l'écriture pointée
                              */
                             if(exist && settingKey){
                                 exist = false;
                                 dotted = false;
                             }
                             created = true;
                             if(MegaScope){
                                 loop.end();
                                 return;
                             }
                             loop.start();
                         });
                     }
                     else{
                        //  console.log('[Result]',resultValue);
                         if(!$this.isCallable(resultValue,true)){
                             $this.exception($this.err("cannot call "+(resultValue ? "[ "+resultValue.name+" ]" : "from null")+" !"));
                         }
                         if(MegaScope){
                             $this.exception($this.err("illegal method calling !"));
                         }
                         /**
                          * Si c'est un object auquel on accède à une de ses méthodes
                          * on laisse sa trace dans l'objet en cours
                          */
                        //  if(previousObject && previousObject.label == 'object'){
                        //     usingObjectKey.push($this.setStructure('instance', previousObject));
                        //  }
                         $this.caller(resultValue,ressources).then(function(result){
                             resultValue = result;
                             
                             _cursor = $this.copy($this.cursor);
                             called = true;
                            //  $this.restoreStructure('instance', usingObjectKey);
                             if($this.code[$this.cursor.index] == ';'){
                                 loop.end();
                                 return;
                             }
                             loop.start();
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
                    /**
                     * Si on recherche des arguments pour la boucle for ... in
                     * on empêche une affectation
                     */
                     if(forInArgSearching){
                        $this.exception($this.err("syntax error withing for ... in statement"),true);
                     }
                     if(!exist && resultValue == null){
                         $this.exception($this.err("[ "+cursor.char+" ] unexpected !"),true);
                     }
                     if(dotted){
                         $this.exception($this.err("syntax error !"),true);
                     }
                     
                     dotted = false;
                     $this.goTo(1);
                     loop.stop();
                     $this.value({
                         object: $this.meta({
                             type: Synthetic.Lang.typeFromConstants.Any.addr
                         },false), 
                         subvariables: false, 
                         ressources:ressources,
                         ternary: false,
                         end: [Synthetic.Lang.constants._EOS.BRACKET]
                     }).then(function(result){
                         if($this.containsKey(result.value, resultValue)){
                             previousObject = resultValue;
                             resultValue = $this.getValueOf(result.value,resultValue);
                         }
                         else{
                             /**
                              * Si l'objet exist mais pas la clé,
                              * on le prépare paresseusement pour un enregistrement
                              */
                             if($this.isTypeInBaseTypeList(['Array', 'JSON'],resultValue.type) && exist){
                                 settingKey = result.value;
                                 settingKeyObject = resultValue;
                             }
                             resultValue = null;
                         }
                         
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
                             $this.exception($this.err("invalid syntax !"),true);
                         }
                         if($this.containsKey(nextWord, resultValue)){
                             previousObject = resultValue;
                             resultValue = $this.getValueOf(nextWord,resultValue);
                         }
                         else{
                             resultValue = null;
                             dotted = false;
                         }
                     }
                     else{
                         dotted = true;
                     }
                     if(called){
                         called = false;
                     }
                     cursor.word = '';
                     nextWord = '';
                     $this.cursor.index++;
                     loop.start();
                 }
                 /**
                  * Si on rencontrer un ',' ou un ';' on procède ainsi
                  */
                 else if([',',';'].indexOf(cursor.char) >= 0){
                    /**
                     * Si on recherche des arguments pour la boucle for ... in
                     * on empêche une affectation
                     */
                    if(forInArgSearching && cursor.char == ';'){
                        $this.exception($this.err("syntax error withing for ... in statement"),true);
                    }
                    if(!exist){
                        serial.value = 'value' in serial ? serial.value : null;
                        if(cursor.char == ','){
                            $this.currentType = type;
                        }
                        resultValue = serial;
                    }
                    loop.end();
                 }
                 else{
                    /**
                     * Si on recherche des arguments pour la boucle for ... in
                     * on empêche une affectation
                     */
                     if(forInArgSearching){
                        loop.end();
                        return;
                     }
                     if(ref){
                         loop.end();
                         return;
                     }
                     if(resultValue == null && settingKey){
                         $this.exception($this.err("can not read value of property [ "+settingKey+" ] "));
                     }
                    //  console.log('[Litt][End]',litteral,exist,$this.tryMethodInstead);
                     if(!exist && $this.executing && !created && resultValue == null && !$this.isType(serial)){
                         if($this.tryMethodInstead){
                            // console.log('[Litt]',litteral);
                             if($this.executing){
                                resultValue = null;
                                $this.garbage(true);
                                $this.tryMethodInsteadConfirmed = true;
                             }
                             else{
                                 resultValue = $this.toVariableStructure(null);
                             }
                             loop.end();
                             return;
                         }
                         else{
                            //  console.log('[Modules]',serial)
                            //  console.log('[Code]',$this.code.substr($this.cursor.index, 10));
                            console.log('[FORIN]',forInArgSearching,$this.getStructure('currentLoop'));
                             $this.exception($this.err("[ "+litteral+" ] is undefined !"));
                         }
                     }
                     if(exist && resultValue && $this.isCallable(resultValue) && !dotted){
                         if(called){
                             if(cursor.char.length && /[\S]+/.test(cursor.char)){
                                
                                 $this.backTo(cursor.char.length - (cursor.char.length == 1 ? 1 : 0));
                             }
                             loop.end();
                             return;
                         }
                         $this.caller(resultValue,ressources).then(function(result){
                             resultValue = result;
                             $this.linkWith(resultValue);
                             called = true;
                            
                             if($this.code[$this.cursor.index] == ';'){
                                 loop.end();
                                 return;
                             }
                             loop.start();
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
                         
                         if(cursor.char.length && /[\S]+/.test(cursor.char)){
                             $this.backTo(cursor.char.length - (cursor.char.length == 1 ? 1 : 0));   
                         }
                         $this.linkWith(resultValue);
                         loop.end();
                     }
                     else{
                         $this.goTo(1);
                         loop.start();
                     }
                 }
             });
         }).then(function(){
             /**
              * S'il y a une mégastructure comme
              */
            if(MegaScope && ['function','variable','mixin'].indexOf(resultValue.label) >= 0){
                /**
                 * Si c'est un constructeur, on l'enregistre comme constructeur
                 */
                $this.linkWith(resultValue,MegaScope);
                if(resultValue.name == MegaScope.name && resultValue.label == 'function'){
                    if(MegaScope.label != 'class'){
                        $this.exception($this.err("Only class can have constructor !"));
                    }
                    resultValue.label = 'constructor';
                    resultValue.type = MegaScope.type;
                    resultValue.implicitType = MegaScope.type;
                    /**
                     * Si le class n'a pas de constructeur, on définit son premier
                     */
                    if(!MegaScope._constructor){
                        MegaScope._constructor = resultValue;
                    }
                    /**
                     * On vérifie qu'il n'a pas eu de signature preéxistante de la même sorte
                     */
                    else if(!$this.isSignaturesSuitable(MegaScope._constructor, resultValue)){
                        MegaScope._constructor.signatures.push(resultValue.addr);
                    }
                    /**
                     * Sinon on n'accepte pas le surcharge de même signature
                     */
                    else{
                        $this.exception($this.err("error from overriding [ "+resultValue.name+" ]"));
                    }
                }
                /**
                 * Sinon, on l'enregistre comme membre
                 */
                else{
                    /**
                     * Si le nom de l'objet existe déjà dans le mégaScope
                     */
                    // console.log('[Struct]',MegaScope.members, resultValue.name, resultValue.addr, exist);
                    if(MegaScope.label == 'class'){
                        $this.checkIfCanOverrideMethod(MegaScope, resultValue);
                    }
                    if(resultValue.name in MegaScope.members){
                        var member = $this.getObjectFromAddr(MegaScope.members[resultValue.name]);
                        // console.log('[SIGN]',{member,resultValue});
                        /**
                         * On vérifie :
                         *  * Si les label sont équivalents, c'est-à-dire
                         *      * un mixin peut surcharger seulement un autre mixin
                         *      * une méthode peut surcharger seulement une autre méthode
                         *      * dans un cas différent, une erreur est levée
                         *  * Si c'est un attribut (variable) pour déclencher une erreur
                         */
                        if(member.label != resultValue.label || 
                            [member.label, resultValue.label].indexOf('variable') >= 0 ||
                            member.static != resultValue.static
                        ){
                            $this.cursor = $this.copy(resultValue.cursor);
                            $this.exception($this.err("error from overriding [ "+resultValue.name+" ]"));
                        }
                        else if(member.final != resultValue.final || member.static != resultValue.static){
                            if(member.final != resultValue.final){
                                $this.exception($this.err("[ "+resultValue.name+" ] was "+(member.final ? "" : "not")+" previously declared final."));
                            }
                            if(member.static != resultValue.static){
                                $this.exception($this.err("[ "+resultValue.name+" ] was "+(member.static ? "" : "not")+" previously declared static."));
                            }
                        }
                        if($this.isSignaturesSuitable(member, resultValue)){
                            $this.exception($this.err("[ "+resultValue.name+" ] signature are already defined !"));
                        }
                        else{
                            member.signatures.push(resultValue.addr);
                        }
                    }
                    else{
                        MegaScope.members[resultValue.name] = resultValue.addr;
                    }
                }
                /**
                 * On lie l'objet actuel à la structure actuelle pour le garder en mémoire
                 */
                // $this.linkWith(resultValue, MegaScope);
                /**
                 * Si l'objet est static, on le définit en valeur de la classe
                 */
                if(resultValue.static && !(resultValue.name in MegaScope.value)){
                    MegaScope.value[resultValue.name] = resultValue;
                }
            }
             $this.restoreObjectAddr(key);
            //  console.log('[ADDR][end]',$this.currentObjectAddr,litteral,typeof Synthetic.Lang.objects[$this.currentObjectAddr])
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
         ressource = this.set(ressource,{parent: null}),
         object = null,
         _end,_start, statement = 0;
         
         data.end = Array.isArray(data.end) ? data.end : [];
         data.start = Array.isArray(data.start) ? data.start : [];
         preOperation = null;
         data.statementCount = this.set(data.statementCount,-1);
         data.stopOnBreak = this.set(data.stopOnBreak,false);
         data.stopOnBrace = this.set(data.stopOnBrace,false);
     return new Promise(function(resolve, reject){
         $this.runner(function(cursor,loop){
             /**
              * S'il y a un mot trouvé, on va vérifier:
              */
             _end = Synthetic.Lang.constants._EOS.values.end.indexOf(cursor.char);
             _start = Synthetic.Lang.constants._EOS.values.start.indexOf(cursor.char);
            
             if(cursor.word){
                 if(cursor.char.length){
                     $this.backTo(cursor.char.length - 1);
                 }
                
                 /**
                  * S'il existe dans la liste des mots-clés réservés
                  */
                 if(Synthetic.Lang.reservedKeys.indexOf(cursor.word) >= 0){
                    /**
                     * Si on attend un pré-post incrementation, on assure que c'est fait obligatoirement
                     */
                    if(preOperation){
                        $this.exception($this.err("Invalid pre-"+(preOperation == '++' ? 'incrementation' : 'decrementation')+" syntax !"),true);
                    }
                     if(cursor.word == "null"){
                         /**
                          * On préserve l'intégrité syntaxique de la structure
                          * switch s'il y en a
                          */
                         if($this.getStructure('currentSwitch')){
                             $this.exception($this.err("[ " + cursor.word + " ] unexpected withing switch statement scope"),true);
                         }
                         /**
                          * On préserve l'intégrité syntaxique de la structure
                          * try ... catch s'il y en a
                          */
                         if($this.getStructure('tryingBlock') && $this.getStructure('tryingBlock').reachCatch){
                             $this.exception($this.err("[ " + cursor.word + " ] unexpected !"),true);
                         }
                         object = $this.toVariableStructure(null,ressource);
                     }
                     else if(data.stopOnBreak && cursor.word == 'break'){
                         loop.end();
                     }
                     else{
                         loop.stop();
                         /**
                          * On préserve l'intégrité syntaxique de la structure
                          * switch s'il y en a
                          */
                         if($this.getStructure('currentSwitch') && ['case','default'].indexOf(cursor.word) < 0){
                             $this.exception($this.err("[ " + cursor.word + " ] unexpected withing switch statement scope"));
                         }
                         /**
                          * On préserve l'intégrité syntaxique de la structure
                          * try ... catch s'il y en a
                          */
                         if($this.getStructure('tryingBlock') && $this.getStructure('tryingBlock').reachCatch && ['catch'].indexOf(cursor.word) < 0){
                             $this.exception($this.err("[ " + cursor.word + " ] unexpected !"),true);
                         }
                         /**
                          * Si on a une boucle for ... in et qu'on définit ses arguments
                          */
                        if($this.getStructure('currentLoop') && $this.getStructure('currentLoop').type == 'forin' && !$this.getStructure('currentLoop').argset && cursor.word == 'in'){
                            if($this.getStructure('currentLoop').args.length == 0){
                                $this.exception($this.err("No iteration variable was defined for the for ... in loop !"),true);
                            }
                            loop.end();
                            return;
                        }
                        /**
                         * Si on execute les arguments d'une boucle for, on ne veut pas de mot-clé
                         */
                        if($this.getStructure('currentLoop') && $this.getStructure('currentLoop').type == 'for' && !$this.getStructure('currentLoop').argset){
                            $this.exception($this.err("syntax error within for scope"),true);
                            return;
                        }
                        // console.log('[Word]', cursor.word);
                         $this[cursor.word](ressource).then(function(result){
                             if(Synthetic.Lang.valuableReservedKeys.indexOf(cursor.word) >= 0){
                                 object = result;
                             }
                             statement++;
                             
                             if(data.statementCount >= statement){
                                 loop.end();
                             }
                             else{
                                 loop.start();
                             }
                         });
                     }
                     return;
                 }
                 
                 /**
                  * Sinon c'est un litéral
                  */
                 else if([Synthetic.Lang.constants.LITTERAL, Synthetic.Lang.constants.TYPE].indexOf($this.getCodeType(cursor.word)) >= 0){
                     loop.stop();
                     /**
                      * On préserve l'intégrité syntaxique de la structure
                      * switch s'il y en a
                      */
                     if($this.getStructure('currentSwitch')){
                         $this.exception($this.err("[ " + cursor.word + " ] unexpected withing switch statement scope"));
                     }
                     /**
                      * On préserve l'intégrité syntaxique de la structure
                      * try ... catch s'il y en a
                      */
                     if($this.getStructure('tryingBlock') && $this.getStructure('tryingBlock').reachCatch){
                         $this.exception($this.err("[ " + cursor.word + " ] unexpected !"),true);
                     }
                     $this.litteral(cursor.word, ressource).then(function(result){
                        /**
                         * Si on attend un pré-post incrementation, on assure que c'est fait obligatoirement
                         */
                         if(preOperation && $this.executing){
                             if(!$this.isTypesEqual(result,Synthetic.Lang.typeFromConstants.Number) || result.label != 'variable'){
                                $this.exception($this.err("Invalid pre-"+(preOperation == '++' ? 'incrementation' : 'decrementation')+" syntax !"),true);
                             }
                            
                             result.value = $this.calc([result, preOperation == '++' ? '+' : '-', $this.toVariableStructure(1)]).value;
                            
                         }
                         preOperation = null;
                         if(result && $this.isType(result)){
                             $this.currentType = {
                                 type: result.addr,
                                 constraints: null,
                                 object: result
                             };
                         }
                         else{
                             object = result;
                         }
                         statement++;
                        
                         if(data.statementCount >= statement){
                             loop.end();
                         }
                         else{
                             loop.start();
                         }
                     });
                     return;
                 }
                 else if(/[\S]+/.test(cursor.word)){
                     
                 }
             }
             else{
                 if(['--','++'].indexOf(cursor.char) >= 0){
                     preOperation = cursor.char;
                 }
             }
             /**
              * Si on constate un caractère EOS sous demande, on met fin à la lecture
              */
             if(data.end.indexOf(_end) >= 0 || data.start.indexOf(_start) >= 0 ||
                ($this.code[$this.cursor.index - 1] == ';' && data.end.indexOf(Synthetic.Lang.constants._EOS.SEMICOLON) >= 0)
            ){
                 /**
                  * Si on attend un pré-post incrementation, on assure que c'est fait obligatoirement
                  */
                 if(preOperation){
                     $this.exception($this.err("Invalid pre-"+(preOperation == '++' ? 'incrementation' : 'decrementation')+" syntax !"),true);
                 }
                 
                 if(cursor.char == '}' && statement){
                     $this.fixScope(true);
                 }
                 loop.end();
                 return;
             }
             else if(['<', ' ', '\n'].indexOf(cursor.char) < 0 && Synthetic.Lang.blockEOS.indexOf(cursor.char) < 0 && $this.getCodeType(cursor.char) != Synthetic.Lang.constants.LITTERAL){
                
             }
             /**
              * on suggère qu'il y a un type prise en compte pour voir s'il y a généricité
              */
             if($this.currentType != null && cursor.char == '<'){
                /**
                 * Si on attend un pré-post incrementation, on assure que c'est fait obligatoirement
                 */
                if(preOperation){
                    $this.exception($this.err("Invalid pre-"+(preOperation == '++' ? 'incrementation' : 'decrementation')+" syntax !"),true);
                }
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
                //  console.log('[Modules]',$this.modules[$this.rootScope].modules.master, Synthetic.Lang.objects);
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
 $syl.class = function(ressources,label){
     var $this = this,
         label = this.set(label, 'class');
     return new Promise(function(resolve, reject){
         $this.accessErr("protected", label);
         if(label != 'class'){
             $this.accessErr("final", label);
         }
         var  serial = $this.meta({
             label: label,
             parent: $this.set(ressources.parent,null),
             visible: !$this.access.private,
             static: $this.access.static,
             abstract: $this.access.abstract || label == 'interface',
             final: $this.access.final,
             _constructor: null,
             supertypes: [],
             superclass: [],
             members: {},
             value: {}
         }),
         _scopeKey = [$this.saveScope(), $this.saveScope(true)],
         _addrKey = [$this.saveObjectAddr(), $this.setObjectAddr(serial.addr)],
         old, parent, toImplement = null,
         extending = false, implementing = false, waitingNext = false;
         serial.type = serial.addr;
         serial.implicitType = serial.addr;

         /**
          * On va parcourir l'ensemble des membres de la structure parente
          * pour enregistrer tous ses membres abstraits à implémenter
          */
         function setImplementation(parent,replace){
            if(!toImplement){
                toImplement = {};
            }
            var signatures, signature, replace = $this.set(replace,true);
            for(var i in parent.members){
                if(replace || !(i in toImplement)){
                    toImplement[i] = [];
                    signature = $this.getObjectFromAddr(parent.members[i]);
                    if(signature.abstract){
                        toImplement[i].push(parent.members[i]);
                    }
                    signatures = $this.getObjectFromAddr(parent.members[i]).signatures;
                    for(var j in signatures){
                        if($this.getObjectFromAddr(signatures[j]).abstract){
                            toImplement[i].push(signatures[j]);
                        }
                    }
                }
            }
            for(var i in parent.superclass){
                setImplementation($this.getObjectFromAddr(parent.superclass[i]), false);
            }
         }
        //  console.log('[Serial]',serial);
         $this.runner(function(cursor,loop){
             if(cursor.word && cursor.word.length){
                 if([Synthetic.Lang.constants.LITTERAL, Synthetic.Lang.constants.TYPE].indexOf($this.getCodeType(cursor.word)) < 0){
                     if(!waitingNext && (!serial.name || ['extends', 'implements'].indexOf(cursor.word) < 0)){
                        $this.exception($this.err("illegal statement ["+cursor.word+"] encountered !"),true);
                     }
                     else if(cursor.word == 'extends'){
                        if(implementing){
                            $this.exception($this.err("syntax error :: implements .... extends"))
                        }
                        if(extending){
                            $this.exception($this.err("syntax error :: extends .... extends"))
                        }
                        waitingNext = true;
                        extending = true;
                     }
                     else if(cursor.word == 'implements'){
                        if(implementing){
                            $this.exception($this.err("syntax error :: implements .... implements"))
                        }
                        implementing = true;
                        waitingNext = true;
                     }
                     else{
                         $this.exception($this.err("statement unexpected [ "+cursor.word+" ]"));
                     }
                     return;
                 }
                 if(serial.name == null){
                     /**
                      * On recherche d'abord si le nom de la classe a déjà été utilisé,
                      * dans un tel cas, il faut vérifier si elle a été déclarée constante
                      * pour éviter sa rédéfinition.
                      */
                     loop.stop();
                     $this.litteral(cursor.word, ressources, true).then(function(old){
                        // console.log('[Old]',old);
                        if(old && old.constant){
                            $this.exception($this.err("Violation error from trying to rewrite class "+old.name+" defined at file: "+old.origin));
                        }
                        serial.name = cursor.word;
                        if(label == 'trait'){
                            loop.stop();
                            $this.toNextChar().then(function(_char){
                                if(_char != '{'){
                                    $this.exception($this.err("illegal char [ "+_char+" ]"),true);
                                }
                                loop.start();
                            });
                        }
                        else{
                            loop.start();
                        }
                     });
                     return;
                 }
                 else if(!waitingNext){
                     $this.exception($this.err("illegal litteral [ "+cursor.word+" ] encountered !"))
                 }
                 else{
                     /**
                      * On recherche l'objet à étendre ou implémenter
                      * en vérifiant qu'il bien une classe ou une interface
                      */
                    loop.stop();
                    _addrKey.push($this.setObjectAddr(null));
                     $this.litteral(cursor.word, ressources,true).then(function(_super){
                        $this.restoreObjectAddr(_addrKey.pop());
                        if(['class','interface'].indexOf(_super.label) < 0){
                            $this.exception($this.err("[ "+_super.name+" ] was not defined as a class or interface"));
                        }
                        if(_super.final){
                            $this.exception($this.err("[ "+_super.name+" ] is declared final !"));
                        }
                        if(extending){
                            if(serial.label != _super.label){
                                $this.exception($this.err("[ "+_super.name+" ] was not defined as "+serial.label));
                            }
                            if(serial.static && !_super.static){
                                $this.exception($this.err(" [ "+_super.name+" ] must be static because [ "+serial.name+" ] is static !"));
                            }
                        }
                        if(implementing){
                            if(_super.label != 'interface'){
                                $this.exception($this.err("[ "+_super.name+" ] was not defined as interface"));
                            }
                            if(serial.label == 'interface'){
                                $this.exception($this.err("[ "+serial.name+" ] can not implement another interface"));
                            }
                        }
                        if(extending && !implementing){
                            serial.superclass.push(_super.addr);
                        }
                        // if(extending && !implementing){
                        serial.supertypes.push(_super.addr);
                        // }
                        if(_super.abstract && !serial.abstract){
                            setImplementation(_super);
                        }
                        $this.toNextChar().then(function(_char){
                            if(_char == ','){
                                if(extending && !implementing){
                                    $this.exception($this.err("Illegal character [ "+_char+" ]"));
                                }
                            }
                            else if(_char == '<' || _char == '{'){
                                // console.log('[Char]',_char);
                                loop.start();
                            }
                            else{
                                $this.exception($this.err("Illegal character [ "+_char+" ]"), true);
                            }
                        });
                        // if(old && old.constant){
                        //     $this.exception($this.err("Violation error from trying to rewrite class "+old.name+" defined at file: "+old.origin));
                        // }
                        // serial.name = cursor.word;
                        // serial.type = cursor.word;
                        // serial.supertypes.push(cursor.word);
                        // loop.start();
                     });
                     return;
                    // if(!parent){
                    //     $this.exception("can not find [ "+cursor.word+" ]")
                    // }
                    // else if(implementing){
                    //     console.log()
                    // }
                    // else if(extending){
   
                    // }
                 }
             }
             if(cursor.char == '<'){    
                if(!serial.name){
                    $this.exception($this.err("Syntax error ! [ < ] unexpected !"),true);
                }
                loop.stop();
                console.log('[Type]', 'setting');
                // $this.genericType()
             }
             else if(cursor.char == '{'){
                 $this.garbage();
                 $this.save(serial);
                 serial.cursor.index = cursor.index;
                 serial.cursor.scope = $this.cursor.scope - 1;
                 serial.cursor.lines = {
                     x : $this.cursor.lines.x,
                     y : $this.cursor.lines.y,
                 };
                 $this.createBlock(true,serial.addr);
                 serial.module = $this.currentScope;
                //  console.log('[class]',serial.addr);
                 loop.stop();
                 $this.goTo(1);
                 $this.parse($this.extend(ressources,{
                     parent: serial.addr
                 },true),{
                    end: [Synthetic.Lang.constants._EOS.BRACE]
                 }).then(function(){
                     if(toImplement){
                         for(var i in toImplement){
                             for(var j in toImplement[i]){
                                $this.checkIfCanOverrideMethod(serial, $this.getObjectFromAddr(toImplement[i][j]), true);
                             }
                         }
                     }
                     $this.restoreScope(_scopeKey);
                     $this.restoreObjectAddr(_addrKey);
                    //  console.log('[Serial]',serial);
                     loop.end();
                 });
             }
         }).then(function(){
             resolve();
         })
     });
 }
 $syl.interface = function(ressources){
    return this.class(ressources, 'interface');
 }
 $syl.trait = function(ressources){
    return this.class(ressources, 'trait');
 }
 $syl.this = function(ressources){
     var $this = this;
     return new Promise(function(res){
         $this.litteral('this', ressources).then(function(result){
            res(result);
         })
     });
 }
 $syl.super = function(ressources){
    var $this = this;
     return new Promise(function(res){
        $this.litteral('super', ressources).then(function(result){
            res(result);
         })
     });
 }
/**
 * La méthode in permet de gérer l'opérateur in pour vérifier si un
 */
 $syl.in = function(data){
    var data = this.set(data,{
        key: null,
        ressources: {parent : null}
    }),
    $this = this;
    return new Promise(function(res){
        if($this.executing && data.key == null){
            $this.exception($this.err("syntax error near by ... in ... operator"),true);
        }
        var cursor = $this.copy($this.cursor), r = false;
        $this.value({
            object: $this.meta({type: Synthetic.Lang.typeFromConstants.Any.addr}, false),
            ressources: data.ressources,
        }).then(function(object){
            if($this.executing){
                r = $this.containsKey(data.key.value, object);
            }
            res($this.toVariableStructure(r));
        });
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
             braceless = false,key = $this.saveScope(),
             reason = true;
         
         if(data.type == 0){
             $this.previousReason = null;   
         }
         previousReason = $this.previousReason;
         /**
          * Si aucune raison précédente n'a été définie alors qu'on ne traite pas un if,
          * on lève une exception
          */
         if(previousReason === null && data.type > 0){
             $this.exception($this.err("syntax error ! can't read "+(data.type == 1 ? "elif" : "else")+" statement without a previous if or elif statement !"),true);
         }
         $this.toNextChar().then(function(_char){
             /**
              * Traitement pour les else
              */
             if(data.type == 2){
                 $this.setExecutionMod(executing && previousReason !== null && !previousReason);
                 
                 braceless = $this.code[$this.cursor.index] != '{';
                 if(!braceless){
                     $this.setExecutionMod($this.executing && !previousReason);
                     $this.restoreScope(key);
                     key = $this.setScope($this.cursor.scope + 1);
                     $this.goTo(1);
                 }
                 $this.parse(ressources,{
                     end: braceless ? [] : [Synthetic.Lang.constants._EOS.BRACE],
                     statementCount: braceless ? 1 : -1
                 }).then(function(){
                     $this.setExecutionMod(executing);
                     if(!braceless){
                         if($this.code[$this.cursor.index] != '}'){
                             $this.exception($this.err("[ } ] expected !"),true);
                         }
                         $this.goTo(1);
                     }
                     $this.restoreScope(key);
                     
                     res();
                 });
             }
             /**
              * Traitement pour les if/elif
              */
             else{
                 $this.setExecutionMod(executing && !previousReason);
                 
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
                     if(parentheseless){
                         $this.goTo(1);
                     }
                     
                     $this.toNextChar().then(function(_char){
                        if(parentheseless && _char != '{'){
                            $this.exception($this.err("syntax error. [ { ] expected !"),true);
                        }
                        if(!parentheseless){
                            $this.goTo(1);
                        }
                        braceless = _char != '{';
                        reason = !$this.executing ? false : $this.toBoolean(value.value);
                        
                        if(!reason || (previousReason !== null && previousReason) ){
                            $this.setExecutionMod(false);
                            /**
                             * Si la raison actuelle est fausse
                             * on doit encore garder la raison précédente
                             */
                            reason = previousReason === null ? reason : previousReason;
                        }
                        
                        if(!braceless){
                            $this.goTo(1);
                        }
                        else{
                            $this.restoreScope(key);
                            key = $this.setScope($this.cursor.scope + 1);
                        }
                        $this.parse(ressources,{
                            end: braceless ? [] : [Synthetic.Lang.constants._EOS.BRACE],
                            statementCount: braceless ? 1 : -1
                        }).then(function(e){
                            $this.setExecutionMod(executing);
                            $this.previousReason = reason;
                            
                            if(!braceless){
                                if($this.code[$this.cursor.index] != '}'){
                                    $this.exception($this.err("[ } ] expected !"),true);
                                }
                                $this.goTo(1);
                            }
                            $this.restoreScope(key);
                            res(e);
                        });
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
         
         /**
          * Si l'instruction return est en déhors d'une fonction, on arrête tout
          */
         if($this.executing && parent.label != 'function'){
             $this.exception($this.err("Illegal statement ! return statement outside of function !"),true);
         }
        //  console.log('[Return]',$this.executing, $this.code.substr($this.cursor.index, 10))
         $this.value({
             object: $this.executing ? $this.copy(parent) : $this.meta({},false),
             subvariables: false, 
             ressources : ressources,
             ternary: false
         }).then(function(result){
             if($this.executing){
                 $this.setExecutionMod(false);
                 res(result);
             }
             else{
                 res(null);
             }
         });
     });
 }
 /**
  * La méthode switch permet d'éxécuter un bloc switch
  */
 $syl.switch = function(ressources){
     var $this = this;
     return new Promise(function(res){
         var reference = null, backToGetReference = false,
             _cursor = $this.copy($this.cursor),
             _currentSwitch,
             _scopeKey = [$this.saveScope()];
         $this.runner(function(cursor,loop){
             /**
              * Si on voit une parenthèse pendant que la référence n'est pas encore
              * définie, on procède à son enregistrement
              */
             if(!reference && (cursor.char == '(' ||  backToGetReference)){
                 loop.stop();
                 $this.value({
                     ressources: ressources,
                     object: $this.meta({type: Synthetic.Lang.typeFromConstants.Any.addr},false),
                     end: [Synthetic.Lang.constants._EOS[backToGetReference ? 'BRACE' : 'PARENTHESE']]
                 }).then(function(result){
                     reference = result;
                     _currentSwitch = $this.setStructure('currentSwitch',{
                        reference : reference,
                        toDefault: true
                     })
                     $this.toNextChar().then(function(_char){
                         if(_char != '{'){
                             $this.exception($this.err("[ { ] expected for switch beginning scope !"),true);
                         }
                         $this.goTo(1);
                         $this.parse(ressources,{
                             end: [Synthetic.Lang.constants._EOS.BRACE]
                         }).then(function(_result){
                             $this.restoreStructure('currentSwitch', _currentSwitch[1]);
                             if($this.code[$this.cursor.index] != '}'){
                                 $this.exception($this.err("[ } ] expected !"),true);
                             }
                             $this.restoreScope(_scopeKey);
                             loop.end();
                             res(_result);
                         });
                     });
                 });
                 return;
             }
             if(cursor.word && cursor.word.length){
                 if(!reference){
                     $this.cursor = $this.copy(_cursor);
                     backToGetReference = true;
                     return;
                 }
             }
         });
     });
 }
 /**
  * La n méthode case permet d'éxecuter le condition d'un block switch
  */
 $syl.case = function(ressources,defaultInstead){
     var $this = this,
         defaultInstead = this.set(defaultInstead,false),
         reference = this.getStructure('currentSwitch'),
         _scopeKey = [$this.saveScope()],
         _executing = $this.executing,
         matched = false;
     return new Promise(function(res){
         if(!reference){
             $this.exception($this.err("syntax error from using 'case' outside of a switch scope"),true);
         }
         var values = [], _end = false;
         $this.runner(function(cursor,loop){
             /**
              * Si _end est à false, on continue d'enregistrer les valeurs possibles
              */
             if(!_end){
                 loop.stop();
                 if(defaultInstead){
                     $this.toNextChar().then(function(_char){
                         if(_char != ':'){
                             $this.backTo(1);
                         }
                         _end = true;
                         loop.start();
                     });
                 }
                 else{
                     if(cursor.word && cursor.word.length){
                         values.push($this.toVariableStructure(cursor.word));
                         $this.toNextChar().then(function(_char){
                             if(_char != '|'){
                                 _end = true;
                             }
                             if(['|', ':'].indexOf(_char) >= 0){
                                 $this.goTo(1);
                             }
                             loop.start();
                         });
                     }
                     else{
                         $this.value({
                             object: $this.meta({type: Synthetic.Lang.typeFromConstants.Any.addr}, false),
                             ressources: ressources,
                             end: [Synthetic.Lang.constants._EOS.ELSE,Synthetic.Lang.constants._EOS.OR]
                         }).then(function(result){
                             values.push(result);
                             $this.toNextChar().then(function(_char){
                                 if(_char != '|'){
                                     _end = true;
                                 }
                                 if(['|', ':'].indexOf(_char) >= 0){
                                     $this.goTo(1);
                                 }
                                 loop.start();
                             });
                         });
                     }
                 }
             }
             else{
                 if(defaultInstead){
                     if($this.executing){
                         matched = reference.toDefault;
                     }
                 }
                 else if(values.length && $this.executing){
                     for(var i in values){
                         matched = $this.calc([reference.reference, '===', values[i]]).value;
                         if(matched){
                             reference.toDefault = false;
                             break;
                         }
                     }
                 }
                 $this.setExecutionMod(matched);
                 reference = $this.setStructure('currentSwitch', null);
                 loop.stop();
                 if($this.executing){
                     _scopeKey.push($this.saveScope(true));
                     $this.createBlock();
                 }
                 $this.parse(ressources,{
                     stopOnBreak: true,
                     end: [Synthetic.Lang.constants._EOS.BRACE]
                 }).then(function(_value){
                     if($this.code.substr($this.cursor.index-5,5) != 'break' && $this.code[$this.cursor.index] != '}'){
                         $this.exception($this.err("[ break ] statement expected"),true);
                     }
                     /**
                      * Si et seulement si on n'était pas en mode exécution qu'on doit retablir
                      * le mode d'exécution 
                      */
                     if(!matched){
                         $this.setExecutionMod(_executing);
                     }
                     $this.restoreStructure('currentSwitch', reference[1]);
                     $this.restoreScope(_scopeKey);
                     
                     loop.end();
                     res(_value);
                 });
             }
         });
         
     });
 }
 /**
  * La méthode case permet d'éxecuter le condition par défaut d'un block switch
  */
 $syl.default = function(ressources){
     return this.case(ressources,true);
 }
 /**
  * La méthode try permet de d'éxecuter un
  */
 $syl.try = function(ressources,except){
     var $this = this,
         except = this.set(except,false),
         _tryingBlock,
         _executing = $this.executing,
         blocked,
         _scopeKey = [$this.saveScope(true),$this.saveScope()];
    
     return new Promise(function(res){
         if(except && (!$this.getStructure('tryingBlock') || !$this.getStructure('tryingBlock').reachCatch) ){
             $this.exception($this.err("syntax error ! catch statement without previous try statement !"),true);
         }
         function parse(_char){
             if(_char != '{'){
                 $this.exception($this.err("[ { ] expected for try block beginning !"),true);
             }
             $this.goTo(1);
             $this.createBlock();
            
             if(except){
                 /**
                  * On restaure les anciennes données avant l'éxecution du block try
                  */
                 _executing = $this.getStructure('tryingBlock').executing;
                 blocked = $this.getStructure('tryingBlock').blocked;
                 $this.getStructure('tryingBlock').blocked = false;
                
                 $this.setExecutionMod(_executing && blocked);
                 $this.restoreStructure('tryingBlock', $this.getStructure('tryingBlock').previous);
                 if(argset){
                     $this.save(argset);
                 }
             }
             else{
                 _tryingBlock = $this.setStructure('tryingBlock', {
                    blocked: false,
                    reachCatch: false,
                    message: null,
                    executing: _executing,
                    previous: null
                });
                $this.getStructure('tryingBlock').previous = _tryingBlock[1];
             }
             $this.parse(ressources,{
                 end: [Synthetic.Lang.constants._EOS.BRACE]
             }).then(function(e){
                
                 if(!except){
                     $this.getStructure('tryingBlock').reachCatch = true;
                 }
                 if($this.code[$this.cursor.index] != '}'){
                     $this.exception($this.err("[ } ] expected !"), true);
                 }
                 else{
                     $this.goTo(1);
                 }
                 $this.restoreScope(_scopeKey);
                 if(except){
                     $this.setExecutionMod(_executing);
                 }
                
                 res(e);
             });
         }
         var parentheseless = false, argset = null, message;
         $this.toNextChar().then(function(_char){
             if(except){
                 message = $this.getStructure('tryingBlock').message;
                 parentheseless = _char != '(';
                 if(!parentheseless){
                     $this.goTo(1);
                 }
                 $this.runner(function(cursor,loop){
                     if(cursor.word && cursor.word.length){
                         
                         if($this.getCodeType(cursor.word) == Synthetic.Lang.constants.LITTERAL){
                             argset = $this.meta({
                                 type: Synthetic.Lang.typeFromConstants.Any.addr,
                                 name: cursor.word,
                                 value: message
                             },false);
                         }
                         else{
                             $this.exception($this.error("invalid syntax !"), true);
                             loop.end();
                         }
                     }
                     if(argset && [' ', '\n', ')', '{'].indexOf(cursor.char) < 0){
                         $this.exception($this.err("unexpected [ "+cursor.char+" ] !"),true);
                         loop.end();
                     }
                     if(cursor.char == ')'){
                         if(parentheseless){
                             $this.exception($this.err("[ ) ] unexpected !"),true);
                             loop.end();
                         }
                         else{
                             if(!argset){
                                 $this.exception($this.err("catch argument must be set !"),true);
                                 loop.end();
                             }
                         }
                     }
                     if(cursor.char == '{'){
                         if(parentheseless || argset){
                             parse(cursor.char);
                             loop.end();
                         }
                         else{
                             $this.exception($this.err("[ { ] unexpected !"),true);
                             loop.end();
                         }
                     }
                 })
                 return;
             }
             parse(_char);
         });
     });
 }
 /**
  * La méthode catch permet d'éxecuter un block catch
  */
 $syl.catch = function(ressources){
     return this.try(ressources,true);
 }
 $syl.break = function(){
     var $this = this;
     return new Promise(function(res){
         if(!$this.getStructure('currentLoop')){
             $this.exception($this.err("syntax error from using break statement outside of loop scope !"), true);
         }
         if($this.executing){
             $this.getStructure('currentLoop').broken = true;
             $this.setExecutionMod(false);
         }
         res();
     });
 }
 $syl.continue = function(){
     var $this = this;
     return new Promise(function(res){
         if(!$this.getStructure('currentLoop')){
             $this.exception($this.err("syntax error from using continue statement outside of loop scope !"), true);
         }
         if($this.executing){
             $this.getStructure('currentLoop').continued = true;
             $this.setExecutionMod(false);
         }
         res();
     });
 }
 /**
  * La méthode loop permet de parcourir une structure de type String, JSON, Array
  */
 $syl.loop = function(ressources,looptype){
     var $this = this,
         types = Synthetic.Lang.constants.LOOP,
         looptype = this.set(looptype,types.LOOP),
         _executing = $this.executing,
         _scopeKey = [$this.saveScope(),$this.saveScope(true)],
         _currentLoop = $this.getStructure('currentLoop'),
         _cursor,start = false, args = {points: [0,0,0], index: 0};
    
     return new Promise(function(res){
         var parentheseless, remain = 0, braceless;

         function executeScope(_char,gotonext,next,end){
             var gotonext = $this.set(gotonext,false),
                next = $this.set(next,function(){}),
                end = $this.set(end,function(){}),
                braceless = _char != '{';
            $this.setExecutionMod(gotonext);
            $this.parse(ressources,{
                statementCount: !parentheseless && braceless ? 1 : -1,
                end: !braceless ? [Synthetic.Lang.constants._EOS.BRACE] : []
            }).then(function(result){
                // console.log('__________[loop][end]',parentheseless,braceless, $this.code.substr($this.cursor.index, 10));
                if($this.code[$this.cursor.index] != '}' && parentheseless){
                    $this.exception($this.err("[ } ] expected !"), true);
                }
                if($this.code[$this.cursor.index] == '}' && braceless){
                    $this.goTo(1);
                }
                if(!braceless){
                    $this.goTo(1);
                }
                if(remain > 1 && $this.executing){
                    next();
                }
                else{
                    if($this.getStructure('currentLoop').broken || $this.getStructure('currentLoop').continued || remain <= 1){
                        $this.getStructure('currentLoop').broken = false;
                        $this.getStructure('currentLoop').continued = false;
                        $this.setExecutionMod(_executing,false);
                    }
                    if($this.getStructure('currentLoop').continued && remain > 1){
                        next();
                        return;
                    }
                    // if(looptype < types.FOR){
                        $this.garbage(true, $this.currentScope);
                    // }
                    $this.restoreStructure('currentLoop', _currentLoop);
                    $this.restoreScope(_scopeKey);
                    end();
                    res(result);
                }
            });
         }

         $this.toNextChar().then(function(_char){
             parentheseless = _char != '(';
             if(!parentheseless){
                 $this.goTo(1);
             }
             _currentLoop = $this.setStructure('currentLoop', {
                 broken: false,
                 continued: false,
                 type: 'loop',
                 args: []
             });
             if(looptype == types.LOOP){
                $this.getStructure('currentLoop').type = 'loop';
                /**
                 * On recherche la valeur à parcourir !
                 */
                $this.value({
                    ressources: ressources,
                    object: $this.meta({},false),
                    end: [Synthetic.Lang.constants._EOS[parentheseless ? 'BRACE' : 'PARENTHESE']]
                }).then(function(result){
                    if($this.executing && !$this.isValidateConstraint(result, [
                        {type: Synthetic.Lang.typeFromConstants.JSON.addr}, 
                        {type: Synthetic.Lang.typeFromConstants.String.addr}, 
                        {type: Synthetic.Lang.typeFromConstants.Array.addr
                    }])){
                        $this.exception($this.err("Array or JSON or String type expected, "+$this.getTypeName(result.implicitType)+" given !"));
                    }
                    /**
                     * Si le syntaxe comporte des parenthèses,
                     * on doit survéiller que c'est complet : (...)
                     */
                    if(!parentheseless && $this.code[$this.cursor.index-1] != ')'){
                        $this.exception($this.err("[ ) ] expected !"),true);
                    }
                    if(parentheseless){
                        $this.goTo(1);
                    }
                    $this.toNextChar().then(function(_char){
                        braceless = _char != '{';
                        /**
                         * Comme toute structure en mode syntaxe parentheseless
                         * on doit vérifier que l'accolade ouvrant début le scope
                         */
                        if(braceless && parentheseless){
                            $this.exception($this.err("[ { ] expected !"), true);
                        }
                        if(!braceless){
                            $this.goTo(1);
                        }
                        
                        _cursor = $this.copy($this.cursor);
                        if($this.executing && $this.len(result.value)){
                            $this.createBlock();
                            $this.wait(result.value, function(value,index,count,_remain,next,end){
                                $this.cursor = $this.copy(_cursor);
                                // console.log({value,index,count,_remain});
                                remain = _remain;
                                $this.updateStructure('currentLoop', _currentLoop[0], {
                                    broken: false,
                                    continued: false,
                                    type: 'loop',
                                    args: []
                                });
                                $this.meta({
                                    type: value.type,
                                    implicitType: value.implicitType,
                                    name: 'i',
                                    value: typeof value == 'object' && value != null ? value.value : value
                                });
                                $this.meta({
                                    type: Synthetic.Lang.typeFromConstants[/[\d]+(\.[\d]+)/.test(index) ? 'Number' : 'String'].addr,
                                    name: 'j',
                                    value: index
                                });
                                $this.meta({
                                    type: Synthetic.Lang.typeFromConstants.Number.addr,
                                    name: 'k',
                                    value: count
                                });
                                executeScope(_char,remain > 1 && $this.executing, next, end);
                            });
                        }
                        else{
                            remain = 0;
                            $this.executing = false;
                            executeScope(_char);
                        }
                    });
                });
             }
             else if(looptype == types.WHILE){
                 var fakeObject = $this.meta({},false),
                    reason,scopeCreated = false;
                _cursor = $this.copy($this.cursor);
                function until(){
                    $this.cursor = $this.copy(_cursor);
                    $this.updateStructure('currentLoop', _currentLoop, {
                        broken: false,
                        continued: false,
                        type: 'while',
                        args: []
                    });
                    $this.value({
                        ressources: ressources,
                        object: fakeObject,
                        end: [Synthetic.Lang.constants._EOS[parentheseless ? 'BRACE' : 'PARENTHESE']]
                    }).then(function(result){
                        if(!parentheseless && $this.code[$this.cursor.index-1] != ')'){
                            $this.exception($this.err("[ ) ] expected !"),true);
                        }
                        if(parentheseless){
                            $this.goTo(1);
                        }
                        $this.toNextChar().then(function(_char){
                            /**
                             * Comme toute structure en mode syntaxe parentheseless
                             * on doit vérifier que l'accolade ouvrant début le scope
                             */
                            if(_char != '{' && parentheseless){
                                $this.exception($this.err("[ { ] expected !"), true);
                            }
                            if(_char == '{'){
                                $this.goTo(1);
                            }
                            if(!scopeCreated && $this.executing){
                                $this.createBlock();
                                scopeCreated = true;
                            }
                            reason = !$this.executing ? false : result.value == 'false' ? true : $this.toBoolean(result.value);
                            $this.executing = reason;
                            remain = reason ? 2 : 0;
                            executeScope(_char,reason,until);
                        });
                    });
                }
                until();
             }
             else if(looptype == types.FOR){
                
                args.points[args.index] = $this.copy($this.cursor);
                args.index++;
                
                _cursor = $this.copy($this.cursor);
                start = true;
                $this.runner(function(cursor,loop){
                    if(cursor.char == ';'){
                        if(looptype == types.FORIN){
                            $this.exception($this.err("syntax error !"),true);
                        }
                        /**
                         * On ne prend que 3 paramètres
                         */
                        if(args.index < 3){
                            $this.goTo(1);
                            args.points[args.index] = $this.copy($this.cursor);
                            // args.points[args.index].index++;   
                            args.index++;
                        }
                        if(args.index == 3){
                            loop.stop();
                            $this.setExecutionMod(false);
                            // console.log('[for][parse]',$this.code.substr($this.cursor.index, 10))
                            $this.parse(ressources, {
                                end: !parentheseless ? [Synthetic.Lang.constants._EOS.PARENTHESE] : [],
                                start: parentheseless ? [Synthetic.Lang.constants._EOS.BRACE] : []
                            }).then(function(){
                                var _char = $this.code[$this.cursor.index];
                                if(!parentheseless && _char != ')'){
                                    // console.log('[Char]',_char);
                                    $this.exception($this.err("[ ) ] expected !"),true);
                                }
                                if(_char == ')'){
                                    $this.goTo(1);
                                }
                                $this.toNextChar().then(function(_char){
                                    if(parentheseless && _char != '{'){
                                        $this.exception($this.err("[ { ] expected !"),true);
                                    }
                                    if(_char == '{'){
                                        $this.goTo(1);
                                    }
                                    else{
                                        braceless = false;
                                    }
                                    args.points.push($this.copy($this.cursor));
                                    $this.setExecutionMod(_executing);
                                    loop.end();
                                });
                            });
                        }
                    }
                    if(cursor.word)
                    // console.log('[Word]',cursor.word, args.index);
                    if(cursor.word == 'in' && args.index == 1){
                        looptype = types.FORIN;
                        loop.end();
                    }
                }).then(function(){
                    $this.cursor = $this.copy(_cursor);
                    if(looptype == types.FORIN){
                        $this.updateStructure('currentLoop', _currentLoop, {
                            broken: false,
                            continued: false,
                            type: 'forin',
                            args: [],
                            argset: false,
                        });
                        /**
                         * Récupération des arguments d'itération
                         */
                        $this.parse(ressources).then(function(){
                            /**
                             * Récupération de la variable à parcourir
                             */
                            _cursor = $this.copy($this.cursor);
                            $this.getStructure('currentLoop').argset = true;
                            $this.value({
                                object: $this.meta({}, false),
                                ressources: ressources,
                                end: [Synthetic.Lang.constants._EOS[parentheseless ? 'BRACE' : 'PARENTHESE']]
                            }).then(function(object){
                                if($this.executing){
                                    if(!$this.isTypeInBaseTypeList(['Array','JSON'],object.type) && !$this.isTypeInBaseTypeList(['Array','JSON'],object.implicitType)){
                                        $this.cursor = $this.copy(_cursor);
                                        $this.exception($this.err("Array or JSON value expected, " + $this.getTypeName(object.implicitType)+" given !"));
                                    }
                                }
                                else{
                                    object = {value: {}};
                                }
                                $this.createBlock();
                                if(parentheseless){
                                    $this.goTo(1);
                                }
                                $this.toNextChar().then(function(_char){
                                    _cursor = $this.copy($this.cursor);
                                    /**
                                     * Si l'objet ne contient pas d'éléments,
                                     * on ne le parcourt pas
                                     */
                                    if($this.len(object.value)){
                                        
                                        $this.wait(object.value, function(value,index,count,_remain,next,end){
                                            var list = [value,$this.toVariableStructure(index)];
                                            $this.getStructure('currentLoop').broken = false;
                                            $this.getStructure('currentLoop').continued = false;
                                            remain = _remain;
                                            $this.cursor = $this.copy(_cursor);
                                            
                                            for(var i in $this.getStructure('currentLoop').args){
                                                if('value' in $this.getStructure('currentLoop').args[i]){
                                                    delete $this.getStructure('currentLoop').args[i].value;
                                                }
                                                if(i < list.length){
                                                    var currentArg = $this.getStructure('currentLoop').args[i];
                                                    if(!$this.isSuitable(list[i],currentArg) && (i < 0 || !$this.isTypesEqual(currentArg, Synthetic.Lang.typeFromConstants.String) ) ){
                                                        $this.exception($this.err("[ "+$this.getStructure('currentLoop').args[i].name+" ] is not suitable with "+(i > 0 ? "key" : "value")+" of object !"));
                                                    }
                                                    /**
                                                     * On crée les variables de l'étendue
                                                     */
                                                    $this.meta($this.extend(list[i], $this.getStructure('currentLoop').args[i]));
                                                }
                                                else{
                                                    break;
                                                }
                                            }
                                            
                                            executeScope(_char,remain > 1 && $this.executing, next, end);
                                        });
                                    }
                                    else{
                                        remain = 0;
                                        $this.executing = false;
                                        executeScope(_char);
                                    }
                                });
                            });
                        });
                    }
                    else{
                        $this.createBlock();
                        $this.cursor = $this.copy(args.points[0]);                  
                        
                        $this.parse(ressources,{
                            end: [Synthetic.Lang.constants._EOS.SEMICOLON]
                        }).then(function(){
                            function until(){
                                $this.updateStructure('currentLoop', _currentLoop, {
                                    broken: false,
                                    continued: false,
                                    type: 'for',
                                    args: [],
                                    argset: false,
                                });
                                /**
                                 * La deuxième manche est pour le calcule de la valeur conditionnelle
                                 */
                                $this.cursor = $this.copy(args.points[1]);  
                                var loopStruct = $this.getStructure('currentLoop');
                                // console.log('[struct]',loopStruct);
                                // console.log('[for][reason]',$this.code.substr($this.cursor.index, 10));
                                $this.value({
                                    ressources: ressources,
                                    object: $this.meta({},false),
                                    end: [Synthetic.Lang.constants._EOS.SEMICOLON]
                                }).then(function(result){
                                    
                                    loopStruct.reason = $this.executing ? $this.toBoolean(result.value) : false;
                                    /**
                                     * On exécute d'abord le corps de la boucle, ensuite on
                                     * exécute la troisième partie des arguments
                                     */
                                    $this.cursor = $this.copy(args.points[3]);
                                    remain = loopStruct.reason ? 2 : 0;
                                    loopStruct.argset = true;
                                    executeScope(braceless ? '' : '{', loopStruct.reason, function(){
                                        $this.cursor = $this.copy(args.points[2]);
                                        loopStruct.argset = false;
                                        // console.log('[for][modules]',$this.modules, $this.currentScope);
                                        // console.log('[for][code]',$this.code.substr($this.cursor.index,10), parentheseless)
                                        $this.parse(ressources,{
                                            end: !parentheseless ? [Synthetic.Lang.constants._EOS.PARENTHESE] : [],
                                            start: !parentheseless ? [] : [Synthetic.Lang.constants._EOS.BRACE]
                                        }).then(function(){
                                            until(); 
                                        });
                                    });
                                });  
                            }
                            until();
                        });
                    }
                });
             }
         });
     });
 }
 /**
  * La méthode while permet d'exécuter une boucle while
  */
 $syl.while = function(ressources){
     return this.loop(ressources, Synthetic.Lang.constants.LOOP.WHILE);
 }

 $syl.for = function(ressources){
     return this.loop(ressources,Synthetic.Lang.constants.LOOP.FOR);
 }
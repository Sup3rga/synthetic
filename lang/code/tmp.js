
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
         'unset', 'export','upper','root','external', 'async', 'return', '@js', 'label',
         'for', 'while', 'loop', 'override', 'switch','case','default', 'strict_mode',
         'final', 'invoke', 'reset', 'await', '@MixinActing', '@SyncBlockRender',
         'class', 'interface', 'trait', 'protected', 'this','super', 'abstract', 'static',
         'toString','implements','null','callable','run'
     ],
     valuableReservedKeys: ['return'],
     lazyKeys : ['import', 'from', 'include'],
     baseType : ['Any', 'String', 'Number', 'JSON', 'Array', 'Boolean', 'Regex', 'Function', 'External', "SML"],
     breakableKeys : ['return', 'break'],
     scopeSniper: ['root', 'upper'],
     callAsMethodKeys : ['mixin', 'function'],
     privatisableKeys : ['mixin', 'unused', 'final', 'class', 'interface', 'abstract', 'static'],
     finalizableKeys : ['mixin', 'class'],
     typeCreatorKeys : ['mixin', 'class', 'interface', 'enum'],
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
         "push": "Any"
     },
     definedTypes: [],
     blockEOS : ['}'],
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
     this.currentSwitch = null;
     this.tryingBlock = null;
     this.currentLoop = null;
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
     var r, defineBase = typeof Synthetic.Lang.baseType[0] == 'string';
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
                 value: {
                     type: this.meta({
                         label: 'type',
                         value: Synthetic.Lang.baseType[i]
                     },false)
                 }
             });
         if(defineBase){
             Synthetic.Lang.baseType[i] = r;
         }
         else{
             this.save(r);
         }
         this.types.push(r.name);
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
  * La méthode isBaseType permet de définir si un type est un type de base
  */
 $syl.isBaseType = function(type){
     var r = false;
     for(var i in Synthetic.Lang.baseType){
         if(type == Synthetic.Lang.baseType[i].type){
             r = true;
             break;
         }
     }
     return r;
 }
 /**
  * La méthode garbage pemet de nettoyer le stockage inutile des variables
  */
 $syl.garbage = function(more){
     var addr = [],
         more = this.set(more, false);
     for(var i in this.modules){
         if(null in this.modules[i].modules){
             addr.push(this.modules[i].modules[null].addr);
             // console.log('[Addr]',this.modules[i].modules[null].addr,'/',this.modules[i].modules[null].label, '/', this.modules[i].modules[null].linked);
             // if(this.modules[i].modules[null].label == null) console.log(this.modules[i].modules[null]);
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
                 if(this.modules[i].modules[j].label == 'variable' && !('value' in this.modules[i].modules[j]) ){
                     addr.push(this.modules[i].modules[j].addr);
                     this.freeLinkOf(this.modules[i].modules[j]);
                     delete this.modules[i].modules[j];
                 }
                 else if(i != this.rootScope && this.modules[i].modules[j].linked == 0){
                     // console.log('[Delete]', j);
                     // addr.push(this.modules[i].modules[j].addr);
                     // delete this.modules[i].modules[j];
                 }
             }
         }
     }
     for(var i in addr){
         delete Synthetic.Lang.objects[addr[i]];
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
         labelConstraint: null,
         typeOrigin: null,
         constraints: null,
         native: false,
         final: this.access.final,
         constant: this.access.const,
         ref: this.cursor.scope+','+this.cursor.index,
         label: null, //le type de notation: par exemple : mixin, variable
         name: null, //le nom du notation: par exemple : nomVariable
         visible: this.access.export, //Le module sera visible ou pas
         origin: null,//this.realpath, //Le chemin absolu dans lequel se trouve le module
         addr: this.addr(),
         linked: 0,
         following: [],
         parentScope: this.currentScope
     }, options),
     autosave = this.set(autosave,true);
     result.implicitType = result.implicitType == null ? result.type : result.implicitType;
     this.resetAccess();
     this.currentType = null;
     this.previousReason = null;
     this.currentSwitchReference = null;
     // if(result.name == null)
     // console.log('[Result]',result.name, result.label, result.value, '/', result.addr);
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
                     // console.log('[char]',$this.code[cursor-1]+$this.code[cursor]);
                 }
 
                 if(!findEOS && !wrapper.comment){
                     word += $this.code[cursor];
                 }
                 // $this.lastIndex = $this.cursor.index;
                 
                 if(!wrapper.quote && !wrapper.simple_quote && !wrapper.comment){
                     var _data = {
                         char: doubleSigns ? tripleSigns ? $this.code.substr(cursor-2, 3) : $this.code.substr(cursor-1,2) : $this.code[cursor],
                         //(tripleSigns ? $this.code[cursor-2] : '') + $this.code[cursor-1]+$this.code[cursor] : $this.code[cursor], 
                         word: findEOS ? word : null, 
                         index: cursor
                     };
                     callback(_data, 
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
                 if($this.cursor.scope != 0){
                     // $this.exception($this.err("[ } ] expected at end of file !"));
                 }
                 resolve();
             }
         }
         until();
     });
 };
 
 $syl.wait = function(list, callback){
     var indexes = [],
         k = 0;
     for(var i in list){
         indexes.push(i);
     }
     function until(){
         if(k < indexes.length){
             callback(list[indexes[k]], indexes[k], k, indexes.length - k, until, function(){
                 k = indexes.length;
                 until();
             });
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
     // return;
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
     // console.log('[Scope]',scope, typeof scope);
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
             // console.log('[Scope__]',this.scopeSaver[index]);
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
 $syl.setExecutionMod = function(mod, relative){
     relative = this.set(relative,true);
     var r = (!this.tryingBlock || !relative ? true : !this.tryingBlock.blocked);
     r = r && mod;
     r = r && (!this.currentLoop || !relative ? true : !this.currentLoop.broken && !this.currentLoop.continued);
     this.executing =  r;
 }
 $syl.saveLines = function(){
     if(this.lastIndex.line == this.cursor.index){
         return;
     }
     this.lastIndex.line = this.cursor.index;
     if(this.code[this.cursor.index] == '\n' && this.linesEnd.indexOf(this.cursor.index) < 0){
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
         $this.runner(function(cursor,loop){
             if(/[\S]+/.test(cursor.char) || cursor.index == $this.code.length - 2){
                 // console.log('[char]',cursor.char,'/',$this.cursor.index);
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
 $syl.genericType = function(type,origin){
     var $this = this,
         _currType, _cursor,
         origin = this.set(origin, false),
         _type = type, isBaseType;
     return new Promise(function(res,rej){
         if($this.isBaseType(_type) && ['Array', 'JSON'].indexOf(_type) < 0){
             $this.exception($this.err("primitive type [ "+ _type + " ] can't be generic !"),true);
         }
         var _dictMod = _type != 'Array',
             _origin,
             type = {
                 type: _type,
                 constraints: null,
                 origin: origin,
                 hasKeyConstraint: false,
                 hasNextType: false,
                 saved: false
             }, lastword = null, all = false;
 
         function savetype(){
             var r = false;
             if(lastword != null && type.constraints != null){
                 r = true;
                 if(_dictMod && !type.hasKeyConstraint && ['Number', 'String','Any'].indexOf(lastword) < 0){
                     $this.exception($this.err("Number or String are only allowed to be key constraints"));
                 }
                 type.constraints[!type.hasKeyConstraint && _dictMod ? 'key' : 'value']
                 .push(typeof lastword == 'string' ? {
                     type: lastword,
                     origin: _origin,
                     constraints: null
                 } : lastword);
                 if(_dictMod && !type.hasKeyConstraint){
                     type.hasKeyConstraint = true;
                 }
                 lastword = null;
             }
             return r;
         }
 
         function nextStatements(cursor,loop){
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
                     $this.exception($this.err("illegal expression [ "+cursor.char+" ]"),true);
                 }
                 else{
                     $this.exception($this.err("Syntax error !"),true);
                 }
             }
             //pour les autres caractères
             else if(type.constraints != null){
                 if(cursor.char == '|'){
                     //Aucune permutation de type ne peu être faite sans un type précédent
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
                         $this.exception($this.err("illegal character [ , ]"),true);
                     }
                     $this.goTo(1);
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
                         $this.exception($this.err("illegal expression [ "+cursor.char+" ]"),true);
                     }
                     type.saved = true;
                     loop.end();
                     $this.goTo(1);
                     if(type.constraints.value.length == 0){
                         lastword = 'Any';
                         savetype();
                     }
                     res(type);
                     loop.end();
                 }
             }
             //sinon il y a erreur de syntaxe
             else if($this.currentType.constraints != null && $this){
                 // console.log('[Current]', $this.cursor.scope, Synthetic.Lang.scope, cursor.word, $this.cursor.index, cursor.index);
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
                     lastword += $this.code.substr(_cursor.index, $this.cursor.index - _cursor.index - 1);
                     if(!type){
                         $this.exception($this.err("[ "+lastword+" ] is not a defined type !"));
                     }
                     _origin = type.origin;
                     lastword = type.type;
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
         type: 'Any',
         origin: null,
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
         },
         list = typeof list == 'string' ? [{type: list}] : list;
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
     return [false,"false",0,'0','null',null].indexOf(value) < 0;
 }
 
 /**
  * La méthode calc permet de simplifier une opération complexe en une seule valeur
 */
 $syl.calc = function(list){
     if(list.length == 1){
         return list[0];
     }
     // console.log('[List]',list);
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
             return $this.toPrimitiveValue(a) >= $this.toPrimitiveValue(b);
         },
         "==": function(a,b){
             return $this.toPrimitiveValue(a) == $this.toPrimitiveValue(b);
         },
         "!=": function(a,b){
             return $this.toPrimitiveValue(a) != $this.toPrimitiveValue(b);
         },
         "===": function(a,b){
             var sameType = (a.type == b.type || a.implicitType == b.implicitType) && b.typeOrigin == a.typeOrigin;
             return sameType && $this.toPrimitiveValue(a) == $this.toPrimitiveValue(b);
         },
         "!==": function(a,b){
             var sameType = (a.type == b.type || a.implicitType == b.implicitType) && b.typeOrigin == a.typeOrigin;
             return sameType && $this.toPrimitiveValue(a) == $this.toPrimitiveValue(b);
         },
         "||": function(a,b){
             return $this.toPrimitiveValue(a) || $this.toPrimitiveValue(b);
         },
         "&&": function(a,b){
             return $this.toPrimitiveValue(a) && $this.toPrimitiveValue(b);
         },
         "|": function(a,b){
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
     //Finir les opérations
     var operands = [null,null], 
     /**
      * On définit l'ordre de recherche des opérateurs par priorité de calcul
     */
     operators = [
         ['*','/','~','%'],
         ['-','+'],
         ['||', '&&','>','>=','<','<=','==','!=', '===','!==='],
         ['+=', '-=','%=','*=','/=','~=']
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
         var _scopeKey = [$this.saveScope(true)];
         $this.createBlock();
         var _type = $this.code[$this.cursor.index] == '[' ? 'Array' : 'JSON',
         structure = $this.meta({
             type: _type,
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
         // console.log('[Call][Struct]')
         // $this.goTo(1);
         $this.runner(function(cursor,loop){
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
                 /**
                  * Il ne faut enregistrer la variable provenue de la clé pour éviter les conflits
                  * avec l'existence des variables pré-existantes !
                  */
                 object = $this.meta({
                     type: !data.object.constraints ? 'Any' : data.object.constraints.value[0].type,
                     name: _type == 'JSON' ? key : index,
                     constraints: !data.object.constraints ? null : data.object.constraints,
                     value: null
                 });
                 $this.linkWith(object,data.object);
                 // console.log('[Struct]', object.addr);
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
                         if(!result.name){
                             object.name = _type == 'Array' ? index : key;
                             $this.save(object);
                         }
                         if(structure.constraints){
                             if(_isCallable && structure.constraints.value.length > 1 && !$this.isValidateConstraint("Any", structure.constraints.value)){
                                 $this.cursor = $this.copy(_cursor);
                                 $this.exception($this.err("to much return value types !"));
                             }
                             /**
                              * Si le resulta est un external, on vérifier qu'il n'y a acceptation que
                              * du type 'Any'
                              */
                             if(object.label == 'external' && !$this.isValidateConstraint('Any', object.constraints.value)){
                                 $this.cursor = $this.copy(_cursor);
                                 $this.exception($this.err("external structure don't support other type than Any, "+structure.constraints.value[0].type+" was given !"));
                             }
                             /**
                              * Si c'est une fonction et que le type est Any
                              * On lui passe le type principale de la contrainte de la 
                              * structure
                              */
                             if(result.type == 'Any' && $this.isCallable(objet)){
                                 objet.type =  structure.constraints.value[0].type;
                             }
                             /**
                              * Sinon Si le type de la valeur n'est pas compatible aux contraintes
                              * de la structure, on lève une erreur
                              */
                             else if(!$this.isValidateConstraint(object, structure.constraints.value)){
                                 $this.cursor = $this.copy(_cursor);
                                 $this.exception($this.err($this.toStringTypes(structure.constraints.value)+" value expected, "+object.implicitType+" given !"));
                             }
                         }
                     }
                     if(data.object.constraints && !$this.isValidateConstraint(object, data.object.constraints.value)){
                         if(['Array', 'JSON'].indexOf(object.type) < 0 || !data.object.constraints.recursive){
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
                     // $this.save(object);
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
                                 $this.exception($this.err("Illegal character !"),true);
                             }
                         break;
                         default:
                             // $this.exception($this.err("[ "+$this.code[$this.cursor.index-1]+" ] unexpected !"));
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
                                     // console.log('[Litt]',result.name, '>'+$this.code.substr($this.cursor.index, 10));
                                     if($this.executing){
                                         if(data.object.constraints && !$this.isValidateConstraint("String", data.object.constraints.key)){
                                             if(['Array', 'JSON'].indexOf(result.type) < 0 || !data.object.constraints.recursive){
                                                 $this.cursor = _cursor;
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
                                         // console.log('[Struct]',structure);
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
                     // console.log('[End][Struct]',cursor.char, structure);
                     loop.end();
                 }
             }
         }).then(function(){
             $this.restoreObjectAddr(addrKey);
             $this.restoreScope(_scopeKey);
             // console.log('[Struct][end]',structure.name, $this.code.substr($this.cursor.index, 10));
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
                     // console.log('[Cool]',value, $this.code.substr($this.cursor.index, 10))
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
     // console.log('[Data.Object]',data.object)
     return new Promise(function(res,rej){
         $this.runner(function(cursor,loop){
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
                     // if(['--','++'].indexOf(cursor.char) >= 0){
                         // console.log('********[]',cursor.char, cursor.word);
                     // }
                     if(/[\S]+/.test(cursor.char)){
                         $this.backTo(cursor.char.length - 1);
                     }
                     _cursor = $this.copy($this.cursor);
                     /**
                      * Si on est en mode subvalue
                      * On va vérifier si on est en une appelle de fonction
                      */
                     // console.log('[Here]',cursor.word, cursor.char);
                     // if(cursor.word == 'nom') console.log('[from][Value]',$this.modules);
                     $this.litteral(cursor.word, data.ressources).then(function(result){
                         // console.log('[Result]',result, $this.executing)
                         // if($this.executing && result.type != 'Number' && result.label != 'variable' && preOperations != Synthetic.Lang.simpleOperations.REVERSE){
                             // $this.cursor = $this.copy(_cursor);
                             // $this.exception($this.err("Number value expected"),true);
                         // }
                         if(preOperations){
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
                                     values.push($this.toVariableStructure(![false,'false',0,'0'].indexOf(result.value) >= 0));
                                 break;
                             }
                             if(preOperations != Synthetic.Lang.simpleOperations.REVERSE){
                                 values.push(result);
                             }
                             preOperations = -1;
                         }
                         // if(data.subvalue && !result)
                         // console.log('[Result]', data.subvalue,result == null, $this.tryMethodInsteadConfirmed);
                         if(result && result.label == 'type'){
                             if(data.subvalue){
                                 $this.tryMethodInsteadConfirmed = true;
                                 loop.end();
                                 return;
                             }
                             else{
                                 $this.exception($this.err("invalid syntax !"),true);
                             }
                         }
                         if(['--','++'].indexOf($this.code.substr($this.cursor.index - 3, 2)) >= 0){
                             values.push($this.toVariableStructure(result.value * 1 - 1));
                         }
                         else{
                             values.push(result);
                         }
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
                     /**
                      * Si le mot est "null"
                      * on considère la valeur null
                      */
                     if(cursor.word == "null"){
                         values.push($this.toVariableStructure(null, data.ressources));
                     }
                     else if(['external', 'callable'].indexOf(cursor.word) >= 0){
                         loop.stop();
                         // console.log('[Data]',data.ressources);
                         $this[cursor.word](data.ressources).then(function(method){
                             values.push(method);
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
                         // console.log('[PreOp]',preOperations,Synthetic.Lang.simpleOperations, values, $this.executing);
                         if(type != 'Number' && preOperations != Synthetic.Lang.simpleOperations.REVERSE){
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
                     // console.log('[Console]',data.end, _end);
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
                 if(data.end.indexOf(_end) < 0 && Synthetic.Lang.blockEOS.indexOf(cursor.char) < 0 && _end != constants.SEMICOLON && /[\S]+/.test(cursor.char)){
                     $this.backTo(1);
                 }
                 // console.log('[END]',_end,cursor.char, cursor.word,'/', Synthetic.Lang.blockEOS.indexOf(cursor.char));
                 // console.log('[--.',$this.code.substr($this.cursor.index, 5), data.end);
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
                             $this.exception($this.err("illegal character [ "+cursor.char+"]"),true);
                         }
                         _cursor = $this.copy($this.cursor);
                         loop.stop();
                         // _lastWordCursor.index++;
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
                                         // console.log('[Method]',method, $this.modules);//_cursor = $this.copy($this.cursor);
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
                      * Si c'est une fonction, on l'appelle comme un littéral
                      */
                     // else if(values[values.length - 1]){
                         
                     // }
                     /**
                      * Sinon on déclenche une erreur
                      */
                     else{
                         $this.exception($this.err("illegal character [ "+cursor.char+"]"),true);
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
             if($this.executing && !data.subvariables && !data.subvalue && data.object.type != 'Any' && (!r || (r.type != data.object.type && r.implicitType != data.object.type)) ){
                 // console.log('[R]',r);
                 if(!r || !('labelConstraint' in r && r.labelConstraint == 'callable' && r.label == 'function')){
                     $this.cursor = data.object.cursor;
                     // console.log('[R]',r);
                     $this.exception($this.err(data.object.type+" value expected, "+(r ? r.implicitType : "Any" )+" given !"));
                 }
             }
             else if($this.executing && data.subvariables && data.object.constraints && (!r || !$this.isValidateConstraint(r, data.object.constraints.value)) ){
                 if(!r || ['Array', 'JSON'].indexOf(r.type) < 0 || !data.object.constraints.recursive){
                     $this.exception($this.err($this.toStringTypes(data.object.constraints.value)+" value expected, "+(!r ? "Any" : r.type)+" given !"));
                 }
             }
             // if('labelConstraint' in r && r.labelConstraint == 'callable' && r.label == 'function'){
             //     r.type = data.object.type;
             //     r.implicitType = data.object.implicitType;
             //     data.object.labelConstraint = 'callable';
             // }
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
  * La méthode exception permet de lever une exception en tout sécurité
  */
 $syl.exception = function(message,runtimeError){
     var runtimeError = this.set(runtimeError, false);
     if(this.tryingBlock && !runtimeError){
         if(!this.tryingBlock.blocked){
             this.tryingBlock.message = message;
             this.tryingBlock.blocked = true;
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
         $this.exception(this.err("syntax error : " + previousKey + " ... " + currentKey), true);
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
         //erreur de syntax :  final ... private
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
         //erreur de syntax :  final ... protected
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
         //erreur de syntax : abstract ... abstract
         $this.accessErr('abstract', 'abstract',rej);
         //erreur de syntax : private ... abstract
         $this.accessErr('private', 'abstract',rej);
         //erreur de syntax : protected ... abstract
         $this.accessErr('protected', 'abstract',rej);
         //erreur de syntax :  export ... abstract
         $this.accessErr('export', 'abstract',rej);
         //erreur de syntax :  final ... abstract
         $this.accessErr('final', 'abstract',rej);
         //erreur de syntax :  override ... abstract
         $this.accessErr('override', 'abstract',rej);
         //erreur de syntax :  override ... abstract
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
         //erreur de syntax :  static ... static
         $this.accessErr('static', 'static',rej);
         //erreur de syntax :  export ... static
         $this.accessErr('export', 'static',rej);
         //erreur de syntax :  abstract ... static
         $this.accessErr('abstract', 'static',rej);
         //erreur de syntax :  abstract ... static
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
         //erreur de syntax :  final ... final
         $this.accessErr('final', 'final',rej);
         //erreur de syntax :  abstract ... final
         $this.accessErr('abstract', 'final',rej);
         //erreur de syntax :  abstract ... final
         $this.accessErr('const', 'final',rej);
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
         //erreur de syntax :  export ... export
         $this.accessErr('export', 'export',rej);
         //erreur de syntax :  const ... export
         $this.accessErr('const', 'export',rej);
         //erreur de syntax :  override ... export
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
         //erreur de syntax : const ... override
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
         //erreur de syntax : override ... override
         $this.accessErr('override', 'override',rej);
         //erreur de syntax : override ... override
         $this.accessErr('abstract', 'override',rej);
         //erreur de syntax : override ... final
         $this.accessErr('final', 'override', rej);
         //erreur de syntax : override ... export
         $this.accessErr('export', 'override', rej);
         //erreur de syntax : override ... protected
         $this.accessErr('protected', 'override', rej);
         //erreur de syntax : override ... private
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
 $syl.save = function(objet,parent){
     if(!this.executing){
         return;
     }
     // if(parent != undefined){
     //     parent = {
     //         scope: parent.cursor.scope + 1,
     //         index: parent.cursor.index
     //     }
     // }
     // else{
     //     parent = {
     //         scope: objet.cursor.scope,
     //         index: objet.cursor.index
     //     }
     // }
     // var ref = this.previousCloserRef([parent.scope, parent.index], true);
     // // console.log('[REF]',ref, objet.name, objet.label, '/', parent.scope, parent.index);
     // if(!(ref in this.modules)){
     //     this.modules[ref] = {};
     // }
     // this.modules[ref][objet.name] = objet;
     this.modules[this.currentScope].modules[objet.name] = objet;
     Synthetic.Lang.objects[objet.addr] = objet;
     // if(objet.visible){
     //     this.exportables[objet.name] = objet;
     // }
 }
 
 /**
  * La méthode freeLinkOf permet de libérer les liens d'un objet vis-à-vis un autres
  */
 $syl.freeLinkOf = function(object){
     for(var i in object.following){
         Synthetic.Lang.objects[object.following[i]].linked--;
         Synthetic.Lang.objects[object.following[i]].linked = Synthetic.Lang.objects[object.following[i]].linked < 0 ? 0 : Synthetic.Lang.objects[object.following[i]].linked;
     }
     return this;
 }
 /**
  * La méthode linkWith permet de lier deux objets Synthetic
  */
 $syl.linkWith = function(depend,current){
     // if(current != undefined){
     //     console.log('[CURRENT]',current);
     // }
     var depend = typeof depend == 'object' ? depend :
         Synthetic.Lang.objects[depend],
         current = this.set(current, Synthetic.Lang.objects[this.currentObjectAddr]);
     if(depend && this.currentObjectAddr){
         depend.linked++;
         // console.log('[Obj]',this.currentObjectAddr);
         // if(!(this.currentObjectAddr in Synthetic.Lang.objects)){
         //     console.trace('[T]', this.currentObjectAddr)//, Synthetic.Lang.objects);
         // }
         // Synthetic.Lang.objects[this.currentObjectAddr]
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
 $syl.createBlock = function(autoReplace){
     if(!this.executing){
         return;
     }
     var scope = this.addr(),
         autoReplace = this.set(autoReplace, true);
     this.modules[scope] = {
         parent: this.currentScope,
         modules: {}
     };
     if(autoReplace){
         this.currentScope = scope;
     }
     // console.log('[block]',ref);
     // var cursor = ref.split(',');
     // var ref = cursor[0] + ',' + cursor[1];
     // if(this.blocks.indexOf(ref) < 0){
     //     this.blocks.push(ref);
     // }
     return scope;
 }
 /**
  * La méthode getCloserStruct permet de retrouver la structure (class, mixin, enum) la plus proche en parenté
  */
 $syl.getCloserStruct = function(cursor, labels){
     return null;
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
     // console.log('[Final]',args,serial.name, serial.ref);
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
         var $this = this,
             scope = this.currentScope,
             r = null;
         while(!r){
             if(name in this.modules[scope].modules){
                 r = this.modules[scope].modules[name];
             }
             else{
                 if(this.modules[scope].parent != null){
                     scope = this.modules[scope].parent;
                 }
                 else{
                     break;
                 }
             }
         }
         // var scope = $this.previousCloserRef([$this.cursor.scope, $this.cursor.index],true),
         //     r = null;
         // console.log('[Name]',name,'::', [$this.cursor.scope, $this.cursor.index], scope, this.blocks);
         // if(name == 'tk'){
         //     console.log('[Mod]',this.modules);
         // }
         // while(scope != null && r == null){
         //     if(name == 'root'){
         //         if(scope == "0,0"){
         //         break;
         //         }
         //         scope = '0,0';
         //     }
         //     else if(name == 'upper'){
         //         if(scope == "0,0"){
         //             break;
         //         }
         //         scope = $this.previousCloserRef(scope.split(','),true);
         //     }
         //     else{
         //         if($this.modules[scope] && name in $this.modules[scope]){
         //             r = $this.modules[scope][name];
         //             break;
         //         }
         //         if(scope == "0,0"){
         //             break;
         //         }
         //         scope = $this.previousCloserRef(scope.split(','),true);
         //     }
         // }
     }
     // console.log('[Return]',r, this.modules);
     return r;
 }
 /**
  * La méthode containsKey permet de savoir si une clé existe dans le champs des valeur
  * d'un objet
  */
 $syl.containsKey = function(key, object){
     if(!object){
         $this.exception(this.err("cant read [ "+key+" ] property of null"));
     }
     return typeof object.value[key] != 'undefined';
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
 $syl.isCallable = function(object){
     return object && ['function','external'].indexOf(object.label) >= 0;
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
             struct: function(e,n){
                 var n = $this.set(n,0),
                     array = e && (e.type == 'Array' || e.implicitType == 'Array') ? 1 : e && (e.type == 'JSON' || e.implicitType == 'JSON') ? 2 : 0;
                     r = array > 0 ? array == 1 ? '[' : '{' : '';
                 if(array > 0){
                     for(var i in e.value){
                         r += r.length == 1 && array > 1 ? '\n' : '';
                         r += (r.length >= 3+(array > 1 ? 0 : -1) ? ", "+(array > 1 ? '\n' : '') : "")+(array > 1 ? " "+this.tab(n) : "")+(array == 1 ? "": i+" : ")+this.struct(e.value[i], n+1);
                     }
                     r += r.length > 1 && array > 1 ? '\n' : '';
                 }
                 else{
                     r += e && (e.type == 'String' || e.implicitType == 'String') && n > 0 && !$this.isCallable(e) ? 
                                 '"'+e.value+'"' : 
                                 e ? 
                                     'value' in e ? e.value : e.label+" ["+e.addr+"]"
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
                     $this.exception($this.toStringTypes(types)+" expected for argument "+n+" of "+serial.name+", "+arg.implicitType+" given !");
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
                 // console.log('[Args]',args);
                 for(var i in args){
                     // console.log('[Args]',args[i]);
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
                 r = parseInt(r.value);
                 r = isNaN(r) ? 0 : r;
                 return $this.toVariableStructure(r, ressources.parent);
             },
             float: function(){
                 var r = {};
                 for(var i in args){
                     r = args[i];
                     break;
                 }
                 r = parseFloat(r.value);
                 r = isNaN(r) ? 0.0 : r;
                 return $this.toVariableStructure(r, ressources.parent);
             },
             len: function(){
                 var r = 0;
                 if('0' in args && 'value' in args[0]){
                     if(['Array', 'JSON'].indexOf(args[0].type)){
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
                     type: 'Array',
                     value: {}
                 },false);
                 this.expect(args[0],0,[{type:'String'}]);
                 if('0' in args && (args[0].type == 'String' || args[0].implicitType == 'String')){
                     if('1' in args && (args[1].type == 'String' || args[1].implicitType == 'String')){
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
                 var r = "Any";
                 if('0' in args){
                     r = args[0].implicitType;
                 }
                 return $this.toVariableStructure(r);
             },
             replace: function(){
                 this.err(3);
                 var r = args[0].value;
                 this.expect(args[0],0,[{type:'String'}]);
                 this.expect(args[1],1,[{type:'String'},{type:'Number'}]);
                 this.expect(args[2],2,[{type:'String'},{type:'Number'}]);
                 r = args[0].value.replace(args[1].value, args[2].value);
                 return $this.toVariableStructure(r);
             },
             lower: function(){
                 this.expect(args[0], 0, [{type:'String'},{type:'Number'}]);
                 var r = $this.toVariableStructure(args[0].value.toLowerCase());
                 r.type = 'String';
                 r.implicitType = 'String';
                 return r;
             },
             maj: function(){
                 this.expect(args[0], 0, [{type:'String'},{type:'Number'}]);
                 // console.log('[Arg]',args,$this.currentObjectAddr,serial.addr);
                 var r = $this.toVariableStructure(args[0].value.toUpperCase());
                 r.type = 'String';
                 r.implicitType = 'String';
                 return r;
             },
             push: function(){
                 this.err(2);
                 this.expect(args[0], 0, [{type: 'Array'}]);
                 var index = $this.len(args[0].value);
                 for(var i in args){
                     if(i * 1 > 0){
                         this.expect(args[i], i, args[0].constraints ? args[0].constraints.value : [{type: 'Any'}]);
                         if(['Array','JSON'].indexOf(args[i].type) >= 0 && (!args[0].constraints || !args[0].constraints.recursive)){
                             $this.cursor = $this.copy(arg[i].cursor);
                             $this.exception($this.err("trying to push structure into non-recursive structure !"));
                         }
                         args[0].value[index] = args[i];
                         index++;
                     }
                 }
                 return args[0];
             },
             shift: function(){
                 this.expect(args[0], 0, [{type: 'Array'}, {type: 'JSON'}]);
                 for(var i in args[0].value){
                     delete args[0].value[i];
                     break;
                 }
                 if(args[0].type == 'Array' || args[0].implicitType == 'Array'){
                     this.rearrange();
                 }
                 return args[0];
             },
             pop: function(){
                 this.expect(args[0], 0, [{type: 'Array'},{type: 'JSON'}]);
                 var index = $this.len(args[0].value),
                     json = args[0].type == 'JSON' || args[0].implicitType == 'JSON',
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
                 if(args[0].type == 'Array' || args[0].implicitType == 'Array'){
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
                 this.expect(args[0], 0, [{type: 'Array'}]);
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
                 this.expect(args[0], 0, [{type: 'Array'}]);
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
                 this.expect(args[0], 0, [{type: 'Number'}]);
                 var precision = 0;
                 if('1' in args){
                     this.expect(args[1], 0, [{type: 'Number'}]);
                     precision = Math.floor(args[1].value * 1);
                 }
                 var r = Math.round(args[0].value * Math.pow(10,precision)) / Math.pow(10,precision);
                 return $this.toVariableStructure(r);
             },
             floor: function(){
                 this.expect(args[0], 0, [{type: 'Number'}]);
                 return $this.toVariableStructure(Math.floor(args[0].value * 1));
             },
             ceil: function(){
                 this.expect(args[0], 0, [{type: 'Number'}]);
                 return $this.toVariableStructure(Math.ceil(args[0].value * 1));
             },
             abs: function(){
                 this.expect(args[0], 0, [{type: 'Number'}]);
                 return $this.toVariableStructure(Math.abs(args[0].value * 1));
             },
             pow: function(){
                 this.err(2);
                 this.expect(args[0], 0, [{type: 'Number'}]);
                 this.expect(args[1], 1, [{type: 'Number'}]);
                 return $this.toVariableStructure(Math.pow(args[0].value * 1, args[1].value * 1));
             },
             max: function(max){
                 this.expect(arg[0],0,[{type: 'Number'}]);
                 var r = arg[0].value * 1,
                     max = $this.set(max, true);
                 for(var i in args){
                     this.expect(arg[i],i,[{type: 'Number'}]);
                     r = (max && r > args[i].value) || (!max && r < args[i].value) ? r : args[i].value;
                 }
                 return $this.toVariableStructure(r);
             },
             min: function(){
                 return this.max(false);
             },
             join: function(){
                 this.err(2);
                 this.expect(args[0], 0, [{type: 'Array'}]);
                 this.expect(args[1], 1, [{type: 'String'}, {type: 'Number'}]);
                 var r = '';
                 for(var i in args[0].value){
                     r += (r.length ? args[1].value : '')+args[0].value[i].value;
                 }
                 r = $this.toVariableStructure(r);
                 r.type = 'String';
                 r.implicitType = 'String';
                 return r;
             },
             bool: function(){
                 return $this.toVariableStructure($this.toBoolean(args[0].value));
             },
             raise: function(){
                 $this.exception(args[0].value);
             },
             //!TODO : To be implemented
             plaform: function(){
                 var r = null;
                 return $this.toVariableStructure(r);
             },
             timer: function(){
                 var r = null;
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
                 natives.expect(args[0],0,[{type: 'String'}]);
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
 /**
  * La méthode caller
  */
 $syl.caller = function(callable,ressources){
     var $this = this, cursor, instance;
     // if(callable.ref in this.modules){
     //     delete this.modules[callable.ref];
     // }
     /**
      * On sauvegarde le scope actuel pour le restaurer plus tard
      */
     var //_mainScope = this.currentScope,
         key = [$this.saveScope(true)];
     return new Promise(function(res){
         $this.toNextChar().then(function(_char){
             // console.log('[code]',$this.code.substr($this.cursor.index, 10));
             $this.arguments(callable,ressources,true).then(function(args){
                 // console.log('[Args]',callable.name,"::",args,$this.executing);
                 // console.log('[Arg]',args,'\n-->',$this.code.substr($this.cursor.index-10, 20), $this.executing);
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
                         $this.native(callable,args,ressources).then(function(value){
                             if(!value){
                                 value = $this.toVariableStructure(value,ressources);
                             }
                             res(value);
                         });
                     }
                     else{
                         // console.log('[scope]',$this.currentScope,$this.modules);
                         // console.log('[Args-->]',args,callable.arguments);
                         // console.log('[$modules]',$this.modules);
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
                         // $this.currentScope = callable.childScope;
                         key.push($this.setScope(callable.childScope));
                         $this.createBlock();
                         $this.createScopeObject(callable,args);
                         // console.log('[CALL][PARSING]', callable.name, cursor.lines);
                         $this.cursor = $this.copy(callable.scopeCursor);
                         // $this.cursor.index++;
                         // if('paralex' in callable){
                         //     console.log('[Parallex]', callable.name, callable.paralex);
                         // }
                         // instance = 'paralex' in callable && callable.paralex ? callable.paralex : $this;
                         $this.parse({
                             parent : callable.addr
                         },{
                             end: callable.braced ? [Synthetic.Lang.constants._EOS.BRACE] : [],
                             statementCount: callable.braced ? -1 : 1
                         }).then(function(response){
                             $this.setExecutionMod(true);
                             /**
                              * Si l'exécution ne retourne aucune donnée,
                              * on évite de retourner la valeur sous sa forme brute
                              */
                             if(!response){
                                 response = $this.toVariableStructure(response,ressources);
                             }
                             if(!$this.isValidateConstraint(response, callable.type)){
                                 $this.exception($this.err(" "+callable.type+" expected, "+response.type+" given"));
                             }
                             $this.cursor = $this.copy(cursor);
                             /**
                              * À la fin de l'éxecution de la fonction, on restaure 
                              * le scope principale
                              */
                             $this.restoreScope(key);
                             // console.log('[Scopes]',_mainScope, $this.currentScope);
                             // $this.currentScope = _mainScope;
                             // if(callable.braced){
                             //     $this.toNextChar().then(function(__char){
                             //         $this.cursor = $this.copy(cursor);
                             //         res(response);
                             //     });
                             // }
                             // else{
                                 // $this.cursor.scope--;
                                 // console.log('[CURSOR]',callable.name, cursor);
                                 res(response);
                             // }
                         });
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
         var _arguments = {}, _typeset = false,
             arg, index = 0, _cursor, _reachCursor, _arg,
             withParenthese = 0, callCertitude = 0;
         if(calling){
             // console.log('[callable]', serial.name, $this.executing);
         }
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
                 callable: false,
                 external: false,
                 constant: false
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
             // console.log('[CURSOR]',cursor);
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
                     console.log('[Cursor]',cursor.word);
                     $this.exception($this.err("syntax error withing parenthesisless calling style function !"),true);
                 }
                 if(calling && !(cursor.word in serial.arguments)){
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
                 // console.log('[Set]',$this.code.substr($this.cursor.index, 10));
                 $this.value({
                     object: arg,
                     subvariables: false, 
                     ressources: ressources,
                     ternary: false,
                     end: [Synthetic.Lang.constants._EOS.COMA, Synthetic.Lang.constants._EOS.PARENTHESE]
                 }).then(function(result){
                     /**
                      * On doit déléguer les type si c'est une fonction
                      */
                     // if(result && result.label == 'function'){
                     //     result.type = arg.type;
                     //     result.implicitType = arg.implicitType;
                     // }
                     // console.log('[Result]',result);
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
                         $this.exception($this.err("error from trying to set value of [ "+_arg.name+" ] !"));
                     }
                     _arguments[index] = typeof cursor.word == 'object' ? cursor.word : $this.toVariableStructure(cursor.word);
                 }
                 withParenthese--;
                 if(callCertitude){
                     $this.goTo(1);
                 }
                 // console.log('[ARGS][END][1]',serial.name, $this.code.substr($this.cursor.index, 10));
                 // console.log('[arg][end]', cursor.word,serial.name, '>'+$this.code.substr($this.cursor.index-1, 5));
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
                         // console.log('[Char]',serial.name);
                         // if(serial.name == 'debug') console.log(serial);
                         $this.backTo(cursor.char.length - (cursor.char.length == 1 ? 1 : 0));
                     }
                     // console.log('[END][Args]',$this.code.substr($this.cursor.index, 10));
                     loop.end();
                 }
                 else{
                     $this.exception($this.err("[ "+cursor.char+" ] unexpected !"),true);
                 }
             }
         }
         function saveArgument(cursor,loop){
             return new Promise(function(_res,_rej){
                 // console.log('Cursor',cursor.word, '/', cursor.char, calling);
                 if(calling && cursor.char != ':' && cursor.word && typeof cursor.word != 'object'){
                     loop.stop();
                     $this.cursor = $this.copy(_cursor);
                     // console.log('[Char*****]',serial.name+"::", cursor.word, '/', cursor.char,'>'+$this.code.substr(_cursor.index,10));
                     // console.log('[String]',$this.code.substr($this.cursor.index, 10));
                     $this.value({
                         object: arg,
                         ressources: ressources,
                         end: [Synthetic.Lang.constants._EOS.COMA, Synthetic.Lang.constants._EOS.PARENTHESE]
                     }).then(function(result){
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
                         var _char = $this.code[$this.cursor.index-1];
                         /**
                          * Si le caractère précédent est une ")", on doit pas procéder
                          * jusqu'au caractère non-blanc suivant avant de finir l'enregistrement
                          */
                         // console.log('[ARG][Litt]','>'+$this.code.substr($this.cursor.index,10), '/', _char, result)
                         if([')'].indexOf(_char) >= 0){
                             $this.cursor.index--;
                             finishSavingArgument({char: _char, word: result}, loop,_res);
                             _cursor = $this.copy($this.cursor);
                         }
                         else{
                             // console.log('[Master]****',cursor.word, '/', _char, '/','>'+$this.code.substr($this.cursor.index-1,10))
                             $this.toNextChar().then(function(__char){
                                 // console.log('[Char]',_char, '/', __char);
                                 // console.log('[HERE]',$this.code[$this.cursor.index - 1],_char,withParenthese)
                                 // console.log('[ARG][Litt]',cursor.word, '>'+$this.code.substr($this.cursor.index,10))
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
         }
 
         $this.runner(function(cursor,loop){
             /**
              * On cherche les mots dans les arguments
              */
             //  console.log('[Cursor]',cursor);
             if(cursor.word && cursor.word.length){
                 // console.log('[Word]',cursor.word, calling);
                 if(Synthetic.Lang.reservedKeys.indexOf(cursor.word) >= 0 && cursor.word != 'null'){
                     if(_typeset){
                         $this.exception($this.err("syntax error near by [ "+arg.type+" ... "+cursor.word+" ] !"),true);
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
                     else{
                         $this.exception($this.err("invalid syntax near [ "+cursor.word+" ] !"),true);
                     }
                 }
                 else{
                     _reachCursor = $this.copy($this.cursor);
                     loop.stop();
                     $this.litteral(cursor.word,{parent: null},true).then(function(type){
                         if(type && type.label == 'type'){
                             if(arg.name || calling || (serial.label == 'external' && type.name != 'Any')){
                                 if(serial.label == 'external'){
                                     $this.exception("externals function don't support other type than Any");
                                 }
                                 $this.exception($this.err("invalid syntax !"),true);
                             }
                             if(arg.external && type.type != 'Any'){
                                 $this.exception($this.err("syntax error, external don't support other type than Any !"),true);
                             }
                             arg.type = type.type;
                             arg.implicitType = type.type;
                             _typeset = true;
                             arg.typeOrigin = type.origin,
                             $this.toNextChar().then(function(char){
                                 if(char == '<'){
                                     $this.genericType(type.type).then(function(generic){
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
                             // console.log('[Not Found]', cursor.word);
                             $this.cursor = $this.copy(_reachCursor);
                             arg.name = cursor.word;
                             if(['\n', ' '].indexOf(cursor.char) >= 0){
                                 $this.toNextChar().then(function(_char){
                                     // console.log('[call for][1]',cursor.word,'/',_char,'/',$this.code.substr($this.cursor.index, 10));
                                     saveArgument({char:_char, word: cursor.word}, loop).then(function(){
                                         loop.start();
                                     });
                                 });
                                 return;
                             }
                             // console.log('[call for]',cursor.word,'/',cursor.char, '\n',$this.code.substr($this.cursor.index, 10));
                             saveArgument(cursor,loop).then(function(){
                                 // console.log('[end-->]')
                                 loop.start();
                             });
                         }
                     });
                     return;
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
                     // console.log('[Result]',result);
                     $this.toNextChar().then(function(_char){
                         // console.log('[Result]',result.name, $this.code[$this.cursor.index]+"<");
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
                     $this.exception($this.error("[ "+cursor.char+" ] unexpected !"),true);
                 }
                 loop.end();
                 // console.log('[Okk*********]',serial.name+"::",cursor.word,$this.code.substr($this.cursor.index, 10));
             }
             else{
                 // console.log('[Char]', cursor.char);
                 // $this.exception($this.err("near by [ "+cursor.char+" ] unexpected !"));
             }
         })
         .then(function(){
             // $this.goTo(1);
             // console.log('[Arg][result]',serial.name+"::", calling, $this.len(_arguments), $this.code.substr($this.cursor.index, 10));
             if(withParenthese != 0){
                 /**
                  * Il se peut qu'un argument ait le même nom qu'une fonction définie,
                  * il faut empêcher le déclenchemenent de l'erreur
                  */
                 if($this.tryMethodInstead){
                     res(null);
                 }
                 else if(callCertitude){
                 // console.log('[NOOOOO !]',withParenthese,calling,'>'+$this.code.substr($this.cursor.index-1,10));
                     $this.exception($this.err(withParenthese < 0 ? "syntax error ! [ ) ] unexpected" : "[ ) ] expected !"),true);
                 }
             }
             // console.log('[Arg][finish]',serial.name+"::",$this.code.substr($this.cursor.index, 10));
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
             res(_arguments);
         });
     });
 }
 /***
  * La méthode method permet la sérialization d'une fonction ou d'une méthode
  */
 $syl.method = function(serial,ressources){
     var $this = this,
         _currentScope = $this.currentScope,
         key;
     this.currentType = null;
     // console.log('[Serial]',serial);
     // console.log('[Method]',serial.name);
     return new Promise(function(res,rej){
         var savingArg = false,executing = $this.executing,
             scope;
         if(serial.label != 'external'){
             serial.label = 'function';
         }
         serial.arguments = {};
         serial.scopeCursor = $this.cursor;
         //On définit si la fonction a des accollades
         serial.braced = false;
         serial.begin = 0;
         serial.end = 0;
         serial.childScope = null;
         brace = 0;
         $this.runner(function(cursor,loop){
             if(cursor.char == '(' && !savingArg){
                 loop.stop();
                 scope = $this.cursor.scope;
                 key = $this.setScope($this.cursor.scope + 1);
                 // $this.fixScope(true);
                 /**
                  * On crée un bloc pour éviter tout écrasement de nom
                  */
                 $this.createBlock();
                 serial.childScope = $this.currentScope;
                 $this.arguments(serial,ressources)
                 .then(function(arg){
                     // console.log("[Method][Arg]",serial.name+"::", $this.code.substr($this.cursor.index, 10), $this.cursor.scope);
                     $this.toNextChar().then(function(_char){
                         /**
                          * On doit décrémenter le scope parce qu'on l'avait incrémenté avant la
                          * lecture des arguments
                          */
                         $this.restoreScope(key);
                         key = $this.setScope($this.cursor.scope + 1);
                         // console.log('[Scope]',$this.cursor.scope, serial.name, $this.code.substr($this.cursor.index, 15));
                         serial.arguments = arg;
                         if($this.code[$this.cursor.index] == '{'){
                             serial.braced = true;
 
                             // $this.cursor.scope--;
                             // $this.fixScope(false);
                             $this.goTo(1);
                             // console.log('[Back To]', $this.code[$this.cursor.index], $this.cursor.scope);
                             // console.log('[method] braced', $this.code.substr($this.cursor.index, 10));
                         }
                         else if(/[\S]+/.test($this.code[$this.cursor.index])){
                             $this.backTo(1);
                         }
                         if(!serial.braced){
                             // $this.fixScope(true);
                         }
                         serial.scopeCursor = $this.copy($this.cursor);
                         serial.begin = $this.cursor.index;
                         $this.createBlock(serial.ref);
                         // console.log('[Arg]', arg, serial.name, $this.code.substr($this.cursor.index-1, 15))//, serial.ref, $this.executing, $this.blocks);
                         loop.start();
                     });
                 });
                 return;
             }
             /**
              * On restaure le bloc parent
              */
             $this.currentScope = _currentScope;
             $this.setExecutionMod(false);
             loop.stop();
             $this.parse(ressources, {
                 end: [Synthetic.Lang.constants._EOS.BRACE],
                 statementCount: serial.braced ? -1 : 1
             }).then(function(){
                 // console.log('[PARSE][END]',serial.name,'/', $this.code.substr($this.cursor.index, 10), $this.cursor.scope);
                 /**
                  * Si la function a des accolades, il faut que le EOS soit un "}"
                  * sinon on déclenche une erreur
                  */
                 $this.setExecutionMod(executing);
                 // console.log('[End] of Method',serial,'/',$this.code.substr($this.cursor.index, 10)+'<')//,serial, $this.code.substr($this.cursor.index, 10));
                 if(serial.braced && $this.code[$this.cursor.index] != '}'){
                     // console.log('[Execution]', $this.code.substr($this.cursor.index, 10));
                     $this.exception($this.err("[ } ] expected !"),true);
                 }
                 /**
                  * Si on pense que c'est une fonction alors qu'elle n'avait pas d'accollade
                  * de debut, on enlève la décompte de scope faite précédemment !
                  */
                 if(!serial.braced && $this.code[$this.cursor.index] == '}'){
                     // console.log('******[HELP]', serial.name, $this.cursor.scope);
                     // $this.cursor.scope++;
                 }
                 if(serial.braced){
                     $this.goTo(1);
                 }
                 else{
                     // $this.cursor.scope--;
                     $this.backTo(1);
                 }
                 $this.restoreScope(key);
                 loop.end();
             });
         }).then(function(){
             $this.currentScope = _currentScope;
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
             type: 'Any',
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
             type: 'Any',
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
     var $this = this,
         assignType = this.currentType,
         ref = this.set(ref,false),
         type = this.getType(),
         syntObject = $this.find(litteral),
         key = [this.saveObjectAddr()],
         _scopeKey = [this.saveScope(true)],
         _currentObjetAddr = this.currentObjectAddr,
         redefinition = this.currentType != null,
         exist = !redefinition && syntObject != null && !$this.access.override,
         settingKey = null, settingKeyObject = null,
         created = false, dotted = false, nextWord = '',
         serial = exist || ref ? syntObject : this.meta({
             type: type.type,
             typeOrigin: type.origin,
             parent: this.set(ressources.parent,null),
             constraints: type.constraints,
             label: 'variable', //le type de notation: par exemple : mixin, variable
             name: litteral, //le nom du notation: par exemple : nomVariable
             visible: this.access.export,
             parent: this.set(ressources.parent,null)
         }),
         resultValue = exist ? syntObject : null, called = false,
         _cursor;
         console.log('[search for]', litteral, exist, $this.executing);
         // console.log('[Result]', resultValue, litteral);
         if(!exist ){
             // console.log('[Modules]',litteral,$this.modules);
         }
         else{
             // console.log('[Litt]',litteral, $this.modules);
         }
         // console.log('[Type]',litteral,redefinition,exist, [$this.cursor.scope, $this.cursor.index]);
         // console.trace('[Serial]',litteral,exist,serial);
         // previous = exist ? null : this.getCloserStruct([serial.cursor.scope,serial.cursor.index]);
         // console.log('[Ok]');
     return new Promise(function(res){
         if(syntObject != null && syntObject.label == 'type' && assignType != null){
             $this.exception($this.err("syntax error : "+assignType.type+" ... "+syntObject.name),true);
         }
         if(redefinition && exist && (resultValue.constant || resultValue.final) ) {
             $this.exception($this.err("cannot override [ "+litteral+" ] declared previously as "+(resultValue.constant ? 'constant' : 'final')+" !"));
         }
         _cursor = $this.copy($this.cursor);
         if(ref && !exist){
             // console.log('Direct',litteral,syntObject,redefinition)
             res(null);
             return;
         }
         $this.runner(function(cursor,loop){
             // console.log('[Litt][sign]',cursor);
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
                         $this.exception($this.err("Cannot read property [ "+nextWord+" ] of null"));
                     }
                     if($this.containsKey(nextWord,resultValue)){
                         resultValue = resultValue.value[nextWord];
                         _cursor = $this.copy($this.cursor);
                     }
                     else{
                         // console.log('[ResultVal]',resultValue)
                         /**
                          * Si l'objet exist mais pas la clé,
                          * on le prépare paresseusement pour un enregistrement
                          */
                         if((resultValue.type == 'JSON' || resultValue.implicitType == 'JSON') && exist){
                             settingKey = nextWord;
                             settingKeyObject = resultValue;
                         }
                         resultValue = null;
                         _cursor = $this.copy($this.cursor);
                     }
                     // if(cursor.char == '.'){
                         dotted = false;
                     // }
                     if(called){
                         called = false;
                     }
                     // console.log('[Nextword]',nextWord,dotted)
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
                 //Si on a un opérateur d'affectation ou de cummulation, on passe à une affectation
                 if(['=','+=','-=','/=','*=','~=', '--', '++'].indexOf(cursor.char) >= 0){
                     if(ref){
                         loop.end();
                         return;
                     }
                     $this.goTo(1);
                     /**
                      * Si l'objet n'existe pas et que c'est n'est pas une création d'objet
                      * on lève une exception
                      */
                     if(!exist && cursor.char != '='){
                         $this.exception($this.err("cannot modified undefined object [ "+(settingKey ? settingKey : litteral)+" ] value"));
                     }
                     if(!exist || resultValue || !settingKey){
                         // console.log('[Val]',  exist,'/', settingKey, litteral);
                         // if(exist){
                         //     console.log('[Litt]',litteral,resultValue);
                         // }
                         key.push($this.setObjectAddr(exist ? resultValue.addr : serial.addr));
                         // $this.currentObjectAddr = exist ? resultValue.addr : serial.addr;
                     }
                     if(cursor.char == '=' && exist && resultValue){
                         // console.log('[Ok]',litteral,resultValue)
                         $this.freeLinkOf(resultValue);
                     }
                     // console.log('[Serial]',litteral,settingKey, exist);
                     if(settingKey){
                         // console.log('[Dot]', settingKeyObject)
                         _scopeKey.push($this.setScope(settingKeyObject.childScope));
                         _scopeKey.push($this.saveScope());
                         _scopeKey.push($this.setScope(settingKeyObject.cursor.scope + 1));
                         settingKey = $this.meta({
                             name: settingKey,
                             constraints: serial.constraints,
                             visible: false
                         });
                         $this.linkWith(settingKey,serial);
                         // console.log('[Val][1]', settingKey.addr);
                         key.push($this.setObjectAddr(settingKey.addr));
                         // $this.currentObjetAddr = settingKey.addr;
                     } 
                     if(exist && cursor.char == '=' && resultValue && ( resultValue.constant || resultValue.final ) ){
                         $this.exception($this.err("cannot override [ "+litteral+" ] declared previously as "+(resultValue.constant ? 'constant' : 'final')+" !"));
                     }
                     if(!exist && assignType != null){
                         $this.currentType = assignType;
                     }
                     /**
                      * On doit donner à la variable la clé 'value' pour ne pas être supprimée
                      * Si on est entrain de la créer
                      */
                     if(!exist){
                         serial.value = null;
                     }
                     if(['--', '++'].indexOf(cursor.char) >= 0){
                         if($this.executing){
                             var tmp = {
                                 name : resultValue.name,
                                 visible : resultValue.visible,
                                 addr: resultValue.addr
                             };
                             // console.log('[Result]',result,resultValue);
                             $this.extend(resultValue, $this.calc([resultValue, cursor.char == '++' ? '+=' : '-=', $this.meta({type: 'Number', label: 'variable', value: 1})]),true);
                             // $this.linkWith(result,resultValue);
                             $this.extend(resultValue, tmp,true);
                         }
                         loop.end();
                     }
                     else{
                         // loop.stop();
                         $this.value({
                             object: exist ? resultValue && !settingKey ? resultValue : settingKey : serial, 
                             subvariables: false, 
                             ressources:ressources,
                             ternary: false,
                             end: $this.currentType != null ? [Synthetic.Lang.constants._EOS.COMA] : []
                         }).then(function(result){
                             // console.log('[result]',litteral,exist,'/',result, $this.executing, $this.modules);
                             if($this.code[$this.cursor.index-1] == ','){
                                 $this.currentType = assignType;
                             }
                             if(exist){
                                 if(settingKey){
                                     /**
                                      * Si c'est un callable
                                      * On doit vérifier que le type de retour n'est pas multiple
                                      */
                                     // console.log('[Scope]',$this.cursor.scope);
                                     if($this.isCallable(result) && serial.constraints && serial.constraints.value.length > 1 && !$this.isValidateConstraint("Any", serial.constraints.value)){
                                         $this.cursor = $this.copy(_cursor);
                                         $this.exception($this.err("too much return value types !"));
                                     }
                                     settingKeyObject.value[settingKey.name] = $this.extend(settingKey, $this.copy(result));
                                     // $this.linkWith(result);
                                     if(serial.constraints){
                                         /**
                                          * Si le resulta est un external, on vérifier qu'il n'y a acceptation que
                                          * du type 'Any'
                                          */
                                         if(result.label == 'external' && !$this.isValidateConstraint('Any', serial.constraints.value)){
                                             $this.cursor = $this.copy(_cursor);
                                             $this.exception($this.err("external structure don't support other type than Any, "+serial.constraints.value[0].type+" was given !"));
                                         }
                                         /**
                                          * Si c'est une fonction et que le type est Any
                                          * On lui passe le type principale de la contrainte de la 
                                          * structure
                                          */
                                         if(result.type == 'Any' && $this.isCallable(result)){
                                             settingKeyObject.value[settingKey.name].type =  serial.constraints.value[0].type;
                                         }
                                         /**
                                          * Sinon Si le type de la valeur n'est pas compatible aux contraintes
                                          * de la structure, on lève une erreur
                                          */
                                         else if(!$this.isValidateConstraint(result, serial.constraints.value)){
                                             $this.cursor = $this.copy(_cursor);
                                             $this.exception($this.err($this.toStringTypes(serial.constraints.value)+" value expected, "+result.implicitType+" given !"));
                                         }
                                     }
                                     $this.restoreScope(_scopeKey[1]);
                                     _scopeKey.pop();
                                 }
                                 else{
                                     var tmp = {
                                         name : resultValue.name,
                                         visible : resultValue.visible,
                                         addr: resultValue.addr
                                     };
                                     // console.log('[Result]',cursor.char,result);
                                     if(cursor.char != '='){
                                         result = $this.calc([resultValue, cursor.char, result]);
                                         // resultValue.value = result.value;
                                         // console.log('[Result]',resultValue);
                                     }
                                     // else{
                                         // console.log('[Result]',result,resultValue);
                                         $this.extend(resultValue, result,true);
                                         // $this.linkWith(result,resultValue);
                                         $this.extend(resultValue, tmp,true);
                                         // resultValue.name = tmp.name;
                                         // resultValue.visible = tmp.visible;
                                         // $this.save(resultValue);
                                     // }
                                 }
                             }
                             else{
                                 if($this.executing){
                                     delete serial.value;
                                     $this.extendElse(serial, result);
                                     // console.log('[VLitt]', litteral, $this.modules, $this.code.substr($this.cursor.index, 10));
                                     if(!result){
                                         $this.exception($this.err("previous syntax error detected !"));
                                     }
                                     serial.implicitType = result.implicitType;
                                     if(["function", 'external'].indexOf(result.label) >= 0){
                                         serial.label = result.label;
                                     }
                                     // if(["function"].indexOf(result.label) >= 0){
                                     //     serial.label = result.label;
                                     // }
                                     _cursor = $this.copy($this.cursor);
                                     created = true;
                                     resultValue = serial;
                                 }
                             }
                             loop.end();
                         });
                     }
                 }
                 //Si on a le caractère '(' on passe à l'appelation d'une fonction
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
                     // console.log('[SERIAL]',serial.name, exist,redefinition);
                     if(!exist || (exist && (redefinition || settingKey) && !$this.isCallable(serial) && (serial.constant || serial.final) ) ){
                         if(exist){
                             if(settingKey){
                                 if(serial.type != "JSON"){
                                     $this.exception($this.err("cannot add [ "+settingKey+" ] to [ "+serial.name+" ], JSON type required !"));
                                 }
                                 if(serial.constraints && serial.constraints.length > 1){
                                     $this.exception($this.err("too much return type !"));
                                 }
                                 if(serial.constraints && !$this.isValidateConstraint("String", serial.constraints.key)){
                                     $this.exception($this.err($this.toStringTypes(serial.constraints.key)+" key type expected String given !"));
                                 }
                                 serial.value[settingKey] = $this.meta({
                                     type: !serial.constraints ? 'Any' : serial.constraints.value[0].type,
                                     name: settingKey,
                                     constraints: !serial.constraints ? null : serial.constraints.value[0].constraints,
                                 });
                                 serial = serial.value[settingKey];
                             }
                         }
                         $this.method(serial,ressources).then(function(method){
                             resultValue = method;
                             // console.log('*********[Method]',$this.executing,method.name, $this.cursor);
                             _cursor = $this.copy($this.cursor);
                             /**
                              * Pour empêcher d'interpréter fraichement la fonction
                              * on dit qu'elle n'a pas existée et on désactive l'écriture pointée
                              */
                             if(exist && settingKey){
                                 exist = false;
                                 dotted = false;
                             }
                             created = true;
                             loop.start();
                         });
                     }else{
                         if(!$this.isCallable(resultValue)){
                             $this.exception($this.err("cannot call "+(resultValue ? "[ "+resultValue.name+" ]" : "from null")+" !"));
                         }
                         // console.log('[Call][1]',resultValue.name);
                         $this.caller(resultValue,ressources).then(function(result){
                             resultValue = result;
                             // console.log('[Caller][finished]', resultValue, $this.executing)
                             _cursor = $this.copy($this.cursor);
                             called = true;
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
                     if(!exist && resultValue == null){
                         $this.exception($this.err("[ "+cursor.char+" ] unexpected !"),true);
                     }
                     if(dotted){
                         $this.exception($this.err("syntax error !"),true);
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
                         if($this.containsKey(result.value, resultValue)){
                             resultValue = resultValue.value[result.value];
                         }
                         else{
                             /**
                              * Si l'objet exist mais pas la clé,
                              * on le prépare paresseusement pour un enregistrement
                              */
                             if(['Array', 'JSON'].indexOf(resultValue.type) >= 0 && exist){
                                 settingKey = result.value;
                                 settingKeyObject = resultValue;
                             }
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
                             $this.exception($this.err("invalid syntax !"),true);
                         }
                         if($this.containsKey(nextWord, resultValue)){
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
                     if(called){
                         called = false;
                     }
                     cursor.word = '';
                     nextWord = '';
                     $this.cursor.index++;
                     loop.start();
                 }
                 else{
                     if(ref){
                         // console.log('[Litt][ref]',litteral);
                         loop.end();
                         return;
                     }
                     // resultValue = resultValue == null ? $this.find(litteral) : resultValue;
                     // console.log('[END LITT]', litteral, exist, created, $this.cursor.index, $this.code.substr($this.cursor.index, 10));
                     if(!exist && $this.executing && !created /*&& resultValue == null*/){
                         if($this.tryMethodInstead){
                             resultValue = null;
                             $this.garbage(true);
                             $this.tryMethodInsteadConfirmed = true;
                             loop.end();
                             return;
                         }
                         else{
                             // console.log('[Litteral]',resultValue, $this.cursor,dotted);
                             $this.exception($this.err("[ "+litteral+" ] is undefined !"));
                         }
                     }
                     if(exist && resultValue && $this.isCallable(resultValue)){
                         if(called){
                             if(cursor.char.length && /[\S]+/.test(cursor.char)){
                                 // console.log('[Char]',cursor.char, _char);
                                 $this.backTo(cursor.char.length - (cursor.char.length == 1 ? 1 : 0));
                             }
                             loop.end();
                             return;
                         }
                         // console.log('[Cursor__]',cursor,resultValue);
                         // console.log('[Call][2]',resultValue.name);
                         // console.log('[Next To]',cursor.char,'/',$this.code.substr($this.cursor.index,10));
                         $this.caller(resultValue,ressources).then(function(result){
                             // console.log('[Ok]',result);
                             // console.log('[Call][end]',litteral, resultValue.name)//,'/',(result ? result.name : null), $this.code.substr($this.cursor.index, 10));
                             resultValue = result;
                             $this.linkWith(resultValue);
                             called = true;
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
                         // console.log('[Done]',dotted,nextWord, cursor.char);
                         if(cursor.char.length && /[\S]+/.test(cursor.char)){
                             $this.backTo(cursor.char.length - (cursor.char.length == 1 ? 1 : 0));
                             // console.log('[Char]',litteral,cursor.char, _char,'/',$this.code[$this.cursor.index]);
                         }
                         // console.log('[Litteral]',litteral);
                         $this.linkWith(resultValue);
                         loop.end();
                     }
                     else{
                         $this.goTo(1);
                         // $this.cursor.index++;
                         loop.start();
                     }
                 }
             });
         }).then(function(){
             $this.restoreObjectAddr(key);
             // $this.currentObjectAddr = _currentObjetAddr;
             // console.log('[Litteral][Result]', litteral, '/', $this.code.substr($this.cursor.index, 10));
             // if($this.code[$this.cursor.index] == '}'){
             //     // console.log('[litt][}]',$this.cursor.scope);
             //     $this.fixScope(true);
             //     // console.log('[litt][}]',$this.cursor.scope);
             // }
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
         _end, statement = 0;
         // console.log('[Parse]', ressource);
         data.end = Array.isArray(data.end) ? data.end : [];
         data.statementCount = this.set(data.statementCount,-1);
         data.stopOnBreak = this.set(data.stopOnBreak,false);
     return new Promise(function(resolve, reject){
         $this.runner(function(cursor,loop){
             /**
              * S'il y a un mot trouvé, on va vérifier:
              */
             _end = Synthetic.Lang.constants._EOS.values.end.indexOf(cursor.char);
             if(cursor.word){
                 if(cursor.char.length){
                     // $this.backTo(cursor.char.length - 1);
                 }
                 // console.log('[WORD]',cursor);
                 /**
                  * S'il existe dans la liste des mots-clés réservés
                  */
                 if(Synthetic.Lang.reservedKeys.indexOf(cursor.word) >= 0){
                     if(cursor.word == "null"){
                         /**
                          * On préserve l'intégrité syntaxique de la structure
                          * switch s'il y en a
                          */
                         if($this.currentSwitch){
                             $this.exception($this.err("[ " + cursor.word + " ] unexpected withing switch statement scope"),true);
                         }
                         /**
                          * On préserve l'intégrité syntaxique de la structure
                          * try ... catch s'il y en a
                          */
                         if($this.tryingBlock && $this.tryingBlock.reachCatch){
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
                         if($this.currentSwitch && ['case','default'].indexOf(cursor.word) < 0){
                             $this.exception($this.err("[ " + cursor.word + " ] unexpected withing switch statement scope"));
                         }
                         /**
                          * On préserve l'intégrité syntaxique de la structure
                          * try ... catch s'il y en a
                          */
                         if($this.tryingBlock && $this.tryingBlock.reachCatch && ['catch'].indexOf(cursor.word) < 0){
                             $this.exception($this.err("[ " + cursor.word + " ] unexpected !"),true);
                         }
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
                     }
                     return;
                 }
                 /**
                  * S'il est un type défini on prend on compte le type
                  */
                 // else if($this.types.indexOf(cursor.word) >= 0){
                 //     loop.stop();
                 //     $this.litteral(cursor.word, ressource, true).then(function(type){
                 //         /**
                 //          * Si aucun type n'est encore pris en compte, on passe à sa prise en compte
                 //          */
                 //         if($this.currentType == null){
                 //             $this.currentType = {
                 //                 type: cursor.word,
                 //                 constraints: null,
                 //                 hasKeyConstraint: false,
                 //                 saved: true,
                 //                 hasNextType: false
                 //             };
                 //         }
                 //         /**
                 //          * si le type pris en compte a des contraintes, c'est qu'il est générique
                 //          */
                 //         else if($this.currentType.constraints != null && !$this.currentType.saved && $this.hasNextType){
                 //             $this.currentType.constraints[!$this.currentType.hasKeyConstraints ? 'key' : 'value'].push(cursor.word);
                 //         }
                 //         /**
                 //          * sinon il y a erreur de syntaxe
                 //          */
                 //         else{
                 //             $this.exception($this.err("syntax error : "+$this.currentType.type+" ... "+cursor.word));
                 //         }
                 //     });
                 // }
                 /**
                  * Sinon c'est un litéral
                  */
                 else if([Synthetic.Lang.constants.LITTERAL, Synthetic.Lang.constants.TYPE].indexOf($this.getCodeType(cursor.word)) >= 0){
                     loop.stop();
                     /**
                      * On préserve l'intégrité syntaxique de la structure
                      * switch s'il y en a
                      */
                     if($this.currentSwitch){
                         $this.exception($this.err("[ " + cursor.word + " ] unexpected withing switch statement scope"));
                     }
                     /**
                      * On préserve l'intégrité syntaxique de la structure
                      * try ... catch s'il y en a
                      */
                     if($this.tryingBlock && $this.tryingBlock.reachCatch){
                         $this.exception($this.err("[ " + cursor.word + " ] unexpected !"),true);
                     }
                     $this.litteral(cursor.word, ressource).then(function(result){
                         if(result && result.label == 'type'){
                             $this.currentType = {
                                 type: result.type,
                                 origin: result.origin,
                                 constraints: null,
                                 object: result
                             };
                         }
                         else{
                             object = result;
                         }
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
                 else if(/[\S]+/.test(cursor.word)){
                     // console.log('[Word]',cursor.word);
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
                 // console.log('[Modules]',$this.modules);
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
         $this.runner(function(cursor,loop){
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
             braceless = false,key = $this.saveScope(),
             reason = true;
         // console.log('[Type]',data.type, $this.previousReason);
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
                 // console.log('[ELSE]', $this.cursor.scope);
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
                     // $this.cursor.scope--;
                     res();
                 });
             }
             /**
              * Traitement pour les if/elif
              */
             else{
                 $this.setExecutionMod(executing && !previousReason);
                 // reason = $this.executing;
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
                         $this.exception($this.err("syntax error. [ { ] expected !"),true);
                     }
                     if(!parentheseless){
                         $this.goTo(1);
                     }
                     braceless = $this.code[$this.cursor.index + (parentheseless ? 1 : 0)] != '{';
                     reason = !$this.executing ? false : $this.toBoolean(value.value);
                     
                     if(!reason || (previousReason !== null && previousReason) ){
                         $this.setExecutionMod(false);
                         /**
                          * Si la raison actuelle est fausse
                          * on doit encore garder la raison précédente
                          */
                         reason = previousReason === null ? reason : previousReason;
                     }
                     // console.log('[reason]',$this.previousReason,braceless);
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
                         // console.log('[ENDIF]',$this.code.substr($this.cursor.index, 10))
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
         // console.log('[ressources]',ressources,$this.executing);
         var parent = Synthetic.Lang.objects[ressources.parent];
         
         //$this.getCloserStruct([$this.cursor.scope, $this.cursor.index], ['function']);
         /**
          * Si l'instruction return est en déhors d'une fonction, on arrête tout
          */
         // if('parent' in ressources){
         //     console.log('[Ressources]',Synthetic.Lang.objects[ressources.parent]);   
         // }
         // console.log('[Parent]',parent, ressources);
         if($this.executing){
             // console.log('[Return]',ressources);
         }
         if($this.executing && parent.label != 'function'){
             $this.exception($this.err("Illegal statement ! return statement outside of function !"),true);
         }
         $this.value({
             object: $this.executing ? $this.copy(parent) : $this.meta({},false),
             subvariables: false, 
             ressources : ressources,
             ternary: false
         }).then(function(result){
             // $this.extend(parent, cp_parent);
             // console.log('[Return]',result, $this.code.substr($this.cursor.index, 10));
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
             _currentSwitch = $this.currentSwitch,
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
                     object: $this.meta({type: 'Any'},false),
                     end: [Synthetic.Lang.constants._EOS[backToGetReference ? 'BRACE' : 'PARENTHESE']]
                 }).then(function(result){
                     reference = result;
                     $this.currentSwitch = {
                         reference : reference,
                         toDefault: true
                     };
                     $this.toNextChar().then(function(_char){
                         if(_char != '{'){
                             $this.exception($this.err("[ { ] expected for switch beginning scope !"),true);
                         }
                         $this.goTo(1);
                         $this.parse(ressources,{
                             end: [Synthetic.Lang.constants._EOS.BRACE]
                         }).then(function(_result){
                             $this.currentSwitch = _currentSwitch;
                             if($this.code[$this.cursor.index] != '}'){
                                 $this.exception($this.err("[ } ] expected !"),true);
                             }
                             $this.restoreScope(_scopeKey);
                             loop.end();
                             res(_result);
                             // console.log('[Result__]',_result,$this.code.substr($this.cursor.index, 10));
                         });
                         // console.log('[code]',_char,'/',$this.code.substr($this.cursor.index, 10))
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
         reference = $this.currentSwitch,
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
                             object: $this.meta({type: 'Any'}, false),
                             ressources: ressources,
                             end: [Synthetic.Lang.constants._EOS.ELSE,Synthetic.Lang.constants._EOS.OR]
                         }).then(function(result){
                             values.push(result);
                             // console.log('[With]', result, '>'+$this.code.substr($this.cursor.index, 5));
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
                     // console.log('[Values]',values);
                     for(var i in values){
                         matched = $this.calc([reference.reference, '===', values[i]]).value;
                         if(matched){
                             reference.toDefault = false;
                             break;
                         }
                     }
                     // console.log('[Values]',matched,reference.reference,'/',values);
                 }
                 $this.setExecutionMod(matched);
                 $this.currentSwitch = null;
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
                     $this.currentSwitch = reference;
                     $this.restoreScope(_scopeKey);
                     // console.log('[Value]',_value, matched,_executing);
                     loop.end();
                     res(_value);
                 });
             }
         });
         // console.log('[Next]',$this.code.substr($this.cursor.index, 10));
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
         _tryingBlock = $this.tryingBlock,
         _executing = $this.executing,
         blocked,
         _scopeKey = [$this.saveScope(true),$this.saveScope()];
     return new Promise(function(res){
         if(except && (!_tryingBlock || !_tryingBlock.reachCatch)){
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
                 _executing = $this.tryingBlock.executing;
                 $this.setExecutionMod(_executing);
                 $this.tryingBlock = $this.tryingBlock.previous;
                 // console.log('[Parsing]',$this.executing, _executing);
                 if(argset){
                     $this.save(argset)
                 }
             }
             else{
                 $this.tryingBlock = {
                     blocked: false,
                     reachCatch: false,
                     message: null,
                     executing: _executing,
                     previous: _tryingBlock
                 };
             }
             $this.parse(ressources,{
                 end: [Synthetic.Lang.constants._EOS.BRACE]
             }).then(function(e){
                 if(!except){
                     $this.tryingBlock.reachCatch = true;
                 }
                 if($this.code[$this.cursor.index] != '}'){
                     $this.exception($this.err("[ } ] expected !"), true);
                 }
                 $this.restoreScope(_scopeKey);
                 if(except){
                     $this.setExecutionMod(_executing);
                 }
                 res(e);
                 // console.log('[Char]'+$this.code.substr($this.cursor.index,2));
             });
         }
         var parentheseless = false, argset = null, message;
         $this.toNextChar().then(function(_char){
             if(except){
                 message = $this.tryingBlock.message;
                 parentheseless = _char != '(';
                 if(!parentheseless){
                     $this.goTo(1);
                 }
                 $this.runner(function(cursor,loop){
                     if(cursor.word && cursor.word.length){
                         // console.log('[cursor]',cursor.word);
                         if($this.getCodeType(cursor.word) == Synthetic.Lang.constants.LITTERAL){
                             argset = $this.meta({
                                 type: "Any",
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
         if(!$this.currentLoop){
             $this.exception($this.err("syntax error from using break statement outside of loop scope !"), true);
         }
         if($this.executing){
             $this.currentLoop.broken = true;
             $this.setExecutionMod(false);
         }
         res();
     });
 }
 $syl.continue = function(){
     var $this = this;
     return new Promise(function(res){
         if(!$this.currentLoop){
             $this.exception($this.err("syntax error from using continue statement outside of loop scope !"), true);
         }
         if($this.executing){
             $this.currentLoop.continued = true;
             $this.setExecutionMod(false);
         }
         res();
     });
 }
 /**
  * La méthode loop permet de parcourir une structure de type String, JSON, Array
  */
 $syl.loop = function(ressources){
     var $this = this,
         _executing = $this.executing,
         _scopeKey = [$this.saveScope(),$this.saveScope(true)],
         _currentLoop = $this.currentLoop,
         _cursor;
     return new Promise(function(res){
         var parentheseless;
         $this.toNextChar().then(function(_char){
             parentheseless = _char != '(';
             if(!parentheseless){
                 $this.goTo(1);
             }
             $this.value({
                 ressources: ressources,
                 object: $this.meta({type: 'Any'},false),
                 end: [Synthetic.Lang.constants._EOS[parentheseless ? 'BRACE' : 'PARENTHESE']]
             }).then(function(result){
                 if($this.executing && !$this.isValidateConstraint(result, [{type: 'JSON'}, {type: 'String'}, {type: 'Array'}])){
                     $this.exception($this.err("Array or JSON or String type expected, "+result.implicitType+" given !"));
                 }
                 /**
                  * Si le syntaxe comporte des parenthèses,
                  * on doit survéiller que c'est complet : (...)
                  */
                 if(!parentheseless && $this.code[$this.cursor.index-1] != ')'){
                     $this.exception($this.err("[ ) ] expected !"),true);
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
                     _cursor = $this.copy($this.cursor);
                     if($this.executing && $this.len(result.value)){
                         $this.createBlock();
                         $this.wait(result.value, function(value,index,count,remain,next,end){
                             $this.cursor = $this.copy(_cursor);
                             $this.currentLoop = {
                                 broken: false,
                                 continued: false
                             };
                             $this.meta({
                                 type: value.type,
                                 implicitType: value.implicitType,
                                 name: 'i',
                                 value: typeof value == 'object' && value != null ? value.value : value
                             });
                             $this.meta({
                                 type: /[\d]+(\.[\d]+)/.test(index) ? 'Number' : 'String',
                                 name: 'j',
                                 value: index
                             });
                             $this.meta({
                                 type: 'Number',
                                 name: 'k',
                                 value: count
                             });
                             // console.log('[Loop]',$this.executing);
                             $this.parse(ressources,{
                                 statementCount: !parentheseless && _char != '{' ? 1 : -1,
                                 end: _char == '{' ? [Synthetic.Lang.constants._EOS.BRACE] : []
                             }).then(function(result){
                                 console.log('[Loop]',$this.executing);
                                 if($this.code[$this.cursor.index] != '}' && parentheseless){
                                     $this.exception($this.err("[ } ] expected !"), true);
                                 }
                                 // console.log('[Remain]',remain, $this.executing, $this.currentLoop.continued)
                                 if(remain <= 1 || !$this.executing){
                                     if($this.code[$this.cursor.index] == '}'){
                                         $this.goTo(1);
                                     }
                                     if($this.currentLoop.broken || $this.currentLoop.continued){
                                         $this.setExecutionMod(_executing,false);
                                     }
                                     if($this.currentLoop.continued && remain > 1){
                                         next();
                                     }
                                     else{
                                         $this.currentLoop = _currentLoop;
                                         $this.restoreScope(_scopeKey);
                                         end();
                                         res(result);
                                     }
                                 }
                                 else{
                                     next();
                                 }
                             });
                         });
                     }
                     else{
                         $this.parse(ressources,{
                             statementCount: !parentheseless && _char != '{' ? 1 : -1,
                             end: _char == '{' ? [Synthetic.Lang.constants._EOS.BRACE] : []
                         }).then(function(result){
                             if($this.code[$this.cursor.index] != '}' && parentheseless){
                                 $this.exception($this.err("[ } ] expected !"), true);
                             }
                             if($this.code[$this.cursor.index] == '}'){
                                 $this.goTo(1);
                             }
                             $this.currentLoop = _currentLoop;
                             $this.restoreScope(_scopeKey);
                             res(result);
                         });
                     }
                 });
             });
         });
     });
 }
 
 /**
  * La méthode while permet d'exécuter une boucle while
  */
 $syl.while = function(ressources){
     var $this = this,
         _executing = $this.executing,
         _scopeKey = [$this.saveScope(),$this.saveScope(true)],
         _currentLoop = $this.currentLoop,
         _cursor;
     return new Promise(function(res){
         var parentheseless, 
             fakeObject = $this.meta({type: 'Any'},false),
             reason,scopeCreated = false;
         $this.toNextChar().then(function(_char){
             parentheseless = _char != '(';
             if(!parentheseless){
                 $this.goTo(1);
             }
             _cursor = $this.copy($this.cursor);
             function until(){
                 $this.cursor = $this.copy(_cursor);
                 $this.currentLoop = {
                     broken: false,
                     continued: false
                 };
                 $this.value({
                     ressources: ressources,
                     object: fakeObject,
                     end: [Synthetic.Lang.constants._EOS[parentheseless ? 'BRACE' : 'PARENTHESE']]
                 }).then(function(result){
                     if(!parentheseless && $this.code[$this.cursor.index-1] != ')'){
                         $this.exception($this.err("[ ) ] expected !"),true);
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
                         $this.parse(ressources,{
                             statementCount: !parentheseless && _char != '{' ? 1 : -1,
                             end: _char == '{' ? [Synthetic.Lang.constants._EOS.BRACE] : []
                         }).then(function(result){
                             if($this.code[$this.cursor.index] != '}' && parentheseless){
                                 $this.exception($this.err("[ } ] expected !"), true);
                             }
                             if($this.code[$this.cursor.index] == '}'){
                                 $this.goTo(1);
                             }
                             if($this.executing){
                                 until();
                             }
                             else{
                                 if($this.currentLoop.broken || $this.currentLoop.continued){
                                     $this.setExecutionMod(_executing,false);
                                 }
                                 
                                 if($this.currentLoop.continued){
                                     until();
                                 }
                                 else{
                                     $this.currentLoop = _currentLoop;
                                     $this.restoreScope(_scopeKey);
                                     res(result);
                                 }
                             }
                         })
                     });
                 });
             }
             until();
         });
     });
 }
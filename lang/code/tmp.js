// $syl.value = function(data){
//     /**
//      * @structure [data]
//      * {object,subvariables,ressources,ternary,subvalue, end, nearconstraints}
//      * 
//     */
//     var $this = this,
//         values = [], 
//         preOperations = -1,
//         waitingForNextOperand = false,
//         ternaryOperator = {
//             active: 0,
//             right: false,
//             end: false
//         },
//         defernow = false,
//         subvariables = {
//             searching: 0,
//             index: 0,
//             key: null
//         },
//         constants = Synthetic.Lang.constants._EOS, 
//         _end, _start, _char, _cursor, _type;
//     data.subvariables = this.set(data.subvariables, false);
//     data.subvalue = this.set(data.subvalue, false);
//     data.nearconstraints = 'nearconstraints' in data ? data.nearconstraints : data.subvariables ? null : data.object.constraints;
//     data.end = Array.isArray(data.end) ? data.end : [];
//     // console.log('[Data.Object]',data.object)
//     return new Promise(function(res,rej){
//         $this.loop(function(cursor,loop){
//             /**
//              * (*1)Si on attend la partie droite du ternaire, on ignore la partie droite
//              * Ou le ternaire principal est terminé, on ignore le reste jusqu'à la fin
//              */
//                 _end = [')',']','}',',', ';'].indexOf(cursor.char);
//                 _start =  ['(', '[', '{'].indexOf(cursor.char);
//             /**
//              * Si on rencontre un caractère qui succède un non signe 
//              * 1er Cas) sans aucune attente d'opérande, on met fin à la lecture 
//              *          de valeur
//              * 2e Cas)  si on est en attente d'une partie de ternaire 
//              *          on déclenche une erreur
//              * 3e Cas) Si on est en recherche de clé de DICTIONNAIRE (sous-variable)
//              *         et la prochaine clé a déjà été définie, on lève une exception
//              */
//             if(
//                 /[\S]/.test(cursor.char) && data.end.indexOf(_end) < 0 && 
//                 values.length && !waitingForNextOperand && 
//                 (!ternaryOperator.active || ternaryOperator.end) &&
//                 Synthetic.Lang.signs.indexOf(cursor.char) < 0
//             ){
//                 if(data.end.indexOf(_end) < 0 && _end != constants.SEMICOLON && /[\S]+/.test(cursor.char)){
//                     $this.cursor.index--;
//                 }
//                 loop.end();
//                 return;
//             }
//             /**
//              * Dans la recherche des valeurs, on veut des mots, et pour chaque mot
//              * non vide trouvé, on cherche son type pour le traiter soit en tant que:
//              * - Littéral
//              * - Nombre ou autre type de valeur
//              */
//             if(cursor.word && cursor.word.length){
//                 // console.log('[Litt**]',cursor.word);
//                 if($this.getCodeType(cursor.word) == Synthetic.Lang.constants.LITTERAL /* && !subvariables.searching*/ ){
//                     //(*1)
//                     if(!ternaryOperator.end && (!ternaryOperator.active || !ternaryOperator.right) ){
//                         /**
//                          * S'il y a une opération à faire, il faut attendre le type de la variable
//                          * avant de déclencher une action appropriée
//                         */
//                        loop.stop();
//                        console.log('[Litt**]',cursor.word, $this.cursor.index, cursor.char);
//                        if(/[\S]+/.test(cursor.char)){
//                             $this.cursor.index -= cursor.char.length - 1;
//                        }
//                         _cursor = $this.cursor;
//                         $this.litteral(cursor.word, data.ressources).then(function(result){
//                             values.push(result);
//                             waitingForNextOperand = false;
//                             $this.cursor.index--;
//                             // console.log('[REDO]',$this.code.substr($this.cursor.index, 10));
//                             loop.start();
//                         });
//                         return;
//                     }
//                 }
//                 else{
//                     // console.log('[WORD]',cursor.word);
//                     var type = $this.getImplicitType(cursor.word);
//                     /**
//                      * S'il y a une opération à faire avant l'enregistrement de la valeur
//                      * On doit avoir un nombre pour le faire sinon on lève une exception
//                     */
//                     if(preOperations >= 0){
//                         if(type != 'Number'){
//                             throw new Error($this.err("Number value expected"));
//                         }
//                         cursor.word = parseFloat(cursor.word);
//                         switch(preOperations){
//                             case Synthetic.Lang.simpleOperations.NEGATIVE:
//                                 cursor.word *= -1;
//                             break;
//                             case Synthetic.Lang.simpleOperations.PREINCREMENTATION:
//                                 cursor.word++;
//                             break;
//                             case Synthetic.Lang.simpleOperations.PREDECREMENTATION:
//                                 cursor.word--;
//                             break;
//                         }
//                         preOperations = -1;
//                     }
//                     //(*1)
//                     if(/*subvariables.searching < 2 && */!ternaryOperator.end && (!ternaryOperator.active || !ternaryOperator.right) ){
//                         // console.log('****',cursor.word,subvariables)
//                         values.push($this.toVariableStructure(cursor.word+'',data.ressources.parent));
//                     }
//                     waitingForNextOperand = false;
//                 }
//             }
            
//             //Si on voit un signe d'opération on vérifie si sa place est correcte
//             if(Synthetic.Lang.signs.indexOf(cursor.char) >= 0){
//                 // console.log('[LEN]', values.length, cursor);
//                 // console.log('[Values]',values,waitingForNextOperand);
//                 if((values.length || (ternaryOperator.active )) && !waitingForNextOperand){
//                     /**
//                      * Si c'est un '?' on prend en compte un opérateur ternaire
//                      * 
//                      * CAS 2:
//                      * Si on est en mode recherche de sous-variable dans le même niveau d'itération
//                      * on bloque les '?'
//                      */
//                     if(cursor.char == '?'){
//                         ternaryOperator.active++;
//                         //(*1)
//                         if(!ternaryOperator.end && (!ternaryOperator.active || !ternaryOperator.right) ){
//                             var calc = $this.calc(values).value;
//                             // console.log('[CALC]',calc,values);
//                             values = [];
//                             calc = ['false', false, 0, '0'].indexOf(calc) < 0;
//                             if(calc){
//                                 console.log('[Calc] again !', calc);
//                                 loop.stop();
//                                 $this.cursor.index++;
//                                 $this.value({
//                                     object : data.object,
//                                     subvariables: data.subvariables,
//                                     ressources: data.ressources,
//                                     ternary: true,
//                                     subvalue: data.subvalue,
//                                     end: data.end
//                                 }).then(function(result){
//                                     values = [result];
//                                     ternaryOperator.active = true;
//                                     ternaryOperator.right = false;
//                                     ternaryOperator.end = true;
//                                     $this.cursor.index++;
//                                     console.log('[Next time]'+$this.code.substr($this.cursor.index, 5));
//                                     loop.start();
//                                 });
//                             }
//                             else{
//                                 ternaryOperator.right = true;
//                             }
//                         }
//                     }
//                     else if(cursor.char == ':'){
//                         ternaryOperator.active--;
//                         /**
//                          * si le décompteur est négatif on vérifie si on avait
//                          * demandé une partie ternaire pour terminer la partie
//                          * sinon on déclenche une erreur
//                         */
//                         if(ternaryOperator.active == -1){
//                             if(data.ternary && !ternaryOperator.end){
//                                 loop.end();
//                             }
//                             else{
//                                 throw new Error($this.err("illegal operator sign [ "+cursor.char+"]"));
//                             }
//                         }
//                         else if(!ternaryOperator.active == 0){
//                             ternaryOperator.right = false;
//                         }
//                     }
//                     else{
//                         //(*1)
//                         if(!ternaryOperator.end && (!ternaryOperator.active || !ternaryOperator.right) ){
//                             values.push(cursor.char);
//                         }
//                         waitingForNextOperand = true;
//                     }
//                 }
//                 else if(['-', '+', '++', '--'].indexOf(cursor.char) >= 0){
//                     if(cursor.char == '+'){
//                         preOperations = Synthetic.Lang.simpleOperations.POSITIVE;
//                     }
//                     else if(cursor.char == '++'){
//                         preOperations = Synthetic.Lang.simpleOperations.PREINCREMENTATION;
//                     }
//                     else if(cursor.char == '-'){
//                         preOperations = Synthetic.Lang.simpleOperations.NEGATIVE;
//                     }
//                     else if(cursor.char == '--'){
//                         preOperations = Synthetic.Lang.simpleOperations.PREDECREMENTATION;
//                     }
//                 }
//                 else{
//                     throw new Error($this.err("illegal operator sign [ "+cursor.char+" ]"));
//                 }
//             }
//             //Si le caractère est un caractère de fin de recherche d'instruction
//             if(_end >= constants.PARENTHESE){
//                 if(waitingForNextOperand){
//                     throw new Error($this.err("right operand expected"));
//                 }
//                 if(data.end.indexOf(_end) >= 0 || 
//                     (!data.subvariables && !ternaryOperator.active && _end == constants.SEMICOLON) ||
//                     (data.subvariables && (data.end.indexOf(_end) || _end == constants.SEMICOLON) )
//                 ){
//                     // console.log('[--->', cursor.char, cursor.index, $this.cursor.index);
//                     $this.cursor.index++;
//                     loop.end();
//                 }
//                 else{
//                     throw new Error($this.err("illegal end of statement [ "+cursor.char+" ]"));
//                 }
//             }
//             if(defernow){
//                 defernow = false;
//                 $this.cursor.index--;
//             }

//     /**
//      * @TRAITEMENT_DES_CARACTERES_DE_DESCISION
//      */
//             /**
//              * 1) Cas
//              * Si on rencontre un '(' on vérifie si la dernière valeur enregistrée 
//              * est une fonction ou un signe d'opération
//              * 
//              * 2)Cas
//              * Si c'est un '[' on vérifie si la dernière valeur enregistrée est
//              * un soit un tableau, soit une chaine de caractère.
//              * Et dans le cas où c'est un signe ou il n'y a rien, on procède à
//              * l'enregistrement d'un tableau
//             */
//             //  console.log('[GO]',_start, cursor.char);
//              if(_start >= constants.PARENTHESE && _start <= constants.BRACE){
//                 //  console.log('[CHECK]');
//                 /**
//                  * S'il y a un mot non-enregistré, on l'enregistre d'abord avant
//                  * d'effectuer le traitement
//                 */
//                 //  console.log('Declaration of Struct', cursor.char, '/', $this.code.substr($this.cursor.index, 10));
//                 if(cursor.word && cursor.word.length){
//                     defernow = true;
//                 }
//                 else{
//                     /**
//                      * Si c'est un signe ou il n'y avait pas de valeur précédente
//                      * on enregistre une sous-valeur
//                     */
//                     if(
//                         //Si c'est un '('
//                         (_start == constants.PARENTHESE && (
//                             !values.length || Synthetic.Lang.signs.indexOf(values[values.length - 1]) >= 0)
//                         ) ||
//                         //Si c'est un '['
//                         (_start == constants.BRACKET && 
//                             values.length && Synthetic.Lang.signs.indexOf(values[values.length - 1]) < 0
//                         )
//                     ){
//                         /**
//                          * Si on prend en compte le '[' et que la valeur précédente n'est pas
//                          * une chaine de caractère ou tableau ou un JSON, on soulève une erreur
//                          */
//                         if(_start == constants.BRACKET && ['String','Array', 'JSON'].indexOf($this.getType(values[values.length - 1])) < 0){
//                             throw new Error($this.err("illegal character [ "+cursor.char+"]"));
//                         }
//                         loop.stop();
//                         $this.cursor.index++;
//                         $this.value({
//                             object : data.object,
//                             subvariables: data.subvariables,
//                             ressources: data.ressources,
//                             ternary: data.ternary,
//                             subvalue: true,
//                             end: [constants.PARENTHESE]
//                         }).then(function(result){
//                             if(_start == constants.BRACKET){
//                                 var val = $this.toPrimitiveValue(values[values.length - 1])[result.value];
//                                 values[values.length - 1].value = val;
//                             }
//                             else{
//                                 values.push(result);
//                             }
//                             waitingForNextOperand = false;
//                             loop.start();
//                         });
//                     }
//                     else if(_start >= constants.BRACKET && _start <= constants.BRACE && (!values.length || waitingForNextOperand) ){
//                         // console.log('[CHECK]',data.nearconstraints);
//                         /**
//                          * Si la structure n'accepte pas d'imbrication de structure
//                          * Et qu'il ne demande pas une structure comme contrainte de clé ou de valeur
//                          * On soulève une exception.
//                          */
//                         if(data.subvariables && (data.object.constraints == null || !data.object.constraints.recursive) ){
//                             throw new Error($this.err("Denied structure syntax !"));
//                         }
//                         _type = _start == constants.BRACKET ? 'Array' : 'JSON';
//                         // values.push($this.meta({
//                         //     type: _type,
//                         //     constraints: data.object.type == _type ? data.object.constraints : null,
//                         //     label: 'variable',
//                         //     value: {},
//                         //     parent: data.ressources.parent
//                         // }));
//                         subvariables.searching = _start == constants.BRACKET  ? 1 : 2;
//                         subvariables.index = 0;
//                         subvariables.key = null;
//                         //@Experimental
//                         // console.log('[Struct]',values);
//                         loop.stop()
//                         $this.struct({
//                             object: data.object,
//                             ressources: data.ressources
//                         }).then(function(result){
//                             values.push(result);
//                             loop.start();
//                         });
//                         //@end
//                     }
//                     //Si c'est une fonction, on l'appelle comme un littéral
//                     else if(values[values.length - 1]){
                        
//                     }
//                     //Sinon on déclenche une erreur
//                     else{
//                         throw new Error($this.err("illegal character [ "+cursor.char+"]"));
//                     }
//                 }
//              }
//         /**
//          * @FIN_DU_TRAITEMENT
//          */
//         }).then(function(){
//             // console.log('[-->]',values);
//             var r = $this.calc(values);
//             // console.trace('-->',r);
//             if(!data.subvariables && !data.subvalue && data.object.type != 'Any' && r.type != data.object.type && r.implicitType != data.object.type){
//                 $this.cursor = data.object.cursor;
//                 throw new Error($this.err(data.object.type+" value expected, "+r.implicitType+" given !"));
//             }
//             else if(data.subvariables && data.object.constraints && !$this.isValidateConstraint(r, data.object.constraints.value)){
//                 if(['Array', 'JSON'].indexOf(r.type) < 0 || !data.object.constraints.recursive){
//                     throw new Error($this.err($this.toStringTypes(data.object.constraints.value)+" value expected, "+r.type+" given !"));
//                 }
//             }
//             $this.garbage();
//             res(r);
//         })
//     });
// }

var list = Array.isArray(index) ? index : [index];
for(var i = list.length - 1; i >= 0; i--){
    index = list[i];
    if(index in this.scopeSaver){
        this.cursor.scope = this.scopeSaver[index];
        delete this.scopeSaver[index];
    }
}
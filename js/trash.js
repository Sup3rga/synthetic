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
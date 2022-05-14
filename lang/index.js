var Synthetic = require('./synthetic.syntax');

let cc = new Synthetic.Class();
let testing = "loop";
cc.compile("./code/"+testing+".lh");
var premier;
for(var i = 2; i < 50; i++){
    premier = true
    // print "Pour i = " + i
    for(var j = i; j >= 2; j--){
        // debug "[J__]" + j
        if(i != j && i % j == 0){
            // debug "[J] " + j + " > " + i 
            premier = false
            break
        }
    }
    if(premier){
        console.log(i + " est un nombre " + (premier ? "premier" : "ordinaire"))
    }
}
console.log('\n\n\n');
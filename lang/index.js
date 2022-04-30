var Synthetic = require('./synthetic.syntax');

let cc = new Synthetic.Class();
let testing = "function";
cc.compile("./code/"+testing+".lh");
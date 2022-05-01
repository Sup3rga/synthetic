var Synthetic = require('./synthetic.syntax');

let cc = new Synthetic.Class();
let testing = "scope_test";
cc.compile("./code/"+testing+".lh");
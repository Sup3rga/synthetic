var Synthetic = require('./synthetic.syntax');

let cc = new Synthetic.Class();
let testing = "interface";
cc.compile("./code/"+testing+".lh");

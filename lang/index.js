var Synthetic = require('./synthetic.syntax');

let cc = new Synthetic.Class();
let testing = "generic";
cc.compile("./code/"+testing+".lh");

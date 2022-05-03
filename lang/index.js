var Synthetic = require('./synthetic.syntax');

let cc = new Synthetic.Class();
let testing = "loop";
cc.compile("./code/"+testing+".lh");
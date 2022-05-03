var Synthetic = require('./synthetic.syntax');

let cc = new Synthetic.Class();
let testing = "exception";
cc.compile("./code/"+testing+".lh");
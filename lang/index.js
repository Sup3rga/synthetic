var Synthetic = require('./synthetic.syntax');

let cc = new Synthetic.Class();
let testing = "class";
cc.compile("./code/"+testing+".lh");
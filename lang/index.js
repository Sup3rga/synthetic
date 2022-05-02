var Synthetic = require('./synthetic.syntax');

let cc = new Synthetic.Class();
let testing = "object";
cc.compile("./code/"+testing+".lh");
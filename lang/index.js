var Synthetic = require('./synthetic.syntax');

let cc = new Synthetic.Class();
let testing = "execution";
cc.compile("./code/"+testing+".lh");

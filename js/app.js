/*
    @from : SSPA template
*/
//You can set your application splashScreen
SSPA.globals.assets = {
    image: './sspa/assets/SSPA-logo.png',
    imageSize: 'auto 100%',
    text: 'SSPA Application',
    font: 'Arial',
    background: 'white',
    progressline: true,
    progresslineColor: 'red',
    splashText: '',
    splashTextfont: 'Arial',
    adsText : '&copy; Copyright',
    adsTextFont: 'Helvetica',
    height: 200
};
//Instanciation of SSPA
var App = new SSPA();
App.onPrepare(function(loaded,total){
    //TODO: customized your app preparation
    //loaded : for loaded ressources (integer)
    //total : for total ressources amount (integer)
});
App.run().then(function(sspa){
    //start your app
    sspa.start();
});
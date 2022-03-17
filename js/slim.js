/*
    @name : Slim (Synthetic Language for Interface Manipulation)
*/
var SlimJS = {
        config: {}
    },
    sjs = SlimJS,
    node_env = typeof module == 'object' && 'exports' in module,
    xhr;
if(node_env){
    xhr = require("fs");
}else{
    xhr = new XMLHttpRequest();
}
sjs.slimAppDom = document.querySelector('slim-app');
sjs.indexes = function(e){
    var r = [];
    for(var i in e){
        r.push(i);
    }
    return r;
};
sjs.wait = function(object, fn){
    if(typeof object != 'object' && typeof fn != 'function'){
        return;
    }
    return new Promise(function(resolve){
        var index = sjs.indexes(object),
            i = 0, response = null;
        function t(){
            if(i < index.length){
                var promesse = fn(object[index[i]], index[i])
                if(typeof promesse.then != 'undefined'){
                    promesse.then(function(e){
                        response = e;
                        i++;
                        t();
                    });
                }
                else{
                    resolve(response);
                }
            }
            else{
                resolve(response);
            }
        }
        t();
    });
};
sjs.set = function(e,v){
    return typeof e == 'undefined' ? (typeof v == 'undefined' ? null : v) : e;
};
sjs.res = {};
sjs.install = function(list, static, remove){
    var static = typeof static == 'boolean' ? static : true,
        remove = typeof remove == 'boolean' ? remove : false,
        primeScript = document.querySelectorAll('script[initiator="true"]')[0];
    // if(!beginning_process.finish){
    //     beginning_process.total = list.length + SSPA.len(ressources);
    //     updateSplasLoader(beginning_process.loaded,beginning_process.total,true);
    // }
    return sjs.wait(list, function(i){
        return new Promise(function(res){
            var id = i.replace(/\/|\./g, '_');
            if(remove){
                var el = $('#require-'+id);
                if(sjs.set(SSPA.toBoolean(el.attr('static')), false)){
                    el.remove();
                }
                res();
            }
            else{
                var type = /\.js$/.test(i) ? 'script' : 'style';
                var el = document.querySelector("#require-"+id);
                if(el == null){
                    var element = null;
                    switch(type){
                        case 'script':
                            var script = document.createElement('script');
                            script.type = "text/javascript";
                            script.id = "require-"+id;
                            script.src = sjs.config.javascript_root+i;
                            script.setAttribute('static',static);
                            document.querySelector('body').insertBefore(script, primeScript);
                            element = script;
                            break;
                        case 'style':
                            var link = document.createElement('link');
                            link.rel = "stylesheet";
                            link.id = "require-"+id;
                            link.href = sjs.config.css_root+i;
                            link.setAttribute('static', static);
                            document.querySelector("head").appendChild(link);
                            element = link;
                            break;
                    }
                    if(element != null){
                        element.addEventListener('load', function(){
                            // if(!beginning_process.finish){
                            //     updateSplasLoader();
                            // }
                            res();
                        });
                    }
                }
            }
        });
    });
};
sjs.cache = function(){
    var cache = {},
        _sy;
    return sjs.wait(sjs.config.ressources, function(res){
        return new Promise(function(resolve){
            _sy = new Synthetic(sjs.config.viewRoot, undefined, undefined, undefined,true);
            _sy.compileFile(res)
            .then(function(){
               _sy.cursor = 0;
               _sy.currentScope = 0;
               _sy.currentLine = 0;
               _sy.currentRenderScope = 0;
               cache[_sy.realpath] = _sy.getCacheData();
               console.log('[END]', res)
               resolve();
            });
        });
    });
}
sjs.init = function(){
    var content = null,
        file = '.lmi';
    if(node_env){
        content = xhr.readFileSync(file, 'utf-8');
    }
    else{
        xhr.open("GET", file, false);
        xhr.onreadystatechange = function (){
            if(xhr.readyState === 4){
                if(xhr.status === 200 || xhr.status == 0){
                    content = xhr.responseText;
                }
            }
        }
        xhr.send(null);
    }
    var manifest;
    try{
        manifest = JSON.parse(content);
    }
    catch (e){
        throw new Error("Can't parse .lmi file, please check for error !");
    }
    sjs.config = manifest;
    this.install(manifest.dependencies)
    .then(function(){
        console.error('[Ready]')
        var date = new Date().getTime(), d2;
        // sjs.cache()
        // .then(function(){
            console.log('[FINISH]')
            for(var i in manifest.ressources){
                sjs.res[i] = new Synthetic(sjs.config.viewRoot);
                sjs.res[i].compileFile(manifest.ressources[i]);
            }
        // });
        d2 = new Date().getTime();
        console.log('[Time]', d2 - date);
    });
    console.log('[Ok]', JSON.parse(content));
}
sjs.connect = function(name, callback){
    Synthetic.connectPlugins(name, callback);
}
SlimJS.init();
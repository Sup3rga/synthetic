/*
* SSPA          : Super Single Page Application
* Version       : 1.0.0
* Mode          : Development
* Description   : For single page application development
* Components    : - Layer (Class for Layer Description), 
*                 - SSPA (Class for SPA build),
*/
var Layer = null,
    node_env = typeof module == 'object' && 'exports' in module,
   localMod = typeof location == 'object' ? /^file:\/\//.test(location.href) : false;
function includeLayer(){
    Layer = (function($){
        var layer_counter = 0,
            responsive_style = {},
            responsive_insertion = 0;
        return function(content,hybridAnimation,view){
            var content = typeof content == 'undefined' || typeof content != 'string' ? "" : content,
                hybridAnimation = SSPA.set(hybridAnimation,false),
                model = new Synthetic('strict'),
                activated = false,
                persistent = false,
                overlay = false,
                scheduler = {},
                events = {},
                async_modules = {},
                watcher_data = [],
                menuDrawer = null,
                view = SSPA.set(view, null),
                appbar = null,
                waiting = false,
                $this = this,
                footer = null,
                viewDom = null,
                headtab = null,
                el = null;
            var unmask = function(content){
                    return content.replace(/^(?: +)?|(?: +)?$/g, '')
                        .replace(/&lt;/g, '<')
                        .replace(/&gt;/g, '>');
                    // return metadata_mask[content.replace(/^__([0-9]+)__$/, '$1')].replace(/^( +)?|( +)?$/g,'')
                },
                getTarget = function(metadata){
                    var target = metadata,
                        content = $(target).html(),
                        original_content;
                    content = unmask(content);
                    original_content = content;
                    while(target != null && (target.tagName == "sspa-metadata".toUpperCase() || target.tagName == undefined)){
                        target = target.nextSibling;
                    }
                    try{
                        content = SSPA.stringToObject(content);
                    }catch(e){
                        content = {};
                    }
                    return {target: target, content: content, original_content : original_content};
                },
                getStyle = function(cssText){
                    var style = cssText.replace(/^(.+?):/, '"$1":')
                        .replace(/:(?: +)?(.+?)(?: +)?;/g, ':"$1",')
                        .replace(/,(?: +)?(.+?)(?: +)?:/g, ',"$1":')
                        .replace(/:(?: +)?([a-z0-9\(\)%.,-]+)(?: +)?$/, ':"$1"')
                        .replace(/,(?: +)?$/, '');
                    try{style = JSON.parse("{"+style+"}");}catch(e){style = {}}
                    return style;
                },
                finalizerSet = {
                    attr: function(target){
                        SSPA.foreach(target.content, function(j,i){
                            $(target.target).attr(i, (i in target.target.attributes && $(target.target).attr(i).toString().length > 0 ? $(target.target).attr(i)+' ' : '')+j);
                        });
                    },
                    style: function(target){
                        var el = $(target.target);
                        if(responsive_style.default == undefined){
                            responsive_style.default = {};
                        }
                        SSPA.foreach(target.content, function(j,i){
                            if(/^[0-9]+(px)?$/i.test(i)){
                                i = i.replace(/px$/, '');
                                if(!(i in responsive_style)){
                                    responsive_style[i] = {};
                                }
                                if(el.hasClass('dont-color')){
                                    if('background-color' in j){delete j['background-color'];}
                                    if('backgroundColor' in j){delete j['backgroundColor'];}
                                    if('color' in j){delete j['color'];}
                                }
                                var data = {
                                    element: target.target,
                                    style: j
                                };
                                responsive_style[i][responsive_insertion] = data;
                                var style = target.target.style.cssText;
                                style = getStyle(style);
                                responsive_style.default[responsive_insertion] = {
                                    element: target.target,
                                    style: style
                                };
                                responsive_insertion++;
                                dispatchStyle(i, data);
                            }
                            else{
                                if(!el.hasClass('dont-color') || !SSPA.inArray(i, ['color','backgroundColor', 'background-color'])){
                                    $(el).css(i,j);
                                }
                            }
                        });
                        responsive_style.default[responsive_insertion] = {
                            element: target.target,
                            style: getStyle(target.target.style.cssText)
                        };
                    }
                },
                setAttr = function(metadata){
                    var target = getTarget(metadata);
                    if(target.target != undefined){
                        finalizerSet.attr(target);
                    }
                },
                //SSPA JS Pseudo-code translation
                getExecutableCode = function(e){
                    var r = [], code = '',
                        hasVar = false,
                        quote = 0, simple_quote = 0;
                    SSPA.foreach(e,function(i,j){
                        if(SSPA.set(e[j*1-1], '') != '\\'){
                            if(i == '"' && simple_quote % 2 == 0){quote++;}
                            if(i == "'" && quote % 2 == 0){simple_quote++;}
                        }
                        hasVar = (/(var|let)/.test(code));
                        if((simple_quote % 2 == 0 && quote % 2 == 0) || hasVar){
                            if((i != '"' && i != "'" && SSPA.set(e[j*1-1], '') != '\\') || hasVar){
                                code += i;
                            }
                            if(i == ';' && simple_quote % 2 == 0 && quote % 2 == 0 && hasVar){
                                hasVar = false;
                                r.push(code);
                                code = '';
                            }
                        }
                        else if(code.length > 0){
                            r.push(code);
                            code = '';
                        }
                        if(j*1 == e.length - 1 && code.length > 0){
                            r.push(code);
                        }
                    });
                    return r;
                },
                defineRuntime = function(e){
                    e = e.replace(/^( +)?|( +)?$/g, '')
                        .replace(/^{|}$/g, '')
                        .replace(/\\\$/g, '\$')
                    var code = getExecutableCode(e);
                    if(!(view in SSPA.globals.runtime)){
                        SSPA.globals.runtime.one[view] = {};
                    }
                    SSPA.foreach(code, function(i)  {
                        var pseudo = i;
                        //Transform pseudo key
                        //Transform "super" && "upper" keyword;
                        i = i
                            .replace(/([^a-z0-9_$.]+)upper\./g, '$1SSPA.globals.runtime.one.'+view+".")
                            .replace(/([^a-z0-9_$.]+)super\./g, '$1SSPA.globals.runtime.all.')
                            // .replace(/\\/g, ';')
                            .replace(/sspa\./g, 'SSPA.instance.')
                            .replace(/(.+?)?(\(|=|:|,)(?: +)?\((.+?)?\)(?: +)?{(.+?)/g, '$1$2function($3){$4')
                            .replace(/this\./g, '$(this).')
                            .replace(/sspa->([a-zA-Z0-9_-]+)/g, 'SSPA.instance.select("$1")')
                            .replace(/([a-zA-Z$0-9_]+)\.foreach\((?: +)?([a-zA-Z$0-9_]+)(?: +)?(?:=>|\:)(?: +)?([a-zA-Z$0-9_]+)(?: +)?\){(.+?)/g, 'var $3; for(var $2 in $1){var $3 = $1[$2];$4')
                            .replace(/([a-zA-Z$0-9_]+)\.foreach\((?: +)?(.+?)(?: +)?(?:=>|\:)(?: +)?(.+?)(?: +)?\){(.+?)/g, 'throw new Error("Syntax Error in $1.foreach($2 => $3){...} scope");')
                        e = e.replace(new RegExp(SSPA.preg_quote(pseudo), ''), i);
                    });
                    return e;
                },
                inlineMethodeExtractor = function(e){
                    var arg = '',
                        saveBody = false,
                        body = '';
                    SSPA.foreach(e, function(i,j){
                        if(i == '{' && SSPA.set(e[j*1-1], '') != '\\'){
                            saveBody = true;
                        }
                        if(!saveBody){
                            arg += i;
                        }
                        else{
                            body += i;
                        }
                    });
                    arg = arg.replace(/^( +)?|( +)?$/g, '').replace(/^\(|\)$/g, '');
                    body = defineRuntime(body);
                    // console.log('[Body]',body);
                    return new Function(arg, body);
                },
                inlineMethodDispatch = function(e){
                    var event = '',
                        saveContent = false,
                        content = '';
                    SSPA.foreach(e, function(i,j){
                       if(i == ':' && SSPA.set(e[j*1-1], '') != '\\'){
                           saveContent = true;
                       }
                       if(saveContent){
                           content += i;
                       }
                       else{
                           event += i;
                       }
                    });
                    event = event.replace(/^( +)?|( +)?$/g, '');
                    content = content.replace(/^( +)?|( +)?$/g, '').replace(/^( +)?\:( +)?/g, '');
                    return [event, inlineMethodeExtractor(content)];
                },
                inlineMethodSplitter = function(e){
                    var r = [],
                        bracket = 0, quote = 0, simple_quote = 0,
                        begin = false,
                        entity = '';
                    SSPA.foreach(e.replace(/^( +)?{|}( +)?$/g, ''), function(i,j){
                        if(SSPA.set(e[j*1-1], '') != '\\'){
                            if(i == '"'){quote++;}
                            if(i == "'"){simple_quote++;}
                            if(i == '{'){bracket++;}
                            if(i == '}'){bracket--;}
                            if(bracket == 1){
                                begin = true;
                            }
                            entity += i;
                            if(bracket == 0 && begin){
                                r.push(entity.replace(/^( +)?,|( +)?,$/g, ''));
                                entity = '';
                                begin = false;
                            }
                        }
                    });
                    return r;
                },
                getNameSpace = function(content){
                    var content = inlineMethodSplitter(content),
                        ev = {};
                    SSPA.foreach(content, function(e){
                        var method = inlineMethodDispatch(e);
                        ev[method[0]] = method[1];
                    });
                    return ev;
                },
                setEvents = function(metadata){
                    var target = $(getTarget(metadata).target),
                        content = unmask($(metadata).html());
                    // console.error('[CONTENT]',$(metadata).html(),metadata_mask);
                    // console.log('[CONTENT]',content,target,getNameSpace(content));
                    SSPA.foreach(getNameSpace(content), function(fn,ev){
                        target.on(ev, fn);
                        if(target[0] == el[0]){
                            events[ev] = fn;
                        }
                    });
                },
                updateEvents = function(){
                  for(var i in events){
                      el.off(i);
                      el.on(i, events[i]);
                  }
                },
                setStyle = function(metadata){
                    var target = getTarget(metadata);
                    if(target.target != undefined){
                        finalizerSet.style(target);
                    }
                },
                setRoute = function(metadata){
                    var target = $(getTarget(metadata).target),
                        content = unmask($(metadata).html()).replace(/^(?: +)?|(?: +)?$/g, '');
                    if(content.length){
                        target.addClass('process').attr('layer-target', content);
                    }
                },
                adjustAppBarIcon = function(appbar){
                    var appbar = $(appbar).find('appbar-wrapper'),
                        nbr = 0,
                        title = appbar.find('titlebar'),
                        space = appbar.find('space');
                    if(!title.length){
                        return;
                    }
                    var e = SSPA.globals.config,
                        iconspace = appbar.find('icon-space').eq(1),
                        has_menu = appbar.find('icon-space').eq(0).css('display') != 'none';
                        iconspace.find('icon').each(function(){
                           if($(this).css('display') != 'none'){
                               nbr++;
                           }
                        });
                    space.attr('class',space.attr('class').replace(/super\-l[0-9]{1,2}/g, ''))
                        .addClass('super-l'+(e.isIos || e.hybrid ? !has_menu ? 3 : 1 : ''));
                    title.attr('class',title.attr('class').replace(/super\-l[0-9]{1,2}/g, ''))
                        .addClass('super-l'+(e.isIos || e.hybrid ? 6 : !has_menu ? 8 - nbr : 7 - nbr));
                    iconspace.attr('class',iconspace.attr('class').replace(/super\-l[0-9]{1,2}/g, ''))
                        .addClass('super-l'+(!has_menu ? (e.isIos || e.hybrid ? 3 : 4 + nbr) : (e.isIos || e.hybrid ? 3 : 3 + nbr) ));
                },
                setAppBar = function(metadata){
                    var target = getTarget(metadata),
                        content = target.content;
                        appbar = $(target.target);
                    var height = 0,
                        view = appbar.parent().find('view').eq(0),
                        color = appbar[0].style.color;
                    viewDom = view;
                    adjustAppBarIcon(appbar);

                    headtab = appbar.find('head-tab');
                    footer = appbar.parent().find('footbar');
                    height = parseFloat(appbar.find('appbar-wrapper')[0].style.height);
                    height = isNaN(height) ? 50 : height;
                    if(headtab.length){
                        height += 50;
                    }
                    else{
                        appbar.removeClass('with-tab')
                    }
                    // console.log('Height: '+height, headtab);
                    appbar.find('icon').css('color', color);
                    appbar.find('item, item text, .sspa-line').css('color', color);
                    appbar.find('.sspa-line').css('background-color', color);
                    appbar.find('icon,item,head-tab,item text').addClass('dont-color');
                    appbar[headtab.length ? 'addClass' : 'removeClass']('with-tab');
                    if(content.rounded){
                        view.css({
                            height: 'unset',
                            top: (height+5)+'px',
                            bottom: 0,
                            paddingTop: '.2em',
                            'z-index': '2',
                            'border-radius' : content.radius+' '+content.radius+' 0 0'
                        }).addClass('dont-color');
                    }else{
                        view.css('padding-top', (height)+'px');
                    }
                    // console.log('[finish] appbar');
                },
                setFootbar = function(){
                    if(footer != null && 'length' in footer){
                        console.log('[Footbar]', footer)
                        if((SSPA.globals.config.isIos  || SSPA.globals.config.hybrid) && footer.find('head-tab').length == 0){
                            if(footer[0] == undefined){
                                $this.dom().find('view').after('<footbar style="background-color: '+SSPA.globals.config.theme+';"></footbar>');
                                footer = $this.dom().find('footbar');
                                if(footer.length > 1){
                                    footer[0] = footer[1];
                                    delete footer[1];
                                }
                            }
                            footer.html(headtab);
                            appbar.removeClass('with-tab');
                            viewDom.css({
                                'padding-top' : appbar.hasClass('rounded') ? '5px' : viewDom.css('padding-top'),
                                top: appbar.hasClass('rounded') ? '70px' : '0px'
                            });
                        }
                        else if(!/<(.+?)>/.test(footer.html())){
                            return;
                        }
                        var background = SSPA.globals.config.defaultFootBarBackground.toLowerCase() == 'auto' ? SSPA.globals.config.theme : SSPA.globals.config.defaultFootBarBackground,
                            color = SSPA.contrastColor(background);
                        console.log('[bg]',background, SSPA.contrastColor(background));
                        footer.find('head-tab').css({
                            'background-color' : background,
                            'display': 'inline-flex',
                            'color' : color
                        }).find('item text, item icon').css('color', SSPA.contrastColor(background));
                        footer.find('item').css('width', (100/footer.find('item').length)+'%');
                        footer.find('.sspa-tab').css('width', '100%').removeClass('sspa-tab');
                        footer.find('.sspa-link-wrapper').css('width', '100%');
                        footer.css('background-color', 'unset');
                        footer.css('box-shadow', 'unset');
                    }
                },
                setMenu = function(html){
                    var html = SSPA.set(html, null),
                        menu = html == null ? $this.dom().find('hidden-part menu') : $(html),
                        sspaElement = $('sspa');
                    if(sspaElement[0] == undefined){
                        return;
                    }
                    var activeMenu = sspaElement[0].children[0];
                    activeMenu = activeMenu.tagName == 'MENU' ? $(activeMenu) : null;
                    if(menu.length){
                        menu = menu.clone();
                        var persistent = SSPA.toBoolean(menu.attr('persistent'));
                        if(activeMenu == null || !SSPA.toBoolean(activeMenu.attr('persistent')) || persistent){
                            if(activeMenu != null && activeMenu.attr('sspa-phase') != SSPA.instance.getPhase()){
                                activeMenu.remove();
                            }
                            if(activeMenu == null || activeMenu.attr('sspa-phase') != SSPA.instance.getPhase()){
                                menu.addClass('active-menu').attr('sspa-phase', SSPA.instance.getPhase());
                                if(menuDrawer == null){
                                    menuDrawer = menu[0].outerHTML;
                                }
                                sspaElement.prepend(menu);
                            }
                        }
                    }else{
                        if(activeMenu != null && activeMenu.attr('sspa-phase') != SSPA.instance.getPhase()){
                            sspaElement.find('.menu-activator').css('display', 'none');
                            activeMenu.remove();
                        }
                    }
                },
                setName = function(metadata){
                    var target = getTarget(metadata),
                        content = target.content;
                    target = $(target.target);
                    SSPA.foreach(content, function(j,i){
                        target.attr(i,j);
                    });
                },
                setOverLay = function(metadata){
                    var target = getTarget(metadata);
                    $(target.target).attr('sspa-popup', true);
                },
                setAccess = function(metadata){
                    var target = getTarget(metadata), r = {};
                    setTimeout(function(){
                        target.content.level = Array.isArray(target.content.level) ? target.content.level : [target.content.level];
                        for(var k in target.content.level){
                            r = {target : $(target.target)};
                            for(var i = 0; i <  target.content.level[k]; i++){
                                r.target = r.target.parent();
                            }
                            // console.error('[target]', target.content.level[k], r, target)
                            finalizerSet.attr({
                                target : r.target,
                                content : target.content.attr
                            });
                            finalizerSet.style({
                                target : r.target[0],
                                content : target.content.style
                            });
                        }
                    }, 100);
                },
                setWatcher = function(metadata){
                    var target = getTarget(metadata);
                    watcher_data.push(target)
                },
                findWatcher = function(){
                    var element,
                        data,
                        fn,
                        ev,
                        sel;
                    for(var i in watcher_data){
                        if(watcher_data[i] != undefined){
                            data = watcher_data[i];
                            sel = /^[a-z_-]+( +)?=( +)?(.+?)$/i.test(data.content.target) ? '['+data.content.target+']' : data.content.target;
                            element = el.find(sel);
                            if(element.length){
                                fn = inlineMethodDispatch('event:'+data.content.action);
                                ev = data.content.event.split(/ +/);
                                SSPA.foreach(ev,function(event){
                                    if(/drag(start|end|up|down|left|right)?/i.test(event)){
                                        console.log('[Needs] hammer');
                                        element.hammer().on(event, function(e,f){
                                            fn[1](element,$(data.target),e,f);
                                        });
                                    }else{
                                        element.on(event, function(e,k){
                                            fn[1](element,$(data.target),e,k);
                                        });
                                    }
                                });
                                delete watcher_data[i];
                            }
                        }
                    }
                },
                setDraggerScroll = function(metadata)   {
                    var target = getTarget(metadata),
                        current = $(target.target),
                        parentLevel = target.content.parentLevel,
                        only_h = target.content.heightOnly,
                        parent = current;
                    for(var i = 0; i < parentLevel; i++){
                        parent = parent.parent();
                    }
                    var element = target.content.applyToParent ? parent : current,
                        maxValue = target.content.maxValue,
                        initialized = false,
                        supportedMetric = ['px','%','vh','vw'],
                        axis = target.content.vertical ? 'y' : 'x',
                        previousTS = 0, currentTS = 0, currentHeight = 0,
                        minValue = 0;
                    maxValue = maxValue == 'auto' ? ['auto', 'px'] : maxValue.replace(/^([0-9]+(?:\.[0-9]+)?)([a-z]+|%)$/i, '$1_*_$2').split('_*_');

                    // console.log('[TARGET]',target,{element,minValue,maxValue});

                    var metric = supportedMetric.indexOf(maxValue[1].toLowerCase()) >= 0 ? maxValue[1] : 'px';

                    function initVars(){
                        initialized = true;
                        currentHeight = element.height();
                        if(maxValue[0] == 'auto'){
                            maxValue[0] = element[0].scrollHeight > currentHeight ? element[0].scrollHeight : currentHeight;
                            console.log('[val]',maxValue);
                        }
                        maxValue[0] = parseFloat(maxValue[0]);
                        console.log('[MIN]',minValue);
                        switch (metric){
                            case '%':
                                maxValue.push(element.parent().height() * maxValue[0] / 100);
                                break;
                            case 'vh':
                                maxValue.push($(document).height() * maxValue[0] / 100);
                                break;
                            case 'vw':
                                maxValue.push($(document).width() * maxValue[0] / 100);
                                break;
                            default:
                                maxValue.push(maxValue[0]);
                                break;
                        }
                    }

                    function adjustElement(time){
                        var time = !/[0-9]+(\.[0-9]+)?/.test(time) ? 0 : time;
                        if(!only_h){
                            element.css({
                                transform : 'translate3d('+(!target.content.vertical ? currentTS+'px, 0' : 0+'px, '+currentTS+'px')+', 0)',
                            });
                        }
                        element.css({
                            height: (currentHeight - currentTS)+'px',
                            transitionDuration: (time/1000)+'s'
                        });
                    }

                    element.css('overflow-'+axis, 'hidden');
                    element.attr('sspa-drag-stable', true);
                    element.on('scroll',function(){
                        element.attr('sspa-drag-stable', element.scrollTop() == 0);
                    }).hammer().on('drag', function(e){
                        if(!initialized){
                            initVars();
                        }
                        if(SSPA.toBoolean(element.attr('sspa-drag-stable'))){
                            currentTS = previousTS + e.gesture['delta'+(axis.toUpperCase())];
                            currentTS = currentTS < 0 ? currentTS : 0;
                            if(currentHeight - currentTS >= maxValue[2]){
                                currentTS = -maxValue[2] + currentHeight;
                                element.css('overflow-'+axis, 'auto')
                                    .css('touch-action', 'unset');
                            }else{
                                element.css('overflow-'+axis, 'hidden')
                                    .css('touch-action', 'none');
                            }
                            adjustElement();
                        }
                    }).on('dragend', function(){
                        if(SSPA.toBoolean(element.attr('sspa-drag-stable'))){
                            if(-currentTS < (maxValue[2] - currentHeight) / 2){
                                currentTS = 0;
                                element.css('overflow-'+axis, 'hidden');
                            }else{
                                currentTS = -maxValue[2] + currentHeight;
                                element.css('overflow-'+axis, 'auto')
                                    .css('touch-action', 'unset');
                            }
                            adjustElement(target.content.time);
                            previousTS = currentTS;
                        }
                    });
                }
                dispatchEachStyle = function(){
                    var width = $(document).width(),
                        styled = false;
                    SSPA.foreach(responsive_style, function(j,i){
                        if(i != 'default'){
                            var reason = SSPA.globals.responsiveCssFromMax ? width <= i * 1 : width >= i * 1;
                            if(reason){
                                SSPA.foreach(j, function(v){
                                    $(v.element).css(v.style);
                                });
                                styled = true;
                            }
                        }
                    });
                    if(!styled){
                        SSPA.foreach(responsive_style.default, function(j){
                            $(j.element).css(j.style);
                        });
                    }
                },
                schedule = function(options){
                    var before = [],
                        done = [];
                    // console.warn('[SCHEDULE]')
                    el.find('sspa-template').each(function(){
                        var temp = $(this),
                            name = temp.attr('data-name'),
                            //le delai peut etre seulement une fonction asynchrone ou un chiffre
                            delay = /^(?: +)?\((.+?)?\)(?: +)?{(.+?)?}(?: +)?$/.test(temp.attr('sspa-delay')) ? temp.attr('sspa-delay').replace(/^(?: +)?|(?: +)?$/g, '') :
                                    ( /^(?: +)?[0-9]+(\.[0-9]+)?(?: +)?$/.test(temp.attr('sspa-delay')) ? parseFloat(temp.attr('sspa-delay')) : 0 ),
                            follow = temp.attr('sspa-follow');
                        if(!(name in scheduler)){
                            scheduler[name] = {
                                delay : delay,
                                name : name,
                                el : this,
                                parent: $(this).parent(),
                                follow : follow,
                                listen: temp.attr('sspa-event'),
                                before : []
                            };
                            var names = SSPA.set($(this).parent().attr('name'),'').split(',');
                            names = names.length == 1 && names[0] == '' ? [] : names;
                            names.push(name);
                            $(this).parent().attr('name', names.join(','));
                            if(follow.length == 0){
                                before.push(scheduler[name]);
                            }
                            if(follow in scheduler){
                                scheduler[follow].before.push(name);
                            }
                        }
                    });
                    function show(name,target,dom,finish){
                        var sh = scheduler[name],
                            t = sh.before.length, k = 0;
                        function go(){
                            k++;
                            if(k == t){
                                finish();
                            }
                        }
                        setTimeout(function(){
                            $(target).replaceWith(dom[0].childNodes[0]);
                            SSPA.instance.applyPlugins($this);
                            done.push(name);
                            findWatcher();
                            if(sh.before.length){
                                SSPA.foreach(sh.before, function(i){
                                    process(scheduler[i],go);
                                });
                            }else{
                                finish();
                            }
                        }, sh.delay);
                        return dom[0].childNodes[0];
                    }
                    function process(i,finish){
                        var finish = typeof finish == 'function' ? finish : function(){};
                        if(i !== undefined && !SSPA.inArray(i.name, done)){
                            var htm = $(document.createElement('p')),
                                target = null;
                            // var events = inline
                            function setUpdatable(e){
                                SSPA.foreach(getNameSpace(i.listen),function(fn,ev){
                                   $(e).on(ev,function(e,j){
                                       fn(update,fallback,e,j);
                                   });
                                });
                            }
                            function render(name){
                                $this.render(async_modules[name], options).then(function(render){
                                    htm.html($(render));
                                    setMetadata(htm);
                                    $(target).replaceWith(htm[0].childNodes[0]);
                                    findWatcher();
                                });
                            }
                            function update(overrided_options){
                                options = SSPA.instance.getOptions(overrided_options == undefined ? undefined : SSPA.setObject(overrided_options));
                                render(i.name);
                            }
                            function fallback(overrided_options){
                                options = SSPA.instance.getOptions(overrided_options == undefined ? undefined : SSPA.setObject(overrided_options));
                                target = i.el;
                                render('failed_'+i.name);
                            }
                            new Promise(function(res){
                                function launch(overrided_options){
                                    options = overrided_options == undefined ? options : SSPA.instance.getOptions(SSPA.setObject(overrided_options));
                                    res();
                                }
                                if($js.is.number(i.delay)){
                                    res();
                                }else{
                                    var fn = inlineMethodDispatch('call : '+i.delay);
                                    fn[1](launch,update,fallback);
                                }
                            }).then(function(){
                                $this.render(async_modules[i.name], options).then(function(render){
                                    htm.html($(render));
                                    setMetadata(htm);
                                    target = show(i.name,i.el,htm,finish);
                                    setUpdatable(target);
                                });
                            });
                        }else{
                            finish();
                        }
                    }
                    SSPA.foreach(before,function(i){
                        process(i);
                    });
                },
                dispatchStyle = function(width, data){
                    var screen = $(document).width(),
                        reason = SSPA.globals.responsiveCssFromMax ? screen <= width * 1 : screen >= width * 1;
                    if(reason){
                        $(data.element).css(data.style);
                    }
                },
                setMetadata = function(parent){
                    parent.find('sspa-metadata').each(function(){
                        var type = $(this).attr('type');
                        switch (type){
                            case 'style':
                                setStyle(this);
                                break;
                            case 'attribute':
                                setAttr(this);
                                break;
                            case 'events':
                                setEvents(this);
                                break;
                            case 'route':
                                setRoute(this);
                                break;
                            case 'selectable':
                                setName(this);
                                break;
                            case 'appbar':
                                setAppBar(this);
                                break;
                            case 'overlay':
                                setOverLay(this);
                                break;
                            case 'watch':
                                setWatcher(this);
                                break;
                            case 'parent':
                                setAccess(this);
                                break;
                            case 'dragthenscroll':
                                setDraggerScroll(this);
                                break;
                        }
                        $(this).remove();
                    });
                },
                checkDom = function(){
                    if(!document.contains(el[0])){
                        el = $('#'+view);
                    }
                },
                activate = function (innerHtml,options){
                    scheduler = {};
                    return new Promise(function(resolve){
                        $this.render(innerHtml,options).then(function(render){
                            // console.log('[RENDER]',render);
                            var virtual = $(document.createElement('p'));
                            virtual.html(render.replace(/\\('|")/g, "$1"));
                            el = $(virtual.find('layer'));
                            async_modules = model.getRegistredModules();
                            setMetadata(virtual);
                            setFootbar();
                            setMenu();
                            setTimeout(function(){
                                schedule(options);
                                findWatcher();
                            },300);
                            activated = true;
                            // console.error('[RENDER]',view,'==>',render);
                            if($('#'+view).length){
                                console.error('A view ['+view+'] already exists !');
                                $('#'+view).replaceWith(el);
                            }
                            el.attr('id', view);
                            if(hybridAnimation){
                                el.addClass('hybrid-animation-out').addClass('hybrid-animation');
                            }
                            if(view == null){
                                view = el.attr('id');
                            }
                            if(SSPA.globals.hasSpashLoader){
                                setTimeout(function(){
                                    $('ssplash').remove();
                                }, 400);
                            }
                            $this.updatePersistence();
                            overlay = SSPA.toBoolean(el.attr('overlay'));
                            waiting = SSPA.toBoolean(el.attr('wait'));
                            resolve();
                        });
                    });
                };
            $(window).on('resize', dispatchEachStyle);
            this.setContent = function(new_content){
                content = new_content;
                return this;
            }
            this.updatePersistence = function(){
                this.setPersistence(SSPA.toBoolean(el.attr('persistent')));
            }
            this.setPersistence = function(persistence){
                if(activated){
                    persistent = SSPA.set(persistence,false);
                    if(persistent){
                        el.attr('persistent', persistent);
                    }
                    else{
                        el.removeAttr('persistent');
                    }
                }
                return this;
            }
            this.setToOverlay = function(to_overlay){
                if(activated){
                    overlay = SSPA.set(to_overlay, false);
                    if(overlay){
                        el.attr('overlay', persistent);
                    }
                    else{
                        el.removeAttr('overlay');
                    }
                }
            }
            this.togglePersistence = function(){
                this.setPersistence(!persistent);
            }
            this.toggleOverlay = function(){
                this.setToOverlay(!overlay);
            }
            this.updateMenu = function(menu){
                setMenu(menu);
            }
            this.getMenu = function(){
                return menuDrawer;
            }
            this.getContent = function(){
                return content;
            }
            this.activate = function(options){
                // console.log('[CONTENT]',content)
                content = content.replace(/((?:.+?)\/(?:.+?)>)( +)?(<(?:.+?))/g, '$1$3');
                // metas = content.match(/(<sspa\-metadata(?:.+?)>(?:.+?)?<\/sspa\-metadata>)/ig);
                return activate(content,options);
            }
            this.getTransitionDuration = function(){
                var r = 0;
                if(activated){
                    r = parseFloat(el.css('transition-duration'));
                    if(!isNaN(r)){
                        r *= 100;
                    }
                    else{
                        r = 0;
                    }
                }
                return r;
            }
            this.show = function(){
                if(activated){
                    updateEvents();
                    return new Promise(function(resolve, reject){
                        el.css('z-index', 2).addClass('active');
                        setTimeout(function(){
                            // console.log('[showed]',view);
                            resolve();
                        }, $this.getTransitionDuration());
                    });
                }
                return this;
            }
            this.render = function(lh, options){
                var options = SSPA.setObject(options);
                // console.log(SSPA.globals.config.nodeserver_activated,options)
                return new Promise(function(r){
                    // a = new Date().getTime(),
                    // if(!SSPA.globals.config.nodeserver_activated){
                    //     a = new Date().getTime();
                    //     $.post('http://localhost:5000/sy/',{
                    //         model : lh,
                    //         options: JSON.stringify(options),
                    //         action: 'compile'
                    //     }, function(e){
                    //         var b = new Date().getTime();
                    //         console.log('[Elapsed]',b - a);
                    //         r(e.html, e.modules)
                    //         // console.log('[E]',e);
                    //     }, 'json');
                    // }else{
                        var a = new Date().getTime(),
                            html = model.compile(lh,options),
                            b = new Date().getTime();
                        // console.log('[Elapsed]',b - a);
                        r(html);
                    // }
                    console.log('[Elapsed]', new Date().getTime() - a);
                });
            }
            this.hide = function(with_display){
                return new Promise(function(resolve,reject){
                    if(activated){
                        checkDom();
                        el.css('z-index', overlay ? 0 : 1).removeClass('active');
                        if(hybridAnimation){
                            el.removeClass('hybrid-animation');
                            setTimeout(function(){
                                el.addClass('hybrid-animation')
                                resolve();
                            },200);
                        }
                        else{
                            setTimeout(function(){
                                resolve();
                            },$this.getTransitionDuration());
                        }
                    }else{
                        resolve();
                    }
                });
            }
            this.destroy = function(){
                if(activated && !persistent){
                    el.remove();
                }
                return this;
            }
            this.dom = function(){
                return el;
            }
            this.getId = function(){
                return el.attr('id');
            }
            this.getView = function(){
                return view;
            }
            this.getModelOf = function(sel){
                var el = $('<div>'+content+'</div>').find(sel);
                return el[0] == undefined ? "" : el[0].outerHTML;
            }
            this.isPersistent = function(){
                return persistent;
            }
            this.isOverlay = function(){
                return overlay;
            }
            this.isWaiting = function(){
                return waiting;
            }
            this.updateAppbar = function(){
                adjustAppBarIcon($this.dom().find('appbar'));
            }
            this.update = function(options){
                return activate(content,options);
            }
        }
    })(jQuery);   
}
var SSPA_PLUGIN = (function(){
    return function(name, execution, dependencies){
        var name = typeof name == 'string' && name.length > 0 ? name : null,
            execution = typeof execution == 'function' ? execution : function(){},
            dependencies = Array.isArray(dependencies) ? dependencies : [];
        if(name == null){
            throw new Error('This plugin must have a name');
        }
        this.getName = function(){
            return name;
        }
        this.apply = function(e){
            return execution(e);
        }
        SSPA.instance.connect(this);
    }
})();
var SSPA  = (function(){
    return function(){
        var config = {},
            plugins = {},
            sspa_phases = {},
            sspa_phases_default_view = {},
            current_phase_index = 0,
            active_plugins = {},
            active_popups = [],
            popups_view = {},
            ressources = config.ressources,
            requirements = {},
            state_data = {},
            loaderTxt = config.loaderText,
            root = config.requestRoot,
            view = config.defaultView,
            nextView = null,
            layers = {},
            menus = {},
            database = null,
            $this = this,
            ressource_cache = {}, //pour mettre en cache toutes les données de prépocesseur
            raw_view_cache = {}, //pour mettre en cache tous les rendus non compilés
            view_cache = {}, //pour mettre en cache tous les rendus non compilés mais à peine traité
            callback = {
                prepare: function(){}
            },
            lastState = view,
            waitingState = "",
            os = navigator.userAgent,
            default_options = {
                ios : /i(phone|pad|pod)|mac +os/gi.test(os)
            },
            overlay_on = false,
            initialized = false,
            lastOverlayer = null,
            user_interacts = false,
            triggered_event = false,
            view_to_reload = [],
            call_queue = [],
            core,
            $this = this,
            beginning_process = {
                loaded: 0,
                total: 0,
                finish: false
            },
            dataset = {}, current_response_data = {};
            SSPA.instance = $this;
//@Private
    var fetch_terminator = function(e,res,options){
            var hybrid = config.globals.hybrid || default_options.ios,
                layer = typeof e == 'string' ? new Layer(e, hybrid, res) : e,
                res = SSPA.set(res,view);
            if(typeof e == 'string'){
                // console.log('[HTML]', e);
            }
            return new Promise(function(resolve){
                new Promise(function(success){
                    if(typeof e == 'string' || !layer.isPersistent()){
                        if(typeof e == 'string'){
                            layer.activate(options).then(function(){
                                view_to_reload = SSPA.removeValue(res, view_to_reload);
                                inject(layer,res);
                                success();
                            });
                        }else{
                            if(SSPA.inArray(res,view_to_reload)){
                                layer = layers[res];
                                layer = new Layer(view_cache[res], hybrid, res);
                                layer.activate(options).then(function(){
                                    inject(layer,res);
                                    success();
                                    view_to_reload = SSPA.removeValue(res, view_to_reload);
                                });
                            }else{
                                inject(layer,res);
                                success();
                            }
                        }
                    }else{
                        if(SSPA.inArray(res,view_to_reload)){
                            layer.update(getScope(options)).then(function(){
                                success();
                                view_to_reload = SSPA.removeValue(res, view_to_reload);
                            });
                        }else{
                            success();
                        }
                    }
                }).then(function(){
                    if(typeof e == 'string'){
                        if(current_phase_index in menus){
                            layer.updateMenu(menus[current_phase_index]);
                        }
                        else if(sspa_phases_default_view[current_phase_index] == res){
                            menus[current_phase_index] = layer.getMenu();
                        }
                    }else{
                        var menu = menus[current_phase_index];
                        layers[res].updateMenu(menu);
                    }
                    // console.log('[res]',res);
                    applyRequire(res).then(function(){
                        // console.log('[CALL]',layer)
                        $this.applyPlugins(layer);
                        resolve({
                            e:e,
                            layer:layer
                        });
                    });
                });
            });
        },
        setRequired = function(code,res){
            var req = code.match(/@require (.+?);/g);
            code = code.replace(/@require (.+?);/g, '');
            requirements[res] = []
            SSPA.foreach(req,function(j){
                SSPA.foreach(j.replace(/@require/i, '').split(','),function(k){
                    k = k.replace(/^(?: +)?(.+?);?(?: +)?$/, '$1').replace(/^"|"$/g, '');
                    if(/[a-z0-9_]\.[a-z]+$/.test(k)){
                        requirements[res].push(k);
                    }
                })
            });
            return code;
        },
        load = function(res,options){
            var res = SSPA.set(res,view),
                options = SSPA.set(options, {});
            // console.warn('[VIEWS]',res,'/',view, '-->', res in layers);
            nextView = res;
            options = getScope(options);
            return new Promise(function(resolve){
                if(res in layers){
                    fetch_terminator(layers[res],res,options).then(function(r){
                        resolve(r);
                    });
                }
                else{
                    if(res in raw_view_cache){
                        //Si la vue est déjà en cache...
                        var pre_render = res in view_cache ? view_cache[res] : raw_view_cache[res];
                        if(!(res in view_cache)){
                            pre_render = reachPhaseFrom(pre_render, res);
                            pre_render = setRequired(pre_render.replace(/^(?: +)?|(?: +)?$/g, ''),res);
                            view_cache[res] = pre_render;
                        }
                        fetch_terminator(pre_render,res,options).then(function(r){
                            resolve(r);
                        })
                    }else{
                        var file = config.viewRoot+ressources[res]+".lh",
                            path = file.replace(/[a-z_0-9]+\.[a-z]+$/, ''),
                            source = file.replace(/(?:.+?)([a-z_0-9]+\.[a-z]+)$/, '$1');
                        // console.error('[Res]',res);
                        core = new LogicHtml_SRV(path,source,[],null);
                        core.get().then(function(e){
                            // console.log('[LHTML]',e);
                            // e = '';
                            raw_view_cache[res] = e;
                            e = reachPhaseFrom(e, res);
                            e = setRequired(e.replace(/^(?: +)?|(?: +)?$/g, ''),res);
                            view_cache[res] = e;
                            fetch_terminator(e,res,options).then(function(r){
                                resolve(r);
                            });
                        });
                    }
                }
            });
        },
        getScope = function(options, complete){
            var options = SSPA.setObject(options),
                complete = complete == undefined || typeof complete == 'boolean' ? true : complete;
            if(complete){
                return SSPA.extend(options,SSPA.extend(dataset,default_options));
            }else{
                return SSPA.extend(options,default_options);
            }
        },
        loaderText = function(view){
                return view in loaderTxt ? loaderTxt[view] : '';
            },
        reachPhaseFrom = function(e, view){
            var phase = ["0"];
            if(/^(?: +)?@sspa\-phase +([0-9]+(?: +default(?: +)?)?(?:(?:(?: +)?,(?: +)?[0-9]+(?: +default(?: +)?)?)+)?)(?: +)?(?: +default(?: +)?)?;/.test(e)){
                phase = RegExp.$1;
                // phase = e.replace(/^(?:(?: +)?@sspa\-phase +([0-9]+(?: +default(?: +)?)?(?:(?:(?: +)?,(?: +)?[0-9]+(?: +default(?: +)?)?)+)?)(?: +)?;)(.+?)$/, '$1');
                phase = phase.split(',');
            }
            SSPA.foreach(phase, function(i){
                var insert = false;
                var t = i.replace(/^( +)?|( +)?$/g, '').split(/ +/);
                i = parseInt(t[0]);
               if(!(i in sspa_phases)){
                   sspa_phases[i] = [];
                   insert = true;
               }else if(!SSPA.inArray(view, sspa_phases[i])){
                   insert = true;
               }
               if(insert){
                   sspa_phases[i].push(view);
                   if(t.length > 1 && t[1] == "default"){
                       sspa_phases_default_view[i] = view;
                   }
               }
            });
            return e.replace(/^(?: +)?@sspa\-phase +(?:[0-9]+(?: +default(?: +)?)?(?:(?:(?: +)?,(?: +)?[0-9]+(?: +default(?: +)?)?)+)?)(?: +)?;/, '');
        },
        inject = function(layer,res){
            var res = SSPA.set(res,view);
            layer.updatePersistence();
            if(!(res in layers) || !layer.isPersistent()){
                setPopupData(layer.dom(), res);
                $('sspa').append(layer.dom());
                layers[res] = layer;
                layer.dom().trigger('load');
            }else{
                layers[res] = layer;
            }
            return $this;
        },
        setPopupData = function(layer, res){
            popups_view[res] = SSPA.set(popups_view[res], []);
            layer.find("[sspa-popup]").each(function(){
                popups_view[res].push(SSPA.set($(this).data('name'), ''))
            });
        },
        install = function(list, static, remove){
            var static = typeof static == 'boolean' ? static : true,
                remove = typeof remove == 'boolean' ? remove : false,
                primeScript = document.querySelectorAll('script[initiator="true"]')[0];
            if(!beginning_process.finish){
                beginning_process.total = list.length + SSPA.len(ressources);
                updateSplasLoader(beginning_process.loaded,beginning_process.total,true);
            }
            return SSPA.wait(list, function(i){
               return new Promise(function(res){
                   var id = i.replace(/\/|\./g, '_');
                   if(remove){
                       var el = $('#require-'+id);
                       if(SSPA.set(SSPA.toBoolean(el.attr('static')), false)){
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
                                   script.src = config.javascript_root+i;
                                   script.setAttribute('static',static);
                                   document.querySelector('body').insertBefore(script, primeScript);
                                   element = script;
                                   break;
                               case 'style':
                                   var link = document.createElement('link');
                                   link.rel = "stylesheet";
                                   link.id = "require-"+id;
                                   link.href = config.css_root+i;
                                   link.setAttribute('static', static);
                                   document.querySelector("head").appendChild(link);
                                   element = link;
                                   break;
                           }
                           if(element != null){
                               element.addEventListener('load', function(){
                                   if(!beginning_process.finish){
                                       updateSplasLoader();
                                   }
                                   res();
                               });
                           }
                       }
                   }
               });
            });
        },
        applyRequire = function(state,remove){
            var remove = SSPA.set(remove, false),
                require_data = SSPA.set(requirements[state], []),
                static = $this.getLayerOf(state).isPersistent();
            return install(require_data, static, remove);
        },
        launch = function(layer,state,options){
            var options = SSPA.setObject(options);
            if(layer.isOverlay()){
                setLoader(layer,state,options);
            }
            return new Promise(function(resolve){
                if(lastState in layers && lastState != state){
                    applyRequire(lastState,true);
                }
                if(!layer.isOverlay() && state != lastState){
                    if(lastState in layers){
                        layers[lastState].hide().then(function(){
                            // console.log('[HIDE]', lastState,'/',state, layers[lastState].dom())
                            if(!layers[lastState].isPersistent()){
                                layers[lastState].destroy();
                                // delete layers[lastState];
                            }
                            resolve(layer);
                        });
                    }else{
                        resolve(layer);
                    }
                }
                else{
                    resolve(layer);
                }
            });
        },
        setLoader = function(layer,res,options){
            var el = layer.dom(),
                options = SSPA.setObject(options),
                icon = el.find('loader-icon');
            if(icon.length){
                try{
                    icon.html('').gPreloader({
                        theme: config.loaderTheme,
                        replace: true,
                        square: icon.width()
                    });
                }catch(e){
                }
            }
            el.find('text').html(SSPA.set(options.text, loaderText(res)));
        },
        updateSplasLoader = function(loaded, total, atStart){
            var atStart = SSPA.set(atStart, false);
            if(!atStart){
                beginning_process.loaded++;
            }
            var loaded = SSPA.set(loaded, beginning_process.loaded),
                total = SSPA.set(total, beginning_process.total);
            total = total < 1 ? 1 : total;
            if(loaded == 0){
                callback.prepare(loaded, total);
            }else{
                callback.prepare(loaded, total);
            }
            if(!atStart && SSPA.globals.hasSpashLoader){
                var percent = loaded / total * 100;
                if(loaded == total){
                    beginning_process.finish = true;
                }
                document.querySelector('ssplash .progress-line .line').style.width = percent+"%";
                document.querySelector('ssplash .progress-line .line').style.transitionDuration = "0.2s";
                if(SSPA.globals.assets.splashText == undefined){
                    document.querySelector('ssplash .progress-text').innerHTML = loaded+' / '+total;
                }
            }
        },
        unsetLoader = function(el,state){
            return new Promise(function(res){
                applyRequire(state,true).then(function(){
                    el.hide().then(function(){
                        el.destroy();
                        $this.restoreLastState();
                        res();
                    });
                });
            });
        },
        caching = function(){
            return new Promise(function(res){
                SSPA.wait(ressources, function(v, view){
                    return new Promise(function(call){
                        var file = config.viewRoot+v+".lh",
                            path = file.replace(/[a-z_0-9]+\.[a-z]+$/, ''),
                            source = file.replace(/(?:.+?)([a-z_0-9]+\.[a-z]+)$/, '$1');
                        new LogicHtml_SRV(path,source).get().then(function(e){
                                reachPhaseFrom(e, view);
                                updateSplasLoader();
                                call();
                            });
                    });
                }).then(function(){
                    ressource_cache = new LogicHtml_SRV('').getAllModules();
                    setCache().then(function(){
                            res();
                        }).catch(function(){});
                });
            });
        },
        setCache = function(){
            return new Promise(function(res,rej){
                var data = {
                  ressources: ressource_cache,
                  phases:{
                      current: current_phase_index,
                      phases: sspa_phases,
                      default_view: sspa_phases_default_view
                  },
                  datas: state_data,
                  dataset: dataset,
                  menus : menus,
                  view_cache: raw_view_cache
                };
                database.setItem('sspa-cache', JSON.stringify(data), function(err){
                    if(err){
                        rej(err);
                    }
                    else{
                        res();
                    }
                });
            });
        },
        getCache = function(){
            return new Promise(function(res,rej){
                database.getItem('sspa-cache', function(err, v){
                    if(err){
                        rej(err);
                    }
                    else{
                        var cache = JSON.parse(v),
                            ok = true;
                        if(cache == null){
                            cache = {
                                ressources: {},
                                phases: {
                                    current: 0,
                                    phases: { 0 : [] },
                                    default_view: {}
                                },
                                datas: {},
                                menus : {},
                                dataset: {},
                                view_cache: {}
                            };
                            ok = false;
                        }
                        ressource_cache = cache.ressources;
                        sspa_phases = cache.phases.phases;
                        state_data = cache.datas;
                        dataset = cache.dataset;
                        menus = cache.menus;
                        sspa_phases_default_view = cache.phases.default_view;
                        current_phase_index = cache.phases.current;
                        if(!ok){
                            setCache();
                        }
                        if(!config.devMode){
                            new LogicHtml_SRV('').setAllModules(ressource_cache);
                            raw_view_cache = cache.view_cache;
                        }
                        res(ok);
                    }
                });
            });
        },
        prepare = function(){
            if(SSPA.globals.hasSpashLoader){
                var view = document.querySelector('sspa');
                view.innerHTML = SSPA.globals.splashLoaderHTML();
            }
        },
        init = function(){
            return new Promise(function(resolve,err){
                prepare();
                function responseFn(ready, status, response){
                    if (ready == 4 && status == 200) {
                        var manifest = response;
                        manifest = SSPA.conformToJsonStyle(manifest);
                        try{
                            manifest = JSON.parse(manifest);
                            config = manifest;
                            SSPA.globals.config = config.globals;
                            SSPA.globals.config.nodeserver_activated = config.nodeserver_activated;
                            SSPA.globals.config.isIos = default_options.ios;
                            default_options = SSPA.extend(default_options, SSPA.set(config.globals, {
                                appName: config.name
                            }));
                            ressources = config.ressources;
                            loaderTxt = config.loaderText;
                            root = config.requestRoot;
                            view = config.defaultView;
                            if(config.buildMode){
                                config.dependencies = [];
                            }
                            install(config.dependencies).then(function(){
                                localforage.config({
                                    driver      : localforage.INDEXEDDB,
                                    name        : config.name,
                                    version     : config.version,
                                    storeName   : 'SSPA-DataBase',
                                    description : 'for ressources cache'
                                });
                                localforage.ready();
                                database = localforage;
                                getCache().then(function(e){
                                    if(!e || config.devMode){
                                        caching().then(function(){
                                            includeLayer($this);
                                            fire_event();
                                            resolve({start:start});
                                            initialized = true;
                                        });
                                    }else{
                                        updateSplasLoader(beginning_process.loaded, beginning_process.total);
                                        includeLayer($this);
                                        fire_event();
                                        resolve({start:start});
                                        initialized = true;
                                    }
                                }).catch(function(e){
                                    err("Error while saving data. Please check your client-side database.")
                                });
                            });
                        }catch(e){
                            err("Syntax error in the configuration file");
                        }
                    }
                    if(status == 404 || status == 500){
                        err("Configuration file not found in the root app.");
                    }
                }
                if(localMod){
                    console.error('Must be ran under localhost cover');
                }
                else{
                    xhr = new XMLHttpRequest() || new ActiveXObject("Msxml2.XMLHTTP");
                    xhr.open("GET", "./.lmi");
                    try{
                        xhr.send(null);
                        xhr.onreadystatechange = function(){
                            responseFn(xhr.readyState, xhr.status, xhr.responseText);
                        }
                    }catch(e){
                        err(e.getMessage());
                    }
                }
            });
        },
        closeAllPopup = function(state){
            if(state in active_plugins && 'spopup' in active_plugins[state]){
                for(var i in active_popups){
                    active_plugins[state].spopup.close(active_popups[i]);
                }
                active_popups = [];
            }
        },
        closeLastPopup = function(route){
            var state = $this.getCurrentState(),
                popup = active_popups[active_popups.length -  1 >= 0 ? active_popups.length - 1 : 0];
            if(popup != undefined){
                if(state in active_plugins && 'spopup' in active_plugins[state]){
                    active_plugins[state].spopup.close(popup);
                }
                // if(route === null){
                    window.history.back();
                // }
            }
        },
        resetSwipe = function(target, back){
            var back = SSPA.set(back, false);
            if(target in active_plugins && 'sswitcher' in active_plugins[target]){
                var index = 0;
                if(active_plugins[target].sswipe != undefined){
                    if(!back){
                        index = active_plugins[target].sswipe.getActiveIndex();
                    }
                    active_plugins[target].sswipe.scrollTo(index,0);
                }
                active_plugins[target].sswitcher.triggerTap(index);
            }
        },
        process = function(target){
            var target = target.replace(/^#/, ''),
                go = false,
                state = $this.getCurrentState();
            return new Promise(function(res){
                if(target == ''){
                    target = sspa_phases_default_view[current_phase_index];
                }
                if(target == 'menu'){
                    closeAllPopup(state);
                    var granted = user_interacts || triggered_event,
                        access = user_interacts && triggered_event;
                    user_interacts = false;
                    triggered_event = false;
                    if(granted){
                        overlay_on = true;
                        if(state in active_plugins && 'smenu' in active_plugins[state]){
                            if(!access){
                                active_plugins[state].smenu.toggle();
                            }
                        }
                    }else{
                        overlay_on = false;
                        window.history.back();
                    }
                }
                else if(SSPA.inArray(target, SSPA.set(popups_view[state],[]) ) ){
                    var granted = user_interacts;
                    user_interacts = false;
                    triggered_event = false;
                    if(granted){
                        closeLastPopup();
                        if(state in active_plugins && 'spopup' in active_plugins[state]){
                            active_plugins[state].spopup.toggle(target);
                            overlay_on = true;
                        }
                        active_popups.push(target);
                    }else{
                        overlay_on = false;
                        // window.history.back();
                    }
                }
                else{
                    closeAllPopup(state);
                    go = SSPA.inArray(target, sspa_phases[current_phase_index]);
                    user_interacts = false;
                    triggered_event = false;
                    if(!go && current_phase_index in sspa_phases_default_view){
                        target = sspa_phases_default_view[current_phase_index];
                        window.history.back();
                        return;
                    }
                    if(go){
                        user_interacts = false;
                        if(target != state || !(target in layers)){
                            resolveState(target).then(function(e){
                                if(e != null){
                                    if(state in active_plugins && 'smenu' in active_plugins[state] && active_plugins[state].smenu != null){
                                        if(active_plugins[state].smenu.isOpen()){
                                            active_plugins[state].smenu.toggle();
                                        }
                                    }
                                    resetSwipe(target);
                                    e.layer.show();
                                    res();
                                }
                            });
                        }else{
                            if(!overlay_on){
                                resetSwipe(target, true);
                            }
                        }
                        overlay_on = false;
                    }else{
                        throw new Error("The SSPA phase "+current_phase_index+" has no default view !");
                    }
                }
            });
        },
        fire_event = function(){
            window.addEventListener('hashchange', function(){
                var hash = (window.location.hash+"").replace(/^#/, '');
                if(!triggered_event || hash != 'menu'){
                    if(lastState in active_plugins && 'smenu' in active_plugins[lastState] && active_plugins[lastState].smenu != null){
                        if(active_plugins[lastState].smenu.isOpen()){
                            active_plugins[lastState].smenu.toggle();
                        }
                    }
                }
                process(hash);
            })
            $('sspa').hammer()
                .on('tap', '*', function(e){
                    var path = e.path,
                        target = null,
                        insidePopup = false;
                    SSPA.foreach(path, function(i){
                       var el = $(i);
                       if(el.attr('layer-target') != undefined){
                           target = el.attr('layer-target');
                       }
                       if(el.attr('sspa-popup') != undefined){
                           insidePopup = true;
                           return false;
                       }
                    });
                    if(!insidePopup && active_popups.length != null){
                        closeLastPopup(target);
                    }
                 })
                .on('tap', '.process',function(){
                    var target = $(this).attr('layer-target');
                    target = (""+target).replace(/^#/, '');
                    if('#'+target == window.location.hash){
                        user_interacts = false;
                        window.history.back();
                    }
                    else{
                        user_interacts = true;
                        window.location = './#'+target;
                    }
                })
                .on('tap', '[item]', function(){
                    var p =$(this);
                    do{
                        p = p.parent();
                    }while(typeof p.attr('switch') == 'undefined' && p[0].tagName.toLowerCase() != 'body');
                    var cls = p.attr('switch');
                    p.find('[item]').removeClass(cls);
                    $(this).addClass(cls);
                })
                .on('tap', '[title-modifier]', function(){
                    $('titlebar').html($(this).attr('title-modifier'));
                })
                .on('tap','.history-back', function(){
                    window.history.back();
                })
                .on('focus','.animated-field', function(){
                    $(this).addClass('writing');
                })
                .on('blur','.animated-field', function(){
                    var $this = $(this),
                        input = $this.find('input,textarea,select'),
                        value = input[0].tagName == 'SELECT' ? input.find('option:selected').val() : input.val();
                    $this[value.length ? 'addClass' : 'removeClass']('writing');
                })
                .on('change','.animated-field input,.animated-field textarea, .animated-field select', function(){
                    var $this = $(this).parent().parent(),
                        input = $this.find('input,textarea,select'),
                        value = input.val();
                    $this[value.length ? 'addClass' : 'removeClass']('writing');
                })
                .on('tap', '[page-ctl]',function(){
                    var id = $(this).attr('page-ctl'),
                        k = 0,page = null;
                    $('page').each(function(){
                        if($(this).attr('page-id') == id){
                            page = $(this);
                            return false;
                        }
                        k++;
                    });
                    if(page != null){
                        page.parent().gCss({
                            translate3d: [-k*100+'%',0,0]
                        },0);
                    }
                })
                .on('tap','.password-toggle',function(){
                    var icons = SSPA.stringToObject($(this).attr('icons'));
                    icons = [SSPA.iconClass(icons[0]),SSPA.iconClass(icons[1])];
                    var off = $(this).hasClass(icons[0]),
                        type = !off ? 'text' : 'password',
                        input = $(this).parent().find('input[type="'+type+'"]');
                    input.attr('type', off ? 'text' : 'password');
                    if(off){
                        $(this).removeClass(icons[0]).addClass(icons[1]);
                    }else{
                        $(this).removeClass(icons[1]).addClass(icons[0]);
                    }
                })
                .on('input','input[format]',function(){
                    var val = $(this).val(),
                        format = $(this).attr('format'),
                        r = '';
                    SSPA.foreach(val,function(i,j){
                       if(j*1 <= format.length){
                           if((/[0-9]/.test(format[j]) && /[0-9]/.test(i)) || format[j] == '#'){
                               r += i
                           }else if(/(,| |-)/.test(format[j])){
                               var c = RegExp.$1;
                               r += !/(,| |-)/.test(i) ? c+i : i;
                           }else{
                               r += '';
                           }
                       }
                    });
                    $(this).val(r);
                })
                .on('change', 'input[regexp]', function(){
                    var val = $(this).val(),
                        format = $(this).attr('regexp'),qt;
                    if(/^(?: +)?\/(.+?)?\/([a-z]+)?(?: +)?$/.test(format)){
                        qt = RegExp.$2;
                        format = RegExp.$1;
                    }
                    $(this).val(new RegExp(format, qt).test(val) ? val : '');
                });
        },
        warn = function(){
            if(!initialized){
                throw new Error("Please wait for initialized");
            }
        },
        resolveState = function(state,options,overlay_options){
            warn();
            var k = state,
                data = SSPA.set(state_data[state],{}),
                options = SSPA.set(data.options, SSPA.setObject(options)),
                overlay_options = SSPA.set(data.overlay_options, SSPA.setObject(overlay_options));
            if(state in state_data){
                state_data[state] = {
                    options : options,
                    overlay_options : overlay_options
                };
                setCache();
            }
            return new Promise(function(resolve){
                load(state,options).then(function(e){
                    var state = k;
                    if(!e.layer.isWaiting()){
                        waitingState = lastState;
                        lastState = view;
                        view = state;
                        launch(e.layer,view,overlay_options).then(function(){
                            resolve(e);
                        });
                    }
                    else{
                        var layer = e.layer,
                            state = view,
                            isIn = false;
                        SSPA.foreach(call_queue, function(i){
                            if(i.current == state && i.prev == lastState){
                                isIn = true;
                                return false;
                            }
                        });
                        layer.hide();
                        if(!isIn){
                            call_queue.push({
                                current: state,
                                prev: lastState,
                                fn:function(){
                                    return launch(layer,state,overlay_options).then();
                                }
                            });
                        }
                        e = null;
                    }
                    // return new Promise(function(resolve){
                    //     resolve(e);
                    // });
                });
            });
        },
        start = function(){
            return process(window.location.hash);
        };
//@Public
        this.setState = function(state, options, overlay_options){
            state = state.replace(/^#/,'');
            state_data[state] = {
                options: options,
                overlay_options: overlay_options
            };
            setCache();
            user_interacts = true;
            window.location = '#'+state;
        }
        this.restoreLastState = function(){
            warn();
            view = lastState;
        }
        this.freeToLaunch = function(options){
            warn();
            var options = SSPA.setObject(options);
            return new Promise(function(resolve){
                setTimeout(function(){
                    var r = call_queue.pop();
                    if(typeof r == 'object'){
                        r.fn().then(function(e){
                            var target = e.getView();
                            lastOverlayer = e;
                            applyRequire(target);
                            lastState = view;
                            view = target;
                            if(target == 'loader'){
                                setLoader(e, lastState,options);
                            }
                            e.show();
                            resolve(e);
                        })
                    }
                    else{
                        resolve();
                    }

                },200);
            });
        }
        this.hideLastOverLay = function(){
            warn();
            return new Promise(function(resolve){
                setTimeout(function(){
                    if(lastOverlayer != null){
                        unsetLoader(lastOverlayer, lastOverlayer.getView());
                        lastOverlayer = null;
                    }
                    resolve();
                },200);
            });
        }
        this.removeLayer = function(state){
            warn();
            this.getLayerOf(state).dom().remove();
        }
        this.getCurrentState = function(){
            warn();
            return nextView;
        }
        this.getPreviousState = function(){
            warn();
            return lastState;
        }
        this.getLayerOf = function(state){
            warn();
            return SSPA.set(layers[state], null);
        }
        this.getCurrentLayer = function(){
            warn();
            return this.getLayerOf(this.getCurrentState());
        }
        this.addRessource = function(ressources){
            warn();
            SSPA.foreach(ressources, function(i,j){
                ressources[j] = i;
            });
        }
        this.addLoaderText = function(text_object){
            warn();
            text_object = typeof text_object == 'object' ? text_object : {};
            SSPA.foreach(text_object, function(i,j){
                loaderTxt[j] = i;
            });
        }
        this.request = function(url, data){
            warn();
            var data = typeof data == 'object' ? data : {};
            url = /^\.{1,2}\//.test(url) ? url : root+url;
            current_response_data = {};
            return new Promise(function(resolve,reject){
                $.post(url,data,function(e){
                    if(SSPA.isJson(e)){
                        var r = JSON.parse(e);
                        current_response_data = r.data;
                        if(r.error){
                            reject({response: r.message});
                        }
                        else{
                            resolve({data: r.data, url: root+url, arg: data});
                        }
                    }
                    else{
                        reject({response: e, arg: data, url: root+url});
                    }
                }, 'text');
            });
        }
        this.onPrepare = function(fn){
            var fn = typeof fn == 'function' ? fn : function(){};
            callback.prepare = fn;
        }
        this.select = function(el,byname){
            var byname = SSPA.set(byname,true);
            return $this.getLayerOf(nextView).dom().find(!byname ? el : '[data-name="'+el+'"]');
        }
        this.back = function(){
            window.history.back();
        }
        this.connect = function(e){
            if(typeof e == 'object' && typeof e.apply == 'function' && typeof e.getName == 'function'){
                plugins[e.getName()] = e;
            }
        }
        this.run = function(){
            return init();
        },
        this.updateDatabase = function(index, data){
            var index = SSPA.set(index,view),
                data = SSPA.set(data, current_response_data);
            if(index.toString().toLowerCase() == 'global'){
                dataset = SSPA.extend(dataset, data);
            }else{
                dataset[index] = data;
            }
            return setCache();
        }
        this.getDataset = function(){
            return dataset;
        }
        this.setPhase = function(level){
            var level = SSPA.set(level, 0),
                len = SSPA.len(sspa_phases);
            current_phase_index = level > len - 1 ? len - 1 : level;
            SSPA.foreach(sspa_phases, function(i,j){
                if(j != current_phase_index){
                    view_to_reload = SSPA.merge(view_to_reload, i);
                }
            });
        }
        this.getOptions = getScope;
        this.getPhase = function(){
            return current_phase_index;
        }
        this.getPlugins = function(){
            return plugins;
        }
        this.applyPlugins = function(layer){
            var layer = SSPA.set(layer,this.getCurrentLayer()),
                view = layer.getView();
            if(!(view in active_plugins)){
                active_plugins[view] = {};
            }
            //Activate plugins
            //Wave Touch (not for iOs)
            if(typeof Waves != 'undefined' && typeof Waves.attach == 'function' && !default_options.ios){
                Waves.attach('button')
                Waves.attach('.button')
                Waves.attach('.float-btn', ['wave-circle'])
                Waves.init();
            }
            SSPA.foreach(plugins, function(e, name){
                active_plugins[view][name] = e.apply({
                    layer: layer,
                    dom: layer.dom(),
                    iosMod: default_options.ios,
                    hybridMod: config.globals.hybrid,
                    plugins: active_plugins,
                    sspaElement: $('sspa'),
                    globals : config.globals
                });
            });
            if(view in active_plugins && 'smenu' in active_plugins[view] && active_plugins[view].smenu != null){
                active_plugins[view].smenu.on('open', function(){
                    var hash = window.location.hash;
                    if(hash != '#menu'){
                        triggered_event = true;
                        user_interacts = true;
                        window.location = '#menu';
                    }
                }).on('close', function(){
                    var hash = window.location.hash;
                    if(hash == '#menu'){
                        window.history.back();
                    }
                })
            }
        }
        this.updateAppbar = function(){
            this.getCurrentLayer().updateAppbar();
        }
        this.setUnstable = function(){
            var current_view = $this.getCurrentState(),
                current_phase = $this.getPhase(),
                phases = SSPA.removeValue(current_view,sspa_phases[current_phase]);
            return SSPA.wait(phases, function(i){
               return $this.updateView(i);
            });
        }
        this.openModalBox = function(target,message){
            var message = SSPA.set(message,null);
            return new Promise(function(resolve){
                if(SSPA.inArray(target, SSPA.set(popups_view[$this.getCurrentState()],[]) )){
                    var modalBox = $this.getCurrentLayer().dom().find('[data-name="'+target+'"]');
                    if(message != null){
                        modalBox.find('.main-text').html(message);
                    }
                    modalBox.on('tap', 'form-field button[sspa-choice]', function(){
                        var response = $(this).attr('sspa-choice');
                        if(/^(?: +)?!?(false|true)(?: +)?$/.test(response)){
                            response = SSPA.toBoolean(response);
                        }
                        $this.getCurrentLayer().dom().find('[data-name="'+target+'"] button[sspa-choice]').off('tap')
                        setTimeout(function(){
                            resolve({
                                type : 'action',
                                value: response
                            });
                        },300);
                    });
                }
                $this.setState(target);
            });
        }
        this.commons = SSPA.commons;
        this.broadcast = SSPA.all;
        this.updateView = function (target,push){
            var push = push == undefined ? true : push;
            return new Promise(function(resolve){
                if(target in layers){
                    if(document.contains(layers[target].dom()[0])){
                        layers[target].update(getScope()).then(function(){
                            resolve();
                        });
                    }else{
                        if(push){
                            view_to_reload.push(target);
                        }
                        resolve();
                    }
                }else{
                    resolve();
                }
            });
        }
    }
})();
//@Utils
SSPA.globals = {
    runtime: {
        all: {},
        one: {}
    },
    hasSpashLoader: true,
    config: {},
    responsiveCssFromMax: false,
    assets: {
    },
    splashLoaderHTML: function(){
        var config = SSPA.extend({
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
            height: 200,
        }, SSPA.isJson(SSPA.globals.assets) ? SSPA.globals.assets : {});
        return "<ssplash style='display: inline-flex; box-sizing: border-box; position: absolute; top: 0; left: 0; bottom: 0; width: 100%; background-color: "+config.background+"; align-items: center'>" +
                "<wrapper style='display: inline-block; box-sizing: border-box; width: 100%; padding: .2em 1em; text-align: center;'>" +
                    "<span class='img' style='display: inline-block; box-sizing: border-box; width: 100%; height: "+config.height+"px; background-image: url("+config.image+"); background-position: center; background-size: "+config.imageSize+"; background-repeat: no-repeat'></span>"+
                    "<span class='text' style='display: inline-block; box-sizing: border-box; width: 100%; padding: .4em .5em; font-weight: bold; font-family: "+config.font+"; font-size: 1.3em;'>"+
                        config.text+
                    "</span>"+
                    "<span class='operation' style='display: inline-block; box-sizing: border-box; width: 100%; padding: 2em; font-size: 0.9em; font-family: "+config.splashTextFont+"; color: #555;'>" +
                        (config.progressline ?
                            "<span class='wrapper' style='display: inline-block; box-sizing: border-box; width: 100%; padding: 0 2em;'>"+
                                "<span class='progress-line' style='display: inline-flex; box-sizing: border-box; width: 100%; height: 3px; background-color: #ddd; overflow: hidden; border-radius: 4em;'>" +
                                    "<span class='line' style='display: inline-block; box-sizing: border-box; width: 5%; height: 100%; border-radius: 4em; background-color: "+config.progresslineColor+"'></span>"+
                                "</span>"+
                            "</span>"
                            :
                            "<span class='progress-text' style='display: inline-block; box-sizing: border-box; width: 100%; height: auto; font-size: .9em;'>" +
                                config.splashText+
                            "</span>"
                        )+
                    "</span>"+
                    "<span class='ads' style='display: inline-block; box-sizing: border-box; width: 100%; padding: 2em 1em .5em 1em; font-size: 0.9em; font-family: "+config.adsTextFont+"; color: #555;'>" +
                        config.adsText +
                    "</span>"+
                "</wrapper>"+
            "</ssplash>";
    }
}
SSPA.instance = null;
SSPA.commons = function(e,v,update){
    var update = update == undefined ? false : SSPA.toBoolean(update);
    SSPA.globals.runtime.one[SSPA.instance.getCurrentState()][e] = SSPA.set(SSPA.globals.runtime.one[SSPA.instance.getCurrentState()][e], v);
    if(update){
        SSPA.globals.runtime.one[SSPA.instance.getCurrentState()][e] = v;
    }
}
SSPA.all = function(e,v,update){
    var update = update == undefined ? false : SSPA.toBoolean(update);
    SSPA.globals.runtime.all[e] = SSPA.set(SSPA.globals.runtime.all[e], v);
    if(update){
        SSPA.globals.runtime.all[e] = v;
    }
}
SSPA.merge = function(a,b){
    if(!Array.isArray(a) || !Array.isArray(b)){
        return a;
    }
    var r = a;
    SSPA.foreach(b,function(i){
        r.push(i);
    });
    return r;
}
SSPA.conformToJsonStyle = function(e){
    return e.replace(/\/\/(.+?)\n/g, '')
            .replace(/\n|\t|\r/g, "")
            .replace(/\/\*(.+?)\*\//, '')
            .replace(/(.+?)([a-z0-9_-]+)(?: +)?:(.+?)/ig, "$1\"$2\":$3")
            .replace(/(?: +)?'(.+?)'(?: +)?/ig, "\"$1\"")
},
SSPA.stringToObject = function(e){
    return $js.toObject(e);
}
SSPA.set = function(e,v){
    return typeof e == 'undefined' ? (typeof v == 'undefined' ? null : v) : e;
}
SSPA.indexes = function(e){
    var r = [];
    for(var i in e){
        r.push(i);
    }
    return r;
};
SSPA.removeValue = function(value, array){
    if(!Array.isArray(array)){
        return array;
    }
    var r = [];
    for(var i in array){
        if(array[i] != value){
            r.push(array[i]);
        }
    }
    return r;
}
SSPA.toBoolean = function(e){
    return ['undefined', null, 'false', false].indexOf(e) != -1 || typeof e == 'undefined' ? false : true;
};
SSPA.foreach = function(e,fn){
    var fn = this.set(fn, function(){}),r;
    for(var i in e){
            r = SSPA.set(fn(e[i], i), true);
            if(!r)
                break;
    }
};
SSPA.forsync = function(e,fn,time){
    var fn = this.set(fn, function(){}),
        index = SSPA.indexes(e),
        k = 0;
    function go(){
        k++;
        if(k < index.length){
            t(k);
        }
    }
    function t(){
        var i = index[k];
        fn(e[i], i, go);
    }
    t(k);
}
SSPA.isJson = function(m){
    if (typeof m == 'object' && m != null) {
        try{ m = JSON.stringify(m); }
        catch(err) { return false; } }

    if (typeof m == 'string') {
        try{ m = JSON.parse(m); }
        catch (err) { return false; } }

    if (typeof m != 'object' || m == null) { return false; }
    return true;
};
SSPA.setObject = function(e,v){
    return typeof e == 'object' ? e : (typeof v == 'object' ? v : {});
};
SSPA.len = function(e){
    var k = 0;
    this.foreach(e,function(){
        k++;
    });
    return k;
};
SSPA.print = function (e){
    function t(el){
        if(typeof el != 'object')
            return "";
        var j = ["{", "}"], a = ["[", "]"],
            type = Array.isArray(el) ? false : true,
            r = type ? j[0] : a[0],
            run = false;
        for(var i in el){
            r += (type ? '"'+i+'" : ' : "")+(typeof el[i] == "object" && el[i] != null ? t(el[i]) : ( typeof el[i] == 'string' ? '"'+el[i].replace(/('|")/g, "\\$1")+'"' : el[i] ) )+", ";
            run = true;
        }
        r = r.substr(0,r.length-(run ? 2 : 0));
        r += type ? j[1] : a[1];
        return r;
    }
    var r = t(e);
    return r.length == 1 ? (type ? {} : []) : JSON.parse(r.replace(/\\:/g, '\\\\:'));
}
SSPA.inArray = function(e, a, io, l){
    var rep = false,
        l = typeof l == 'bool' || l == 0 || io == 1 ? l : false,
        io = typeof io == 'bool' || io == 0 || io == 1 ? io : false;
    for(var i = 0, j = a.length; i < j; i++){
        if(l){a[i] = a[i].to; e = e.toLowerCase();}
        if(e == a[i] || (io && a[i].indexOf(e) != -1)){
            rep = true;
            break;
        }
    }
    return rep;
};
SSPA.extend = function(model, options){
    var e = this.isJson(model) ? JSON.parse(JSON.stringify(model)) :  {},
        r = e;
    for(var i in options){
        r[i] = options[i];
    }
    return r;
};
SSPA.wait = function(object, fn){
    if(typeof object != 'object' && typeof fn != 'function')
        return;
    return new Promise(function(resolve){
        var index = SSPA.indexes(object),
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
}
SSPA.grab = function(field, sspaMod){
    var r = {},
        sspaMod = SSPA.set(sspaMod,true),
        k = 0;
    function fieldGrabber(e,array){
        var r = {}, arr = [];
        e.find('input,textarea,select').each(function(){
            var $this = $(this),
                name = SSPA.set($this.attr('entry-label'), 'name'+k),
                value = '',
                isImportant = SSPA.set($this.attr('sspa-important'), false);
            switch(this.tagName.toLowerCase()){
                case 'input':
                case 'textarea':
                    value = $this.val();
                    break;
                case 'select':
                    try{
                        value = $this.find('option:selected').val();
                    }catch(e){
                        value = $this.val();
                    }
                    break;
            }
            if(name.length){
                r[name] = value;
            }
            arr.push(value);
            if(isImportant && value.length == 0){
                r = {};
                arr = [];
                return false;
            }
            k++;
        });
        return array ? arr : r;
    }
    if(!sspaMod){
        r = fieldGrabber(field,false);
    }else{
        field.find('field').each(function(){
            var $this = $(this),
                name = SSPA.set($this.attr('name'), 'name'+k),
                joinMod = SSPA.set($this.attr('sspa-join'),'');
            r[name] = fieldGrabber($this, true).join(joinMod)
            // console.log(r);
        });
    }
    return r;
};
SSPA.check = function(field){
  var r = true;
  SSPA.foreach(field,function(i){
      if(['',null,undefined].indexOf(i) > -1){
          r = false;
          return r;
      }
  });
  return r;
};
if(node_env){

    SSPA.icon = function(icon,options) {
        // return new require('./mobile-icon')(icon).html(options);
        return '';
    }
    SSPA.iconClass = function(icon){
        // return new require('./mobile-icon')(icon).getClass();
        return '';
    }
}else{
    SSPA.icon = function(icon,options) {
        return new MobileIcons(icon).html(options);
    }
    SSPA.iconClass = function(icon){
        return new MobileIcons(icon).getClass();
    }
}
SSPA.preg_quote = function(e){
    return e.replace(/(\$|\.|\\|\/|\*|\+|\?|\[|\]|\(|\)|\|)/g, '\\$1');
}
SSPA.random_int = function(min, max){
    return Math.floor(min + Math.random() * (max - min));
}
SSPA.getDelimiter = function(str){
    var td = ['%', '/', '_', '-'],
        delimiter = "";
    do{
        delimiter = "";
        for(var i = 0, k = td.length - 1, j = SSPA.random_int(1,k); i < j; i++){
            delimiter += td[SSPA.random_int(0, k)];
        }
    }while(new RegExp(delimiter,"").test(str));
    return delimiter;
}
SSPA.getRGB = function(color){
    return new Color().getRGB(color).slice(0,3);
}
SSPA.sum = function(array){
    var r = 0;
    SSPA.foreach(array, function(i){
       r += i * 1;
    });
    return r;
}
SSPA.hasContrast = function(background, color){
    var bg = SSPA.sum(SSPA.getRGB(background)),
        cl = SSPA.sum(SSPA.getRGB(color)),
        r = bg <= 255 && cl > 400 || bg > 255 && cl <= 255;
    return SSPA.inArray(background, ['unset', '', 'inherit']) ? true : r;
}
SSPA.contrastColor = function(background){
    var bg = SSPA.getRGB(background),
        cl = SSPA.sum(bg),
        r = cl <= 500 ? '#fff' : '#000';
    return r;
}
SSPA.darker = function(color){
    var reduce = SSPA.getRGB('#444'),
        color = SSPA.getRGB(color),
        res = [];
    for(var i = 0; i < 3; i++){
        res.push(color[i] + reduce[i]);
        if(res[i] > 230){
            res[i] -= Math.floor(reduce[i] * 3);
            res[i] = res[i] < 0 ? 20 : res[i];
        }
    }
    return 'rgb('+res[0]+','+res[1]+','+res[2]+')';
}
if(node_env){
    module.exports = SSPA;
}
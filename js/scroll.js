var SScroll = (function($){
    if(typeof Hammer != 'function'){
        throw new Error("Require Hammer js (jQuery.hammer.js)");
    }
    return function(sel,options){
        var options = $.extend({
            smoothing: 7,
            dryScroll: false,
            scrollBarVisible: true,
            scrollBarAlwayVisible: false,
            scrollBarThinkness: 10,
            scrollBarColor: '#333',
            resistance: 0.8,
            vertical: true,
            touchable: true,
            autoResize: true,
            bounce: true
        }, options);
        var smoothing =  options.smoothing,
            $el = $(sel),
            events = {},
            $this = this,
            resistance = options.resistance,
            datas = [], nbr = 0;
        function init(){
            // console.error('[EL]',sel,$el);
            $el.each(function(){
                var $current = $(this),
                    scrollWidth = $current[0].scrollWidth,
                    count_id = nbr;
                $current.css({
                    position : $current.css('position') == 'absolute' ? 'absolute' : 'relative',
                    overflow : 'hidden'
                });
                if($current.find('.sscroller').length == 0){
                    $current.wrapInner('<div class="sscroller" style="display: block; width: ' + (options.vertical ? '100%' : 'auto') + '; height: ' + (options.vertical ? 'auto' : '100%') + '"></div>');
                }
                var $content = $current.find('.sscroller').eq(0);
                $content.css('overflow', 'hidden');
                $current.append('<span class="sscrollbar"></span>');
                var $scrollbar = $current.find('.sscrollbar');
                $scrollbar.css({
                    'display': options.scrollBarVisible ? 'block' : 'none',
                    position: 'absolute',
                    top: options.vertical ? 0 : 1,
                    right: options.vertical ? 1 : 'unset',
                    left: options.vertical ? 'unset' : 0,
                    width: options.vertical ? options.scrollBarThinkness+'px' : ($current.width() * 0.1)+'px',
                    borderRadius: '2em 1em 1em 2em',
                    height: options.vertical ? ($current.height() * 0.1)+'px' : options.scrollBarThinkness+'px',
                    backgroundColor: options.scrollBarColor
                });
                setDimension(count_id);
                var canDrag = true;
                $current.hammer()
                    .on('dragstart', function(e){
                        if(options.touchable){
                            var direction = e.gesture.direction;
                            e = e.gesture.center;
                            datas[count_id].time.begin = new Date();
                            datas[count_id].start = e[options.vertical ? 'pageY' : 'pageX'];
                            datas[count_id].pageY = datas[count_id].scrollInterval;
                            datas[count_id].wasMoved = false;
                            if(count_id in events && 'scrollstart' in events[count_id]){
                                for(var i in events[count_id].scrollstart){
                                    events[count_id].scrollstart[i]({
                                        scroll : -datas[count_id].pageY,
                                        el : $current,
                                        scrollbar: $scrollbar,
                                        maxScroll: datas[count_id].scrollHeight,
                                        quota: Math.abs(-datas[count_id].pageY / datas[count_id].scrollHeight)
                                    });
                                }
                            }
                            clearTimeout(datas[count_id].timer);
                            clearTimeout(datas[count_id].upt);
                            datas[count_id].$content.css({
                                'transform' : transform(datas[count_id].pageY),
                                'transition-duration' : '0s'
                            });
                            moveScrollbar(datas[count_id].pageY);
                            datas[count_id].finish = datas[count_id].start;
                            canDrag = (options.vertical && ['down', 'up'].indexOf(direction) != -1) ||
                                (!options.vertical && ['left', 'right'].indexOf(direction) != -1);
                        }
                    })
                    .on('drag', function(e){
                        if(canDrag && options.touchable){
                            e.stopPropagation();
                            // e = 'originalEvent' in e ? e.originalEvent : e;
                            e = e.gesture.center;
                            datas[count_id].finish = e[options.vertical ? 'pageY' : 'pageX'];
                            datas[count_id].scrolling = datas[count_id].pageY + datas[count_id].finish - datas[count_id].start;
                            datas[count_id].wasMoved = true;
                            // console.log('[Roll]',datas[count_id].scrolling, '/', datas[count_id].limit, '/',  datas[count_id].scrollHeight, '/', datas[count_id].tt);
                            if(datas[count_id].scrolling > datas[count_id].limit.top || datas[count_id].scrolling < -datas[count_id].limit.bottom){
                                if(datas[count_id].scrolling > datas[count_id].limit.top){
                                    datas[count_id].scrolling = datas[count_id].limit.top + datas[count_id].tt;
                                }
                                if(datas[count_id].scrolling < datas[count_id].limit.bottom){
                                    datas[count_id].scrolling = datas[count_id].limit.bottom - datas[count_id].tt;
                                }
                                if(options.bounce){
                                    datas[count_id].tt += resistance < 0.5 ? 1 - resistance : resistance;
                                }
                            }
                            if(count_id in events && 'scroll' in events[count_id]){
                                for(var i in events[count_id].scroll){
                                    events[count_id].scroll[i]({
                                        scroll : -datas[count_id].scrolling,
                                        el : $current,
                                        scrollbar: $scrollbar,
                                        maxScroll: datas[count_id].scrollHeight,
                                        quota: Math.abs(-datas[count_id].pageY / datas[count_id].scrollHeight)
                                    });
                                }
                            }
                            moveScrollbar(count_id,datas[count_id].scrolling);
                            $content.css({
                                'transform' : transform(datas[count_id].scrolling)
                            });
                        }
                    })
                    .on('dragend', function(e) {
                        e = 'originalEvent' in e ? e.originalEvent : e;
                        if (datas[count_id].wasMoved && options.touchable) {
                            datas[count_id].time.end = new Date();
                            var diff = datas[count_id].time.end.getTime() - datas[count_id].time.begin.getTime(),
                                distance = datas[count_id].finish - datas[count_id].start,
                                velocity = Math.abs(distance) / diff,
                                velocityX = velocity < 0.5 ? velocity : Math.pow(smoothing, velocity),
                                train = distance * velocityX,
                                enlong = true;
                            canDrag = true;
                            datas[count_id].pageY = datas[count_id].scrolling;
                            datas[count_id].tt = 0;
                            datas[count_id].velocity = velocity;
                            var letstrain = datas[count_id].pageY > -datas[count_id].scrollHeight && datas[count_id].pageY < 0 && !options.dryScroll,
                                k = 0;
                            datas[count_id].pageY += letstrain ? train : 0;
                            if (datas[count_id].pageY < -datas[count_id].scrollHeight) {
                                datas[count_id].pageY = -datas[count_id].scrollHeight - (!options.bounce ? 0 : (datas[count_id].wrapper.height * (resistance > 0.5 ? 1 - resistance : resistance)));
                                enlong = false;
                            }
                            if (datas[count_id].pageY > 0) {
                                datas[count_id].pageY = datas[count_id].wrapper.height * (!options.bounce ? 0 : (resistance > 0.5 ? 1 - resistance : resistance));
                                enlong = false;
                            }
                            if (enlong && !options.dryScroll) {
                                diff = diff + diff * velocityX * (velocity < 0.5 ? -1 : 1);
                            }
                            finishScroll(count_id, letstrain, diff);
                            if (letstrain) {
                                $content.css({
                                    'transform': transform(datas[count_id].pageY),
                                    'transition-duration': (diff / 1000) + 's'
                                });
                                datas[count_id].upt = setInterval(function () {
                                    var pY = datas[count_id].pageY > 0 ? 0 : (datas[count_id].pageY < -datas[count_id].scrollHeight ? -datas[count_id].scrollHeight : datas[count_id].pageY);
                                    datas[count_id].scrollInterval = datas[count_id].scrolling + (pY - datas[count_id].scrolling) * k / diff;
                                    k += 7;
                                    if (count_id in events && 'scroll' in events[count_id]) {
                                        for(var i in events[count_id].scroll){
                                            events[count_id].scroll[i]({
                                                scroll: -datas[count_id].scrollInterval,
                                                el: $current,
                                                scrollbar: $scrollbar,
                                                maxScroll: datas[count_id].scrollHeight,
                                                quota: Math.abs(-datas[count_id].scrollInterval / datas[count_id].scrollHeight)
                                            });
                                        }
                                    }
                                    moveScrollbar(count_id, datas[count_id].scrollInterval);
                                    if (k > diff) {
                                        k = diff;
                                    }
                                }, 0);
                            }
                            datas[count_id].finish = 0;
                            datas[count_id].start = 0;
                        }
                    })
                    .on('mousewheel', function(e){
                        e = 'originalEvent' in e ? e.originalEvent : e;
                        if(options.touchable){
                            var scroll = datas[count_id].pageY - e[options.vertical ? 'deltaY' : 'deltaX'];
                            if(count_id in events && 'scroll' in events[count_id]){
                                for(var i in events[count_id].scroll){
                                    events[count_id].scroll[i]({
                                        scroll : -scroll,
                                        el : $current,
                                        scrollbar: $scrollbar,
                                        maxScroll: datas[count_id].scrollHeight,
                                        quota: Math.abs(-scroll / datas[count_id].scrollHeight)
                                    });
                                }
                            }
                            moveScrollbar(count_id, -scroll);
                            scrollTo(count_id,scroll, 0, 0);
                        }
                    })
                $scrollbar.on('touchmove', function(e){
                    // e.stopPropagation();
                    e = 'originalEvent' in e ? e.originalEvent : e;
                    var sc = e.touches[0][options.vertical ? 'pageY' : 'pageX'];
                    if(sc < 0){
                        sc = 0;
                    }
                    if(sc > datas[count_id].wrapper.height + $scrollbar[options.vertical ? 'height' : 'width']()){
                        sc = datas[count_id].wrapper.height + $scrollbar[options.vertical ? 'height' : 'width']();
                    }
                    var scroll = (sc / datas[count_id].wrapper.height) * datas[count_id].scrollHeight;
                    if(count_id in events && 'scroll' in events[count_id]){
                        events[count_id].scroll({
                            scroll : scroll,
                            el : $current,
                            scrollbar: $scrollbar,
                            quota: Math.abs(scroll / datas[count_id].scrollHeight)
                        });
                    }
                    scrollTo(count_id, -scroll, 0, 0);
                    $scrollbar.css({
                        transform : transform(sc)
                    });
                });
                nbr++;
            });
            if(options.autoResize){
                $(window).on('resize', function(){
                    var k = 0;
                    $el.each(function(){
                       setDimension(k, true);
                       k++;
                    });
                });
            }
        }
        init();

        function moveScrollbar(count_id, sc){
            if(!(count_id in datas)){
                return;
            }
            var percent = Math.abs(sc / datas[count_id].scrollHeight) * datas[count_id].wrapper[options.vertical ? 'height' : 'width'];
            datas[count_id].$scrollbar.css({
                transform: transform(percent)
            });
        }

        function transform(e){
            return 'translate3d('+(options.vertical ? '0,' : '')+e+'px, '+(options.vertical ? '' : '0,')+' 0)';
        }

        function finishScroll(count_id, letstrain, diff, time){
            var time = time == undefined || time == null ? 0.4 : 0;
            return new Promise(function(resolve){
                datas[count_id].timer = setTimeout(function(){
                    var scroll = datas[count_id].$content[0].style.transform.replace(/^translate3d\((.+?)(?:px)?,(?: +)?(.+?)px,(?:.+?)\)$/, '$1*$2').split('*');
                    if(scroll.length < 2){
                        scroll = [0,0];
                    }
                    scroll = parseFloat(scroll[options.vertical ? 1 : 0]);
                    if(scroll < -datas[count_id].scrollHeight){
                        var dh = datas[count_id].child[options.vertical ? 'height' : 'width'] - datas[count_id].wrapper[options.vertical ? 'height' : 'width'];
                        datas[count_id].$content.eq(0).css({
                            'transform' : transform(-(dh > 0 ? dh : 0)),
                            'transition-duration' : time+'s'
                        });
                        scroll = -(dh > 0 ? dh : 0);
                    }
                    if(scroll > 0){
                        datas[count_id].$content.eq(0).css({
                            'transform' : transform(0),
                            'transition-duration' : time+'s'
                        });
                        scroll = 0;
                    }
                    setTimeout(function(){
                        clearInterval(datas[count_id].upt);
                        datas[count_id].scrollInterval = scroll;
                        datas[count_id].pageY = scroll;
                        if(count_id in events && 'scrollend' in events[count_id] && datas[count_id].wasMoved){
                            for(var i in events[count_id].scrollend){
                                events[count_id].scrollend[i]({
                                    scroll : -datas[count_id].pageY,
                                    el : datas[count_id].$current,
                                    velocity: datas[count_id].velocity,
                                    distance: datas[count_id].distance,
                                    scrollbar: datas[count_id].$scrollbar,
                                    maxScroll: datas[count_id].scrollHeight,
                                    quota: Math.abs(-datas[count_id].pageY / datas[count_id].scrollHeight)
                                });
                            }
                        }
                        resolve();
                    },time);
                }, letstrain ? diff : 0);
            });
        }

        function setDimension(index, update){
            var update = typeof update == 'undefined' ? false : update,
                $current = $el.eq(index),
                $content = $current.find('.sscroller'),
                wrapper = {
                    width: $current.width(),
                    height: $current.height()
                };
            // console.log('[content]',wrapper, $content);
            if(!options.vertical){
                $content.css('width', $content[0].scrollWidth);
            }
            var child = {
                    width: $content[0].scrollWidth,
                    height: $content[0].scrollHeight
                },
                scrollHeight = child[options.vertical ? 'height' : 'width'] - wrapper[options.vertical ? 'height' : 'width'] > 0 ? child[options.vertical ? 'height' : 'width'] - wrapper[options.vertical ? 'height' : 'width'] : 0,
                $scrollbar = $current.find('.sscrollbar');
            if(options.scrollBarVisible && !options.scrollBarAlwayVisible){
                $scrollbar.css('display', scrollHeight > wrapper.height ? 'inline-block' : 'none');
            }
            datas[index] = {
                time : update ? datas[index].time : {begin: null, end: null},
                start : update ? datas[index].start : 0,
                $current: update ? datas[index].$current : $current,
                $content: update ? datas[index].$content : $content,
                $scrollbar: update ? datas[index].$scrollbar : $scrollbar,
                wrapper: wrapper,
                child: child,
                velocity: update ? datas[index].velocity : 0,
                finish : update ? datas[index].finish : 0,
                timer : update ? datas[index].timer : null,
                scrolling : update ? datas[index].scrolling : 0,
                wasMoved : false,
                scrollHeight : scrollHeight,
                limit : {top: !options.bounce ? 0 : wrapper[options.vertical ? 'height' : 'width'] * (1 - resistance), bottom: !options.bounce ? -scrollHeight : -scrollHeight - wrapper[options.vertical ? 'height' : 'width']  * (resistance >= 0.5 ? 1 - resistance : resistance)},
                pageY : update ? datas[index].pageY : 0,
                tt : update ? datas[index].tt : 0.1,
                scrollInterval : update ? datas[index].scrollInterval : 0,
                upt : update ? datas[index].upt : null
            }
            if(update){
                finishScroll(index, false, 0, 0);
            }
        }

        function scrollTo(index, scroll, time, bounceTime){
            if(index < nbr){
                var letstrain = scroll > -datas[index].scrollHeight && scroll < 0,
                    bounceTime = bounceTime == undefined || bounceTime == null ? 400 : bounceTime;
                datas[index].pageY = scroll;
                datas[index].wasMoved = false;
                finishScroll(index, letstrain, 0, time).then(function(){
                    datas[index].$content.eq(0).css({
                        'transform' : transform(scroll),
                        'transition-duration' : (time / 1000)+'s'
                    });
                });
            }
        }

        this.scrollTo = function(e, time, index){
            var e = typeof e == 'number' ? e : 0,
                index = /^[0-9]+$/.test(index) ? parseInt(index) : 0,
                time = typeof time == 'number' ? time : 400;
            scrollTo(index, -e, time, 400);
        }

        this.length = function(){
            return nbr;
        }

        this.on = function(event, fn, index){
            var event = typeof event == 'string' ? event : '',
                fn = typeof fn == 'function' ? fn : function(){},
                index = /^[0-9]+$/.test(index) ? parseInt(index) : 0;
            if(['scrollstart', 'scroll', 'scrollend'].indexOf(event) != '-1'){
                if(!(index in events)){
                    events[index] = {};
                }
                if(!(event in events[index])){
                    events[index][event] = [];
                }
                events[index][event].push(fn);
            }
            else{
                $el.on(event,fn);
            }
            return this;
        }

        this.update = function(index){
            var index = /^\-?[0-9]+$/.test(index) ? index : 0;
            if(index >= 0){
                setDimension(index,true);
            }
            else{
                for(var i = 0; i < nbr; i++){
                    setDimension(i);
                }
            }
        }

        this.eq = function(e){
            var e = typeof e == 'number' ? parseInt(e) : 0;
            return $el.eq(e);
        }

        this.getScroll = function(index){
            var index = /^\-?[0-9]+$/.test(index) ? index : 0;
            return -datas[index].pageY;
        }

        this.getScrollHeight = function(index){
            var index = /^\-?[0-9]+$/.test(index) ? index : 0;
            return datas[index].child[options.vertical ? 'height' : 'width'];
        }

        this.getMaxScroll = function(index){
            var index = /^\-?[0-9]+$/.test(index) ? index : 0;
            return datas[index].scrollHeight;
        }

        this.getDatas = function(index){
            var index = /^\-?[0-9]+$/.test(index) ? index : 0;
            return datas[index];
        }
    }
})(jQuery||Zepto),
    SSwipe = (function($){
        var activated = [], saved_data = [];
        return function(sel, options){
            var options = $.extend({
                bounce: false,
                vertical: false
            }, options),
            $wrapper = $(sel),
            $this = this,
            datas = [], nbr = 0;

            function setDimension(position){
                var position = /^[0-9]+$/.test(position) ? position : 0;
                datas[position].dimension = {
                    width : datas[position].$wrapper.width(),
                    height: datas[position].$wrapper.height(),
                    total: 0,
                    size : 0
                };
                datas[position].dimension.size = options.vertical ? datas[position].dimension.height : datas[position].dimension.width;
                datas[position].dimension.total = datas[position].dimension.size * datas[position].$wrapper.find('page,.page').length;
            }

            function  trigger(index, position){
                var el = datas[position].$wrapper.find('.sscroller').eq(0)[0].children;
                if(datas[position].activeIndex != index){
                    $(el[datas[position].activeIndex]).trigger('quit');
                    $(el[index]).trigger('view');
                    datas[position].activeIndex = index;
                }
            }

            function update(position){
                var position = /^[0-9]+$/.test(position) ? position : 0;
                setDimension(position);
                var scroller = datas[position].$wrapper.find('.sscroller'),
                    pages = scroller[0].children,
                    page, total = 0;
                for(var i in pages){
                    if(!/^[0-9]+$/.test(i)){
                        break;
                    }
                    page = $(pages[i]);
                    if(page.hasClass('page') || page[0].tagName == 'PAGE'){
                        page.css(options.vertical ? 'height' : 'width', (options.vertical ? datas[position].dimension.height : datas[position].dimension.width)+'px');
                        total++;
                    }
                }
                scroller.css(options.vertical ? 'height' : 'width', ((options.vertical ? datas[position].dimension.height : datas[position].dimension.width) * total)+'px')
                        .css('display', 'inline-flex');
                $this.scrollTo(datas[position].activeIndex,0,position);
            }

            this.on = function(event, fn,position){
                var position = /^[0-9]+$/.test(position) ? position : 0;
                if(['scroll', 'scrollstart', 'scrollend', 'transitionend'].indexOf((event+"").toLowerCase()) != -1){
                    event = event == 'transitionend' ? 'scrollend' : event;
                    datas[position].$el.on(event, function(e){
                        e.index = Math.floor(e.scroll / datas[position].dimension.size);
                        e.viewportSize = datas[position].dimension.size;
                        e.scrollSize = datas[position].dimension.total;
                        fn(e);
                    });
                }
                else{
                    datas[position].$el.on(event, fn);
                }
                return this;
            }

            this.onTransitionEnd = function(fn,position){
                var position = /^[0-9]+$/.test(position) ? position : 0;
                var fn = typeof fn == 'function' ? fn : function(){};
                this.on('scrollend', fn,position);
                return this;
            }

            this.update = function(position){
                var position = /^[0-9]+$/.test(position) ? position : 0;
                update(position);
                datas[position].$el.update();
                return this;
            }

            this.scrollTo = function(index,time,position){
                var position = /^[0-9]+$/.test(position) ? position : 0;
                var index = /^[0-9]+$/.test(index) ? parseInt(index) : 0,
                    time = /^[0-9]+$/.test(time) ? parseInt(time) : datas[position].attr.duration;
                datas[position].$el.scrollTo(index*datas[position].dimension.size,time,position);
                trigger(index,position);
            }

            this.getActiveIndex = function(position){
                var position = /^[0-9]+$/.test(position) ? position : 0;
                return datas[position].activeIndex;
            }

            //INIT
            ;(function(){
                $wrapper.each(function(){
                    var active = false,
                        index = activated.indexOf(this);
                    if(index != -1){
                        active = true;
                    }else{
                        activated.push(this);
                    }
                    var $current = $(this),
                        attr = {
                            touchable: [undefined,null].indexOf($current.attr('data-swipe-touchable')) != -1 ? true : [false,0,'false','0',''].indexOf($current.attr('data-swipe-touchable')) >= 0 ? false : true,
                            duration : /^[0-9]+$/.test($current.attr('data-swipe-duration')) ? parseInt($current.attr('data-swipe-duration')) : 400
                        };
                    // console.log(sel,this);
                    datas[nbr] = active ? saved_data[index] : {
                        $wrapper: $current,
                        activeIndex : 0,
                        attr : attr,
                        dimension : null,
                        $el : new SScroll($current,{
                            dryScroll: true,
                            bounce: options.bounce,
                            vertical: options.vertical,
                            touchable: attr.touchable,
                            autoResize: false,
                            scrollBarVisible: false
                        })
                    };
                    datas[nbr].attr.duration = isNaN(datas[nbr].attr.duration) ? 400 : datas[nbr].attr.duration;
                    update(nbr);
                    datas[nbr].$el.update();
                    saved_data.push(datas[nbr]);
                    if(!active){
                        ;(function(n){
                            datas[n].$el.on('scrollend', function(e){
                                var scroll = e.scroll < 0 ? 0 : e.scroll,
                                    el = Math.floor(scroll / datas[n].dimension.size),
                                    modulo = scroll % datas[n].dimension.size;
                                datas[n].activeIndex = el;
                                datas[n].$el.scrollTo((modulo > datas[n].dimension.size / 2 ? el + 1 : el)*datas[n].dimension.size, datas[n].attr.duration);
                                trigger(el,n);
                            });
                        })(nbr);
                    }
                    nbr++;
                });
            })();
            $(window).on('resize', function(){
                for(var i = 0; i < nbr; i++){
                    update(i);
                }
            });
        }
    })(jQuery || Zepto);

// window.addEventListener('load',function(){
if(typeof SlimJS == 'object'){
    SlimJS.connect('sscroll', {
        tag : 'head-tab',
        callback : function(e){
                // console.log('[E]',e);
                return new SScroll($(e).find('.scrollable'),{
                    bounce : false
                });
            }
        }
    );
    SlimJS.connect('sswipe', {
           tag : 'head-tab',
           callback: function(e) {
                //Swipe page
                // console.log('[e]',e);
               var dom = $(e);
                // e.globals.footbarDesign = SSPA.inArray(e.globals.footbarDesign, ['normal', 'bubble']) ? e.globals.footbarDesign : 'normal';

                function activate(onglet, active) {
                    if (active) {
                        switch (e.globals.footbarDesign) {
                            case "bubble":
                                onglet.addClass('current').addClass('inview').css({
                                    overflow: 'unset'
                                }).find('icon').css({
                                    'background-color': SSPA.contrastColor(e.globals.theme),
                                    'color': e.globals.automaticColor ? e.globals.theme : e.globals.foregroundTheme
                                });
                                break;
                            default:
                                // console.log('[has contrast]', SSPA.hasContrast(e.globals.defaultFootBarBackground, e.globals.theme));
                                var color = SSPA.hasContrast(e.globals.defaultFootBarBackground, e.globals.theme) ? e.globals.theme : SSPA.darker(e.globals.theme);
                                color = e.globals.automaticColor ? color : e.globals.foregroundTheme;
                                onglet.addClass('inview').find('icon').css({
                                    color: color
                                });
                                onglet.find('text').css({
                                    color: color
                                });
                                break;
                        }
                    } else {
                        switch (e.globals.footbarDesign) {
                            case "bubble":
                                onglet.removeClass('current').removeClass('inview').css({
                                    overflow: 'hidden'
                                }).find('icon').css({
                                    'background-color': 'unset',
                                    'color': SSPA.contrastColor(dom.find('footbar head-tab').css('background-color'))
                                });
                                break;
                            default:
                                var color = SSPA.darker(SSPA.contrastColor(e.globals.theme));
                                onglet.removeClass('inview').find('icon').css({
                                    color: color
                                });
                                onglet.find('text').css({
                                    color: color
                                });
                                break;
                        }
                    }
                }

                function reach(index, id) {
                    dom.find('footbar [data-linked="' + id + '"]').each(function () {
                        var onglet = $(this);
                        activate(onglet, onglet.attr('data-index') == index);
                    });
                }

                var swipe = null;
                if (dom.find('.swiper-container').length) {
                    swipe = new SSwipe(dom.find('.swiper-container'));
                    var id = dom.find('.swiper-container').attr('swiper-id'),
                        current = (function () {
                            var r = 0;
                            dom.find('footbar [data-linked="' + id + '"]').each(function () {
                                if ($(this).hasClass('inview')) {
                                    r = parseInt($(this).attr('data-index'));
                                }
                            });
                            return r;
                        })();
                    reach(current, id);

                    dom.find('[data-linked="' + id + '"]').on('tap', function () {
                        var index = parseInt(SSPA.set($(this).attr('data-index'), 0));
                        index = isNaN(index) ? 0 : index;
                        swipe.scrollTo(index, e.globals.animatedSwipe ? undefined : 0);
                        reach(index, id);
                    });
                    swipe.on('scrollend', function (r) {
                        if ('sswitcher' in e.plugins[e.layer.getView()]) {
                            e.plugins[e.layer.getView()].sswitcher.setActive(r.index, e.globals.animatedSwipe ? 400 : 0);
                        }
                        reach(r.index, id);
                    }).on('scroll', function (r) {
                        var transition = r.scroll % r.viewportSize,
                            percent = transition / r.viewportSize;
                        e.plugins[e.layer.getView()].sswitcher.setProgression(r.index, percent);
                    });
                }
                return swipe;
            }
        }
    );
}
// });
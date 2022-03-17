var SMenu = (function($){
    if(typeof Hammer != 'function'){
        throw new Error("Require Hammer js (jQuery.hammer.js)");
    }
    return function(sel, target, options){
        var options = $.extend({
            startRatio: 0.12,
            toggleLimit: 0.5,
            top: 0,
            time: 400,
            bottom: 0
        }, options),
        $over = $(sel),
        $el = null,
        $menu = $(target),
        events = {},
        menuIndex = /^[0-9.]+$/.test($menu.css('z-index')) ? $menu.css('z-index') * 1 : 1,
        // overIndex = /^[0-9.]+$/.test($over.css('z-index')) ? $over.css('z-index') * 1 : 1,
        zIndex = menuIndex,
        touch = {};
        setDimension();
        // zIndex = menuIndex - zIndex > 0 ? menuIndex - 1 : zIndex;
        // zIndex = zIndex <= overIndex ? overIndex + 1 : zIndex;
        $menu.css('z-index', zIndex+1);
        if($over.parent().find('.ssmenu-activator').length == 0){
            $over.before('<div class="ssmenu-activator" style="position: absolute; top: ' + options.top + 'px; bottom: ' + options.bottom + 'px; left: 0; width: ' + touch.draggableArea + 'px; z-index: ' + zIndex + ';"></div>')
        }
        $el = $over.parent().find('.ssmenu-activator');
        function setDimension(update){
            var update = update == undefined ? false : update;
            touch = {
                start: update ? touch.start : 0,
                end : update ? touch.end : 0,
                draggableArea: $over[0].scrollWidth * options.startRatio,
                distance : update ? touch.distance : 0,
                drag: update ? touch.drag : 0,
                canDrag: update ? touch.canDrag : false,
                open: update ? touch.open : false,
                width: $menu[0].scrollWidth
            }
        }
        $(window).on('resize', function (){
            setDimension(true);
            toggle(touch.open, true);
        });
        function drag($this, open){
            var tapped = true, canDrag = true;
            $this.hammer()
            .on('dragstart', function(e){
                touch.start = e.gesture.center.pageX;
                touch.end = touch.start;
                tapped = true;
                canDrag = ['left', 'right'].indexOf(e.gesture.direction) != -1;
                if(touch.start <= touch.draggableArea){
                    touch.canDrag = true;
                }
                if(!open){
                    $this.css({
                        width: '100%',
                        top: '0px',
                        bottom: '0px'
                    })
                }
            })
            .on('drag', function(e){
                var direction = e.gesture.direction;
                // console.log('[direction]',direction);
                tapped = false;
                if(canDrag ){
                    e.stopPropagation();
                    e = e.gesture.center
                    touch.end = e.pageX;
                    touch.distance = touch.drag - touch.end + touch.start;
                    if(-touch.distance > touch.width){
                        touch.distance = -touch.width;
                    }
                    $el.css({
                        'background-color' : 'rgba(0,0,0,'+(0.5 * (-touch.distance / touch.width))+')',
                        'transition-duration' : 0
                    });
                    $menu.css({
                        transform : 'translate3d('+(-touch.distance - touch.width)+'px,0,0)',
                        'transition-duration' : '0s'
                    });
                }
            })
            .on('dragend', function(){
                touch.canDrag = true;
                touch.distance = touch.drag - touch.end + touch.start;
                touch.drag = touch.distance;
                touch.start = 0;
                canDrag = true;
                touch.end = 0;
                if(tapped && !open){
                    $this.trigger('tap');
                    tapped = false;
                }
                else{
                    if(-touch.distance > touch.width * options.toggleLimit){
                        toggle();
                    }
                    else{
                        toggle(false);
                    }
                }
            });
        }
        drag($el, false);
        drag($menu, true);
        $el.on('tap', function(){
            if(touch.open){
                toggle(false);
            }
        });
        function toggle(open, update){
            var open = open == undefined ? true : open,
                update = update == undefined ? false : update;
            touch.distance = !open ? -touch.width : 0;
            touch.drag = open ? -touch.width : 0;
            touch.open = open;
            $el.css({
                width: open ? '100%' : '20px',
                'background-color' : 'rgba(0,0,0,'+(open ? 0.5 : 0)+')',
                top: open ? '0px' : options.top+'px',
                bottom: open ? '0px' : options.bttom+'px'
            });
            setTimeout(function(){
                $el[open ? 'addClass' : 'removeClass']('history-back');
            },update ? 0 : options.time);
            $menu.css({
                transform : 'translate3d('+(touch.distance)+'px,0,0)',
                'transition-duration' : (update ? 0 : options.time / 1000)+'s'
            });
            if(!update){
                setTimeout(function(){
                    if('open' in events && open){
                        for(var i in events.open){
                            events.open[i](touch)
                        }
                    }
                    if('close' in events && !open){
                        for(var i in events.close){
                            events.close[i](touch)
                        }
                    }
                }, options.time);
            }
        }

        this.toggle = function(open){
            var open = open == undefined ? !touch.open : open;
            toggle(open);
        }

        this.isOpen = function(){
            return touch.open;
        }

        this.on = function(event, fn){
            var event = typeof event == 'string' ? event : '',
                fn = typeof fn == 'function' ? fn : function(){};
            if(['open', 'close'].indexOf(event) != '-1'){
                if(!(event in events)){
                    events[event] = [];
                }
                events[event].push(fn);
            }
            else{
                $el.on(event,fn);
            }
            return this;
        }
    }
})(jQuery || Zepto);
window.addEventListener('load',function(){
    if(typeof SSPA_PLUGIN == 'function'){
        new SSPA_PLUGIN('smenu', function(e){
            var menu = null;
            if(e.sspaElement.find('menu.active-menu').length){
                menu = new SMenu(e.layer.dom(), 'sspa menu.active-menu',{
                    top: e.layer.dom().find('appbar head-tab').length ? 100 : 50,
                    bottom: e.layer.dom().find('footbar').length ? 50 : 0
                });
                e.sspaElement.on('click', '.menu-toggler', function(){
                    menu.toggle();
                });
            }
            return menu;
        });
    }
});
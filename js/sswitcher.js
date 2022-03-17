var SSwitcher = (function($){
    if(typeof Hammer != 'function'){
        throw new Error("Require Hammer js (jQuery.hammer.js)");
    }
    if(typeof SScroll != 'function'){
        throw new Error("Require SScroll js");
    }
    return function(sel,options){
        var options = $.extend({
            lineWidth : 'auto',
        }, options);
        var smoothing =  options.smoothing,
            $el = $(sel),
            events = {},
            resistance = options.resistance,
            datas = [], nbr = 0;
        function init(){
            $el.each(function(){
                var $current = $(this),
                    count_id = nbr,
                    $wrapper = $current.find('.slim-link-wrapper'),
                    _time = $current.attr('slim-time-transition') == undefined ? 200 : parseFloat($current.attr('slim-time-transition'));
                datas[count_id] = {};
                console.log('[ATTR]',$wrapper.attr('sswitcher-activation'), _time)
                if($wrapper.attr('sswitcher-activation') == 'false'){
                    return false;
                }
                datas[count_id].scroll = new SScroll($current,{
                    vertical: false,
                    scrollBarVisible: false,
                    bounce: false
                });
                $current.find('.sscoller').css({
                    display: 'inline-flex',
                    flexDirection: 'column'
                });
                datas[count_id].lineWidth = typeof $current.attr('slim-linewidth') == 'undefined' ? options.lineWidth : $current.attr('slim-linewidth');
                var n = 0;
                $wrapper.find('item').each(function(){
                    $(this).attr('data-sswitcher-index', n);
                    n++;
                });
                setDimension(count_id);
                $el.hammer()
                .on('tap', 'item', function(){
                    $current.find('item').removeClass('current');
                    $(this).addClass('current');
                    setLineXY(count_id, _time);
                });
                nbr++;
            });
            $(window).on('resize', function(){
                var k = 0;
                $el.each(function(){
                    setDimension(k, true);
                    k++;
                });
            });
        }
        init();

        function setDimension(index){
            var $current = $el.eq(index),
                $wrapper = $current.find('.slim-link-wrapper'),
                width = $wrapper[0].scrollWidth,
                w = 0,
                $lineWrapper = $current.find('.slim-line-wrapper');
            $wrapper.css('width', width+'px');
            $wrapper.find('item').each(function(){
                w = $(this).offset().left + this.scrollWidth;
            });
            $wrapper.css('width', width+'px')
            $lineWrapper.css('width', width+'px');
            datas[index].scroll.update();
            setLineXY(index);
        }

        function setLineXY(index, time){
            var $current = $el.eq(index),
                time = typeof time == 'number' ? Math.abs(time) : 0,
                $active = $current.find('.slim-link-wrapper item.current'),
                $wrapper = $current.find('.slim-link-wrapper'),
                $line = $current.find('.slim-line');
            $active = $active.length ? $active.eq(0) : $current.find('item').eq(0);
            $active.addClass('current');
            var width = $active[0].offsetWidth,
                middle = $current.width()/2,
                out = $active.position().left + datas[index].scroll.getScroll(),
                tendance = middle - out,
                maxScroll = datas[index].scroll.getMaxScroll(),
                lineWidth = datas[index].lineWidth.toLowerCase() == 'auto' || !/^[0-9]+(\.[0-9]+)?(em|px|vh|vw)?$/.test(datas[index].lineWidth) ? width+'px' : datas[index].lineWidth,
                numericWidth = parseFloat(lineWidth.replace(/^([0-9]+(?:\.[0-9]+)?)(em|px|vh|sp)?$/, '$1')),
                left = $active.offset().left - $wrapper.offset().left + ((width - numericWidth)/2);
            if(tendance < 0){
                if(-tendance < maxScroll){
                    tendance = -tendance;
                }
                else{
                    tendance = maxScroll;
                }
            }
            else{
                tendance = 0;
            }
            datas[index].scroll.scrollTo(tendance, time);
            $line.css({
                position: 'relative',
                width: lineWidth,
                transform: 'translate3d('+left+'px,0,0)',
                'transition-duration': (time/1000)+'s'
            })
        }

        function setActive(el, index,time){
            var $current = $el.eq(index);
            $current.find('.slim-link-wrapper item').removeClass('current');
            $current.find('.slim-link-wrapper item').eq(el).addClass('current');
            if($current[0] == undefined){
                return;
            }
            setLineXY(index,time);
        }

        this.setProgression = function(index, percent, wrapperIndex){
            var index = /^[0-9]+$/.test(index) ? parseInt(index) : 0,
                percent = /^-?[0-9]+(\.[0-9]+)?$/.test(percent) ? parseFloat(percent) : 0,
                wrapperIndex = /^[0-9]+$/.test(wrapperIndex) ? parseInt(wrapperIndex) : 0;
            var $current = $el.eq(wrapperIndex),
                $active = $current.find('.slim-link-wrapper item.current');
            if($active[0] == undefined){
                return;
            }
            var activeIndex = parseInt($active.attr('data-sswitcher-index')),
                index = index == activeIndex && percent > 0 ? index + 1 : index,
                $next = $current.find('.slim-link-wrapper item').eq(index),
                $wrapper = $current.find('.slim-link-wrapper'),
                $line = $current.find('.slim-line'),
                activeWidth =  options.lineWidth.toLowerCase() == 'auto' || !/^[0-9]+(\.[0-9]+)?(em|px|vh|sp)?$/.test(options.lineWidth) ? $active[0].offsetWidth : parseFloat(options.lineWidth.replace(/(em|px|vh|sp)?$/, '')),
                nextWidth = options.lineWidth.toLowerCase() == 'auto' || !/^[0-9]+(\.[0-9]+)?(em|px|vh|sp)?$/.test(options.lineWidth) ? $next[0].offsetWidth : parseFloat(options.lineWidth.replace(/(em|px|vh|sp)?$/, '')),
                activeLeft = $active.offset().left - $wrapper.offset().left + (($active[0].offsetWidth - activeWidth)/2),
                nextLeft = $next.offset().left - $wrapper.offset().left + (($next[0].offsetWidth - nextWidth)/2),
                minWidth = 0, maxWidth = 0, finalWidth = 0,
                minLeft = 0, maxLeft = 0, finalLeft = 0;
            if(activeIndex != index){
                minWidth = index < activeIndex ? nextWidth : activeWidth;
                maxWidth = index > activeIndex ? nextWidth : activeWidth;
                minLeft = index < activeIndex ? nextLeft : activeLeft;
                maxLeft = index > activeIndex ? nextLeft : activeLeft;
                finalWidth = minWidth + (maxWidth - minWidth) * percent;
                finalLeft = minLeft + (maxLeft - minLeft) * percent;
                $line.css({
                    width : finalWidth+'px',
                    transform: 'translate3d('+finalLeft+'px,0,0)',
                    'transition-duration': '0s'
                })
            }
        }

        this.setActive = function(index, time, wrapperIndex){
            var index = /^[0-9]+$/.test(index) ? parseInt(index) : 0,
                time = /^[0-9]+$/.test(time) ? parseInt(time) : 400,
                wrapperIndex = /^[0-9]+$/.test(wrapperIndex) ? parseInt(wrapperIndex) : 0;
            setActive(index,wrapperIndex, time);
        }

        this.triggerTap = function(index, wrapperIndex){
            var index = /^[0-9]+$/.test(index) ? parseInt(index) : 0
                wrapperIndex = /^[0-9]+$/.test(wrapperIndex) ? parseInt(wrapperIndex) : 0;
            $el.eq(wrapperIndex).find('item').eq(index).trigger('tap');
        }

        this.update = function(){
            var k = 0;
            $el.each(function (){
                setDimension(k);
                k++;
            })
        }
    }
})(jQuery||Zepto);
if(typeof SlimJS == 'object'){
    SlimJS.connect('sswitcher', {
            tag: 'head-tab',
            callback : function(e) {
                // console.log('[E]',$(e))
                var t = new SSwitcher($(e));
                // setTimeout(function(){
                //     t.update();
                // },200);
                // return t;
            }
        }
    );
}
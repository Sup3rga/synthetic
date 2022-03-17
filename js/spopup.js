var SPopup = (function($){
    var total = 0;
    return function(cls){
        var $list = $(cls),
            all = {};

        $list.each(function(){
           var $current = $(this),
               name = typeof $current.attr('data-name') != 'undefined' ? $current.attr('data-name') : total+"";
           $current.attr('data-name', name);
           all[name] = $current;
           close(name);
           listen(name);
           total++;
        });

        function close(name){
            var el = all[name];
            if(el == undefined){
                return;
            }
            el.css({
                display: 'none',
                opacity: 0
            });
            el.attr('data-open', false);
        }

        function open(name){
            var el = all[name];
            if(el == undefined){
                return;
            }
            el.css({
                display: 'inline-block',
                opacity: 0
            });
            setTimeout(function(){
                el.css({
                    opacity : 1,
                    transitionDuration: '.4s',
                    transform : 'translate3d(0,0,0)'
                });
            }, 100);
            el.attr('data-open', true);
        }

        function listen(name){
            //Code
        }

        function isOpen(name){
            var el = all[name];
            var open = el == undefined ? false : el.attr('data-open');
            return ['false', 'null', null, false, 0, '0'].indexOf(open) >= 0 ? false : true;
        }

        this.isVisible = function(name){
            return isOpen(name);
        }

        this.toggle = function(name){
            if(isOpen(name)){
                close(name);
            }else{
                open(name);
            }
        }

        this.open = open;

        this.close = close;
    }
})(jQuery || Zepto);
window.addEventListener('load',function(){
    if(typeof SSPA_PLUGIN == 'function'){
        new SSPA_PLUGIN('spopup', function(e){
            var action = new SPopup(e.layer.dom().find('[sspa-popup]'));
            return action;
        })
    }
})
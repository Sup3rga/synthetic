/**
 * @auteur: Superga
 * @version: 1.0.0
 * @description: Synthetic Language Interface Manipulation 
 * @lang: french
 */
var Slim = {};

Slim.SyntheticValue = function(value){
    this.value = value;
    this.toString = function(e){
        return this.value;
    }
}
/**
 * Virtual dom
 */

Slim.Virtual = function(){
    this.rootApp = null;
    /**
     * la fonction element permet
     */ 
    this.element = function(){
        var type,
            props,
            el,
            index = 0,
            children = [];
        for(var i in arguments){
            if(i == 0){
                type = arguments[i];
            }
            else if(i == 1){
                props = arguments[i];
            }
            else {
                el = typeof arguments[i] == 'object' && !(arguments[i] instanceof Slim.SyntheticValue) ? arguments[i] : this.text(arguments[i]);
                el.index = index;
                children.push(el);
                index++;
            }
        }
        if(typeof type != 'string'){
            throw new Error('argument 0 must be a string');
        }
        if(typeof props != 'object'){
            throw new Error('argument 1 must be an object');
        }
        return {
            type: type,
            props: props,
            children: children,
            index: 0
        };
    }

    /**
     * la fonction texte
     */
    this.text = function(text){
        synthetic = text instanceof Slim.SyntheticValue;
        return {
            type: 'SLIM_TEXT',
            synthetic: synthetic ? text : null,
            props: {
            },
            value: synthetic ? text.value : text,
            children: [],
            index: 0
        }
    }

    this.create = function(structure){
        var dom = structure.type == 'SLIM_TEXT' ?
        document.createTextNode(structure.value) :
        document.createElement(structure.type);
    //application des attributs de l'élément
        for(var i in structure.props){
            if(/^on[a-z]+$/.test(i)){
                this.setEvent(dom, i, structure.props[i]);
            }
            else{
                dom[i] = structure.props[i];
            }
        }
        // console.log('[Struct]',dom);
        //application des rendus
        // for(var i in element.children){
        // render(element.children[i], dom);
        // }
        // parent.appendChild(dom);
        return dom;
    }
    /**
     * la fonction render permet de faire le rendu du code
     */
    this.render = function(element,parent){
        if(!parent && !this.rootApp){
            return;
        }
        else if(!parent){
            parent = this.rootApp;
        }
        Slim.watcher.root = {
            dom: parent,
            children: [element],
            old: Slim.watcher.currentRoot
        };
        Slim.watcher.nextTask = Slim.watcher.root;
        Slim.watcher.trash = [];
    }

    this.setEvent = function(element, event, callback, remove){
        remove = remove == undefined ? false : remove;
        event = event.toLowerCase().replace(/^on/, '');
        if(!remove){
            element.addEventListener(event,callback);
        }
        else{
            element.removeEventListener(event,callback);
        }
    }

    this.insertAt = function(index, container, element){
        var nextElement = null;
        for(var i in container.childNodes){
            if(i == index + 1){
                nextElement = container.childNodes[i];
                break;
            }
            else if(i == index && element == container.childNodes[i]){
                nextElement = element;
                inamovible = true;
                break;
            }
        }
        if(nextElement != element){
            container.insertBefore(element,nextElement);
        }
    }

    this.setState = function(){
        // console.log('[Cool !]', this.rootApp, Slim.watcher.currentRoot, Slim.watcher.current);
        this.render(Slim.watcher.currentRoot.children[0], Slim.watcher.currentRoot.dom);
    }
}
/**
 * SCHEDULER
 */
Slim.Scheduler = function(){

    this.nextTask = null;
    this.root = null;
    this.rootApp = null;
    this.currentRoot = null;
    this.stop = false;
    this.trash = [];
    // console.log('[Deadline]',deadline.timeRemaining());
    // requestIdleCallback(scheduler);
    this.executeTask = function(task){
        //Si l'élément n'a pas de composant dom, on en lui crée
        if(!task.dom){
            task.dom = Slim.dom.create(task);
        }
        
        this.compareChild(task, task.children);
        
        // console.warn('[Task]',task);
        //Si l'élément actuel a un enfant, on retourne direct pour le parcourir plustard !
        if('child' in task){
            return task.child;
        }
        //on va remonter pour retrouver les éléments-frères
        while(task){
            if('brother' in task){
                return task.brother;
                // break;
            }
            // console.log('[next]')
            task = task.parent;
        }
        return null;
    }

    this.compareChild = function(wipTask, children){
        var index = 0, element,
            old = wipTask.old && wipTask.old.child,
            sameType, _element,
            brother = null;
        // if(old) console.log('[OLD]', old, children);
        while(index < children.length || old != null){
            element = children[index];
            _element = null;
            sameType = old && element && element.type == old.type;
            // console.log('[TYPE]',element.type, index);
            if(sameType){
                // console.log('[OLD]', old, element);
                _element = {
                    type: element.type,
                    props: element.props,
                    index: index,
                    children: element.children,
                    value: element.value,
                    synthetic: element.synthetic,
                    parent: wipTask,
                    dom: old.dom,
                    old: old,
                    comment: 'update'
                };
            }

            if(element && !sameType){
                _element = {
                    type: element.type,
                    props: element.props,
                    index: index,
                    children: element.children,
                    synthetic: element.synthetic,
                    value: element.value,
                    parent: wipTask,
                    dom: null,
                    old: null,
                    comment: 'insert'
                };
            }
            if(old && !sameType){
                old.comment = 'delete';
                $this.trash.push(old);
            }

            if(old){
                old = old.brother;
            }

            if(index == 0){
                wipTask.child = _element;
            }
            else if(element){
                brother.brother = _element;
            }
            brother = _element;
            index++;
        }
        // console.log('[OLD]',old, children);
    }

    this.commitRoot = function(){
        for(var i in this.trash){
            this.commitTask(this.trash[i]);
        }
        this.commitTask(this.root.child);
        this.currentRoot = this.root;
        this.root = null;
    }

    this.updateDom = function(element, props,values){
        //suppression des anciennes propriétés
        for(var i in props.old){
            if(!(i in props.current)){
                if(/^on[a-z]+$/.test(i)){
                    Slim.dom.setEvent(element, i, props.current[i], true);
                }
                else{
                    element[i] = '';
                }
            }
        }
        //ajout ou modification des propriétés restantes
        for(var i in props.current){
            if(
                props.current[i] != props.old[i] || 
                (props.current[i] instanceof Slim.SyntheticValue)
            ){
                if(/^on[a-z]+$/.test(i)){
                    if(i in props.old){
                        Slim.dom.setEvent(element, i, props.old[i], true);
                    }
                    Slim.dom.setEvent(element, i, props.current[i]);
                }
                else{
                    element[i] = props.current[i] instanceof Slim.SyntheticValue ? props.current[i].value : props.current[i];
                }
            }
        }
        if(values.old != values.current){
            element.nodeValue = values.current;
        }
    }

    this.commitTask = function(task){
        if(!task){
            return;
        }
        if(task.comment == 'insert' && task.dom){
            task.parent.dom.appendChild(task.dom);
        }
        else if(task.comment == 'update'){
            task.value = task.synthetic ? task.synthetic.value : task.value;
            this.updateDom(task.dom, {
                old: task.old.props, 
                current: task.props
            }, {
                old: task.old.value,
                current: task.value
            });
            Slim.dom.insertAt(task.index, task.parent.dom, task.dom);
        }
        else if(task.comment == 'delete'){
            task.parent.dom.removeChild(task.dom);  
            return;
        }
        this.commitTask(task.child);
        this.commitTask(task.brother);
    }

    var $this = this;
    function clock(deadline){
        $this.stop = false;
        while($this.nextTask && !$this.stop){
            $this.nextTask = $this.executeTask($this.nextTask);
            $this.stop = deadline.timeRemaining() < 1;
        }
        if(!$this.nextTask && $this.root){
            $this.commitRoot();
        }
        requestIdleCallback(clock);
    }
    requestIdleCallback(clock);
}

Slim.dom = new Slim.Virtual();
Slim.watcher = new Slim.Scheduler();
/**
 * Exportation
 */
if(typeof module == 'object' && 'exports' in module){
    module.exports = Slim;
}
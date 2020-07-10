

class splitInput{
    tryIfValid(Char){
        // can be overwritten in constructor

        //only single chars
        if(Char.length > 1) return false;

        // numeric alpha or alphanumeric
        if(this.numeric)
            return '1234567890'.includes(Char);
        else if(this.alpha)
            return /^[a-zA-Z]+$/.test(Char);

        return '1234567890'.includes(Char) || /^[a-zA-Z]+$/.test(Char);
    }

    isValid(text){
        // can be overwritten in constructor
        for(let i=0;i < text.length;i++){
            if(!this.tryIfValid(text[i])){
                return false;
            }
        }
        return true;
    }

    updateValues(){
        for(let i = 0; i < this.boxes.length; i++){
            this.boxes[i].value = this._value[i];
        }
    }

    keydown($event){
        if($event.ctrlKey || $event.metaKey) return setTimeout( () => this.updateValues(),0);

        let index = $event.target.splitInput.index;
        if(this.tryIfValid($event.key))  this._value[index] = $event.key;

        if ($event.key === 'Backspace') {
            if(this._value[index].length === 0) {
                setTimeout( () => this.setFocus(-1,index),0);
            }
            this._value[index] = '';
        }

        setTimeout( () => this.updateValues(),0);
    }

    setFocus(n,index){
        if(index + n >= 0 && index + n < this.count ){
            this.boxes[index + n].focus();
        }
    }

    paste($event){
        let index = $event.target.splitInput.index;
        let paste = (event.clipboardData || window.clipboardData).getData('text');
        $event.target.blur();

        if( paste.length !== this.count || !this.isValid(paste)) return;

        for(let i=0;i < this.count;i++){
            this._value[i] = paste[i];
            this.boxes[i].value = paste[i];
        }
    }

    keyup($event){
        let index = $event.target.splitInput.index;
        setTimeout( () => this.updateValues(),0);
        if($event.ctrlKey || $event.metaKey || $event.key === 'Backspace') return;

        if($event.key === 'ArrowLeft')    return this.setFocus(-1,index);
        if($event.key === 'ArrowRight')   return this.setFocus(1,index);

        if(this._value[index].length > 0) return this.setFocus(1,index);
    }

    constructor(root,charValidator,pasteValidator){
        if(!window.splitInputsStylesAdded){
            document.head.prepend(splitInputs.getStyles());
            window.splitInputsStylesAdded = true;
        }
        this.root = root;
        this.root.splitInput = this;

        if(charValidator && typeof charValidator === 'function'){
            this.tryIfValid = charValidator;
        }

        if(pasteValidator && typeof pasteValidator === 'function'){
            this.isValid = pasteValidator;
        }

        this.type = this.root.getAttribute('type')

        this.alpha = this.type === 'alpha';
        this.numeric = this.type === 'numeric';
        this.alphanumeric = this.type === 'alphanumeric' || (!this.alpha && !this.numeric);

        this.boxes = this.root.querySelectorAll('input');
        this.count = this.boxes.length;
        if(!this.count){
            //input boxes are not defined, so we must generate
            this.count = parseInt(this.root.getAttribute('count')) || 4;
            this.boxes = [];
            for(let i = 0 ;i< this.count; i++){
                let inpTemp = document.createElement('input');
                inpTemp.type = this.numeric ? 'tel' : 'text';
                this.boxes.push(inpTemp);
                this.root.appendChild(inpTemp);
            }
        }

        this._value = [];
        for(let i = 0; i < this.boxes.length; i++){
            this._value.push(this.boxes[i].value);
            this.boxes[i].splitInput = { index : i };
            this.boxes[i].addEventListener('keyup',(...arg)=>this.keyup(...arg));
            this.boxes[i].addEventListener('keydown',(...arg)=>this.keydown(...arg));
            this.boxes[i].addEventListener('paste',(...arg)=>this.paste(...arg))
        }
    }
}

class splitInputCustomElement extends HTMLElement {
    cloneStyles(){
       this.shadow.prepend(splitInputs.getStyles());
       let styles = document.querySelectorAll('style[split-input] ');
       for(let i =0 ; i < styles.length ; i++){
           this.shadow.prepend(styles[i].cloneNode(true));
       }
    }
    connectedCallback() {
        this.shadow.innerHTML = this.innerHTML;
        this.innerHTML = '';
        this.cloneStyles();
        new splitInput(this.shadow,this.charValidator,this.pasteValidator);
    }
    constructor(charValidator,pasteValidator){
        super();
        this.charValidator = charValidator;
        this.pasteValidator = pasteValidator;
        this.shadow = this.attachShadow({mode: 'open'});
        this.shadow.getAttribute = (...args) => this.getAttribute(...args);
        this.shadow.setAttribute = (...args) => this.setAttribute(...args);
    }
}

class splitInputs {

    static getStyles(){
        let componentStyles = document.createElement('link');
        componentStyles.rel = 'stylesheet';
        componentStyles.type = 'text/css';
        componentStyles.href = './split-inputs.css';
        return componentStyles;
    }

    static init(options = {}){
        if(!options.disableCE && window.customElements){
            window.customElements.define('split-input', splitInputCustomElement);
        } else {
            window.splitInputsStylesAdded = false;
            let parents = document.querySelectorAll('split-input');

            for(let i = 0; i < parents.length; i++){
                new splitInput(parents[i])
            }
        }
    }

}
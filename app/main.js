import EasyMvvm from 'easyMvvm'
import './index.css'

let i = 0

new EasyMvvm({
    el: '#app',
    template: `
                  <div>
                    <h1 e-for="item in items">this is {{item}} {{++item}}</h1>
                    <p>{{msg}}</p>
                    <p>{{msg1}}</p>
                    <button @click=change>change</button>
                    <input @input=input />
                  </div>
                `,
    created() {
        this.msg1 = '我在created时被改变了'
    },         
    mounted() {
       setTimeout(() => {
           this.msg1 = '我在mounted时被改变了'
       }, 1000);
    },
    data: {
        msg: 'easy-mvvm',
        msg1: 'easy-local',
        msg2: 'hello world',
        items: [1,2,3], 
        flag: true
    },
    methods: {
        change() {
            this.items = [i++, i++, i++]
        },
        input(e) {
            this.msg1 = e.target.value
        }
    },
})

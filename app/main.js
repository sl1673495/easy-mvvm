import EasyMvvm from 'easyMvvm'
import './index.css'

let i = 0

new EasyMvvm({
    el: '#app',
    template: `
                  <div>
                    <h1>this is {{msg}}</h1>
                    <p>{{flag ? msg2 : msg1  }}</p>
                    <button @click=change>change</button>
                    <input @input=input />
                  </div>
                `,
    data: {
        msg: 'easy-mvvm',
        msg2: 'hello world',
        flag: true
    },
    methods: {
        change() {
            this.msg = 'hello'
            this.msg2 = 'data is changed!!' + (++i)
        },
        input(e) {
            this.msg = e.target.value
        }
    },
})

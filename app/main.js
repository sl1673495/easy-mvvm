import EasyMvvm from 'easyMvvm'
import './index.css'

const data = {
    msg: 'easy-mvvm',
    msg2: 'hello world'
}

let i = 0

const methods = {
    change() {
        data.msg = 'hello'
        data.msg2 = 'data is changed!!' + (++i)
    },
}

new EasyMvvm({
    el: '#app',
    template: `
                  <div>
                    <h1>this is {{msg}}</h1>
                    <p>{{  msg2  }}</p>
                    <button @click=change>change</button>
                  </div>
                `,
    methods,
    data
})

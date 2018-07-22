import EasyMvvm from 'easyMvvm'
import './index.css'

let i = 0

new EasyMvvm({
    el: '#app',
    template: `
                  <div>
                    <h2>e-for="item in items"</h2>
                    <p e-for="item in items">
                        <button e-bind-click=change(item)>{{item}} items数组中的项</button>
                    </p>
                    <h2>msg</h2>
                    <p>{{msg}}</p>
                    <h2>msg1</h2>
                    <p>{{msg1}}</p>
                    <h2>computed(msg + msg1)</h2>
                    <p>{{sum}}</p>
                    <input e-bind-input="input" placeholder="改变msg1的内容" />
                  </div>
                `,
    created() {
        this.msg1 = '我在created时被改变了'
    },
    computed: {
        sum() {
            return this.msg + this.msg1
        }
    },
    mounted() {
       setTimeout(() => {
           this.msg1 = '我在mounted时被改变了(延迟是因为定时器演示效果)'
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
        change(item) {
            console.log(item)
            this.msg1 = 'data is changed!!' + (++i)
            setTimeout(() => {
                this.msg2 = 'change async'
            }, 1000)
            this.items = [i++, i++, i++]
        },
        input(e) {
            console.log(e.target.value)
            this.msg1 = e.target.value
            console.log(this.msg1)
        }
    },
})

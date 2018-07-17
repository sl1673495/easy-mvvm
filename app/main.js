import EasyMvvm from 'easyMvvm'

const data = {
    msg: 'hello pm',
    msg2: 'hello world'
}

let i = 0

const methods = {
    change() {
        data.msg = 'data is changed!!' + (++i)
    }
}

new EasyMvvm({
    el: '#app',
    template: `
                  <div>
                    <p>
                        <span>this is proxy-mvvm</span>
                        <span>this is</span>
                        <p>
                         {{msg2}}
                        </p>
                    </p>
                    <p>{{msg}}嘎嘎{{msg2}}</p>
                    <button @click=change>change</button>
                  </div>
                `,
    methods,
    data
})

import EasyMvvm from 'easyMvvm'


const methods = {
    change() {
        data.msg = Math.random()
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
    data: {
        msg: 'hello pm',
        msg2: 'hello world'
    },
})

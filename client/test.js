var osu = require('node-os-utils')
var mem = osu.mem
var cpu = osu.cpu


function run() {


    let date = new Date().toLocaleDateString().replaceAll('/','-')
    console.log(date)

    // cpu.free()
    //     .then(info => {
    //         console.log('CPU: ',info)
    //     })

    // mem.info()
    //     .then(info => {
    //         console.log('RAM: ', info)
    //     })
}

run()

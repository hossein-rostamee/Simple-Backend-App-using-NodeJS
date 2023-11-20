const { createServer } = require ( 'http' )
const makeId = require ( './makeId' )
const Cookies = require ( 'cookies' )

const db = {
    users: [
        {
            id: makeId (), username: "gholam", password: '123456',
            data: {
                fname: "Gholam", lname: "Gholami",
                contacts: [ 'akbar', 'asghar', 'soghra' ]
            }
        },
        {
            id: makeId (), username: "asghar", password: '123456',
            data: {
                fname: "Asghar", lname: "Asghari",
                contacts: [ 'yaser', 'jasem', 'kazem' ]
            }
        },
        {
            id: makeId (), username: "akbar", password: '123456',
            data: {
                fname: "Akbar", lname: "Akbari",
                contacts: [ 'begoosham' ]
            }
        }
    ]
}


const sessionIds = {}


function handleSid ( id ) {
    for ( let key in sessionIds )
        if ( sessionIds [ key ] === id )
            return key
    let isR = false
    let sid
    do { 
        sid = Math.random ()
        for ( let key in sessionIds )
            if ( key === sid )
                isR = true
    } while ( isR )
    sessionIds [ sid ] = id
    return sid.toString ()
}



function getCurrentUser ( cookies ) {
    const userId = sessionIds [ cookies.get ( 'sid' ) ]
    if ( ! userId )
        return false
    const user = db.users.filter ( u => u.id == userId ) [ 0 ]
    if ( ! user )
        return false
    return user
} 


const routeHandlers = {
    login: ( req, res, urlParts, cookies ) => {
        const [ username, password ] = urlParts
        const user = db.users.filter ( u => u.username === username && u.password === password ) [ 0 ]
        if ( ! user ) {
            res.end ( 'Invalid username or password!' )
            return
        }
        const sid = handleSid ( user.id )
        cookies.set ( 'sid', sid )
        res.end ( `Silam ${ user.data.fname } ${ user.data.lname }!` )
        return true
    },
    contacts: ( req, res, urlParts, cookies ) => {
        const user = getCurrentUser ( cookies )
        if ( ! user ) {
            res.end ( "You are not permitted to perform this action!" )
            return
        }
        const html = `
            <html>
                <head>
                    <title>Contacts</title>
                    <style>
                        h1 {
                            color: green;
                        }
                    </style>
                </head>
                <body>
                    <h1>Silam ${ user.data.fname } ${ user.data.lname }.</h1>
                    <h3>Your Contacts:</h3>
                    <ul>
                        ${ user.data.contacts.map ( contact => `
                            <li>${ contact }</li>
                        ` ).join ( '' ) }
                    </ul>
                </body>
            </html>
        `
        res.end ( html )
    },
    add: ( req, res, urlParts, cookies ) => {
        const user = getCurrentUser ( cookies )
        if ( ! user ) {
            res.end ( "You are not permitted to perform this action!" )
            return
        }
        const [ newContact ] = urlParts
        user.data.contacts.push ( newContact )
        res.end ( 'ok' )
    }
}


const server = createServer ( ( req, res ) => {
    const [ , routeName, ...routeParts ] = req.url.split ( '/' )
    const routeHandler = routeHandlers [ routeName ]
    if ( typeof routeHandler !== 'function' ) {
        res.end ( "Invalid Route!" )
        return
    }
    const cookies = new Cookies ( req, res )
    routeHandler ( req, res, routeParts, cookies )
} )
server.listen ( 4000 )

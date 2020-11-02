const express = require('express');
const hbs = require('express-handlebars');
const mysql = require('mysql2/promise');

// SQL
const SQL_FIND_BY_NAME = 'select * from apps where name like ? limit ?'

const app = express();
const pool = mysql.createPool({
        host: process.env.HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 3306,
        database: process.env.DB_NAME || 'playstore',
        user: process.env.DB_USER,
        password: process.env.DB_PWD,
        connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT),
        timezone: '+8:00'

})

const startApp = async (app, pool) =>{

    try {
        // acquire a connection from the connection pool
        const conn = await pool.getConnection();

        console.log('Pinging database...')
        await conn.ping()

        // release the connection
        conn.release()

        app.listen(PORT, ()=>{
            console.log(`The server is running on port: ${PORT} - ${new Date}`);
        })

    } catch(e) {
        console.error('cannot ping database: ', e)
    }
}

app.engine('hbs', hbs({defaultLayout: 'default.hbs'}));
app.set('view engine', 'hbs');

const PORT = parseInt(process.argv[2]) || parseInt(process.env.PORT) || 3000;

app.get('/', (req, res)=>{
    res.status(200);
    res.type('text/html');
    res.render('index');
})

app.get('/search', async (req, res)=>{

    const q = req.query.search;

    // acquire a connection from the pool
    const conn = await pool.getConnection();

    try {
        // perform the query
        // select * from apps wherename like ? limit ?
        const result = await conn.query(SQL_FIND_BY_NAME, [ `%${q}%`, 100 ])
        const records = result[0]

        console.log(records);

        res.status(200);
        res.type('text/html');
        res.render('result', {
            display: records
        });

    } catch(e) {
    } finally {
        // release the connection
        conn.release()
    }
})

app.use(
    express.static(__dirname + '/public')
)

startApp(app, pool);
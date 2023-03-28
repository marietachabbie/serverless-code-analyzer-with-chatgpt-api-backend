const Pool = require('pg-pool');

class DBConnectionManager {
    constructor() {
        this.dbConnectionsPool = new Pool({
            host: process.env.DB_HOST,
            user: process.env.DB_USERNAME,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_DATABASE_NAME,
            port: process.env.DB_PORT,
            ssl: { rejectUnauthorized: false },
            connectionTimeoutMillis: 50000,
            idleTimeoutMillis: 1000,
            max: 30,
        });
    }

    query(sql, values) {
        return new Promise((resolve, reject) => {
            this.dbConnectionsPool.query(sql, values)
                .then(result => {
                    resolve(result.rows);
                })
                .catch(err => {
                    reject(err);
                });
        });
    }

    insertMap(table, map, client = this) {
        const fields = [ 'created_at' ];
        const vals = [ new Date() ];
        const params = [ "$1" ];
        let i = 2;
        for (const key in map) {
            fields.push('"' + key + '"');
            params.push("$" + i++);
            vals.push(map[key]);
        }
        const query = `INSERT INTO ${table}(${fields.join(",")}) values(${params.join(",")})`;
        return client.query(query, vals);
    }

    updateMap(table, map, condition, client = this) {
        const fields = [ 'updated_at = $1' ];
        const vals = [ new Date() ];
        let i = 2;
        for (const key in map) {
            fields.push(`${key} = $${i++}`);
            vals.push(map[key]);
        }
        let query = `UPDATE ${table} SET ${fields.join(',')}`;
        if (condition) {
            query += ' WHERE ' + condition;
        }

        return client.query(query, vals);
    }
}

module.exports = DBConnectionManager;

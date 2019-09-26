import { Neo4jDriver, TransactionTypes } from "../base/driver";

import * as csv from "fast-csv";
import { createReadStream } from "fs";

import * as config from "../config";

const file = config.filename;

interface BankAccount {
    name: string; // bank -  ACCT: account
    bank: string;
    account: string;
}

interface Entity {
    name: string;
}

const load = async () => {
    await Neo4jDriver.Instance.openSession(TransactionTypes.WRITE);

    await Neo4jDriver.Instance.openTransaction();
    let query = `CREATE CONSTRAINT ON (n:Entity) ASSERT n.name IS UNIQUE`;
    await Neo4jDriver.Instance.runQuery(query, {});
    await Neo4jDriver.Instance.commitTransaction();

    const readStream = createReadStream(file)
    .pipe(csv.parse({ headers: true }));

    for await (const row of readStream) {

        await Neo4jDriver.Instance.openTransaction();
        query =
        `MATCH  ` +
        `RETURN `;
        const result = await Neo4jDriver.Instance.runQuery(query, row);
        if (!result.records.length) {
            query = ``;
            await Neo4jDriver.Instance.runQuery(query, row);
        }

        await Neo4jDriver.Instance.commitTransaction();
    }

    await Neo4jDriver.Instance.closeSession();
};

load()
.then(() => {
    console.log("IMPORT FINISHED.");
    process.exit(0);
})
.catch((err) => {
    console.log(err);
    process.exit(-1);
});
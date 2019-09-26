import { Neo4jDriver, TransactionTypes } from "../base/driver";

const map = async () => {
    await Neo4jDriver.Instance.openSession(TransactionTypes.WRITE);
    await Neo4jDriver.Instance.openTransaction();
    let query =
    `MATCH (n:Entity) ` +
    `WITH ` +
    `n, ` +
    `split(n.name, "") AS n_arr ` +
    `WITH ` +
    `n, ` +
    `n_arr[0] AS f, ` +
    `n_arr[1] AS s, ` +
    `n_arr[2] AS t ` +
    ``;
    await Neo4jDriver.Instance.runQuery(query, {});
    query = `CREATE CONSTRAINT ON (n:Entity) ASSERT n.id IS UNIQUE`;
    await Neo4jDriver.Instance.runQuery(query, {});
    query = `CREATE CONSTRAINT ON (n:BankAccount) ASSERT n.id IS UNIQUE`;
    await Neo4jDriver.Instance.runQuery(query, {});
    await Neo4jDriver.Instance.commitTransaction();
    await Neo4jDriver.Instance.closeSession();
};

map()
.then(() => {
    console.log("MAP FINISHED.");
    process.exit(0);
})
.catch((err) => {
    console.log(err);
    process.exit(-1);
});
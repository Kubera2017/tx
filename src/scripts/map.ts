import { Neo4jDriver, TransactionTypes } from "../base/driver";

const map = async () => {
    await Neo4jDriver.Instance.openSession(TransactionTypes.READ);
    const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789 ".toUpperCase().split("");
    for (let i = 0; i < alphabet.length; i++) {
        for (let j = 0; j < alphabet.length; j++) {
            for (let k = 0; k < alphabet.length; k++) {
                const f = alphabet[i], s = alphabet[j], t = alphabet[k];
                await Neo4jDriver.Instance.openTransaction();
                const q = `MATCH (n:Entity)
                WITH
                n,
                split(n.name, "") AS n_arr
                WITH
                n,
                n_arr[0] AS f,
                n_arr[1] AS s,
                n_arr[2] AS t
                where
                f = $f AND s = $s AND t = $t
                WITH
                return count(n) AS count`;
                const result = await Neo4jDriver.Instance.runQuery(q, {f: f, s: s, t: t});
                const count = result.records[0].get("count").low;
                console.log(`${f}${s}${t}`, count);
                await Neo4jDriver.Instance.commitTransaction();
            }
        }
    }
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
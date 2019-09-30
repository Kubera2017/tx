import { Neo4jDriver, TransactionTypes } from "../base/driver";

const resolveAccounts = async () => {
    await Neo4jDriver.Instance.openSession(TransactionTypes.WRITE);
    await Neo4jDriver.Instance.openTransaction();
    let q =
    `MATCH (n:BankAccount)
    WITH n.account AS account, collect(id(n)) AS twins
    WITH account, twins, size(twins) AS s
    WHERE s > 1
    RETURN twins`;
    let result = await Neo4jDriver.Instance.runQuery(q, {});
    console.log(result.records.length);
    for (let i = 0; i < result.records.length; i++) {
        const twins = result.records[i].get("twins").map((twin: any) => twin.low);
        // console.log(twins);
        q =
        `MATCH (n) WHERE id(n) IN $list
        WITH collect(n) AS list
        UNWIND list AS n1
        UNWIND list AS n2
        WITH n1, n2
        WHERE id(n1) > id(n2)
        WITH n1, n2, apoc.text.sorensenDiceSimilarity(n1.bank, n2.bank) as score
        WHERE score > 0.7
        MERGE (n1)-[:SIMILAR_TO]-(n2)`;
        await Neo4jDriver.Instance.runQuery(q, {list: twins});
    }

    q =
    `CALL algo.louvain.stream('BankAccount', 'SIMILAR_TO', {})
    YIELD nodeId, community
    WITH algo.getNodeById(nodeId) AS member, community
    MERGE (c:BankAccountCommunity {id: community})
    MERGE (c)-[:COMMUNITY_MEMBER]->(member)`;
    await Neo4jDriver.Instance.runQuery(q, {});

    await Neo4jDriver.Instance.commitTransaction();
    await Neo4jDriver.Instance.closeSession();
};

resolveAccounts()
.then(() => {
    console.log("FINISHED.");
    process.exit(0);
})
.catch((err) => {
    console.log(err);
    process.exit(-1);
});
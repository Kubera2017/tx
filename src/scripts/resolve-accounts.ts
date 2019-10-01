import { Neo4jDriver, TransactionTypes } from "../base/driver";

const resolveAccounts = async () => {
    await Neo4jDriver.Instance.openSession(TransactionTypes.WRITE);

    await Neo4jDriver.Instance.openTransaction();
    let q =
    `MATCH (n:BankAccount)
    WHERE NOT n.account IS NULL
    WITH n.account AS account, collect(id(n)) AS dups
    WITH account, dups, size(dups) AS s
    WHERE s > 1
    RETURN dups`;
    const result = await Neo4jDriver.Instance.runQuery(q, {});
    console.log("Total groups:", result.records.length);
    await Neo4jDriver.Instance.commitTransaction();

    for (let i = 0; i < result.records.length; i++) {

        await Neo4jDriver.Instance.openTransaction();

        const dups = result.records[i].get("dups");
        console.log(`Group ${i} Members: ${dups.length}`);
        const temp_label = `POTENTIAL_DUP_ACC_GROUP_${i}`;

        q =
        `MATCH (n) WHERE id(n) IN $list
        WITH collect(n) AS list
        CALL apoc.create.addLabels(list, ["${temp_label}"]) YIELD node
        WITH collect(node) AS list
        UNWIND list AS n1
        UNWIND list AS n2
        WITH n1, n2
        WHERE id(n1) > id(n2)
        WITH n1, n2,
        apoc.text.sorensenDiceSimilarity(n1.bank, n2.bank) as sorensenScore
        WHERE sorensenScore > 0.7
        MERGE (n1)-[:SIMILAR_TO]-(n2)`;
        await Neo4jDriver.Instance.runQuery(q, {list: dups});
        await Neo4jDriver.Instance.commitTransaction();

        await Neo4jDriver.Instance.openTransaction();
        q =
        `CALL algo.louvain.stream($temp_label, 'SIMILAR_TO', {})
        YIELD nodeId, community
        WITH algo.getNodeById(nodeId) AS member, community
        MERGE (c:BankAccountCommunity {id: toString(${i}) + "_" + toString(community)})
        MERGE (c)-[:COMMUNITY_MEMBER]->(member)
        `;
        await Neo4jDriver.Instance.runQuery(q, {temp_label: temp_label});
        await Neo4jDriver.Instance.commitTransaction();

        await Neo4jDriver.Instance.openTransaction();
        q =
        `MATCH (n) WHERE id(n) IN $list
        WITH collect(n) AS list
        CALL apoc.create.removeLabels(list, ["${temp_label}"]) YIELD node`;
        await Neo4jDriver.Instance.runQuery(q, {list: dups});
        await Neo4jDriver.Instance.commitTransaction();

        console.log(`DONE ${i}/${result.records.length}`);
    }
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
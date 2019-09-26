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

interface CsvRow {
    m: string;
    n: string;
    r: string;
}

interface Node {
    id: number;
    labels: Array<string>;
    properties: any;
}

const getNode = (nodeDesc: string): Node => {
    const node_id_rx = nodeDesc.match(/(?<=id=).*?(?=\slabels=)/gs);
    if (!node_id_rx) throw new Error();

    const node_labels_rx1 = nodeDesc.match(/(?<=labels={).*?(?=}\sproperties={)/gs);
    if (!node_labels_rx1) throw new Error();
    const node_labels_rx2 = node_labels_rx1[0].match(/(?<=').*?(?=')/gs);
    if (!node_labels_rx2) throw new Error();

    const node_props_rx1 = nodeDesc.match(/(?<=properties=).*?(?=>)/gs);
    if (!node_props_rx1) throw new Error();
    const propStr = node_props_rx1[0].replace(/\'/g, '"');

    const node: Node = {
        id: parseInt(node_id_rx[0], 10),
        labels: node_labels_rx2.filter((item, index) => index % 2 === 0),
        properties: JSON.parse(propStr),
    };

    return node;
};

const load = async () => {
    await Neo4jDriver.Instance.openSession(TransactionTypes.WRITE);
    await Neo4jDriver.Instance.openTransaction();
    let query = `CREATE CONSTRAINT ON (n:Entity) ASSERT n.name IS UNIQUE`;
    await Neo4jDriver.Instance.runQuery(query, {});
    query = `CREATE CONSTRAINT ON (n:Entity) ASSERT n.id IS UNIQUE`;
    await Neo4jDriver.Instance.runQuery(query, {});
    query = `CREATE CONSTRAINT ON (n:BankAccount) ASSERT n.id IS UNIQUE`;
    await Neo4jDriver.Instance.runQuery(query, {});
    await Neo4jDriver.Instance.commitTransaction();
    await Neo4jDriver.Instance.closeSession();

    await Neo4jDriver.Instance.openSession(TransactionTypes.WRITE);
    const readStream = createReadStream(file)
    .pipe(csv.parse({ headers: true }));

    let i = 0;
    let j = 1;
    const counter = 1000;
    const limit = 10;
    for await (const row of readStream) {
        i++;
        // if (i > limit) break;
        if (i > j * counter) {
            console.log(i);
            j++;
        }
        await Neo4jDriver.Instance.openTransaction();
        const entry = <CsvRow> row;

        const node1 = getNode(entry.m);

        const node2 = getNode(entry.n);

        const createOrSkip = async (n: Node): Promise<void> => {
            let q = "";
            if (n.labels.find(str => str === "Entity"))
            q =
            `MATCH (n) WHERE n:Entity AND n.id = $id ` +
            `RETURN n`;
            else
            q =
            `MATCH (n) WHERE n:BankAccount AND n.id = $id ` +
            `RETURN n`;
            const result = await Neo4jDriver.Instance.runQuery(q, n);
            if (!result.records.length) {
                const labs = n.labels.map(str => ":" + str).join("");
                q =
                `CREATE (n${labs} {id: toInt($id)}) `;
                const props: object = n.properties;

                for (const key in props) {
                    if (props.hasOwnProperty(key)) {
                        q +=
                        `SET n.${key} = "${n.properties[key]}" `;
                    }
                }
                await Neo4jDriver.Instance.runQuery(q, n);
            }
        };
        await createOrSkip(node1);
        await createOrSkip(node2);
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
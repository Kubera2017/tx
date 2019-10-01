1. Install Node.js

2. Clone the repository
```
git clone https://github.com/Kubera2017/tx.git
```

3. Install dependencies:
```
cd tx
npm i
```

4. Change Neo4j connection settings in:
```
/src/config.ts
```

5. Build
```
cd tx
npm run build
```

5. Run script
```
cd tx
npm run resolve-accounts
```

6. After the script has finished, you are able to observe duplicates:
```
MATCH (n:BankAccountCommunity)-[]-(m) return n, m LIMIT 1000
```
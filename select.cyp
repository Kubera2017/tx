MATCH (n:Entity) 
WITH 
n, 
split(n.name, "") AS n_arr
WITH 
n,
n_arr[0] AS f,
n_arr[1] AS s,
n_arr[2] AS t
where
f = "B" AND s = "A" AND t = "N"
WITH collect(n) AS a
UNWIND a AS A
UNWIND a AS B
WITH A, B
WHERE id(A) > id(B)
WITH
A, B, apoc.text.sorensenDiceSimilarity(A.name, B.name) as sorensenDS
WHERE sorensenDS > 0.8
WITH {name: A.name, id: A.id} + collect({name: B.name, id: B.id}) AS twins
return DISTINCT twins
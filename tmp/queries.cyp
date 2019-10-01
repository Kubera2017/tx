PROFILE 
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
return n.name limit 30
WITH n,
"FIRST_" + substring(n.name, 1, 1) AS f,
"SECOND_" + substring(n.name, 2, 2) AS s,
"THIRD_" + substring(n.name, 3, 3) AS t
where 
return * limit 50
CALL apoc.create.addLabels([ id(n) ], [ f, s, t ]) yield node

WITH ["A", "B", "C"] AS letters
UNWIND letters AS f
WITH letters, f
UNWIND letters AS s
WITH letters, f, s
UNWIND letters AS t
MATCH (n:Entity)
WHERE


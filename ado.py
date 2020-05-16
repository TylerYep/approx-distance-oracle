"""
This contains the pseudocode for the ADO that I got while reading the paper.
It should resemble the paper's pseudocode closely.
Currently compiles, but completely untested. Helped me understand some confusing areas
in the paper - specifically around the use fo the distance() function.
"""
from typing import Dict, List, Set
from dataclasses import dataclass
import random


@dataclass
class Vertex:
    vertex_id: int

    def __hash__(self):
        return hash(self.vertex_id)


@dataclass
class Edge:
    weight: float
    start: int
    end: int

INF = 1000000000



class ApproxDistanceOracle:

    def __init__(self, V, E, k=2):
        """
        Preprocessing step.
        Initialize k+1 sets of vertices with decreasing sizes. (i-centers)
        """
        n = len(V)
        m = len(E)

        self.n = n
        self.E = E
        self.k = k

        A: List[Set[Vertex]] = [None for _ in range(k+1)]
        A[0] = V
        A[k] = set()
        for i in range(1, k):
            prob = n ** (-1 / k)
            A[i] = {v for v in A[i-1] if weighted_coin_flip(prob)}


        """ Find minimum distances from each vertex to each other set. """
        # stores distances from any vertex to one of the i-centers. (the closest one to the vertex)
        a_i_v_distances = [dict() for _ in range(k+1)]

        self.p = [dict() for _ in range(k+1)]  # p[i][v] is the vertex in i-center that is nearest to v

        # Bunches!
        # B[v] contains the union of all sets B_i.
        # B_i contains all vertices in A[i] that are strictly closer to v than all vertices in A[i-1]
        #       The partial unions of B_{i}s are balls in increasing diameter,
        #       that contain vertices with distances up to the first vertex of the next level.
        self.B: Dict[Vertex, Set[Vertex]] = {}

        for v in V:
            for i in range(k):
                min_dist, w = self.find_closest_vertex(A[i], v)
                a_i_v_distances[i][v] = min_dist
                self.p[i][v] = w
            a_i_v_distances[k][v] = INF

            self.B[v] = set()
            for i in range(k):
                self.B[v] |= {w for w in A[i] - A[i+1] if self.distance_fn(w, v) < a_i_v_distances[i+1][v]}

        self.hash_table = [[None] * n for _ in range(n)]
        for v, b_set in self.B.items():
            for w in b_set:
                self.hash_table[w][v] = self.distance_fn(w, v)
        # Notes:
        #    for fixed v, the distance is weakly increasing with i
        #    for all v, a_distance[0][v] = 0 and p[0][v] = v

    def query(self, u, v):
        w = u
        i = 0
        while w not in self.B[v]:
            i += 1
            u, v = v, u
            w = self.p[i][u]
        return self.hash_table[w][u] + self.hash_table[w][v]


    def distance_fn(self, u, v):
        """ Using a BFS just to try it out. """
        # Mark all the vertices as not visited
        visited = [False] * self.n

        # Create a queue for BFS
        queue = []

        # Mark the source node as
        # visited and enqueue it
        queue.append((u, 0))
        visited[u] = True

        while queue:

            # Dequeue a vertex from
            # queue and print it
            u, dist = queue.pop(0)

            # Get all adjacent vertices of the
            # dequeued vertex s. If a adjacent
            # has not been visited, then mark it
            # visited and enqueue it
            for w in self.E[u]:
                if w == v:
                    return dist
                if not visited[w]:
                    queue.append((w, dist + 1))
                    visited[w] = True
        return INF


    def find_closest_vertex(self, A_i, v):
        """
        The result of the below code is that:
            distances[(A[i], v)] = min([ distances[(w, v)] for w in A[i] ])
            p[(i, v)] = w
        """
        min_dist = INF
        closest_w = None
        for w in A_i:  # iterate over vertices
            computed_dist = self.distance_fn(w, v)
            if computed_dist < min_dist:
                min_dist = computed_dist
                closest_w = w
        return min_dist, closest_w


def weighted_coin_flip(prob):
    """ Returns True with probability prob. """
    return random.choices([True, False], [prob, 1-prob])[0]


if __name__ == "__main__":
    V = set([i for i in range(4)])
    E = [
        [0, 1, 1, 0],
        [1, 0, 1, 0],
        [1, 1, 0, 1],
        [0, 0, 1, 0]
    ]

    ado = ApproxDistanceOracle(V, E)
    x = ado.query(0, 2)
    print(x)

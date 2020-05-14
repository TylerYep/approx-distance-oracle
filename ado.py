"""
This contains the pseudocode for the ADO that I got while reading the paper.
It should resemble the paper's pseudocode almost exactly.
"""
from typing import Dict, List, Set
from dataclasses import dataclass
from collections import defaultdict
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
        # m = len(E)

        A: List[Set[Vertex]] = [set() for _ in range(k+1)]
        A[0] = V
        A[k] = set()
        for i in range(1, k):
            prob = n ** (-1 / k)
            A[i] = {v for v in A[i-1] if weighted_coin_flip(prob)}


        """ Find minimum distances from each vertex to each other set. """
        a_distances = [[None for _ in range(n)] for _ in range(n)]  # maps pair (A_i, v) to a distance. a_distance[u][v] = a_distance[p[i][u]][v]
        p = [dict() for _ in range(k)]  # p[i][v] is the vertex nearest to v

        # Bunches!
        # B[v] contains the union of all sets B_i.
        # B_i contains all vertices in A[i] that are strictly closer to v than all vertices in A[i-1]
        #       The partial unions of B_{i}s are balls in increasing diameter,
        #       that contain vertices with distances up to the first vertex of the next level.
        B: Dict[Vertex, Set[Vertex]] = {}

        for v in V:
            for i in range(k):
                min_dist, w = self.find_closest_vertex(A[i], v)
                p[i][v] = w
                a_distances[w][v] = min_dist
            a_distances[k][v] = INF

            B[v] = set()
            for i in range(k):
                B[v] |= {w for w in A[i] - A[i-1] if self.distance_fn(w, v) < a_distances[i][v]}

        print(a_distances)
        print(p)

        hash_table = {}
        for v, b_set in B.items():
            for w in b_set:
                hash_table[w] = self.distance_fn(w, v)

        # Notes:
        #    for fixed v, the distance is weakly increasing with i
        #    for all v, a_distance[0][v] = 0 and p[0][v] = v

        self.k = k
        self.B = B
        self.p = p
        self.hash_table = hash_table
        self.a_distances = a_distances


    def query(self, u, v):
        w = u
        i = 0
        while w not in self.B[v]:
            i += 1
            u, v = v, u
            w = self.p[i][u]
        return self.a_distances[w][u] + self.a_distances[w][v]


    @staticmethod
    def distance_fn(u, v):
        return 5


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
    V = set([i for i in range(20)])
    E = set([(i, j) for i in range(10) for j in range(5)])
    print(V)
    print(E)
    ado = ApproxDistanceOracle(V, E)
    ado.query(0, 2)

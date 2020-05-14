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
        p = [[None for v in range(n)] for i in range(k)]  # p[i][v] is the i-center nearest to v
        distances = {}  # maps pair (A_i, v) to a distance.
        distance_to_A = {}

        # Bunches!
        # B[v] contains the union of all sets B_i.
        # B_i contains all vertices in A[i] that are strictly closer to v than all vertices in A[i-1]
        #       The partial unions of B_{i}s are balls in increasing diameter,
        #       that contain vertices with distances up to the first vertex of the next level.
        B: Dict[Vertex, Set[Vertex]] = {}

        for v in V:
            for i in range(k):
                min_dist, w = find_closest_vertex(A, v, i, distances)
                distances[(A[i], v)] = min_dist
                p[i][v] = w
            distances[(A[k], v)] = INF

            B[v] = set()
            for i in range(k):
                B[v] |= {w for w in A[i] - A[i-1] if distances[(w, v)] < distances[(A[i], v)]}
        print(distances)
        print(p)

        hash_table = {}
        for v, b_set in B.items():
            for w in b_set:
                hash_table[w] = distances[(w, v)]

        # Notes:
        #    for fixed v, the distance is weakly increasing with i
        #    for all v, distance(A[0], v) = 0 and p(0, v) = v

        self.k = k
        self.B = B
        self.p = p
        # self.hash_table = hash_table
        self.distances = distances


    def query(self, u, v):
        w = u
        i = 0
        while w not in self.B[v]:
            i += 1
            u, v = v, u
            w = self.p[i][u]
        return self.distances[(w, u)] + self.distances[(w, v)]


def find_closest_vertex(A, v, i, distances):
    """
    The result of the below code is that:
        distances[(A[i], v)] = min([ distances[(w, v)] for w in A[i] ])
        p[(i, v)] = w
    """
    min_dist = INF
    closest_w = None
    for w in A[i]:  # iterate over vertices
        if distances[(w, v)] < min_dist:
            min_dist = distances[(w, v)]
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

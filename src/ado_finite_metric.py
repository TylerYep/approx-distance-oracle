"""
ADO for Finite Metric Spaces
This code is largely untested. You can look in tests/ to see some examples, or
run them using `pytest -vv`.

It seems to work fine, but take that with a grain of salt.
"""
from typing import Dict, List, Set
import math
import random


class ApproxDistanceOracle:

    def __init__(self, distance_matrix, k=2):
        """
        Preprocessing step.
        Initialize k+1 sets of vertices with decreasing sizes. (i-centers)

        a_i_v_distances:
            stores distances from any vertex to one of the i-centers.
            (the closest one to the vertex)

        self.p:
            p[i][v] is the vertex in i-center that is nearest to v

        self.B:
            Bunches!
            B[v] contains the union of all sets B_i.
            B_i contains all vertices in A[i] that are strictly closer to v
            than all vertices in A[i-1]
                The partial unions of B_{i}s are balls in increasing diameter,
                that contain vertices with distances up to the first vertex of the next level.

        Notes:
           for fixed v, the distance is weakly increasing with i
           for all v, a_i_v_distances[0][v] = 0 and p[0][v] = v
        """
        n = len(distance_matrix)
        self.distance_matrix = distance_matrix
        self.n = n
        self.k = k

        V = set([i for i in range(n)])
        A: List[Set[int]] = [None for _ in range(k+1)]
        A[0] = V
        A[k] = set()
        for i in range(1, k):
            prob = n ** (-1 / k)
            A[i] = {v for v in A[i-1] if weighted_coin_flip(prob)}


        """ Find minimum distances from each vertex to each other set. """
        a_i_v_distances: List[Dict[int]] = [dict() for _ in range(k+1)]
        self.p: List[Dict[int]] = [dict() for _ in range(k+1)]
        self.B: Dict[int, Set[int]] = {}

        for v in V:
            for i in range(k):
                min_dist, w = self.find_closest_vertex(A[i], v)
                a_i_v_distances[i][v] = min_dist
                self.p[i][v] = w
            a_i_v_distances[k][v] = math.inf

            self.B[v] = set()
            for i in range(k):
                self.B[v] |= {
                    w for w in A[i] - A[i+1] if self.distance_fn(w, v) < a_i_v_distances[i+1][v]
                }

        self.hash_table = {}
        for v, b_set in self.B.items():
            for w in b_set:
                self.hash_table[(w, v)] = self.distance_fn(w, v)

    def find_closest_vertex(self, A_i, v):
        """
        The result of the below code is that:
            distances[(A[i], v)] = min([ distances[(w, v)] for w in A[i] ])
            p[(i, v)] = w
        """
        min_dist = math.inf
        closest_w = None
        for w in A_i:  # iterate over vertices
            computed_dist = self.distance_fn(w, v)
            if computed_dist < min_dist:
                min_dist = computed_dist
                closest_w = w
        return min_dist, closest_w

    def query(self, u, v):
        w = u
        i = 0
        while w not in self.B[v]:
            i += 1
            u, v = v, u
            w = self.p[i][u]
        return self.hash_table[(w, u)] + self.hash_table[(w, v)]

    def distance_fn(self, u, v):
       return self.distance_matrix[u][v]


def weighted_coin_flip(prob):
    """ Returns True with probability prob. """
    return random.choices([True, False], [prob, 1-prob])[0]


if __name__ == "__main__":
    distance_matrix = [
        [0, 1, 0, 5],
        [1, 0, 0, 0],
        [0, 0, 0, 0],
        [5, 0, 0, 0]
    ]

    ado = ApproxDistanceOracle(distance_matrix)
    x = ado.query(0, 2)
    print(x)

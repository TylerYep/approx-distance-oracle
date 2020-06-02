from typing import Dict, List, Set
from dataclasses import dataclass
import random
import math
import heapq


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


INF = math.inf


class ApproxDistanceOracle:
    def __init__(self, V: Set[Vertex], E: List[List[Vertex]], k=2):
        """
        Preprocessing step.

        Note that
            self.p represents witnesses
            self.a_i_v_distances represents delta(A_i, v)

        """
        self.E = E
        self.V = V
        self.n = len(V)  # number of vertices

        # Initialize k+1 sets of vertices with decreasing sizes. (i-centers)
        self.A: List[Set[Vertex]] = [None for _ in range(k + 1)]
        self.A[0] = V
        self.A[k] = set()
        for i in range(1, k):  # for i = 1 to k - 1
            prob = self.n ** (-1 / k)
            self.A[i] = {x for x in self.A[i - 1] if weighted_coin_flip(prob)}

        self.a_i_v_distances: List[int, Dict[Vertex, int]] = [None for _ in range(k+1)]
        self.p: Dict[int, List[int]] = {}

        # Initialize a_i_v_distances of A_k to INF
        self.a_i_v_distances[k] = {v: INF for v in self.V}
        self.p[k] = None

        self.C: Dict[Vertex, Set[Vertex]] = {}

        for i in range(k - 1, -1, -1):  # for i = k - 1 down to 0
            # Add new source vertex to A_i
            s = self.add_source(i)

            # Build shortest path trees
            # (ideally using Thorup[2000b] O(m))
            # but currently using Dijkstra's
            self.a_i_v_distances[i], self.p[i] = self.distance_fn(s)

            # Preserve that witnesses are in each bunch
            for v in self.V:
                if v != s and i + 1 < k:
                    if self.a_i_v_distances[i][v] == self.a_i_v_distances[i + 1][v]:
                        self.p[i] = self.p[i + 1]

            # TODO: probably something missing here - I followed the pseudocode but they
            # also mention creating a shortest path tree T(w) and then don't mention it again...?
            for w in self.A[i] - self.A[i + 1]:
                self.C[w] = {
                    v
                    for v in self.V
                    if v != s and self.distance_fn(w, v)[0] < self.a_i_v_distances[i+1][v]
                }

        # TODO: This rest of this function is just copy pasted from the finite metric version.
        # There are probably changes that need to happen.
        self.B: Dict[Vertex, Set[Vertex]] = {}
        for v in self.V:
            self.B[v] = set()
            for i in range(k):
                self.B[v] |= {w for w in self.V if v in self.C[w]}

        self.hash_table = {}
        for v, b_set in self.B.items():
            for w in b_set:
                self.hash_table[(w, v)] = self.distance_fn(w, v)[0]


    def query(self, u, v):
        # TODO: This function is just copy pasted from the finite metric version.
        # Make changes if necessary.
        w = u
        i = 0
        while w not in self.B[v]:
            i += 1
            u, v = v, u
            w = self.p[i][u]
        return self.hash_table[(w, u)] + self.hash_table[(w, v)]


    def add_source(self, i):
        """
        Adds a source vertex that is connected with edge weight 0 to all
        nodes in A_i. Returns the index of the added vertex
        """
        self.E.append([0 if v in self.A[i] else INF for v in self.V])
        for v in self.A[i]:
            self.E[v].append(0)
        self.V.add(self.n)
        s = self.n
        self.n += 1
        return s


    def distance_fn(self, src, dst=None):
        """
        Variant on Dijkstra's trying to also keep track of witnesses
        """
        q = [(0, (src, None))]
        distances = [0 if v == src else INF for v in self.V]
        witnesses = [INF for v in self.V]
        first = True
        while q:
            (cost, (u, w)) = heapq.heappop(q)
            if cost > distances[u]:
                continue
            for v, c in enumerate(self.E[u]):
                prev = distances[v]
                nxt = cost + c
                if nxt < prev:
                    if first:
                        w = v
                        first = False
                    distances[v] = nxt
                    witnesses[v] = w
                    heapq.heappush(q, (nxt, (v, w)))
        d = distances if dst is None else distances[dst]
        w = witnesses if dst is None else witnesses[dst]
        # print(d, w)
        return d, w


def weighted_coin_flip(prob):
    """ Returns True with probability prob. """
    return random.choices([True, False], [prob, 1 - prob])[0]


def argmin(a):
    """
    Returns index of minimum element in array a
    """
    if not a:
        return None
    return min(range(len(a)), key=lambda x: a[x])


if __name__ == "__main__":
    # Fix seed to preserve sanity
    random.seed(0)


    V: Set[Vertex] = set([i for i in range(4)])
    # INF means there is no edge between the vertices
    E: List[List[Vertex]] = [
        # [1, 2, 3, 4],
        # [2, 2, 5, 6],
        # [3, 5, 7, 1],
        # [4, 6, 1, 9],

        [0, 1, 1, INF],
        [1, 0, 1, INF],
        [1, 1, 0, 1],
        [INF, INF, 1, 0],
    ]

    print(f"V: {V}")
    print(f"E: {E}")

    ado = ApproxDistanceOracle(V, E)
    x = ado.query(0, 2)
    print(x)

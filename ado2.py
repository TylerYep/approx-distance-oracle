from typing import Dict, List, Set
from dataclasses import dataclass
from collections import defaultdict
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
        Initialize k+1 sets of vertices with decreasing sizes. (i-centers)
        """
        self.E = E
        self.V = V
        self.k = k
        self.n = len(V)  # number of vertices
        self.delta: Dict[Vertex, List[int]] = defaultdict(list)
        self.witnesses: Dict[int, List[int]] = {}
        self.A: List[Set[Vertex]] = [None for _ in range(k + 1)]
        self.delta_set: Dict[int, List[int]] = defaultdict(list)

        # Construct the A_i samples
        self.A[0] = V
        self.A[k] = set()
        for i in range(1, k):  # for i = 1 to k - 1
            prob = self.n ** (-1 / k)
            self.A[i] = [x for x in self.A[i - 1] if weighted_coin_flip(prob)]

        # Initialize delta_set of A_k to INF
        self.delta_set[self.k] = [{v: INF for v in self.V}]
        self.witnesses[self.k] = None

        print(f"V: {self.V}")
        print(f"E: {self.E}")

        for i in range(k - 1, -1, -1):  # for i = k - 1 downto 0
            # Add new source vertex to A_i
            s = self.add_source(i)
            # Build shortest path trees
            # (ideally using Thorup[2000b] O(m))
            # but currently using Dijkstra's
            print(self.A)
            self.delta_set[i], self.witnesses[i] = self.distance_fn(s)
            # Preserve that witnesses are in each bunch
            for v in self.V:
                if self.delta_set[i][v] == self.delta_set[i + 1][v]:
                    self.witnesses[i] = self.witnesses[i + 1]
        for w in self.A[i] / self.A[i + 1]:
            pass  # still working on this

    def query(self, u, v):
        pass

    # Adds a source vertex that is connected with edge weight 0 to all
    # nodes in A_i. Returns the index of the added vertex
    def add_source(self, i):
        self.E.append([0 if v in self.A[i] else INF for v in self.V])
        for v in self.A[i]:
            self.E[v].append(0)
        self.V.add(self.n)
        s = self.n
        self.n += 1
        return s

    # Variant on Dijkstra's trying to also keep track of witnesses
    def distance_fn(self, src, dst=None):
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
        print(d, w)
        return d, w


def weighted_coin_flip(prob):
    """ Returns True with probability prob. """
    return random.choices([True, False], [prob, 1 - prob])[0]


# Returns index of minimum element in array a
def argmin(a):
    if not a:
        return None
    return min(range(len(a)), key=lambda x: a[x])


if __name__ == "__main__":
    V: Set[Vertex] = set([i for i in range(4)])
    # INF means there is no edge between the vertices
    E: List[List[Vertex]] = [
        [0, 1, 1, INF],
        [1, 0, 1, INF],
        [1, 1, 0, 1],
        [INF, INF, 1, 0],
    ]

    ado = ApproxDistanceOracle(V, E)
    x = ado.query(0, 2)
    print(x)

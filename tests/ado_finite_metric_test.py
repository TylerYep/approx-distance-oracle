import numpy as np

from src.ado_finite_metric import ApproxDistanceOracle


# def test_zero_distance_approx():
#     distance_matrix = np.zeros((4, 4))

#     ado = ApproxDistanceOracle(distance_matrix)

#     assert ado.query(0, 2) == 0
#     assert ado.query(3, 2) == 0


def test_approx_greater_than_actual():
    distance_matrix = np.ones((41, 41))
    distance_matrix[0, 40] = 50
    distance_matrix[40, 0] = 50

    ado = ApproxDistanceOracle(distance_matrix)
    # print(ado.p)

    assert ado.query(3, 5) == 2.0
    assert ado.query(0, 3) == 51.0
    assert ado.query(0, 30) == 51.0

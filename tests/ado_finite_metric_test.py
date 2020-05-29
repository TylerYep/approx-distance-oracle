from src.ado_finite_metric import ApproxDistanceOracle

def test_zero_distance_approx():
    distance_matrix = [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ]

    ado = ApproxDistanceOracle(distance_matrix)

    assert ado.query(0, 2) == 0
    assert ado.query(3, 2) == 0

def test_approx_greater_than_actual():
    distance_matrix = [
        [1, 1, 1, 50],
        [1, 1, 1, 1],
        [1, 1, 1, 1],
        [50, 1, 1, 0]
    ]

    ado = ApproxDistanceOracle(distance_matrix)

    assert ado.query(0, 3) == 50

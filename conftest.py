""" This file is needed for pytest to work. """
import random
import pytest


@pytest.fixture(autouse=True)
def reset_seed():
    random.seed(0)

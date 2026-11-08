import numpy as np
from PIL import Image

def find_coeffs(pa, pb):
    # pa: destination quad [(x0,y0), (x1,y1), (x2,y2), (x3,y3)]
    # pb: source quad [(u0,v0), (u1,v1), (u2,v2), (u3,v3)]
    # We want mapping from pa -> pb
    matrix = []
    for p1, p2 in zip(pa, pb):
        matrix.append([p1[0], p1[1], 1, 0, 0, 0, -p2[0]*p1[0], -p2[0]*p1[1]])
        matrix.append([0, 0, 0, p1[0], p1[1], 1, -p2[1]*p1[0], -p2[1]*p1[1]])

    A = np.matrix(matrix, dtype=float)
    B = np.array(pb).reshape(8)

    res = np.dot(np.linalg.inv(A.T * A) * A.T, B)
    return np.array(res).reshape(8)

print("find_coeffs ready")
